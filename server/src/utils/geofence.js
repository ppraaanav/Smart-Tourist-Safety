const { distanceMeters } = require('./geo')

const isPointInZone = (point, zone) => {
  if (zone.type !== 'circle') return false
  const d = distanceMeters(point, zone.center)
  return d <= zone.radiusM
}

module.exports = { isPointInZone }

