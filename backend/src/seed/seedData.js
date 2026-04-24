require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const GeoFence = require('../models/GeoFence');
const Incident = require('../models/Incident');
const LocationLog = require('../models/LocationLog');
const logger = require('../config/logger');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      GeoFence.deleteMany({}),
      Incident.deleteMany({}),
      LocationLog.deleteMany({})
    ]);

    // Create authority user
    const authority = await User.create({
      name: 'Admin Authority',
      email: 'admin@safety.com',
      password: 'admin123',
      role: 'authority',
      phone: '+1234567890'
    });

    // Create tourist users
    const tourists = await User.insertMany([
      {
        name: 'John Traveler',
        email: 'john@tourist.com',
        password: await hashPassword('tourist123'),
        role: 'tourist',
        dtid: 'DTID-TEST001-A1B2C3',
        phone: '+1987654321',
        nationality: 'US',
        lastKnownLocation: { type: 'Point', coordinates: [72.8777, 19.0760] },
        lastActive: new Date(),
        emergencyContact: { name: 'Jane Doe', phone: '+1555123456', relation: 'Spouse' }
      },
      {
        name: 'Maria Explorer',
        email: 'maria@tourist.com',
        password: await hashPassword('tourist123'),
        role: 'tourist',
        dtid: 'DTID-TEST002-D4E5F6',
        phone: '+1555987654',
        nationality: 'ES',
        lastKnownLocation: { type: 'Point', coordinates: [72.8347, 18.9220] },
        lastActive: new Date(),
        emergencyContact: { name: 'Carlos Garcia', phone: '+1555654321', relation: 'Brother' }
      },
      {
        name: 'Akira Wanderer',
        email: 'akira@tourist.com',
        password: await hashPassword('tourist123'),
        role: 'tourist',
        dtid: 'DTID-TEST003-G7H8I9',
        phone: '+8190123456',
        nationality: 'JP',
        lastKnownLocation: { type: 'Point', coordinates: [72.8686, 19.0821] },
        lastActive: new Date(Date.now() - 45 * 60 * 1000),
        emergencyContact: { name: 'Yuki Tanaka', phone: '+8190654321', relation: 'Sister' }
      },
      {
        name: 'Sophie Voyager',
        email: 'sophie@tourist.com',
        password: await hashPassword('tourist123'),
        role: 'tourist',
        dtid: 'DTID-TEST004-J1K2L3',
        phone: '+33612345678',
        nationality: 'FR',
        lastKnownLocation: { type: 'Point', coordinates: [72.8311, 18.9388] },
        lastActive: new Date(),
        emergencyContact: { name: 'Pierre Dubois', phone: '+33698765432', relation: 'Father' }
      },
      {
        name: 'Raj Adventure',
        email: 'raj@tourist.com',
        password: await hashPassword('tourist123'),
        role: 'tourist',
        dtid: 'DTID-TEST005-M4N5O6',
        phone: '+919876543210',
        nationality: 'IN',
        lastKnownLocation: { type: 'Point', coordinates: [72.8296, 18.9436] },
        lastActive: new Date()
      }
    ]);

    // Create geofences (Mumbai area example)
    await GeoFence.insertMany([
      {
        name: 'Restricted Coastal Zone',
        description: 'Dangerous cliff area near coast',
        type: 'danger',
        geometry: {
          type: 'Polygon',
          coordinates: [[[72.80, 18.90], [72.82, 18.90], [72.82, 18.92], [72.80, 18.92], [72.80, 18.90]]]
        },
        center: { type: 'Point', coordinates: [72.81, 18.91] },
        severity: 'critical',
        alertMessage: 'WARNING: You are entering a dangerous coastal zone!',
        createdBy: authority._id
      },
      {
        name: 'Construction Zone',
        description: 'Active construction area - restricted access',
        type: 'restricted',
        geometry: {
          type: 'Polygon',
          coordinates: [[[72.86, 19.07], [72.87, 19.07], [72.87, 19.08], [72.86, 19.08], [72.86, 19.07]]]
        },
        center: { type: 'Point', coordinates: [72.865, 19.075] },
        severity: 'high',
        alertMessage: 'This is a restricted construction zone. Please leave the area.',
        createdBy: authority._id
      },
      {
        name: 'Night Market Safe Zone',
        description: 'Well-monitored night market area',
        type: 'safe',
        geometry: {
          type: 'Polygon',
          coordinates: [[[72.83, 18.93], [72.84, 18.93], [72.84, 18.94], [72.83, 18.94], [72.83, 18.93]]]
        },
        center: { type: 'Point', coordinates: [72.835, 18.935] },
        severity: 'low',
        alertMessage: 'Welcome to the safe night market zone.',
        createdBy: authority._id
      }
    ]);

    // Create sample incidents
    const incidentTypes = ['sos', 'anomaly', 'geofence_breach', 'inactivity', 'route_deviation'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['open', 'investigating', 'resolved', 'false_alarm'];

    const incidents = [];
    for (let i = 0; i < 25; i++) {
      const tourist = tourists[i % tourists.length];
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 86400000);

      incidents.push({
        userId: tourist._id,
        dtid: tourist.dtid,
        type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        severityScore: Math.floor(Math.random() * 80) + 20,
        location: {
          type: 'Point',
          coordinates: [
            72.82 + Math.random() * 0.06,
            18.92 + Math.random() * 0.17
          ]
        },
        description: `Sample incident ${i + 1} for testing`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt,
        resolvedAt: Math.random() > 0.5 ? new Date(createdAt.getTime() + Math.random() * 7200000) : undefined,
        timeline: [{ action: 'created', notes: 'Auto-generated for testing', timestamp: createdAt }]
      });
    }
    await Incident.insertMany(incidents);

    // Create sample location logs
    const locationLogs = [];
    for (const tourist of tourists) {
      const baseLng = tourist.lastKnownLocation.coordinates[0];
      const baseLat = tourist.lastKnownLocation.coordinates[1];

      for (let i = 0; i < 50; i++) {
        locationLogs.push({
          userId: tourist._id,
          dtid: tourist.dtid,
          location: {
            type: 'Point',
            coordinates: [
              baseLng + (Math.random() - 0.5) * 0.01,
              baseLat + (Math.random() - 0.5) * 0.01
            ]
          },
          speed: Math.random() * 5,
          accuracy: Math.random() * 20 + 5,
          heading: Math.random() * 360,
          battery: Math.max(10, 100 - i * 1.5),
          createdAt: new Date(Date.now() - (50 - i) * 5 * 60 * 1000)
        });
      }
    }
    await LocationLog.insertMany(locationLogs);

    logger.info('Seed data created successfully!');
    logger.info(`  - 1 Authority: admin@safety.com / admin123`);
    logger.info(`  - ${tourists.length} Tourists (password: tourist123)`);
    logger.info(`  - 3 Geofences`);
    logger.info(`  - ${incidents.length} Sample incidents`);
    logger.info(`  - ${locationLogs.length} Location logs`);

    process.exit(0);
  } catch (error) {
    logger.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
}

seedData();
