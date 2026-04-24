const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: { type: String, required: true, index: true, enum: ['SOS', 'GEOFENCE_ENTER', 'ANOMALY_DETECTED'] },

    message: { type: String, required: true },

    geo: {
      zoneId: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      accuracyM: { type: Number }
    },

    anomalyScore: { type: Number },

    meta: { type: Object }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Alert', alertSchema)

