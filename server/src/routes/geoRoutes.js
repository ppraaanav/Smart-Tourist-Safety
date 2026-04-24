const express = require('express')
const { geoZones } = require('../geozones')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ zones: geoZones })
})

module.exports = { router }

