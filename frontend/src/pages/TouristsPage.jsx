import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import {
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineMapPin,
  HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { alertAPI, touristAPI } from '../services/api';
import { timeAgo } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useSocket from '../hooks/useSocket';

const mapContainerStyle = {
  width: '100%',
  height: '180px'
};

const toMapPosition = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return { lat: Number(lat), lng: Number(lng) };
};

const TouristsPage = () => {
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [liveLocations, setLiveLocations] = useState({});
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    severity: 'warning'
  });
  const [sendingAlert, setSendingAlert] = useState(false);
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBahdSYiv_xjChAwfQTqCEfetuwFMEGJwU",
  });

  useSocket('tourist:location', (location) => {
    if (!location?.userId || !Array.isArray(location.coordinates)) return;

    setLiveLocations(prev => ({
      ...prev,
      [location.userId]: location
    }));

    setTourists(prev => prev.map(t => (
      t._id === location.userId
        ? {
            ...t,
            lastKnownLocation: { type: 'Point', coordinates: location.coordinates },
            lastActive: location.timestamp || new Date().toISOString()
          }
        : t
    )));

    setDetail(prev => {
      if (!prev?.tourist || prev.tourist._id !== location.userId) return prev;
      return {
        ...prev,
        tourist: {
          ...prev.tourist,
          lastKnownLocation: { type: 'Point', coordinates: location.coordinates },
          lastActive: location.timestamp || new Date().toISOString()
        },
        liveLocation: location
      };
    });
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await touristAPI.getAll({ search, limit: 50 });
        setTourists(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search]);

  const viewDetail = async (id) => {
    try {
      const res = await touristAPI.getById(id);
      setDetail({
        ...res.data,
        liveLocation: liveLocations[id] || null
      });
      setSelected(id);
    } catch (err) { console.error(err); }
  };

  const selectedLocation = useMemo(() => {
    if (!detail?.tourist) return null;
    const live = liveLocations[detail.tourist._id] || detail.liveLocation;
    const coordinates =
      live?.coordinates ||
      detail.locationHistory?.[0]?.location?.coordinates ||
      detail.tourist?.lastKnownLocation?.coordinates;

    return {
      coordinates,
      position: toMapPosition(coordinates),
      timestamp: live?.timestamp || detail.locationHistory?.[0]?.createdAt || detail.tourist?.lastActive,
      speed: live?.speed,
      battery: live?.battery,
      isLive: Boolean(live)
    };
  }, [detail, liveLocations]);

  const includeLocationInAlert = () => {
    if (!selectedLocation?.position) return;

    const { lat, lng } = selectedLocation.position;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    setAlertForm(f => ({
      ...f,
      message: `${f.message ? `${f.message}\n\n` : ''}Current location: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nMap: ${mapUrl}`
    }));
  };

  const sendManualAlert = async (e) => {
    e.preventDefault();
    if (!detail?.tourist?._id) return;

    setSendingAlert(true);
    try {
      await alertAPI.sendAlert({
        userId: detail.tourist._id,
        touristId: detail.tourist._id,
        title: alertForm.title,
        message: alertForm.message,
        type: 'websocket',
        channel: 'web',
        severity: alertForm.severity,
        priority: alertForm.severity
      });

      toast.success('Alert sent to tourist');
      setAlertForm({ title: '', message: '', severity: 'warning' });
    } catch (err) {
      toast.error(err.message || 'Failed to send alert');
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading tourists..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <HiOutlineUsers className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Tourists</h1>
          <span className="badge badge-info">{tourists.length}</span>
        </div>

        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, DTID, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 !w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tourist list */}
        <div className="lg:col-span-2 space-y-3">
          {tourists.map((t, i) => {
            const isActive = t.lastActive && new Date(t.lastActive) > new Date(Date.now() - 30 * 60 * 1000);
            return (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card-solid p-4 cursor-pointer hover:shadow-lg transition-all ${
                  selected === t._id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => viewDetail(t._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                      {t.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{t.dtid} · {t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {isActive ? 'Active' : timeAgo(t.lastActive)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {detail ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card-solid p-6 sticky top-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {detail.tourist?.name?.charAt(0)}
                </div>
                <h3 className="text-lg font-bold">{detail.tourist?.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{detail.tourist?.dtid}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Email</span><span>{detail.tourist?.email}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Phone</span><span>{detail.tourist?.phone || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Nationality</span><span>{detail.tourist?.nationality || 'N/A'}</span></div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <HiOutlineMapPin className="w-4 h-4 text-primary-500" />
                      <p className="text-xs font-medium">Live Location</p>
                    </div>
                    <span className={`badge ${selectedLocation?.isLive ? 'badge-low' : 'badge-info'}`}>
                      {selectedLocation?.isLive ? 'Live' : 'Last known'}
                    </span>
                  </div>

                  {selectedLocation?.position ? (
                    <>
                      <div className="overflow-hidden rounded-xl border border-[var(--border-color)]">
                        {mapLoadError ? (
                          <div className="p-3 text-xs text-[var(--text-secondary)]">
                            Map failed to load. Check your Google Maps API key.
                          </div>
                        ) : !isMapLoaded ? (
                          <div className="p-3 text-xs text-[var(--text-secondary)]">Loading map...</div>
                        ) : (
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={selectedLocation.position}
                            zoom={15}
                            options={{
                              streetViewControl: false,
                              mapTypeControl: false,
                              fullscreenControl: false
                            }}
                          >
                            <Marker position={selectedLocation.position} />
                          </GoogleMap>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <p>
                          {selectedLocation.position.lat.toFixed(6)}, {selectedLocation.position.lng.toFixed(6)}
                        </p>
                        {selectedLocation.timestamp && <p>Updated {timeAgo(selectedLocation.timestamp)}</p>}
                        <div className="flex flex-wrap gap-2">
                          {Number.isFinite(Number(selectedLocation.speed)) && (
                            <span>Speed: {Number(selectedLocation.speed).toFixed(1)} m/s</span>
                          )}
                          {selectedLocation.battery && <span>Battery: {selectedLocation.battery}%</span>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`https://maps.google.com/?q=${selectedLocation.position.lat},${selectedLocation.position.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost flex-1 !py-2 text-xs inline-flex items-center justify-center gap-1 border border-[var(--border-color)]"
                        >
                          <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                          Open Map
                        </a>
                        <button
                          type="button"
                          onClick={includeLocationInAlert}
                          className="btn-ghost flex-1 !py-2 text-xs border border-[var(--border-color)]"
                        >
                          Add to Alert
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">
                      No location received from this tourist yet.
                    </p>
                  )}
                </div>

                {detail.tourist?.emergencyContact?.name && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 mt-4">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Emergency Contact</p>
                    <p className="text-sm">{detail.tourist.emergencyContact.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{detail.tourist.emergencyContact.phone} ({detail.tourist.emergencyContact.relation})</p>
                  </div>
                )}

                <form onSubmit={sendManualAlert} className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <HiOutlineBell className="w-4 h-4" />
                    <p className="text-xs font-medium">Send Manual Alert</p>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Alert title"
                    value={alertForm.title}
                    onChange={e => setAlertForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field !py-2 text-xs"
                  />
                  <textarea
                    required
                    placeholder="Alert message"
                    value={alertForm.message}
                    onChange={e => setAlertForm(f => ({ ...f, message: e.target.value }))}
                    className="input-field !py-2 text-xs min-h-20 resize-none"
                  />
                  <select
                    value={alertForm.severity}
                    onChange={e => setAlertForm(f => ({ ...f, severity: e.target.value }))}
                    className="input-field !py-2 text-xs"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button
                    type="submit"
                    disabled={sendingAlert}
                    className="btn-primary w-full !py-2 text-xs"
                  >
                    {sendingAlert ? 'Sending...' : 'Send Alert'}
                  </button>
                </form>

                {/* Recent incidents */}
                <div className="mt-4">
                  <p className="font-medium mb-2">Recent Incidents ({detail.incidents?.length || 0})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.incidents?.slice(0, 5).map(inc => (
                      <div key={inc._id} className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-xs">
                        <div className="flex justify-between">
                          <span className="capitalize font-medium">{inc.type?.replace('_', ' ')}</span>
                          <span className={`badge ${inc.severity === 'critical' ? 'badge-critical' : inc.severity === 'high' ? 'badge-high' : 'badge-medium'}`}>
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1">{timeAgo(inc.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card-solid p-8 text-center text-[var(--text-secondary)]">
              <HiOutlineUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a tourist to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristsPage;
