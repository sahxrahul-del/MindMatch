import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const NumberCard = ({ number, isSelected, onClick, disabled, revealed, revealedValue }) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={() => !disabled && onClick(number)}
      disabled={disabled}
      className={cn(
        "relative h-16 w-16 md:h-20 md:w-20 rounded-2xl glass flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-300 border",
        isSelected 
          ? "border-primary bg-primary/20 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105" 
          : "border-white/10 hover:border-primary/50",
        disabled && !isSelected && "opacity-50 grayscale cursor-not-allowed",
        revealed && "border-secondary bg-secondary/20 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
      )}
    >
      {revealed ? revealedValue : number}
      
      {isSelected && !revealed && (
        <motion.div
          layoutId="glow"
          className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.6)] pointer-events-none"
        />
      )}
    </motion.button>
  );
};

export default NumberCard;
