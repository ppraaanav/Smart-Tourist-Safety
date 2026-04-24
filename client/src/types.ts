export type Role = 'tourist' | 'admin'

export type User = {
  id: string
  email: string
  role: Role
  name: string
  touristId: string
  lastLocation: null | {
    lat: number
    lng: number
    accuracyM?: number
    timestamp?: string
  }
}

export type GeoZone = {
  id: string
  name: string
  type: 'circle'
  center: { lat: number; lng: number }
  radiusM: number
}

export type AlertType = 'SOS' | 'GEOFENCE_ENTER' | 'ANOMALY_DETECTED'

export type AlertDoc = {
  _id?: string
  userId: string
  type: AlertType
  message: string
  geo?: {
    zoneId?: string
    lat?: number
    lng?: number
    accuracyM?: number
  }
  anomalyScore?: number
  meta?: any
  createdAt?: string
}

