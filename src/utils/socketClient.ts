import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants';
import api from '@/services/api';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = (): Promise<Socket> => {
  return new Promise(async (resolve, reject) => {
    if (socket && socket.connected) {
      resolve(socket);
      return;
    }

    try {
      // Get token from httpOnly cookie via API call
      const tokenResponse = await api.get<{ token: string }>('/api/socket-token');
      const token = tokenResponse.data.token;

      socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: token,
        },
      });

      socket.on('connect', () => {
        console.log('Socket.IO connected');
        resolve(socket!);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        reject(error);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });
    } catch (error) {
      console.error('Failed to get token for Socket.IO:', error);
      reject(error);
    }
  });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

