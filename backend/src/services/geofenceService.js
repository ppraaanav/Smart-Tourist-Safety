const GeoFence = require('../models/GeoFence');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const { sendNotification } = require('./notificationService');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Check if a tourist's location is inside any active geofence
 */
const checkGeofences = async (userId, dtid, coordinates, io) => {
  try {
    const [lng, lat] = coordinates;

    // Find geofences that contain this point
    const breachedFences = await GeoFence.find({
      isActive: true,
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }
      }
    });

    if (breachedFences.length === 0) return;

    for (const fence of breachedFences) {
      // Check if there's already an open incident for this fence + user in last 30 min
      const recentIncident = await Incident.findOne({
        userId,
        type: 'geofence_breach',
        'metadata.geofenceId': fence._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        status: { $ne: 'resolved' }
      });

      if (recentIncident) continue; // Don't duplicate

      // Create geofence breach incident
      const incident = await Incident.create({
        userId,
        dtid,
        type: 'geofence_breach',
        severity: fence.severity,
        severityScore: fence.severity === 'critical' ? 90 : fence.severity === 'high' ? 70 : 50,
        location: { type: 'Point', coordinates },
        description: `Tourist entered ${fence.type} zone: ${fence.name}`,
        metadata: {
          geofenceId: fence._id
        },
        timeline: [{
          action: 'geofence_breach_detected',
          notes: `Entered ${fence.name} (${fence.type} zone)`
        }]
      });

      // Emit to authorities
      io.to('authorities').emit('geofence:breach', {
        incident,
        geofence: fence,
        userId: userId.toString(),
        dtid,
        coordinates
      });

      // Emit alert to tourist
      io.to(`user:${userId}`).emit('alert:geofence', {
        title: 'Zone Alert',
        message: fence.alertMessage,
        severity: fence.severity,
        geofenceName: fence.name
      });

      // Save alert
      await Alert.create({
        userId,
        incidentId: incident._id,
        type: 'websocket',
        title: `Geofence Alert: ${fence.name}`,
        message: fence.alertMessage,
        severity: fence.severity === 'critical' ? 'critical' : 'warning',
        channel: 'all'
      });

      // Notify authorities
      const authorities = await User.find({ role: 'authority', isActive: true });
      for (const auth of authorities) {
        sendNotification(auth, {
          title: `Geofence Breach: ${fence.name}`,
          message: `Tourist ${dtid} entered ${fence.type} zone`,
          severity: fence.severity,
          incidentId: incident._id
        }).catch(err => logger.error(`Geofence notification error: ${err.message}`));
      }

      logger.warn(`Geofence breach: ${dtid} entered ${fence.name}`);
    }
  } catch (error) {
    logger.error(`Geofence check error: ${error.message}`);
  }
};

module.exports = { checkGeofences };
