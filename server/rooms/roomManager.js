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
      readyPlayers: new Set(),
      lastResult: null,
    };
    this.rooms.set(roomId, room);
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
    if (!room) return null;

    room.submissions[socketId] = number;
    if (!room.submittedPlayers.includes(socketId)) {
      room.submittedPlayers.push(socketId);
    }
    
    if (Object.keys(room.submissions).length === 2) {
      room.status = 'revealing';
    }

    return this.getRoom(roomId);
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
