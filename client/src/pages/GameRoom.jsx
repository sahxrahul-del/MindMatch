import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, LogOut, Users, Play, RotateCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import Button from '../components/Button';
import PlayerCard from '../components/PlayerCard';
import NumberCard from '../components/NumberCard';
import ChatPanel from '../components/ChatPanel';
import { useSocket } from '../context/SocketContext';
import { cn } from '../utils/cn';

const GameRoom = () => {
  const socket = useSocket();
  const { room, user, setReady, submitNumber, requestReplay, leaveRoom } = useGame();
  const [copied, setCopied] = useState(false);
  const [selectedNum, setSelectedNum] = useState(null);
  const [hasSubmittedLocal, setHasSubmittedLocal] = useState(false);

  const me = room?.players?.find(p => p.id === socket?.id);
  const opponent = room?.players?.find(p => p.id !== socket?.id);

  const lastRoundRef = useRef(room?.round || 1);
  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    if (!me) return;
    
    // Only reset selection when the round number changes or room resets to waiting
    if (room?.round !== lastRoundRef.current || room?.status === 'waiting') {
      setSelectedNum(null);
      setHasSubmittedLocal(false);
      lastRoundRef.current = room?.round;
      hasCelebratedRef.current = false; // Reset for new round
    }
    
    if (room?.status === 'result' && room.lastResult?.type === 'match' && !hasCelebratedRef.current) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
      hasCelebratedRef.current = true; // Mark as celebrated for this result
    }
  }, [room?.status, room?.lastResult, room?.round, me?.id]); // Added round to dependencies

  const copyRoomId = () => {
    if (!room?.id) return;
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (selectedNum !== null && room?.id) {
      submitNumber(selectedNum);
      setHasSubmittedLocal(true);
    }
  };

  if (!room || !me) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="relative w-16 h-16 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full"
          />
        </div>
        <h2 className="text-xl font-bold neon-text animate-pulse">CONNECTING...</h2>
        <p className="text-white/40 text-sm mt-2">Synchronizing with room state</p>
        <button onClick={leaveRoom} className="mt-8 text-white/40 hover:text-white transition-colors text-sm underline">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8 glass p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Trophy size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-black tracking-tighter text-xl">MIND MATCH</h2>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Session Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          <span className="text-xs text-white/40 font-bold uppercase">Room Code:</span>
          <span className="font-mono font-black text-primary tracking-widest">{room.id}</span>
          <button onClick={copyRoomId} className="ml-2 hover:text-primary transition-colors">
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>

        <button onClick={leaveRoom} className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors text-sm font-medium">
          <LogOut size={16} /> Exit Room
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Players */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Players</h3>
            <PlayerCard 
              player={me} 
              isMe 
              hasSubmitted={room.submittedPlayers?.includes(me.id)}
              roomStatus={room.status}
              isNext={room.replayPlayers?.includes(me.id)}
            />
            {opponent ? (
              <PlayerCard 
                player={opponent} 
                isOpponent 
                hasSubmitted={room.submittedPlayers?.includes(opponent.id)}
                roomStatus={room.status}
                isNext={room.replayPlayers?.includes(opponent.id)}
              />
            ) : (
              <div className="p-6 rounded-2xl glass border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 opacity-50 animate-pulse-slow">
                <Users size={32} className="text-white/20" />
                <p className="text-xs text-center">Waiting for opponent...</p>
              </div>
            )}
          </div>

          {room.status === 'waiting' && me && !me.ready && opponent && (
            <Button onClick={setReady} className="w-full mt-4 py-4" variant="primary">
              <Play size={18} className="inline mr-2" /> I'm Ready
            </Button>
          )}

          {room.status === 'result' && (
            <Button onClick={requestReplay} className="w-full mt-4 py-4" variant="accent">
              <RotateCcw size={18} className="inline mr-2" /> Play Again
            </Button>
          )}
        </div>

        {/* Center: Game Area */}
        <div className="md:col-span-9 glass rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden flex flex-col items-center justify-start min-h-[500px]">
          {/* Top Status Dashboard */}
          {room.status !== 'waiting' && (
            <div className="w-full flex justify-center gap-6 mb-8 p-3 glass rounded-2xl border border-white/5">
              {room.players.map(p => {
                const isSelected = room.submittedPlayers?.includes(p.id);
                const isReplay = room.replayPlayers?.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-xl">{p.avatar}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-white/40">{p.username}</span>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        (isSelected || isReplay) ? "text-green-400" : "text-primary animate-pulse"
                      )}>
                        {room.status === 'playing' ? (isSelected ? 'Selected' : 'Selecting') : (room.status === 'result' ? (isReplay ? 'Next?' : 'Waiting') : room.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            {room.status === 'waiting' && (
              <motion.div
                key="waiting-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                {!opponent ? (
                  <div className="space-y-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                      />
                      <div className="relative z-10 w-full h-full glass rounded-full flex items-center justify-center border border-primary/30">
                        <Users size={40} className="text-primary" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold">Waiting for Player 2</h2>
                    <p className="text-white/40 max-w-xs mx-auto">Share the room code <span className="text-primary font-mono">{room.id}</span> with a friend to start matching minds!</p>
                    <Button onClick={copyRoomId} variant="outline" className="mt-4">
                      {copied ? 'Copied Code!' : 'Copy Invitation Link'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black neon-text uppercase tracking-tighter italic">Get Ready!</h2>
                    <p className="text-white/40">Both players must click ready to begin.</p>
                  </div>
                )}
              </motion.div>
            )}

            {room.status === 'playing' && (
              <motion.div
                key="playing-ui"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Select your number</h2>
                  <p className="text-white/40 text-sm">Choose a number from 1 to 20. Try to match your opponent!</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-3 md:gap-4 mx-auto">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                    <NumberCard
                      key={num}
                      number={num}
                      isSelected={selectedNum === num}
                      onClick={setSelectedNum}
                      disabled={hasSubmittedLocal}
                    />
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedNum === null || hasSubmittedLocal}
                    className={cn(
                      "px-12 py-4 text-xl uppercase tracking-widest font-black",
                      hasSubmittedLocal && "bg-green-500/20 text-green-400 border-green-500/30"
                    )}
                  >
                    {hasSubmittedLocal ? 'Submitted!' : 'Lock It In'}
                  </Button>
                </div>
              </motion.div>
            )}

            {room.status === 'revealing' && (
              <motion.div
                key="revealing-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-8"
              >
                <h2 className="text-4xl font-black italic tracking-tighter uppercase neon-text animate-pulse">Revealing...</h2>
                <div className="flex justify-center gap-12">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{me.username}</p>
                    <motion.div
                      animate={{ rotateY: 180 }}
                      transition={{ duration: 1 }}
                      className="w-24 h-32 glass rounded-2xl border-2 border-primary/50 flex items-center justify-center text-4xl font-black"
                    >
                      ?
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{opponent.username}</p>
                    <motion.div
                      animate={{ rotateY: 180 }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="w-24 h-32 glass rounded-2xl border-2 border-secondary/50 flex items-center justify-center text-4xl font-black"
                    >
                      ?
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {room.status === 'result' && room.lastResult && (
              <motion.div
                key="result-ui"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 w-full"
              >
                <div className="space-y-2">
                  <h2 className={cn(
                    "text-5xl font-black uppercase italic tracking-tighter",
                    room.lastResult.type === 'match' ? "text-green-400 neon-text" : "text-white"
                  )}>
                    {room.lastResult.message}
                  </h2>
                  <p className="text-white/40">The distance was {room.lastResult.diff} points</p>
                </div>

                <div className="flex justify-center gap-8 md:gap-16">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{me.username}</p>
                    <NumberCard
                      number={room.lastResult.selections[me.id]}
                      revealed
                      revealedValue={room.lastResult.selections[me.id]}
                      className="w-24 h-32 text-4xl"
                    />
                  </div>
                  <div className="flex items-center text-4xl font-black text-white/20">VS</div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{opponent.username}</p>
                    <NumberCard
                      number={room.lastResult.selections[opponent.id]}
                      revealed
                      revealedValue={room.lastResult.selections[opponent.id]}
                      className="w-24 h-32 text-4xl"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <Button onClick={requestReplay} variant="primary" className="px-12 py-4 text-lg">
                    Next Round
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ChatPanel />
    </div>
  );
};

export default GameRoom;
