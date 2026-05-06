import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://smart-tourist-safety-piu5.onrender.com";

let socket = null;

export const connectSocket = (token) => {
  // ✅ prevent multiple connections
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },

    // ✅ FIX: polling first for Render stability
    transports: ["polling", "websocket"],

    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // ✅ SAFE room join
    if (user?._id && user?.role) {
      socket.emit("join-room", {
        userId: user._id,
        role: user.role,
      });

      console.log(`🚀 Joined room: user:${user._id} (${user.role})`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);

    // ✅ auto reconnect fallback
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  socket.on("connect_error", (error) => {
    console.error("🚨 Socket connection error:", error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
};