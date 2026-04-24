const jwt = require('jsonwebtoken')
const { config } = require('./config')

const signToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret)
}

const extractTokenFromRequest = (req) => {
  const auth = req.headers.authorization
  if (!auth) return null
  const [scheme, token] = auth.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

const requireAuth = (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Missing bearer token' })
    const decoded = verifyToken(token)
    req.user = decoded
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { signToken, verifyToken, requireAuth }

