const GeoFence = require('../models/GeoFence');
const logger = require('../config/logger');

exports.createGeofence = async (req, res) => {
  try {
    const data = req.validatedBody || req.body;
    const geofence = await GeoFence.create({
      ...data,
      createdBy: req.user._id
    });

    logger.info(`Geofence created: ${geofence.name} by ${req.user.email}`);
    res.status(201).json({ success: true, data: geofence });
  } catch (error) {
    logger.error(`Create geofence error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create geofence' });
  }
};

exports.getGeofences = async (req, res) => {
  try {
    const { type, active } = req.query;
    const query = {};
    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';

    const geofences = await GeoFence.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: geofences });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch geofences' });
  }
};

exports.getGeofenceById = async (req, res) => {
  try {
    const geofence = await GeoFence.findById(req.params.id).populate('createdBy', 'name email');
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }
    res.json({ success: true, data: geofence });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch geofence' });
  }
};

exports.updateGeofence = async (req, res) => {
  try {
    const geofence = await GeoFence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }
    res.json({ success: true, data: geofence });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update geofence' });
  }
};

exports.deleteGeofence = async (req, res) => {
  try {
    const geofence = await GeoFence.findByIdAndDelete(req.params.id);
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }
    res.json({ success: true, message: 'Geofence deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete geofence' });
  }
};
