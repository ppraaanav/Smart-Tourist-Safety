import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineMapPin, HiOutlineWifi, HiOutlineSignal } from 'react-icons/hi2';
import SOSButton from '../components/tourist/SOSButton';
import TouristMap from '../components/tourist/TouristMap';
import AlertsList from '../components/tourist/AlertsList';
import useGeolocation from '../hooks/useGeolocation';
import useOfflineSync from '../hooks/useOfflineSync';
import useSocket from '../hooks/useSocket';
import useAuthStore from '../stores/authStore';
import { locationAPI } from '../services/api';
import toast from 'react-hot-toast';

const TouristDashboard = () => {
  const { user } = useAuthStore();
  const { position, isTracking } = useGeolocation({ enabled: true, interval: 15000 });
  const { isOnline, pendingCount, saveOfflineLocation } = useOfflineSync();
  const locationInterval = useRef(null);

  // Send location updates to server
  const sendLocationUpdate = useCallback(async () => {
    if (!position?.coordinates) return;

    const data = {
      coordinates: position.coordinates,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      altitude: position.altitude,
      battery: 100  // navigator.getBattery not universally supported
    };

    if (isOnline) {
      try {
        await locationAPI.update(data);
      } catch (err) {
        saveOfflineLocation(data);
      }
    } else {
      saveOfflineLocation(data);
    }
  }, [position, isOnline, saveOfflineLocation]);

  // Send location updates periodically
  useEffect(() => {
    if (position) {
      sendLocationUpdate();
    }
    locationInterval.current = setInterval(sendLocationUpdate, 15000);
    return () => clearInterval(locationInterval.current);
  }, [sendLocationUpdate, position]);

  // Listen for alerts
  useSocket('alert:geofence', (data) => {
    toast.error(`${data.title}: ${data.message}`, { duration: 8000, icon: '🚧' });
  });

  useSocket('alert:anomaly', (data) => {
    toast(data.message, { duration: 6000, icon: '⚠️' });
  });

  useSocket('incident:status', (data) => {
    toast.success(`Incident ${data.status}`, { icon: '📋' });
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-solid p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <HiOutlineShieldCheck className="w-4 h-4 text-green-500" />
                DTID: {user?.dtid}
              </span>
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <><HiOutlineWifi className="w-4 h-4 text-green-500" /> Online</>
                ) : (
                  <><HiOutlineWifi className="w-4 h-4 text-red-500" /> Offline ({pendingCount} pending)</>
                )}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineSignal className={`w-4 h-4 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
                {isTracking ? 'Tracking active' : 'Tracking paused'}
              </span>
            </div>
          </div>

          {/* Current location */}
          {position && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs">
              <HiOutlineMapPin className="w-4 h-4 text-primary-500" />
              <span>{position.coordinates[1].toFixed(4)}, {position.coordinates[0].toFixed(4)}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map + SOS */}
        <div className="lg:col-span-2 space-y-6">
          <TouristMap />

          {/* SOS Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card-solid p-8 flex flex-col items-center gap-4"
          >
            <h2 className="text-lg font-semibold text-center">Emergency SOS</h2>
            <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
              Press the SOS button in case of emergency. Your location will be sent to all nearby authorities.
            </p>
            <SOSButton />
          </motion.div>
        </div>

        {/* Alerts sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card-solid p-6">
            <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDashboard;
