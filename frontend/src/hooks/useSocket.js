import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, getSocket } from '../services/socket';

const useSocket = (event, callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // ✅ ENSURE SOCKET CONNECTS
    let socket = getSocket();
    if (!socket) {
      socket = connectSocket(token);
    }

    if (!socket) return;

    const handler = (...args) => callbackRef.current(...args);

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [event]);

  // ✅ emit function (safe)
  const emit = useCallback((eventName, data) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(eventName, data);
    }
  }, []);

  return { emit };
};

export default useSocket;