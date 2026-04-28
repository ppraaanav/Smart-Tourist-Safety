import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from "@react-google-maps/api";
import { HiOutlineMap, HiOutlinePlusCircle } from 'react-icons/hi2';
import { geofenceAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const geofenceColors = {
  danger: { color: '#ef4444', fillColor: '#ef444480' },
  restricted: { color: '#f97316', fillColor: '#f9731680' },
  safe: { color: '#22c55e', fillColor: '#22c55e80' },
  warning: { color: '#eab308', fillColor: '#eab30880' }
};

const GeofencesPage = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU",
  });
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', type: 'danger', severity: 'high',
    alertMessage: 'You are entering a restricted zone!',
    center: { lat: 19.076, lng: 72.8777 },
    radius: 500
  });

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      const res = await geofenceAPI.getAll();
      setGeofences(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { center, radius, ...rest } = formData;
      const offset = radius / 111000;

      const polygon = [
        [center.lng - offset, center.lat - offset],
        [center.lng + offset, center.lat - offset],
        [center.lng + offset, center.lat + offset],
        [center.lng - offset, center.lat + offset],
        [center.lng - offset, center.lat - offset]
      ];

      await geofenceAPI.create({
        ...rest,
        geometry: { type: 'Polygon', coordinates: [polygon] },
        center: { coordinates: [center.lng, center.lat] },
        radius
      });

      toast.success('Geofence created!');
      setShowForm(false);
      fetchGeofences();
    } catch (err) {
      toast.error('Failed to create geofence');
    }
  };

  if (loading) return <LoadingSpinner text="Loading geofences..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HiOutlineMap className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold">Geofences</h1>
          <span className="badge badge-info">{geofences.length}</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 text-sm flex items-center gap-2">
          <HiOutlinePlusCircle className="w-4 h-4" />
          New Zone
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card-solid p-6"
        >
          <h3 className="font-semibold mb-4">Create Geofence Zone</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" required placeholder="Zone Name" value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="input-field" />
            <select value={formData.type}
              onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
              className="input-field">
              <option value="danger">Danger</option>
              <option value="restricted">Restricted</option>
              <option value="warning">Warning</option>
              <option value="safe">Safe</option>
            </select>
            <input type="text" placeholder="Description" value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className="input-field" />
            <select value={formData.severity}
              onChange={e => setFormData(f => ({ ...f, severity: e.target.value }))}
              className="input-field">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input type="number" step="any" placeholder="Center Lat" value={formData.center.lat}
              onChange={e => setFormData(f => ({ ...f, center: { ...f.center, lat: parseFloat(e.target.value) } }))}
              className="input-field" />
            <input type="number" step="any" placeholder="Center Lng" value={formData.center.lng}
              onChange={e => setFormData(f => ({ ...f, center: { ...f.center, lng: parseFloat(e.target.value) } }))}
              className="input-field" />
            <input type="number" placeholder="Radius (m)" value={formData.radius}
              onChange={e => setFormData(f => ({ ...f, radius: parseInt(e.target.value) }))}
              className="input-field" />
            <input type="text" placeholder="Alert Message" value={formData.alertMessage}
              onChange={e => setFormData(f => ({ ...f, alertMessage: e.target.value }))}
              className="input-field" />
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary !py-2 text-sm">Create Zone</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* GOOGLE MAP */}
      <div className="glass-card-solid overflow-hidden" style={{ height: '500px' }}>
        {loadError ? (
          <div className="p-4">Map failed to load.</div>
        ) : !isLoaded ? (
          <div className="p-4">Loading map...</div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={{ lat: 28.6139, lng: 77.2090 }}
            zoom={10}
          >
            {geofences.map(fence => {
              const path = fence.geometry.coordinates[0].map(c => ({
                lat: c[1],
                lng: c[0]
              }));

              return (
                <Polygon
                  key={fence._id}
                  paths={path}
                  options={{
                    fillColor: geofenceColors[fence.type]?.fillColor,
                    strokeColor: geofenceColors[fence.type]?.color,
                  }}
                />
              );
            })}

            <Marker position={{ lat: 28.6139, lng: 77.2090 }} />
          </GoogleMap>
        )}
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {geofences.map(fence => (
          <motion.div key={fence._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card-solid p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full"
                style={{ backgroundColor: geofenceColors[fence.type]?.color || '#6b7280' }} />
              <h4 className="font-medium">{fence.name}</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{fence.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge badge-info capitalize">{fence.type}</span>
              <span className={`badge ${fence.severity === 'critical' ? 'badge-critical' : fence.severity === 'high' ? 'badge-high' : 'badge-medium'}`}>
                {fence.severity}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GeofencesPage;
