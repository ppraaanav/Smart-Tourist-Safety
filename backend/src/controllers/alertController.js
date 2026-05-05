const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { userId: req.user._id };

    if (unread === 'true') {
      query.isRead = false;
    }

    const alerts = await Alert.find(query)
      .populate('incidentId')
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

// ✅ NEW: Send real-time alert to a tourist
exports.sendAlert = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type = 'warning',
      priority = 'medium'
    } = req.body;

    const alert = await Alert.create({
      userId,
      title,
      message,
      type,
      priority
    });

    // Real-time socket notification
    req.app.get('io')
  .to(`user:${userId}`)
  .emit('alert:geofence', {
    title,
    message,
    type,
    priority
  });

    res.status(201).json({
      success: true,
      data: alert,
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