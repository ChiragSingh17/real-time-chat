import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, TypingState } from '../types';
import { Check, CheckCheck } from 'lucide-react';

interface ChatFeedProps {
  messages: Message[];
  currentUserId: string;
  typingState: TypingState;
}

export default function ChatFeed({ messages, currentUserId, typingState }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new messages or typing changes occur
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  // Format message time cleanly (e.g., "11:42 PM")
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Determine who is currently typing
  const activeTypingUsers = Object.entries(typingState)
    .filter(([_, state]) => state.isTyping && Date.now() - state.timestamp < 3000)
    .map(([username]) => username);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            
            if (msg.isSystem) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={msg.id}
                  className="flex justify-center"
                  id={`system-message-${msg.id}`}
                >
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full uppercase tracking-wider">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                id={`message-bubble-${msg.id}`}
              >
                {/* Avatar / Initials */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 uppercase flex-shrink-0">
                    {msg.senderName.substring(0, 2)}
                  </div>
                )}

                {/* Message Core Container */}
                <div className="space-y-1">
                  {!isMe && (
                    <span className="text-xs font-semibold text-slate-600 block pl-1">
                      {msg.senderName}
                    </span>
                  )}
                  
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm relative text-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    
                    {/* Timestamp & Delivery Badges */}
                    <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] ${isMe ? 'text-indigo-200/90' : 'text-slate-400'}`}>
                      <span>{formatTime(msg.timestamp)}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-300" />
                          ) : (
                            <Check className="w-3 h-3 text-indigo-200/80" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Notification Drawer */}
        <AnimatePresence>
          {activeTypingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 pl-2"
              id="typing-indicator"
            >
              <div className="flex gap-1 bg-slate-100 border border-slate-200/50 px-3 py-1.5 rounded-full items-center">
                <span className="text-xs text-slate-500 font-medium">
                  {activeTypingUsers.join(', ')} {activeTypingUsers.length === 1 ? 'is' : 'are'} typing
                </span>
                <span className="flex gap-0.5 items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
