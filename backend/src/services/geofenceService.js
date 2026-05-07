const GeoFence = require('../models/GeoFence');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const { sendNotification } = require('./notificationService');
const User = require('../models/User');
const logger = require('../config/logger');

const pointQuery = (coordinates) => ({
  isActive: true,
  geometry: {
    $geoIntersects: {
      $geometry: {
        type: 'Point',
        coordinates
      }
    }
  }
});

const severityToAlertSeverity = (severity) => {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'danger';
  if (severity === 'low') return 'info';
  return 'warning';
};

const getTransition = (fence, wasInside, isInside) => {
  if (fence.type === 'safe' && wasInside && !isInside) {
    return {
      action: 'safe_zone_exit_detected',
      title: `Safe zone exit: ${fence.name}`,
      description: `Tourist exited safe zone: ${fence.name}`,
      touristMessage: fence.alertMessage || `You have exited safe zone ${fence.name}.`,
      notifyTourist: true
    };
  }

  if (fence.type !== 'safe' && !wasInside && isInside) {
    return {
      action: 'risk_zone_enter_detected',
      title: `Risk zone alert: ${fence.name}`,
      description: `Tourist entered ${fence.type} zone: ${fence.name}`,
      touristMessage: fence.alertMessage || `You have entered ${fence.name}.`,
      notifyTourist: true
    };
  }

  return null;
};

const checkGeofences = async (userId, dtid, previousCoordinates, currentCoordinates, io) => {
  try {
    if (!currentCoordinates) return;

    if (!Array.isArray(currentCoordinates)) {
      currentCoordinates = previousCoordinates;
      previousCoordinates = null;
    }

    const [previousFences, currentFences] = await Promise.all([
      previousCoordinates ? GeoFence.find(pointQuery(previousCoordinates)) : Promise.resolve([]),
      GeoFence.find(pointQuery(currentCoordinates))
    ]);

    const fenceMap = new Map();
    previousFences.forEach((fence) => fenceMap.set(fence._id.toString(), fence));
    currentFences.forEach((fence) => fenceMap.set(fence._id.toString(), fence));

    for (const fence of fenceMap.values()) {
      const fenceId = fence._id.toString();
      const wasInside = previousFences.some((item) => item._id.toString() === fenceId);
      const isInside = currentFences.some((item) => item._id.toString() === fenceId);
      const transition = getTransition(fence, wasInside, isInside);

      if (!transition) continue;

      const recentIncident = await Incident.findOne({
        userId,
        type: 'geofence_breach',
        'metadata.geofenceId': fence._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        status: { $ne: 'resolved' }
      });

      if (recentIncident) continue;

      const incident = await Incident.create({
        userId,
        dtid,
        type: 'geofence_breach',
        severity: fence.severity,
        severityScore: fence.severity === 'critical' ? 90 : fence.severity === 'high' ? 70 : 50,
        location: { type: 'Point', coordinates: currentCoordinates },
        description: transition.description,
        metadata: {
          geofenceId: fence._id,
          transition: transition.action,
          previousCoordinates
        },
        timeline: [{
          action: transition.action,
          notes: transition.description
        }]
      });

      io.to('authorities').emit('geofence:breach', {
        incident,
        geofence: fence,
        userId: userId.toString(),
        dtid,
        coordinates: currentCoordinates
      });

      const alert = await Alert.create({
        userId,
        incidentId: incident._id,
        type: 'websocket',
        title: transition.title,
        message: transition.touristMessage,
        severity: severityToAlertSeverity(fence.severity),
        channel: 'all',
        deliveredAt: new Date()
      });

      io.to(`user:${userId}`).emit('alert:new', alert);

      const authorities = await User.find({ role: { $in: ['authority', 'admin'] }, isActive: true });
      for (const auth of authorities) {
        sendNotification(auth, {
          title: transition.title,
          message: `Tourist ${dtid}: ${transition.description}`,
          severity: fence.severity,
          incidentId: incident._id
        }).catch(err => logger.error(`Geofence notification error: ${err.message}`));
      }

      logger.warn(`Geofence transition: ${dtid} | ${transition.action} | ${fence.name}`);
    }
  } catch (error) {
    logger.error(`Geofence check error: ${error.message}`);
  }
};

module.exports = { checkGeofences };
