const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  accuracy: {
    type: Number,
    default: 0
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  altitude: {
    type: Number,
    default: 0
  },
  battery: {
    type: Number,
    default: 100
  },
  isOfflineSync: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

locationLogSchema.index({ location: '2dsphere' });
locationLogSchema.index({ createdAt: -1 });
locationLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
