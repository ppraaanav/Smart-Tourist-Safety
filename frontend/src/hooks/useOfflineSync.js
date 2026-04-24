import { useState, useCallback, useEffect } from 'react';
import { locationAPI } from '../services/api';

const STORAGE_KEY = 'offline_locations';

const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingLocations();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending count
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setPendingCount(pending.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineLocation = useCallback((locationData) => {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    pending.push({ ...locationData, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
  }, []);

  const syncPendingLocations = useCallback(async () => {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (pending.length === 0) return;

    try {
      await locationAPI.syncOffline(pending);
      localStorage.setItem(STORAGE_KEY, '[]');
      setPendingCount(0);
      console.log(`Synced ${pending.length} offline locations`);
    } catch (error) {
      console.error('Failed to sync offline locations:', error);
    }
  }, []);

  return { isOnline, pendingCount, saveOfflineLocation, syncPendingLocations };
};

export default useOfflineSync;
