import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../utils/cn';

const PlayerCard = ({ player, isMe, isOpponent, hasSubmitted, roomStatus, isNext }) => {
  const getStatus = () => {
    if (roomStatus === 'waiting' && player.ready) return 'Ready';
    if (roomStatus === 'playing') {
      return hasSubmitted ? 'Selected' : 'Selecting';
    }
    if (roomStatus === 'result' && isNext) return 'Next?';
    return 'Waiting';
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-6 rounded-2xl glass flex flex-col items-center gap-4 min-w-[160px] border",
        isMe ? "border-primary/30" : "border-white/5",
        (status === 'Ready' || status === 'Selected' || status === 'Next?') && "neon-border"
      )}
    >
      <div className="text-5xl">{player.avatar}</div>
      <div className="text-center">
        <h3 className="font-bold text-lg flex items-center gap-2">
          {player.username}
          {isMe && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Me</span>}
        </h3>
      </div>
      
      <div className="flex flex-col gap-2 w-full">
        <div className={cn(
          "flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
          (status === 'Ready' || status === 'Selected' || status === 'Next?') 
            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
            : "bg-white/5 text-white/40 border border-white/10"
        )}>
          {status === 'Ready' || status === 'Selected' || status === 'Next?' ? (
            <CheckCircle2 size={14} />
          ) : (
            <Circle size={14} />
          )}
          {status}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
