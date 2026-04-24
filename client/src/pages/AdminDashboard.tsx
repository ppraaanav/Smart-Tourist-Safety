import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../hooks'
import TopBar from '../components/TopBar'
import MapWithZones from '../components/MapWithZones'
import { createSocket } from '../lib/socketClient'
import { fetchZones } from '../slices/geoSlice'
import { addAlert, clearAlerts, setInitialAlerts } from '../slices/alertsSlice'
import { setPositions, upsertPosition } from '../slices/usersSlice'

export default function AdminDashboard() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const geoZones = useAppSelector((s) => s.geo.zones)
  const usersById = useAppSelector((s) => s.users.byId)
  const alerts = useAppSelector((s) => s.alerts.items)

  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'SOS' | 'GEOFENCE_ENTER' | 'ANOMALY_DETECTED'>('ALL')

  const markers = useMemo(() => {
    return Object.values(usersById).map((u) => ({
      userId: u.userId,
      lat: u.position?.lat ?? 0,
      lng: u.position?.lng ?? 0,
      name: u.name,
      touristId: u.touristId
    }))
  }, [usersById])

  const center = useMemo(() => {
    const first = markers.find((m) => m.lat && m.lng)
    return first ? { lat: first.lat, lng: first.lng } : { lat: 12.9716, lng: 77.5946 }
  }, [markers])

  useEffect(() => {
    dispatch(fetchZones())
  }, [dispatch])

  useEffect(() => {
    if (!token) return

    const socket = createSocket(token)
    socketRef.current = socket

    socket.on('users:positions', (payload: any[]) => {
      const positions = (payload || [])
        .filter((x) => x.userId)
        .map((u: any) => ({
          userId: u.userId,
          name: u.name,
          touristId: u.touristId,
          email: u.email,
          role: u.role,
          position: u.position
        }))
      dispatch(setPositions(positions))
    })

    socket.on('users:position', (u: any) => {
      if (!u?.userId) return
      dispatch(
        upsertPosition({
          userId: u.userId,
          name: u.name,
          touristId: u.touristId,
          email: u.email,
          role: u.role,
          position: u.position
        })
      )
    })

    socket.on('alerts:init', (docs: any[]) => {
      dispatch(setInitialAlerts(docs || []))
    })

    socket.on('alerts:new', (doc: any) => {
      dispatch(addAlert(doc))
      if (!doc?.message) return
      if (doc?.type === 'SOS' || doc?.type === 'ANOMALY_DETECTED') toast.error(doc.message)
      else toast(doc.message)
    })

    return () => {
      try {
        socket.disconnect()
      } catch {}
    }
  }, [dispatch, token])

  const myAlerts = useMemo(() => alerts.slice(0, 300), [alerts])
  const latestAlerts = useMemo(() => {
    if (alertFilter === 'ALL') return myAlerts
    return myAlerts.filter((a: any) => a.type === alertFilter)
  }, [alertFilter, myAlerts])

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Admin Dashboard" />

      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapWithZones center={center} zones={geoZones} markers={markers} height="60vh" />
        </div>

        <div className="space-y-4">
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Live Alerts</div>
              <div className="text-xs text-gray-500">Realtime • {latestAlerts.length}</div>
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

            <div className="mt-3 space-y-3 max-h-[60vh] overflow-auto pr-1">
              {latestAlerts.length === 0 ? (
                <div className="text-sm text-gray-500">No alerts yet.</div>
              ) : (
                latestAlerts.map((a: any) => (
                  <div key={a._id || `${a.type}-${a.createdAt}-${Math.random()}`} className="border rounded p-3 bg-red-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-sm">{a.type}</div>
                      <div className="text-xs text-gray-600">
                        {a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : ''}
                      </div>
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

