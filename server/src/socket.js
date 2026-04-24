const { geoZones } = require('./geozones')
const { isPointInZone } = require('./utils/geofence')
const { distanceMeters, bearingDegrees } = require('./utils/geo')
const { getAnomalyScore } = require('./services/mlClient')
const repo = require('./repo')

const setupSocketHandlers = (io) => {
  // In-memory tracking for fast updates.
  const lastPositions = new Map() // userId => {lat,lng,accuracyM,timestamp}
  const zoneStatus = new Map() // userId => { [zoneId]: boolean }
  const movementHistory = new Map() // userId => { points: [{lat,lng,timestamp}] }
  const lastAnomalyAlertAt = new Map() // userId => number(ms)

  const emitToUserAndAdmins = (alertDoc) => {
    io.to(`user:${alertDoc.userId.toString()}`).emit('alerts:new', alertDoc)
    io.to('admins').emit('alerts:new', alertDoc)
  }

  io.on('connection', (socket) => {
    const user = socket.user
    if (!user?.id) return

    socket.join(`user:${user.id}`)
    if (user.role === 'admin') socket.join('admins')

    // Initial admin state.
    if (user.role === 'admin') {
      ;(async () => {
        const users = await repo.listUsersWithLastLocation()

        io.to(socket.id).emit(
          'users:positions',
          users.map((u) => ({
            userId: (u._id || u.userId).toString(),
            name: u.name,
            touristId: u.touristId,
            email: u.email,
            role: u.role,
            position: u.lastLocation
          }))
        )

        const recentAlerts = await repo.listRecentAlerts(30)
        io.to(socket.id).emit('alerts:init', recentAlerts)
      })().catch(() => {})
    }
  })

  // Tourist -> Server: movement update.
  io.on('connection', (socket) => {
    const user = socket.user
    if (!user?.id) return

    socket.on('location:update', async (payload) => {
      try {
        if (user.role !== 'tourist') return

        const { lat, lng, accuracyM, timestamp } = payload || {}
        const point = {
          lat: Number(lat),
          lng: Number(lng),
          accuracyM: accuracyM !== undefined ? Number(accuracyM) : undefined,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }

        if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return
        if (Number.isNaN(point.timestamp.getTime())) point.timestamp = new Date()

        const userId = user.id.toString()
        const last = lastPositions.get(userId)

        // Update in-memory last position.
        lastPositions.set(userId, point)
        movementHistory.set(userId, movementHistory.get(userId) || { points: [] })
        const history = movementHistory.get(userId)
        history.points.push({ lat: point.lat, lng: point.lng, timestamp: point.timestamp.getTime() })
        if (history.points.length > 6) history.points.shift()

        // Persist last location (best-effort).
        await repo.updateUserLocation(userId, {
          lat: point.lat,
          lng: point.lng,
          accuracyM: point.accuracyM,
          timestamp: point.timestamp
        })

        // Emit to admins for user marker updates.
        io.to('admins').emit('users:position', {
          userId,
          name: user.name,
          touristId: user.touristId,
          email: user.email,
          role: user.role,
          position: { lat: point.lat, lng: point.lng, accuracyM: point.accuracyM, timestamp: point.timestamp }
        })

        const prev = zoneStatus.get(userId) || {}
        zoneStatus.set(userId, prev)

        const entryZones = []
        for (const zone of geoZones) {
          const inside = isPointInZone(point, zone)
          const wasInside = !!prev[zone.id]
          prev[zone.id] = inside
          if (inside && !wasInside) entryZones.push(zone)
        }

        if (entryZones.length > 0) {
          const zone = entryZones[0]
          const alertDoc = await repo.createAlert({
            userId,
            type: 'GEOFENCE_ENTER',
            message: `Entered danger zone: ${zone.name}`,
            geo: {
              zoneId: zone.id,
              lat: point.lat,
              lng: point.lng,
              accuracyM: point.accuracyM
            },
            meta: { zonesEntered: entryZones.map((z) => z.id) }
          })
          emitToUserAndAdmins(alertDoc)
        }

        // AI anomaly detection (dummy ML model).
        let anomalyScore = null
        let risky = false
        const now = point.timestamp.getTime()

        if (last) {
          const distM = distanceMeters(last, point)
          const dtSec = Math.max(0.001, (now - last.timestamp.getTime()) / 1000)
          const speedMps = distM / dtSec

          const lastHistory = history.points
          const prevPoint = lastHistory[lastHistory.length - 2]
          const prevPrevPoint = lastHistory[lastHistory.length - 3]

          let accelerationMps2 = 0
          if (prevPoint && prevPrevPoint) {
            const dist1 = distanceMeters(prevPrevPoint, prevPoint)
            const dt1 = Math.max(0.001, (prevPoint.timestamp - prevPrevPoint.timestamp) / 1000)
            const speed1 = dist1 / dt1
            accelerationMps2 = (speedMps - speed1) / dtSec
          }

          let headingChange = 0
          if (prevPoint) {
            const a = { lat: prevPoint.lat, lng: prevPoint.lng }
            const b = { lat: point.lat, lng: point.lng }
            const bearingNow = bearingDegrees(a, b)
            if (prevPrevPoint) {
              const bearingPrev = bearingDegrees({ lat: prevPrevPoint.lat, lng: prevPrevPoint.lng }, { lat: prevPoint.lat, lng: prevPoint.lng })
              let delta = bearingNow - bearingPrev
              delta = ((delta + 540) % 360) - 180
              headingChange = delta
            }
          }

          const features = {
            userId,
            timestamp: now,
            features: {
              speedMps,
              accelerationMps2,
              headingChangeDeg: headingChange,
              accuracyM: point.accuracyM
            }
          }

          try {
            const ml = await getAnomalyScore(features)
            anomalyScore = typeof ml?.anomaly_score === 'number' ? ml.anomaly_score : null
            risky = !!ml?.risky
          } catch (e) {
            // If ML is down, keep the app running without alerts.
            console.warn('ML anomaly request failed:', e?.message || e)
          }
        }

        if (typeof anomalyScore === 'number' && risky) {
          const lastAt = lastAnomalyAlertAt.get(userId) || 0
          if (Date.now() - lastAt > 60_000) {
            lastAnomalyAlertAt.set(userId, Date.now())
            const alertDoc = await repo.createAlert({
              userId,
              type: 'ANOMALY_DETECTED',
              message: `AI detected potential anomaly. Score: ${anomalyScore.toFixed(3)}`,
              anomalyScore,
              geo: { lat: point.lat, lng: point.lng, accuracyM: point.accuracyM },
              meta: { anomalyScore }
            })
            emitToUserAndAdmins(alertDoc)
          }
        }
      } catch (e) {
        // Never crash the server on client payload issues.
      }
    })

    // Tourist -> Server: SOS press.
    socket.on('sos:press', async (payload) => {
      try {
        if (user.role !== 'tourist') return
        const userId = user.id.toString()
        const last = lastPositions.get(userId)
        const reason = payload?.reason ? String(payload.reason) : 'SOS pressed'

        const alertDoc = await repo.createAlert({
          userId,
          type: 'SOS',
          message: `SOS alert: ${reason}`,
          geo: {
            lat: last?.lat,
            lng: last?.lng,
            accuracyM: last?.accuracyM
          },
          meta: { reason }
        })

        emitToUserAndAdmins(alertDoc)
      } catch (e) {}
    })
  })
}

module.exports = { setupSocketHandlers }

