const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['danger', 'restricted', 'safe', 'warning'],
    default: 'danger'
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of coordinate pairs
      required: true
    }
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  radius: {
    type: Number,
    default: 500 // meters
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertMessage: {
    type: String,
    default: 'You have entered a restricted zone'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

geofenceSchema.index({ geometry: '2dsphere' });
geofenceSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('GeoFence', geofenceSchema);
