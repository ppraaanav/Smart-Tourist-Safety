import { io, type Socket } from 'socket.io-client'

export const createSocket = (token: string) => {
  const url = import.meta.env.VITE_API_BASE_URL || 'https://smart-tourist-safety-piu5.onrender.com'
  const socket: Socket = io(url, {
    transports: ['websocket'],
    auth: { token }
  })
  return socket
}

