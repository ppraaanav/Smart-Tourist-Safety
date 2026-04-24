const Incident = require('../models/Incident');
const User = require('../models/User');
const { getIO } = require('../config/socket');
const { sendNotification } = require('../services/notificationService');
const logger = require('../config/logger');

exports.createIncident = async (req, res) => {
  try {
    const data = req.validatedBody || req.body;
    const userId = req.user._id;
    const dtid = req.user.dtid;

    const incident = await Incident.create({
      userId,
      dtid,
      type: data.type,
      severity: data.severity,
      severityScore: data.severityScore || calculateSeverityScore(data.severity),
      location: {
        type: 'Point',
        coordinates: data.location.coordinates
      },
      description: data.description || `${data.type} incident detected`,
      metadata: data.metadata || {},
      timeline: [{
        action: 'created',
        performedBy: userId,
        notes: `Incident created: ${data.type}`
      }]
    });

    const io = getIO();
    io.to('authorities').emit('incident:new', {
      incident,
      tourist: { name: req.user.name, dtid }
    });

    // Send notifications to all authorities
    const authorities = await User.find({ role: 'authority', isActive: true });
    for (const auth of authorities) {
      sendNotification(auth, {
        title: `${data.severity.toUpperCase()} - ${data.type} Incident`,
        message: `Tourist ${req.user.name} (${dtid}) - ${data.description || data.type}`,
        severity: data.severity,
        incidentId: incident._id
      }).catch(err => logger.error(`Notification error: ${err.message}`));
    }

    logger.warn(`New incident: ${data.type} | Severity: ${data.severity} | DTID: ${dtid}`);

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    logger.error(`Create incident error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create incident' });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, severity, status, from, to } = req.query;
    const query = {};

    if (req.user.role === 'tourist') {
      query.userId = req.user._id;
    }
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const incidents = await Incident.find(query)
      .populate('userId', 'name email dtid phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Incident.countDocuments(query);

    res.json({
      success: true,
      data: incidents,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch incidents' });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('userId', 'name email dtid phone nationality emergencyContact')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('timeline.performedBy', 'name');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch incident' });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const { status, resolutionNotes, assignedTo } = req.validatedBody || req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    if (status) {
      incident.status = status;
      incident.timeline.push({
        action: `status_changed_to_${status}`,
        performedBy: req.user._id,
        notes: resolutionNotes || `Status updated to ${status}`
      });

      if (status === 'resolved' || status === 'false_alarm') {
        incident.resolvedAt = new Date();
        incident.resolvedBy = req.user._id;
      }
    }

    if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
    if (assignedTo) {
      incident.assignedTo = assignedTo;
      incident.timeline.push({
        action: 'assigned',
        performedBy: req.user._id,
        notes: `Assigned to authority`
      });
    }

    await incident.save();

    const io = getIO();
    io.to('authorities').emit('incident:updated', incident);
    io.to(`user:${incident.userId}`).emit('incident:status', {
      incidentId: incident._id,
      status: incident.status
    });

    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update incident' });
  }
};

exports.triggerSOS = async (req, res) => {
  try {
    const { coordinates, description } = req.body;
    const userId = req.user._id;
    const dtid = req.user.dtid;

    const incident = await Incident.create({
      userId,
      dtid,
      type: 'sos',
      severity: 'critical',
      severityScore: 100,
      location: { type: 'Point', coordinates },
      description: description || 'SOS Emergency triggered by tourist',
      timeline: [{
        action: 'sos_triggered',
        performedBy: userId,
        notes: 'Emergency SOS activated'
      }]
    });

    const io = getIO();
    io.to('authorities').emit('sos:alert', {
      incident,
      tourist: {
        id: userId,
        name: req.user.name,
        dtid,
        phone: req.user.phone,
        emergencyContact: req.user.emergencyContact
      },
      coordinates,
      timestamp: new Date()
    });

    // Notify all authorities
    const authorities = await User.find({ role: 'authority', isActive: true });
    for (const auth of authorities) {
      sendNotification(auth, {
        title: 'CRITICAL SOS ALERT',
        message: `Tourist ${req.user.name} (${dtid}) has triggered an SOS emergency!`,
        severity: 'critical',
        incidentId: incident._id
      }).catch(err => logger.error(`SOS notification error: ${err.message}`));
    }

    logger.warn(`SOS TRIGGERED by ${req.user.name} (${dtid}) at [${coordinates}]`);

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    logger.error(`SOS trigger error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to trigger SOS' });
  }
};

function calculateSeverityScore(severity) {
  const scores = { low: 25, medium: 50, high: 75, critical: 100 };
  return scores[severity] || 50;
}
