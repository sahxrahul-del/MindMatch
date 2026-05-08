import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { cn } from '../utils/cn';

const ChatPanel = () => {
  const { messages, sendMessage, sendTyping, typingUser, user } = useGame();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);

  const [lastSeenCount, setLastSeenCount] = useState(messages.length);
  const [showNotification, setShowNotification] = useState(false);

  const isTypingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Show notification if new message arrives while closed
    if (!isOpen && messages.length > lastSeenCount) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.username !== user?.username) {
        setShowNotification(true);
        // Hide message notification after 5 seconds, but keep it if someone is typing
        const timer = setTimeout(() => setShowNotification(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, isOpen, lastSeenCount, user?.username]);

  // Update lastSeenCount when panel opens
  useEffect(() => {
    if (isOpen) {
      setLastSeenCount(messages.length);
      setShowNotification(false);
    }
  }, [isOpen, messages.length]);

  // Stop typing when component unmounts or panel closes
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        sendTyping(false);
        isTypingRef.current = false;
      }
    };
  }, [isOpen, sendTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    sendTyping(false);
    isTypingRef.current = false;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    
    if (value.length > 0 && !isTypingRef.current) {
      sendTyping(true);
      isTypingRef.current = true;
    } else if (value.length === 0 && isTypingRef.current) {
      sendTyping(false);
      isTypingRef.current = false;
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300",
      isOpen ? "w-80 h-[500px]" : "w-14 h-14"
    )}>
      <AnimatePresence>
        {!isOpen && (typingUser || showNotification) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-16 right-0 mb-2 w-48 p-3 glass rounded-2xl border border-primary/30 shadow-xl pointer-events-none"
          >
            {typingUser ? (
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                {typingUser} is typing...
              </div>
            ) : showNotification && lastMessage && (
              <div className="text-xs">
                <span className="font-bold text-primary">{lastMessage.username}: </span>
                <span className="text-white/80 line-clamp-2">{lastMessage.text}</span>
              </div>
            )}
            {/* Arrow */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-surface border-r border-b border-primary/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col h-full glass rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <span className="font-semibold text-sm">Room Chat</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.isSystem ? "mx-auto w-full items-center opacity-60 italic text-[10px]" : (msg.username === user?.username ? "ml-auto items-end" : "mr-auto items-start")
                )}>
                  {!msg.isSystem && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-white/40">{msg.avatar} {msg.username}</span>
                    </div>
                  )}
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm",
                    msg.isSystem ? "bg-transparent text-center" : (msg.username === user?.username ? "bg-primary rounded-tr-none" : "bg-white/5 rounded-tl-none")
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typingUser && (
                <div className="text-[10px] text-white/40 italic">
                  {typingUser} is typing...
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={text}
                  onChange={handleChange}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 text-white"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPanel;
