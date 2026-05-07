const Alert = require('../models/Alert');
const User = require('../models/User');

const normalizeSeverity = (value = 'warning') => {
  const severityMap = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'critical',
    info: 'info',
    warning: 'warning',
    danger: 'danger'
  };

  return severityMap[value] || 'warning';
};

exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { userId: req.user._id };

    if (unread === 'true') {
      query.isRead = false;
    }

    const alerts = await Alert.find(query)
      .populate('incidentId')
      .populate('sentBy', 'name role email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: alerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
};

exports.getSentAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 50, touristId } = req.query;
    const query = {};

    if (touristId) {
      query.userId = touristId;
    } else {
      const touristIds = await User.find({ role: 'tourist' }).distinct('_id');
      query.userId = { $in: touristIds };
    }

    const alerts = await Alert.find(query)
      .populate('userId', 'name email dtid phone')
      .populate('sentBy', 'name role email')
      .populate('incidentId', 'type status severity')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent alerts'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        isRead: true,
        readAt: new Date()
      },
      {
        new: true
      }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Alert.updateMany(
      {
        userId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All alerts marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark alerts as read'
    });
  }
};

exports.sendAlert = async (req, res) => {
  try {
    const {
      userId,
      touristId,
      title,
      message,
      type = 'websocket',
      priority,
      severity = priority || 'warning'
    } = req.body;

    const targetUserId = userId || touristId;
    const alertType = ['push', 'sms', 'websocket', 'email', 'manual', 'sos', 'incident'].includes(type)
      ? type
      : 'websocket';

    if (!targetUserId || !title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tourist, title, and message are required'
      });
    }

    const tourist = await User.findOne({
      _id: targetUserId,
      role: 'tourist',
      isActive: true
    });

    if (!tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    const alert = await Alert.create({
      userId: tourist._id,
      sentBy: req.user._id,
      title: title.trim(),
      message: message.trim(),
      type: alertType,
      severity: normalizeSeverity(severity),
      channel: 'web',
      deliveredAt: new Date()
    });

    const populatedAlert = await Alert.findById(alert._id)
      .populate('sentBy', 'name role email')
      .populate('userId', 'name email dtid phone');

    req.app.get('io')?.to(`user:${tourist._id}`).emit('alert:new', populatedAlert);

    res.status(201).json({
      success: true,
      data: populatedAlert,
      message: 'Alert sent successfully'
    });
  } catch (error) {
    console.error('Send Alert Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alert'
    });
  }
};
