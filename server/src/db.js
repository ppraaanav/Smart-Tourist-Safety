const mongoose = require('mongoose')

const connectDb = async (mongoUri) => {
  if (!mongoUri) return { mode: 'none' }
  try {
    await mongoose.connect(mongoUri)
    return { mode: 'mongo', mongoUri }
  } catch (e) {
    return { mode: 'none', error: String(e?.message || e) }
  }
}

module.exports = { connectDb }

