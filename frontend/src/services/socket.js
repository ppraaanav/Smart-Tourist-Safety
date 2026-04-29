import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://smart-tourist-safety-piu5.onrender.com";

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?._id && user?.role) {
      socket.emit("join-room", {
        userId: user._id,
        role: user.role,
      });

      console.log(
        `🚀 Joined room: user:${user._id} (${user.role})`
      );
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
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