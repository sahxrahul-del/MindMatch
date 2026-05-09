class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    const room = {
      id: roomId,
      players: [],
      status: 'waiting', // waiting, playing, revealing, result
      round: 1,
      messages: [],
      submissions: {}, // socketId -> number
      submittedPlayers: [], // socketIds
      replayPlayers: [], // socketIds
      readyPlayers: new Set(),
      lastResult: null,
    };
    this.rooms.set(roomId, room);
    console.log(`[Room ${roomId}] Created`);
    return room;
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Return a copy with Set converted to Array for JSON serialization
    return {
      ...room,
      readyPlayers: Array.from(room.readyPlayers)
    };
  }

  joinRoom(roomId, player) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    
    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === player.id);
    if (existingPlayer) return { room: this.getRoom(roomId) };

    if (room.players.length >= 2) return { error: 'Room is full' };
    
    room.players.push({
      ...player,
      ready: false
    });
    return { room: this.getRoom(roomId) };
  }

  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== socketId);
    room.readyPlayers.delete(socketId);
    delete room.submissions[socketId];
    room.submittedPlayers = room.submittedPlayers.filter(id => id !== socketId);
    room.replayPlayers = (room.replayPlayers || []).filter(id => id !== socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    // Reset room status if someone leaves
    room.status = 'waiting';
    room.submissions = {};
    room.submittedPlayers = [];
    room.replayPlayers = [];
    room.readyPlayers.clear(); // Clear all ready states
    room.lastResult = null;
    room.players.forEach(p => p.ready = false);
    room.round = 1;

    return this.getRoom(roomId);
  }

  setPlayerReady(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.readyPlayers.add(socketId);
    const player = room.players.find(p => p.id === socketId);
    if (player) player.ready = true;

    if (room.readyPlayers.size === 2 && room.players.length === 2) {
      room.status = 'playing';
      room.readyPlayers.clear();
      room.players.forEach(p => p.ready = false);
    }

    return this.getRoom(roomId);
  }

  submitNumber(roomId, socketId, number) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    // Strict State Machine: Only allow submissions during 'playing' phase
    if (room.status !== 'playing') {
      return { error: 'Game is not in selecting phase' };
    }

    // Prevent duplicate submissions from the same player in one round
    if (room.submittedPlayers.includes(socketId)) {
      return { error: 'You have already submitted a number' };
    }

    if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || number > 20) {
      return { error: 'Invalid number' };
    }

    room.submissions[socketId] = number;
    room.submittedPlayers.push(socketId);
    
    // Only transition to revealing when EXACTLY 2 players have submitted
    if (room.submittedPlayers.length === 2) {
      room.status = 'revealing';
    }

    return { room: this.getRoom(roomId) };
  }

  requestReplay(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!room.replayPlayers) room.replayPlayers = [];
    if (!room.replayPlayers.includes(socketId)) {
      room.replayPlayers.push(socketId);
    }

    if (room.replayPlayers.length === 2) {
      // Immediate restart to selecting phase
      room.status = 'playing';
      room.submissions = {};
      room.submittedPlayers = [];
      room.replayPlayers = [];
      room.lastResult = null;
      room.round += 1;
    }

    return this.getRoom(roomId);
  }

  addMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.messages.push(message);
    if (room.messages.length > 50) room.messages.shift();
    return this.getRoom(roomId);
  }
}

module.exports = new RoomManager();
