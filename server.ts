import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import { Message, User } from './src/types';

// Setup local fallback storage directories and files
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load initial local file messages as cache/fallback
let messages: Message[] = [];
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    messages = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse messages database file, starting clean.', err);
    messages = [];
  }
} else {
  // Seed with a welcoming system message
  messages = [
    {
      id: 'welcome-msg',
      text: 'Welcome to the Real-Time Chat App! Feel free to send your first message.',
      senderName: 'System',
      senderId: 'system',
      timestamp: new Date().toISOString(),
      isSystem: true
    }
  ];
  fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

function persistMessages() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist messages:', err);
  }
}

// MongoDB / Mongoose Setup
const MONGODB_URI = process.env.MONGODB_URI || '';
let isMongoConnected = false;

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  senderName: { type: String, required: true },
  senderId: { type: String, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, default: 'sent' },
  isSystem: { type: Boolean, default: false }
});

const MessageModel = mongoose.model('Message', messageSchema);

async function connectToMongo() {
  if (!MONGODB_URI) {
    console.log('💡 No MONGODB_URI environment variable detected. Falling back to local JSON file storage.');
    return;
  }
  try {
    // Disable strictQuery to suppress mongoose warnings
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI);
    isMongoConnected = true;
    console.log('✅ Successfully connected to MongoDB database!');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB, falling back to local JSON file storage:', err);
  }
}

async function getMessages(): Promise<Message[]> {
  if (isMongoConnected) {
    try {
      const docs = await MessageModel.find().sort({ timestamp: 1 }).lean();
      return docs.map(doc => ({
        id: doc.id,
        text: doc.text,
        senderName: doc.senderName,
        senderId: doc.senderId,
        timestamp: doc.timestamp,
        status: doc.status as 'sent' | 'delivered' | 'read',
        isSystem: doc.isSystem
      }));
    } catch (err) {
      console.error('Failed to fetch from MongoDB, using JSON cache instead:', err);
    }
  }
  return messages;
}

async function saveMessage(msg: Message) {
  if (isMongoConnected) {
    try {
      const doc = new MessageModel(msg);
      await doc.save();
      return;
    } catch (err) {
      console.error('Failed to save message to MongoDB, saving to local JSON file cache:', err);
    }
  }
  messages.push(msg);
  persistMessages();
}

async function startServer() {
  // Connect to MongoDB asynchronously on boot
  await connectToMongo();

  const app = express();
  const server = http.createServer(app);
  
  // Setup Socket.io with permissive CORS
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware for body parsing
  app.use(express.json());

  // Store active socket-to-user maps
  // Key: socket.id, Value: { userId, username }
  const activeSockets = new Map<string, { userId: string; username: string }>();

  // REST API Endpoints
  
  // Fetch chat history
  app.get('/api/messages', async (req, res) => {
    try {
      const history = await getMessages();
      res.json({ success: true, messages: history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch messages' });
    }
  });

  // Send a message via REST API
  app.post('/api/messages', async (req, res) => {
    const { text, senderName, senderId } = req.body;
    
    if (!text || typeof text !== 'string' || !senderName || !senderId) {
       res.status(400).json({ success: false, error: 'text, senderName, and senderId are required fields.' });
       return;
    }

    const newMessage: Message = {
      id: 'rest-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      text,
      senderName,
      senderId,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    await saveMessage(newMessage);

    // Broadcast the new message to all Socket.io clients
    io.emit('message', newMessage);

    res.status(201).json({ success: true, message: newMessage });
  });

  // Socket.io Real-Time Communications
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // When a user registers their presence
    socket.on('user:join', async (data: { username: string; userId: string }) => {
      const { username, userId } = data;
      if (!username || !userId) return;

      // Track socket user association
      activeSockets.set(socket.id, { userId, username });
      console.log(`User registered: ${username} (${userId}) on socket ${socket.id}`);

      // Emit updated list of active users
      const onlineUsers = getOnlineUsersList();
      io.emit('users:update', onlineUsers);

      // Create system message for join event
      const systemMsg: Message = {
        id: 'sys-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        text: `${username} has joined the chat`,
        senderName: 'System',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        isSystem: true
      };

      await saveMessage(systemMsg);

      // Broadcast system join message to everyone
      io.emit('message', systemMsg);
    });

    // When a user sends a real-time message
    socket.on('message:send', async (data: { text: string; senderName: string; senderId: string }) => {
      const { text, senderName, senderId } = data;
      if (!text || !senderName || !senderId) return;

      const userMsg: Message = {
        id: 'ws-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        text,
        senderName,
        senderId,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      await saveMessage(userMsg);

      // Broadcast message to all connected clients
      io.emit('message', userMsg);
    });

    // When typing status updates
    socket.on('typing:status', (data: { username: string; isTyping: boolean }) => {
      const { username, isTyping } = data;
      // Broadcast typing updates to all clients except the sender
      socket.broadcast.emit('typing:update', { username, isTyping });
    });

    // Clean disconnection mapping and notify other clients
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userInfo = activeSockets.get(socket.id);

      if (userInfo) {
        const { username } = userInfo;
        activeSockets.delete(socket.id);

        // Update online user list for everyone
        const onlineUsers = getOnlineUsersList();
        io.emit('users:update', onlineUsers);

        // Create system message for leave event
        const systemMsg: Message = {
          id: 'sys-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
          text: `${username} has left the chat`,
          senderName: 'System',
          senderId: 'system',
          timestamp: new Date().toISOString(),
          isSystem: true
        };

        await saveMessage(systemMsg);

        io.emit('message', systemMsg);
      }
    });
  });

  // Helper to compile a unique list of active online usernames
  function getOnlineUsersList(): User[] {
    const userMap = new Map<string, User>();
    for (const [_, info] of activeSockets.entries()) {
      userMap.set(info.userId, {
        id: info.userId,
        username: info.username,
        status: 'online'
      });
    }
    return Array.from(userMap.values());
  }

  // Vite Development and Asset Compilation middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
