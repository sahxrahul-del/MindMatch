import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const socket = useSocket();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mindmatch_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => {
      setIsConnected(false);
      setRoom(null); // Reset room state so user drops to Home if server restarts
      setMessages([]);
    };

    setIsConnected(socket.connected);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('room-created', (data) => {
      setRoom(data);
      setMessages(data.messages || []);
    });

    socket.on('room-updated', (data) => {
      setRoom(data);
      if (data.messages) setMessages(data.messages);
    });

    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Clear typing indicator if message is from the typing user
      setTypingUser((currentTypingUser) => {
        if (msg.username === currentTypingUser) {
          setIsTyping(false);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          return null;
        }
        return currentTypingUser;
      });
    });

    socket.on('player-typing', ({ username }) => {
      setTypingUser(username);
      setIsTyping(true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingUser(null);
      }, 3000);
    });

    socket.on('player-stop-typing', () => {
      setIsTyping(false);
      setTypingUser(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    });

    socket.on('player-left', ({ username }) => {
      setMessages((prev) => [...prev, {
        id: `system-${Date.now()}`,
        username: 'System',
        avatar: '🤖',
        text: `${username} has left the room.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      }]);
    });

    socket.on('error-message', (err) => {
      alert(err);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('new-message');
      socket.off('player-typing');
      socket.off('player-stop-typing');
      socket.off('player-left');
      socket.off('error-message');
    };
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (room) socket.emit('leave-room', room.id);
    setRoom(null);
    setMessages([]);
  }, [socket, room]);

  const createRoom = useCallback((username, avatar) => {
    if (!socket || !isConnected) {
      return alert("Connection Error: The app is unable to reach the game server. Please ensure VITE_SERVER_URL is set correctly in Vercel and the backend is running.");
    }
    const userData = { username, avatar };
    setUser(userData);
    localStorage.setItem('mindmatch_user', JSON.stringify(userData));
    socket.emit('create-room', userData);
  }, [socket, isConnected]);

  const joinRoom = useCallback((roomId, username, avatar) => {
    if (!socket || !isConnected) {
      return alert("Connection Error: The app is unable to reach the game server.");
    }
    const userData = { username, avatar };
    setUser(userData);
    localStorage.setItem('mindmatch_user', JSON.stringify(userData));
    socket.emit('join-room', { roomId, username, avatar });
  }, [socket, isConnected]);

  const setReady = useCallback(() => {
    if (room) socket.emit('player-ready', room.id);
  }, [socket, room]);

  const submitNumber = useCallback((number) => {
    if (room) socket.emit('submit-number', { roomId: room.id, number });
  }, [socket, room]);

  const sendMessage = useCallback((text) => {
    if (room && user) {
      socket.emit('send-message', {
        roomId: room.id,
        message: text,
        username: user.username,
        avatar: user.avatar
      });
    }
  }, [socket, room, user]);

  const sendTyping = useCallback((isTyping) => {
    if (room && user) {
      socket.emit(isTyping ? 'typing' : 'stop-typing', {
        roomId: room.id,
        username: user.username
      });
    }
  }, [socket, room, user]);

  const requestReplay = useCallback(() => {
    if (room) socket.emit('replay-request', room.id);
  }, [socket, room]);

  const value = {
    room,
    user,
    isConnected,
    messages,
    isTyping,
    typingUser,
    createRoom,
    joinRoom,
    setReady,
    submitNumber,
    sendMessage,
    sendTyping,
    requestReplay,
    leaveRoom
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
