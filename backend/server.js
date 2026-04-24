require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const logger = require('./src/config/logger');

// Route imports
const authRoutes = require('./src/routes/auth');
const touristRoutes = require('./src/routes/tourist');
const locationRoutes = require('./src/routes/location');
const incidentRoutes = require('./src/routes/incident');
const geofenceRoutes = require('./src/routes/geofence');
const alertRoutes = require('./src/routes/alert');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
app.set('io', io);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'tourist-safety-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

module.exports = { app, server };
