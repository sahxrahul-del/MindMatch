import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const avatars = ['🦊', '🐱', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙'];

const AvatarPicker = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {avatars.map((avatar) => (
        <motion.button
          key={avatar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(avatar)}
          className={cn(
            "text-3xl w-12 h-12 flex items-center justify-center rounded-full glass transition-all",
            selected === avatar ? "border-primary bg-primary/20 scale-110" : "border-transparent"
          )}
        >
          {avatar}
        </motion.button>
      ))}
    </div>
  );
};

export default AvatarPicker;
