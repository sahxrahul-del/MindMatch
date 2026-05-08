import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Users, Plus, LogIn } from 'lucide-react';
import { useGame } from '../context/GameContext';
import Button from '../components/Button';
import AvatarPicker from '../components/AvatarPicker';

const Home = () => {
  const { createRoom, joinRoom, room } = useGame();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState('select'); // select, create, join

  const handleCreate = (e) => {
    e.preventDefault();
    if (!username) return alert('Please enter a username');
    createRoom(username, avatar);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username) return alert('Please enter a username');
    if (!roomIdInput) return alert('Please enter a Room ID');
    joinRoom(roomIdInput.toUpperCase(), username, avatar);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-surface to-background overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="inline-block p-4 bg-primary/20 rounded-2xl mb-4"
          >
            <Rocket size={40} className="text-primary" />
          </motion.div>
          <h1 className="text-4xl font-black neon-text mb-2 tracking-tight">MIND MATCH</h1>
          <p className="text-white/40 text-sm italic">Multiplayer Synchronized Selection</p>
        </div>

        {mode === 'select' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-white/40 ml-1">Your Alias</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-all text-lg font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-white/40 ml-1">Pick Avatar</label>
              <AvatarPicker selected={avatar} onSelect={setAvatar} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button onClick={() => setMode('create')} className="flex items-center justify-center gap-2">
                <Plus size={18} /> Create
              </Button>
              <Button onClick={() => setMode('join')} variant="secondary" className="flex items-center justify-center gap-2">
                <Users size={18} /> Join
              </Button>
            </div>
          </div>
        ) : mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Host a New Match</h2>
              <p className="text-white/40 text-sm">You'll get a unique code to share.</p>
            </div>
            <Button type="submit" className="w-full py-4 text-lg">Launch Room</Button>
            <button onClick={() => setMode('select')} className="w-full text-white/40 text-sm hover:text-white transition-colors">Go Back</button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Join Existing Match</h2>
              <p className="text-white/40 text-sm">Enter the 5-digit code from your friend.</p>
            </div>
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              placeholder="ROOM CODE (e.g. A7K92)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-widest focus:outline-none focus:border-primary/50 transition-all"
              maxLength={5}
            />
            <Button type="submit" className="w-full py-4 text-lg">Enter Room</Button>
            <button onClick={() => setMode('select')} className="w-full text-white/40 text-sm hover:text-white transition-colors">Go Back</button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Home;
