const express = require('express')
const bcrypt = require('bcrypt')
const { signToken, requireAuth } = require('../auth')
const { generateTouristId } = require('../touristId')
const repo = require('../repo')

const router = express.Router()

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {}
    if (!email || !password || !name) return res.status(400).json({ error: 'email,password,name required' })

    const existing = await repo.findUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const touristId = generateTouristId()

    const user = await repo.createUser({
      email,
      passwordHash,
      role: 'tourist',
      name,
      touristId
    })

    const token = signToken({ sub: user.id.toString(), id: user.id.toString(), role: user.role, email: user.email, touristId: user.touristId, name: user.name })

    return res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        touristId: user.touristId
      }
    })
  } catch (e) {
    return res.status(500).json({ error: 'Signup failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email,password required' })

    const user = await repo.findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const userId = (user._id || user.id).toString()
    const token = signToken({ sub: userId, id: userId, role: user.role, email: user.email, touristId: user.touristId, name: user.name })

    return res.json({
      token,
      user: {
        id: userId,
        email: user.email,
        role: user.role,
        name: user.name,
        touristId: user.touristId
      }
    })
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const decoded = req.user
    const user = await repo.findUserById(decoded.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({
      id: (user._id || user.id).toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      touristId: user.touristId,
      lastLocation: user.lastLocation || null
    })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

module.exports = { router }

