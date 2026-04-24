const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId} | Role: ${socket.userRole}`);

    // Join role-based rooms
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'authority') {
      socket.join('authorities');
    }
    if (socket.userRole === 'tourist') {
      socket.join('tourists');
    }

    // Tourist location update
    socket.on('location:update', (data) => {
      // Broadcast to authorities
      io.to('authorities').emit('tourist:location', {
        userId: socket.userId,
        ...data,
        timestamp: new Date()
      });
    });

    // SOS signal
    socket.on('sos:trigger', (data) => {
      logger.warn(`SOS triggered by user ${socket.userId}`);
      io.to('authorities').emit('sos:alert', {
        userId: socket.userId,
        ...data,
        timestamp: new Date(),
        priority: 'critical'
      });
    });

    // Incident status update
    socket.on('incident:update', (data) => {
      io.to('authorities').emit('incident:updated', data);
      if (data.touristId) {
        io.to(`user:${data.touristId}`).emit('incident:status', data);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
