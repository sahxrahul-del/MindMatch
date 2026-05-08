const roomManager = require('../rooms/roomManager');
const { generateRoomId } = require('../utils/idGenerator');
const { calculateResult } = require('../gameLogic');

const getSafeRoom = (room) => {
  if (!room) return null;
  const safeRoom = { ...room };
  
  // Hide actual numbers unless we are in reveal or result phase
  if (room.status !== 'revealing' && room.status !== 'result') {
    safeRoom.submissions = {};
    // Still have submittedPlayers array for indicators
  }
  
  return safeRoom;
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', ({ username, avatar }) => {
      const roomId = generateRoomId();
      roomManager.createRoom(roomId);
      const room = roomManager.joinRoom(roomId, { id: socket.id, username, avatar }).room;
      
      socket.join(roomId);
      socket.emit('room-created', getSafeRoom(room));
      console.log(`Room created: ${roomId} by ${username}`);
    });

    socket.on('join-room', ({ roomId, username, avatar }) => {
      const result = roomManager.joinRoom(roomId, { id: socket.id, username, avatar });
      
      if (result.error) {
        return socket.emit('error-message', result.error);
      }

      socket.join(roomId);
      io.to(roomId).emit('room-updated', getSafeRoom(result.room));
      console.log(`${username} joined room: ${roomId}`);
    });

    socket.on('player-ready', (roomId) => {
      const room = roomManager.setPlayerReady(roomId, socket.id);
      if (room) {
        io.to(roomId).emit('room-updated', getSafeRoom(room));
      }
    });

    socket.on('submit-number', ({ roomId, number }) => {
      const room = roomManager.submitNumber(roomId, socket.id, number);
      if (!room) return;

      if (room.status === 'revealing') {
        // Both submitted
        const playerIds = Object.keys(room.submissions);
        const num1 = room.submissions[playerIds[0]];
        const num2 = room.submissions[playerIds[1]];
        
        const result = calculateResult(num1, num2);
        room.lastResult = {
          selections: {
            [playerIds[0]]: num1,
            [playerIds[1]]: num2
          },
          ...result
        };

        if (result.type === 'match') {
          // Score logic removed
        }

        io.to(roomId).emit('room-updated', getSafeRoom(room)); 
        
        setTimeout(() => {
          room.status = 'result';
          io.to(roomId).emit('room-updated', getSafeRoom(room));
        }, 3000); 
      } else {
        io.to(roomId).emit('room-updated', getSafeRoom(room));
      }
    });

    socket.on('send-message', ({ roomId, message, username, avatar }) => {
      const msgData = {
        id: Date.now(),
        senderId: socket.id,
        username,
        avatar,
        text: message,
        timestamp: new Date().toISOString()
      };
      const room = roomManager.addMessage(roomId, msgData);
      if (room) {
        io.to(roomId).emit('new-message', msgData);
      }
    });

    socket.on('typing', ({ roomId, username }) => {
      socket.to(roomId).emit('player-typing', { username });
    });

    socket.on('stop-typing', (roomId) => {
      socket.to(roomId).emit('player-stop-typing');
    });

    socket.on('replay-request', (roomId) => {
      const room = roomManager.requestReplay(roomId, socket.id);
      if (room) {
        io.to(roomId).emit('room-updated', getSafeRoom(room));
      }
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          const room = roomManager.getRoom(roomId);
          if (room) {
            const player = room.players.find(p => p.id === socket.id);
            const username = player ? player.username : 'Someone';
            
            const updatedRoom = roomManager.leaveRoom(roomId, socket.id);
            if (updatedRoom) {
              io.to(roomId).emit('room-updated', updatedRoom);
              io.to(roomId).emit('player-left', { username });
            }
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
