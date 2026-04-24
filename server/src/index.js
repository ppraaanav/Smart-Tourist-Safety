const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { Server } = require('socket.io')

const { config } = require('./config')
const { connectDb } = require('./db')
const repo = require('./repo')

const { router: authRoutes } = require('./routes/authRoutes')
const { router: geoRoutes } = require('./routes/geoRoutes')
const { router: adminRoutes } = require('./routes/adminRoutes')

const { verifyToken } = require('./auth')
const { seedAdmin } = require('./seedAdmin')
const { setupSocketHandlers } = require('./socket')

const start = async () => {
  const db = await connectDb(config.mongoUri)
  repo.initRepo({ dbMode: db.mode })
  await seedAdmin()

  const app = express()
  app.use(helmet())
  app.use(cors({ origin: config.clientOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRoutes)
  app.use('/api/geozones', geoRoutes)
  app.use('/api/admin', adminRoutes)

  // Create HTTP server for Socket.IO.
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: config.clientOrigin,
      credentials: true
    }
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
      if (!token) return next(new Error('Missing auth token'))
      const decoded = verifyToken(token)
      socket.user = decoded
      return next()
    } catch (e) {
      return next(new Error('Invalid auth token'))
    }
  })

  setupSocketHandlers(io)

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${config.port}`)
    console.log(`ML service at ${config.mlServiceUrl}`)
  })
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', e)
  process.exit(1)
})

