const crypto = require('crypto')

const generateTouristId = () => {
  // Short human-ish id for the dashboard. Collisions are extremely unlikely for this demo.
  const bytes = crypto.randomBytes(6).toString('hex') // 12 hex chars
  return `TS-${bytes}`.toUpperCase()
}

module.exports = { generateTouristId }

