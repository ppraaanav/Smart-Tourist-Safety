const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dtid: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['sos', 'anomaly', 'geofence_breach', 'inactivity', 'route_deviation'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  severityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'false_alarm'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  },
  metadata: {
    speed: Number,
    locationVariance: Number,
    anomalyScore: Number,
    geofenceId: mongoose.Schema.Types.ObjectId,
    aiPrediction: Object
  },
  timeline: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, {
  timestamps: true
});

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
