import { io } from 'socket.io-client';
import { getToken } from './api';

// Empty string = same origin (Docker). Undefined = local dev (WS on :3001)
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    const url = WS_URL === '' ? window.location.origin : (WS_URL || 'http://localhost:3001');
    socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: getToken() },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
