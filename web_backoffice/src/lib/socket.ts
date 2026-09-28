'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== 'undefined') {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000/rides';
    socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('🟢 Telemetría WebSocket en vivo conectada.');
    });

    socket.on('connect_error', () => {
      // In serverless environments like Vercel, sockets operate via polling fallback
      socket?.disconnect();
    });
  }

  return socket!;
};
