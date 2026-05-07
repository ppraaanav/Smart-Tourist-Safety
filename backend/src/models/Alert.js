const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['push', 'sms', 'websocket', 'email', 'manual', 'sos', 'incident'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger', 'critical'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  channel: {
    type: String,
    enum: ['web', 'sms', 'push', 'all'],
    default: 'web'
  }
}, {
  timestamps: true
});

alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
