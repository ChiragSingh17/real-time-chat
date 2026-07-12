import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ArrowRight, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }

    if (trimmed.length > 20) {
      setError('Username must be under 20 characters');
      return;
    }

    onLogin(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
        id="login-card"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100/50">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Real-Time Chat
          </h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Connect instantly with Socket.io backend and REST APIs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Choose your Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Satoshi"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/55 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium"
                autoComplete="off"
                maxLength={20}
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 mt-1.5 font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group text-sm cursor-pointer"
            id="login-submit-button"
          >
            Join Chatroom
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <span className="text-[11px] font-mono text-slate-400">
            Node.js + Express + Socket.io Server
          </span>
        </div>
      </motion.div>
    </div>
  );
}
