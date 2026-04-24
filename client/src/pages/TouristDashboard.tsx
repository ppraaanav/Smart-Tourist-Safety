import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchZones } from '../slices/geoSlice'
import { addAlert, clearAlerts } from '../slices/alertsSlice'
import MapWithZones from '../components/MapWithZones'
import TopBar from '../components/TopBar'
import { createSocket } from '../lib/socketClient'

type GeoLoc = { lat: number; lng: number; accuracyM?: number; timestamp?: number }

const FALLBACK_CENTER = { lat: 12.9716, lng: 77.5946 }

export default function TouristDashboard() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const me = useAppSelector((s) => s.auth.user)
  const zones = useAppSelector((s) => s.geo.zones)
  const alerts = useAppSelector((s) => s.alerts.items)

  const [geo, setGeo] = useState<GeoLoc>({ ...FALLBACK_CENTER, accuracyM: 80, timestamp: Date.now() })
  const [geoStatus, setGeoStatus] = useState<'loading' | 'tracking' | 'fallback'>('loading')
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'SOS' | 'GEOFENCE_ENTER' | 'ANOMALY_DETECTED'>('ALL')
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)

  const myMarkers = useMemo(() => {
    if (!me?.touristId) return []
    return [
      {
        lat: geo.lat,
        lng: geo.lng,
        accuracyM: geo.accuracyM,
        name: me.name,
        touristId: me.touristId
      }
    ]
  }, [geo.lat, geo.lng, geo.accuracyM, me?.name, me?.touristId])

  useEffect(() => {
    dispatch(fetchZones())
  }, [dispatch])

  useEffect(() => {
    if (!token) return
    const socket = createSocket(token)
    socketRef.current = socket

    socket.on('alerts:new', (doc: any) => {
      dispatch(addAlert(doc))
      if (!doc?.message) return
      const type = doc?.type as string | undefined
      if (type === 'SOS') toast.error(doc.message)
      else if (type === 'ANOMALY_DETECTED') toast.error(doc.message)
      else toast(doc.message)
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [dispatch, token])

  useEffect(() => {
    if (!token) return

    let watchId: number | null = null
    let simTimer: number | null = null
    let simLat = geo.lat
    let simLng = geo.lng
    let simAcc = geo.accuracyM || 80

    const emitLocation = (point: GeoLoc) => {
      const s = socketRef.current
      if (!s) return
      s.emit('location:update', {
        lat: point.lat,
        lng: point.lng,
        accuracyM: point.accuracyM,
        timestamp: point.timestamp || Date.now()
      })
    }

    const startSimulation = () => {
      setGeoStatus('fallback')
      simTimer = window.setInterval(() => {
        const step = 0.0008 // ~80m in degrees-ish
        simLat += (Math.random() - 0.5) * step
        simLng += (Math.random() - 0.5) * step
        simAcc = Math.max(8, Math.min(150, simAcc + (Math.random() - 0.5) * 10))
        const ts = Date.now()
        const next = { lat: simLat, lng: simLng, accuracyM: simAcc, timestamp: ts }
        setGeo(next)
        emitLocation(next)
      }, 2500)
    }

    const startGeolocation = () => {
      setGeoStatus('loading')
      if (!navigator.geolocation?.watchPosition) {
        startSimulation()
        return
      }

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const ts = pos.timestamp || Date.now()
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy, timestamp: ts }
          setGeo(next)
          setGeoStatus('tracking')
          emitLocation(next)
        },
        () => {
          // Permission denied or unsupported
          startSimulation()
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
      )
    }

    startGeolocation()

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      if (simTimer !== null) window.clearInterval(simTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onSos = () => {
    const s = socketRef.current
    if (!s) return
    s.emit('sos:press', { reason: 'Tourist pressed SOS' })
    toast.error('SOS sent to admin!')
  }

  const myAlerts = useMemo(() => {
    if (!me?.id) return alerts.slice(0, 20)
    return alerts.filter((a: any) => a.userId === me.id).slice(0, 20)
  }, [alerts, me?.id])

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'ALL') return myAlerts
    return myAlerts.filter((a: any) => a.type === alertFilter)
  }, [alertFilter, myAlerts])

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Tourist Dashboard" />

      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapWithZones center={{ lat: geo.lat, lng: geo.lng }} zones={zones} markers={myMarkers} height="60vh" />
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-600">
              Location: {geoStatus === 'tracking' ? 'Live' : geoStatus === 'fallback' ? 'Simulated' : 'Loading'}
              {' | '}
              Accuracy: {Math.round(geo.accuracyM || 0)}m
            </div>
            <button
              onClick={onSos}
              className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
              type="button"
            >
              SOS
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white shadow rounded p-4">
            <div className="text-sm text-gray-500 mb-1">Digital Tourist ID</div>
            <div className="text-2xl font-bold">{me?.touristId || '—'}</div>
            <div className="text-sm text-gray-600 mt-2">{me?.name || '—'}</div>
            <div className="text-xs text-gray-500 mt-1">{me?.email || ''}</div>
          </div>

          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Alerts</div>
              <div className="text-xs text-gray-500">
                Live • {filteredAlerts.length}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <select
                className="text-sm border rounded px-2 py-1 bg-white"
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as any)}
              >
                <option value="ALL">All</option>
                <option value="SOS">SOS</option>
                <option value="GEOFENCE_ENTER">Geo-fence</option>
                <option value="ANOMALY_DETECTED">AI Anomaly</option>
              </select>
              <button
                onClick={() => dispatch(clearAlerts())}
                className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                type="button"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 space-y-3 max-h-80 overflow-auto pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="text-sm text-gray-500">No alerts yet.</div>
              ) : (
                filteredAlerts.map((a: any) => (
                  <div key={a._id || `${a.type}-${a.createdAt}-${Math.random()}`} className="border rounded p-3 bg-red-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-sm">{a.type}</div>
                      <div className="text-xs text-gray-600">{a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : ''}</div>
                    </div>
                    <div className="text-sm text-gray-800 mt-1">{a.message}</div>
                    {typeof a.anomalyScore === 'number' ? (
                      <div className="text-xs text-gray-600 mt-2">Anomaly score: {a.anomalyScore.toFixed(3)}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

