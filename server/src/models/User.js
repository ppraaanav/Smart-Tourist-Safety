const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['tourist', 'admin'], index: true },
    name: { type: String, required: true },

    touristId: { type: String, required: true, unique: true, index: true },

    lastLocation: {
      lat: { type: Number },
      lng: { type: Number },
      accuracyM: { type: Number },
      timestamp: { type: Date }
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)

