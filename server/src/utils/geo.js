const toRad = (deg) => (deg * Math.PI) / 180

// Haversine distance in meters.
const distanceMeters = (a, b) => {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

  return 2 * R * Math.asin(Math.sqrt(h))
}

// Bearing from point a to b in degrees [0,360).
const bearingDegrees = (a, b) => {
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}

const clamp01 = (n) => Math.max(0, Math.min(1, n))

module.exports = { distanceMeters, bearingDegrees, clamp01 }

