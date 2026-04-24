export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500', text: 'text-red-500', badge: 'badge-critical' },
  high: { bg: 'bg-orange-500', text: 'text-orange-500', badge: 'badge-high' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', badge: 'badge-medium' },
  low: { bg: 'bg-green-500', text: 'text-green-500', badge: 'badge-low' }
};

export const INCIDENT_TYPES = {
  sos: { label: 'SOS Emergency', icon: '🆘', color: 'text-red-500' },
  anomaly: { label: 'Anomaly Detected', icon: '⚠️', color: 'text-orange-500' },
  geofence_breach: { label: 'Geofence Breach', icon: '🚧', color: 'text-yellow-500' },
  inactivity: { label: 'Inactivity Alert', icon: '⏸️', color: 'text-blue-500' },
  route_deviation: { label: 'Route Deviation', icon: '🔀', color: 'text-purple-500' }
};

export const STATUS_MAP = {
  open: { label: 'Open', badge: 'badge-open' },
  investigating: { label: 'Investigating', badge: 'badge-investigating' },
  resolved: { label: 'Resolved', badge: 'badge-resolved' },
  false_alarm: { label: 'False Alarm', badge: 'badge-info' }
};

export const MAP_CONFIG = {
  defaultCenter: [19.076, 72.8777], // Mumbai
  defaultZoom: 13,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
};
