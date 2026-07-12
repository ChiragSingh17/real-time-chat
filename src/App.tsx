import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, User, TypingState } from './types';
import LoginScreen from './components/LoginScreen';
import ActiveUsers from './components/ActiveUsers';
import RestApiPanel from './components/RestApiPanel';
import ChatFeed from './components/ChatFeed';
import { LogOut, Wifi, WifiOff, Send, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingState, setTypingState] = useState<TypingState>({});
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing login on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_username');
    const savedId = localStorage.getItem('chat_user_id');
    if (savedUser && savedId) {
      setUsername(savedUser);
      setUserId(savedId);
    }
  }, []);

  // Fetch initial chat logs from REST API
  const fetchChatLogs = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to pre-fetch chat logs:', err);
    }
  };

  // Connect to Socket.io when logged in
  useEffect(() => {
    if (!username || !userId) return;

    // Fetch initial chat history
    fetchChatLogs();

    // Create single socket instance
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket client connected, joining room...');
      socket.emit('user:join', { username, userId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Idempotent real-time message handler
    socket.on('message', (newMsg: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        if (exists) return prev;
        return [...prev, { ...newMsg, status: 'delivered' }];
      });
    });

    // Real-time online users updates
    socket.on('users:update', (users: User[]) => {
      setOnlineUsers(users);
    });

    // Real-time typing states updates
    socket.on('typing:update', (data: { username: string; isTyping: boolean }) => {
      setTypingState((prev) => ({
        ...prev,
        [data.username]: {
          isTyping: data.isTyping,
          timestamp: Date.now()
        }
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [username, userId]);

  // Handle user login
  const handleLogin = (selectedUsername: string) => {
    const generatedId = 'user-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    localStorage.setItem('chat_username', selectedUsername);
    localStorage.setItem('chat_user_id', generatedId);
    setUsername(selectedUsername);
    setUserId(generatedId);
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_user_id');
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setUsername(null);
    setUserId(null);
    setMessages([]);
    setOnlineUsers([]);
    setTypingState({});
  };

  // Socket Send message handler
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !username || !userId) return;

    // Stop typing state
    handleStopTyping();

    // Send real-time event
    socketRef.current.emit('message:send', {
      text: inputText.trim(),
      senderName: username,
      senderId: userId
    });

    setInputText('');
  };

  // Keyboard typing handlers (real-time notification triggers)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!socketRef.current || !username) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing:status', { username, isTyping: true });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1500);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socketRef.current && username) {
      socketRef.current.emit('typing:status', { username, isTyping: false });
    }
  };

  if (!username || !userId) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base tracking-tight font-sans">
              Real-Time Chat Workspace
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  <span className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-wider">
                    Connecting...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User profile & controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center uppercase">
              {username.substring(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {username}
              </p>
              <span className="text-[9px] font-mono text-slate-400">
                ID: {userId.substring(5, 11)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-white bg-transparent hover:bg-rose-50 px-3 py-2 rounded-xl transition-all border border-rose-100 hover:border-rose-200 cursor-pointer"
            title="Log Out"
            id="logout-button"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Bento Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6" id="chat-dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-[calc(100vh-140px)]">
          {/* Column 1: Online Users */}
          <section className="lg:col-span-3 h-full flex flex-col">
            <ActiveUsers users={onlineUsers} currentUserId={userId} />
          </section>

          {/* Column 2: Core Chat Feed & Input */}
          <section className="lg:col-span-6 h-full flex flex-col gap-4">
            <div className="flex-1 overflow-hidden">
              <ChatFeed messages={messages} currentUserId={userId} typingState={typingState} />
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleSendMessage} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onBlur={handleStopTyping}
                placeholder={`Message as ${username}...`}
                className="flex-1 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-xl focus:outline-none transition-all"
                maxLength={1000}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>

          {/* Column 3: REST API Demonstration Panel */}
          <section className="lg:col-span-3 h-full flex flex-col">
            <RestApiPanel
              currentUsername={username}
              currentUserId={userId}
              onRefreshMessages={fetchChatLogs}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
