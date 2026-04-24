import { useState, useEffect, useCallback, useRef } from 'react';

const useGeolocation = (options = {}) => {
  const { enableHighAccuracy = true, interval = 10000, enabled = true } = options;
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const data = {
            coordinates: [pos.coords.longitude, pos.coords.latitude],
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
            altitude: pos.coords.altitude || 0,
            timestamp: pos.timestamp
          };
          setPosition(data);
          setError(null);
          resolve(data);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [enableHighAccuracy]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !enabled) return;

    setIsTracking(true);

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const data = {
          coordinates: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || 0,
          altitude: pos.coords.altitude || 0,
          timestamp: pos.timestamp
        };
        setPosition(data);
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy, timeout: 10000, maximumAge: 5000 }
    );
  }, [enabled, enableHighAccuracy]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      getCurrentPosition().catch(() => {});
      startTracking();
    }
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking, getCurrentPosition]);

  return { position, error, isTracking, getCurrentPosition, startTracking, stopTracking };
};

export default useGeolocation;
