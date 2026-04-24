import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { GeoZone } from '../types'
import type { ReactNode } from 'react'

type PositionLike = { userId?: string; lat: number; lng: number; accuracyM?: number; name?: string; touristId?: string }

export default function MapWithZones(props: {
  center: { lat: number; lng: number }
  zoom?: number
  zones: GeoZone[]
  markers: PositionLike[]
  markerColor?: string
  height?: string
  children?: ReactNode
}) {
  const { center, zoom = 15, zones, markers, markerColor = '#2563eb', height = '60vh' } = props

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {zones.map((z) => (
          <Circle
            key={z.id}
            center={z.center}
            radius={z.radiusM}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2 }}
          />
        ))}

        {markers.map((m, idx) => (
          <Marker key={m.userId || idx} position={{ lat: m.lat, lng: m.lng }}>
            <Popup>
              <div className="min-w-40">
                <div className="font-semibold">{m.name || 'User'}</div>
                {m.touristId ? <div className="text-xs text-gray-600">{m.touristId}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}

        {props.children}
      </MapContainer>
    </div>
  )
}

