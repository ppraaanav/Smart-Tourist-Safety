const express = require('express')
const { requireAuth } = require('../auth')
const repo = require('../repo')

const router = express.Router()

router.get('/users', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })

    const users = await repo.listUsersWithLastLocation()
    return res.json({ users })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
})

module.exports = { router }

