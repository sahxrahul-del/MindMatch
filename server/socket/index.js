const roomManager = require('../rooms/roomManager');
const { generateRoomId } = require('../utils/idGenerator');
const { calculateResult } = require('../gameLogic');

const getSafeRoom = (room) => {
  if (!room) return null;
  const safeRoom = { ...room };
  
  // Security: Only expose actual numbers in 'result' phase.
  // During 'revealing', the client only needs to know that both have submitted,
  // not what the numbers are. This prevents network-tab cheating.
  if (room.status !== 'result') {
    safeRoom.submissions = {};
  }
  
  return safeRoom;
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', ({ username, avatar }) => {
      const roomId = generateRoomId();
      roomManager.createRoom(roomId);
      const result = roomManager.joinRoom(roomId, { id: socket.id, username, avatar });
      const room = result.room;
      
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
      const result = roomManager.submitNumber(roomId, socket.id, number);
      
      if (result.error) {
        return socket.emit('error-message', result.error);
      }

      const room = result.room;
      const originalRoom = roomManager.rooms.get(roomId);

      if (room.status === 'revealing') {
        // Both submitted - execute atomic reveal logic
        const playerIds = Object.keys(originalRoom.submissions);
        const num1 = originalRoom.submissions[playerIds[0]];
        const num2 = originalRoom.submissions[playerIds[1]];
        
        const calculation = calculateResult(num1, num2);
        const currentRound = room.round;
        
        // Lock the result into the original room object
        originalRoom.lastResult = {
          selections: {
            [playerIds[0]]: num1,
            [playerIds[1]]: num2
          },
          ...calculation
        };

        // Notify everyone that revealing has started
        io.to(roomId).emit('room-updated', getSafeRoom(roomManager.getRoom(roomId))); 
        
        // Atomic transition to result after animation time
        setTimeout(() => {
          const roomToUpdate = roomManager.rooms.get(roomId);
          // Safety: Only transition if we are still in the same round and still revealing
          if (roomToUpdate && roomToUpdate.status === 'revealing' && roomToUpdate.round === currentRound) {
            roomToUpdate.status = 'result';
            io.to(roomId).emit('room-updated', getSafeRoom(roomManager.getRoom(roomId)));
          }
        }, 3000); 
      } else {
        // First player submitted, just update indicators
        io.to(roomId).emit('room-updated', getSafeRoom(room));
      }
    });

    socket.on('send-message', ({ roomId, message, username, avatar }) => {
      if (typeof message !== 'string' || message.trim() === '') return;
      
      const safeMessage = message.substring(0, 500); // Max 500 chars
      
      const msgData = {
        id: Date.now(),
        senderId: socket.id,
        username,
        avatar,
        text: safeMessage,
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

    socket.on('leave-room', (roomId) => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        const username = player ? player.username : 'Someone';
        
        const updatedRoom = roomManager.leaveRoom(roomId, socket.id);
        socket.leave(roomId);
        
        if (updatedRoom) {
          io.to(roomId).emit('room-updated', getSafeRoom(updatedRoom));
          io.to(roomId).emit('player-left', { username });
        }
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
              io.to(roomId).emit('room-updated', getSafeRoom(updatedRoom));
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
