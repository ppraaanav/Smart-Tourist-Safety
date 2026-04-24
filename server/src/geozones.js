// Static (predefined) danger zones.
// These are circles expressed as center (lat,lng) and radius in meters.
const geoZones = [
  {
    id: 'zone_rajajinagar',
    name: 'Rajajinagar Danger Zone',
    type: 'circle',
    center: { lat: 12.985, lng: 77.578 },
    radiusM: 350
  },
  {
    id: 'zone_indiranagar',
    name: 'Indiranagar Danger Zone',
    type: 'circle',
    center: { lat: 12.971, lng: 77.639 },
    radiusM: 280
  }
]

module.exports = { geoZones }

