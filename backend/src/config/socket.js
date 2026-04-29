const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://smart-tourist-safety-client.vercel.app'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

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
    logger.info(
      `Socket connected: ${socket.id} | User: ${socket.userId} | Role: ${socket.userRole}`
    );

    // Personal room
    socket.join(`user:${socket.userId}`);

    // Role-based rooms
    if (socket.userRole === 'authority') {
      socket.join('authorities');
    }

    if (socket.userRole === 'tourist') {
      socket.join('tourists');
    }

    // Manual room join
    socket.on('join-room', ({ userId, role }) => {
      socket.join(`user:${userId}`);

      if (role === 'authority') socket.join('authorities');
      if (role === 'tourist') socket.join('tourists');

      logger.info(`${userId} joined ${role} room`);
    });

    // Tourist location updates
    socket.on('location:update', (data) => {
      io.to('authorities').emit('tourist:location', {
        userId: socket.userId,
        ...data,
        timestamp: new Date()
      });
    });

    // SOS alerts
    socket.on('sos:trigger', (data) => {
      logger.warn(`SOS triggered by user ${socket.userId}`);

      io.to('authorities').emit('sos:alert', {
        userId: socket.userId,
        ...data,
        timestamp: new Date(),
        priority: 'critical'
      });
    });

    // Incident updates
    socket.on('incident:update', (data) => {
      io.to('authorities').emit('incident:updated', data);

      if (data.touristId) {
        io.to(`user:${data.touristId}`).emit('incident:status', data);
      }
    });

    // Direct alert to tourist
    socket.on('send-alert', ({ touristId, alert }) => {
      io.to(`user:${touristId}`).emit('new-alert', alert);
      logger.info(`Alert sent to tourist ${touristId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };