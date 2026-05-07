const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI is required');
    }

    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create geospatial indexes
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('locationlogs')) {
      await db.collection('locationlogs').createIndex({ location: '2dsphere' }).catch(() => {});
    }
    if (collectionNames.includes('geofences')) {
      await db.collection('geofences').createIndex({ geometry: '2dsphere' }).catch(() => {});
    }
    if (collectionNames.includes('incidents')) {
      await db.collection('incidents').createIndex({ location: '2dsphere' }).catch(() => {});
    }
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
