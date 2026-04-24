const LocationLog = require('../models/LocationLog');
const User = require('../models/User');
const { getIO } = require('../config/socket');
const { checkGeofences } = require('../services/geofenceService');
const { detectAnomalies } = require('../services/anomalyService');
const logger = require('../config/logger');

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates, accuracy, speed, heading, altitude, battery } = req.validatedBody || req.body;
    const userId = req.user._id;
    const dtid = req.user.dtid;

    // Save location log
    const locationLog = await LocationLog.create({
      userId,
      dtid,
      location: { type: 'Point', coordinates },
      accuracy: accuracy || 0,
      speed: speed || 0,
      heading: heading || 0,
      altitude: altitude || 0,
      battery: battery || 100
    });

    // Update user's last known location
    await User.findByIdAndUpdate(userId, {
      lastKnownLocation: { type: 'Point', coordinates },
      lastActive: new Date()
    });

    // Emit real-time location to authorities
    const io = getIO();
    io.to('authorities').emit('tourist:location', {
      userId: userId.toString(),
      dtid,
      name: req.user.name,
      coordinates,
      speed: speed || 0,
      timestamp: new Date(),
      battery: battery || 100
    });

    // Check geofences asynchronously
    checkGeofences(userId, dtid, coordinates, io).catch(err =>
      logger.error(`Geofence check error: ${err.message}`)
    );

    // Run anomaly detection asynchronously
    detectAnomalies(userId, dtid, { coordinates, speed, accuracy }, io).catch(err =>
      logger.error(`Anomaly detection error: ${err.message}`)
    );

    res.json({ success: true, data: locationLog });
  } catch (error) {
    logger.error(`Location update error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

exports.syncOfflineLocations = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ success: false, message: 'No locations to sync' });
    }

    const bulkOps = locations.map(loc => ({
      insertOne: {
        document: {
          userId: req.user._id,
          dtid: req.user.dtid,
          location: { type: 'Point', coordinates: loc.coordinates },
          accuracy: loc.accuracy || 0,
          speed: loc.speed || 0,
          heading: loc.heading || 0,
          altitude: loc.altitude || 0,
          battery: loc.battery || 100,
          isOfflineSync: true,
          createdAt: new Date(loc.timestamp)
        }
      }
    }));

    await LocationLog.bulkWrite(bulkOps);

    // Update last known location with most recent
    const latest = locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    await User.findByIdAndUpdate(req.user._id, {
      lastKnownLocation: { type: 'Point', coordinates: latest.coordinates },
      lastActive: new Date()
    });

    logger.info(`Synced ${locations.length} offline locations for ${req.user.dtid}`);
    res.json({ success: true, message: `Synced ${locations.length} locations` });
  } catch (error) {
    logger.error(`Offline sync error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to sync locations' });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to, limit = 100 } = req.query;

    const query = { userId };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const locations = await LocationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch location history' });
  }
};

exports.getNearbyTourists = async (req, res) => {
  try {
    const { lng, lat, radius = 5000 } = req.query;
    const tourists = await User.find({
      role: 'tourist',
      isActive: true,
      lastKnownLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    }).select('name dtid lastKnownLocation lastActive');

    res.json({ success: true, data: tourists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch nearby tourists' });
  }
};
