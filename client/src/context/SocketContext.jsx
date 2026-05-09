import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    console.log('🔌 Attempting to connect to socket server at:', serverUrl);
    
    if (window.location.protocol === 'https:' && serverUrl.startsWith('http://') && !serverUrl.includes('localhost')) {
      console.warn('⚠️ MIXED CONTENT WARNING: You are on an HTTPS site but trying to connect to an HTTP server. The browser may block this connection.');
    }
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully! ID:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
