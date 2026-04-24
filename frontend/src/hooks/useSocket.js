import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

const useSocket = (event, callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (...args) => callbackRef.current(...args);
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event]);

  const emit = useCallback((eventName, data) => {
    const socket = getSocket();
    if (socket) socket.emit(eventName, data);
  }, []);

  return { emit };
};

export default useSocket;
