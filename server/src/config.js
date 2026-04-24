const dotenv = require('dotenv')

dotenv.config()

const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me-super-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',

  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/anomaly'
}

module.exports = { config }

