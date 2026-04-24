const axios = require('axios');
const LocationLog = require('../models/LocationLog');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');
const logger = require('../config/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Detect anomalies using rule-based + ML-based detection
 */
const detectAnomalies = async (userId, dtid, locationData, io) => {
  try {
    // Get recent location history for this user
    const recentLocations = await LocationLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (recentLocations.length < 3) return; // Not enough data

    // ===== RULE-BASED DETECTION =====
    const ruleResult = applyRules(locationData, recentLocations);

    if (ruleResult.isAnomaly) {
      await createAnomalyIncident(userId, dtid, locationData, ruleResult, io);
      return;
    }

    // ===== ML-BASED DETECTION (via AI service) =====
    try {
      const features = extractFeatures(recentLocations, locationData);
      const response = await axios.post(`${AI_SERVICE_URL}/api/predict`, {
        features,
        userId: userId.toString(),
        dtid
      }, { timeout: 5000 });

      if (response.data && response.data.is_anomaly) {
        await createAnomalyIncident(userId, dtid, locationData, {
          type: 'anomaly',
          reason: response.data.reason || 'ML model detected anomalous behavior',
          severity: response.data.severity || 'medium',
          score: response.data.anomaly_score || 0.7,
          aiPrediction: response.data
        }, io);
      }
    } catch (aiError) {
      // AI service unavailable - rely on rule-based only
      logger.debug(`AI service unavailable: ${aiError.message}`);
    }
  } catch (error) {
    logger.error(`Anomaly detection error: ${error.message}`);
  }
};

/**
 * Rule-based anomaly detection
 */
function applyRules(currentData, recentLocations) {
  const result = { isAnomaly: false, type: null, reason: '', severity: 'medium', score: 0 };

  // Rule 1: Inactivity detection (no significant movement for 30+ minutes)
  if (recentLocations.length >= 5) {
    const last5 = recentLocations.slice(0, 5);
    const timeSpan = new Date(last5[0].createdAt) - new Date(last5[last5.length - 1].createdAt);
    const maxDistance = calculateMaxDistance(last5);

    if (timeSpan > 30 * 60 * 1000 && maxDistance < 10) { // 30 min, <10m movement
      result.isAnomaly = true;
      result.type = 'inactivity';
      result.reason = `No significant movement detected for ${Math.round(timeSpan / 60000)} minutes`;
      result.severity = 'medium';
      result.score = 60;
      return result;
    }
  }

  // Rule 2: Unusual speed (>120 km/h in tourist area)
  if (currentData.speed && currentData.speed > 33.3) { // ~120 km/h in m/s
    result.isAnomaly = true;
    result.type = 'anomaly';
    result.reason = `Unusually high speed detected: ${(currentData.speed * 3.6).toFixed(1)} km/h`;
    result.severity = 'high';
    result.score = 75;
    return result;
  }

  // Rule 3: Route deviation (sudden large jump in position)
  if (recentLocations.length >= 2) {
    const prevLoc = recentLocations[0].location.coordinates;
    const currLoc = currentData.coordinates;
    const distance = haversineDistance(prevLoc[1], prevLoc[0], currLoc[1], currLoc[0]);
    const timeDiff = (Date.now() - new Date(recentLocations[0].createdAt)) / 1000;

    // If moved more than 5km in less than 1 minute (impossible on foot)
    if (distance > 5000 && timeDiff < 60) {
      result.isAnomaly = true;
      result.type = 'route_deviation';
      result.reason = `Sudden position change: ${(distance / 1000).toFixed(2)}km in ${timeDiff.toFixed(0)}s`;
      result.severity = 'high';
      result.score = 80;
      return result;
    }
  }

  // Rule 4: Late night activity (between 1 AM and 5 AM local time)
  const hour = new Date().getHours();
  if (hour >= 1 && hour <= 5 && currentData.speed > 1) {
    result.isAnomaly = true;
    result.type = 'anomaly';
    result.reason = 'Activity detected during unusual hours (1 AM - 5 AM)';
    result.severity = 'low';
    result.score = 40;
    return result;
  }

  return result;
}

/**
 * Extract ML features from location history
 */
function extractFeatures(recentLocations, currentData) {
  const speeds = recentLocations.map(l => l.speed || 0);
  const lats = recentLocations.map(l => l.location.coordinates[1]);
  const lngs = recentLocations.map(l => l.location.coordinates[0]);

  return {
    current_speed: currentData.speed || 0,
    avg_speed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
    max_speed: Math.max(...speeds),
    speed_variance: calculateVariance(speeds),
    lat_variance: calculateVariance(lats),
    lng_variance: calculateVariance(lngs),
    location_spread: calculateMaxDistance(recentLocations),
    hour_of_day: new Date().getHours(),
    data_points: recentLocations.length,
    time_span_minutes: recentLocations.length > 1
      ? (new Date(recentLocations[0].createdAt) - new Date(recentLocations[recentLocations.length - 1].createdAt)) / 60000
      : 0
  };
}

/**
 * Create anomaly incident and send alerts
 */
async function createAnomalyIncident(userId, dtid, locationData, anomalyResult, io) {
  // Prevent duplicate incidents within 10 minutes
  const recentIncident = await Incident.findOne({
    userId,
    type: anomalyResult.type || 'anomaly',
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    status: { $ne: 'resolved' }
  });

  if (recentIncident) return;

  const incident = await Incident.create({
    userId,
    dtid,
    type: anomalyResult.type || 'anomaly',
    severity: anomalyResult.severity,
    severityScore: anomalyResult.score,
    location: { type: 'Point', coordinates: locationData.coordinates },
    description: anomalyResult.reason,
    metadata: {
      anomalyScore: anomalyResult.score,
      aiPrediction: anomalyResult.aiPrediction || null,
      speed: locationData.speed
    },
    timeline: [{
      action: 'anomaly_detected',
      notes: anomalyResult.reason
    }]
  });

  io.to('authorities').emit('incident:new', {
    incident,
    tourist: { dtid }
  });

  io.to(`user:${userId}`).emit('alert:anomaly', {
    title: 'Safety Alert',
    message: anomalyResult.reason,
    severity: anomalyResult.severity
  });

  await Alert.create({
    userId,
    incidentId: incident._id,
    type: 'websocket',
    title: 'Anomaly Detected',
    message: anomalyResult.reason,
    severity: anomalyResult.severity === 'critical' ? 'critical' : 'warning',
    channel: 'all'
  });

  logger.warn(`Anomaly detected for ${dtid}: ${anomalyResult.reason}`);
}

// Math utilities
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateMaxDistance(locations) {
  let maxDist = 0;
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const c1 = locations[i].location.coordinates;
      const c2 = locations[j].location.coordinates;
      const d = haversineDistance(c1[1], c1[0], c2[1], c2[0]);
      if (d > maxDist) maxDist = d;
    }
  }
  return maxDist;
}

function calculateVariance(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
}

module.exports = { detectAnomalies };
