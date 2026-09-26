'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== 'undefined') {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000/rides';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🟢 Conectado exitosamente al WebSocket de Telemetría Rumbo Fino:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('🟡 Desconectado del WebSocket de Telemetría:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Error de conexión WebSocket (operando con fallback):', err.message);
    });
  }

  return socket!;
};
