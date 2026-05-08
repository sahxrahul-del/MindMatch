import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Button = ({ children, className, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]',
    secondary: 'bg-surface hover:bg-surface/80 text-white border border-white/10',
    outline: 'bg-transparent border border-primary/50 text-primary hover:bg-primary/10',
    accent: 'bg-accent hover:bg-accent/90 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
