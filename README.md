# Real-Time Chat Application (Express + Socket.io + React)

A premium, highly-polished real-time chat application engineered with a **React (Vite)** frontend, **Node.js + Express** server-side REST APIs, and **Socket.io** for bidirectional, low-latency communication.

---

## 🚀 Key Features

- **Instant Message Delivery**: Implements Socket.io for instant real-time message broadcasting without any page refreshing.
- **Durable Chat History**: Fetches previous chat history on initial render via Express REST API (`GET /api/messages`), with persistent JSON file-based database storage.
- **REST API Playground**: Integrated interactive playground allowing developers to trigger message POST requests and inspect live JSON API payloads directly within the UI.
- **Real-Time Typing Indicators**: Shows when other users are currently active and typing in the chat.
- **Presence Tracking**: Displays a list of real-time connected users with automatic join/leave system notices.
- **Responsive Bento Grid Dashboard**: Styled with a gorgeous Slate and Indigo theme utilizing modern typography (Inter & JetBrains Mono) with full responsive screen scaling.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS v4, Lucide React (icons), Motion (animations).
- **Backend**: Node.js, Express, Socket.io, TypeScript (`tsx` runner and CJS server bundler).
- **Database/Persistence**: File-based local JSON data repository (`/data/messages.json`).

---

## 📂 Project Structure

```bash
├── data/                  # Persistent JSON storage for message logs
├── src/
│   ├── components/
│   │   ├── ActiveUsers.tsx    # List of connected online users
│   │   ├── ChatFeed.tsx       # Message list and real-time typing indicators
│   │   ├── LoginScreen.tsx    # Aesthetic username selection screen
│   │   └── RestApiPanel.tsx   # REST API testing & interactive response logger
│   ├── App.tsx            # Core application state, socket triggers & workspace layout
│   ├── index.css          # Tailwinds imports, custom fonts, scrollbar styles
│   ├── main.tsx           # Application entry mount point
│   └── types.ts           # Shared TypeScript interfaces (Message, User, TypingState)
├── server.ts              # Express HTTP + Socket.io real-time server
├── package.json           # Dependencies, dev dependencies, and runtime build scripts
├── vite.config.ts         # Vite asset configuration & local proxies
└── tsconfig.json          # TypeScript project configuration
```

---

## 🏁 Setup & Run Instructions

Ensure Node.js (v18+) is installed on your environment.

### 1. Installation

Install all required NPM packages:
```bash
npm install
```

### 2. Configure Environment Variables

The app runs out-of-the-box with preset variables, but you can configure them by duplicating `.env.example` as `.env`:
```bash
cp .env.example .env
```

### 3. Running the Full-Stack Application

The dev server boots the Express backend with automatic TypeScript execution (`tsx`), which hosts both the API, the Socket.io WebSocket channels, and injects the client-side Vite dev middleware on port `3000`:

```bash
npm run dev
```

Visit the application in your browser at `http://localhost:3000`.

### 4. Production Build & Start

Compile the client bundle and compile the backend server code into a production CJS executable using esbuild:

```bash
# Build the production bundle
npm run build

# Start the compiled production app
npm run start
```

---


## 💡 Design Decisions

1. **Integrated Server Architecture**: To guarantee high reliability, the Socket.io handler and the Express server are bound to the same HTTP server on port `3000`. This completely removes the complexity of managing and routing multiple ports.
2. **REST + Socket Synchronization**: To demonstrate full compliance with both WebSocket and HTTP REST specifications, when a client makes a HTTP `POST` request to `/api/messages`, the server persists the message and instantly triggers a Socket.io broadcast to all clients, allowing the REST message to display immediately on active chat feeds.
3. **Robust Local JSON Storage**: Handled file persistence cleanly inside the Node backend using synchronized write actions. This prevents data loss on container reloads or browser refreshes, with zero configuration or database engine installation overhead.
4. **Idempotence Guards**: Aligned with modern real-time architecture, when Socket.io triggers a message callback, the frontend performs an ID verification guard to ignore duplicates, ensuring consistency during network reconnections.

---

## ⚙️ Environment Variables Required

Refer to `.env.example`:

- `GEMINI_API_KEY`: Required for AI capabilities (if used). Auto-injected at runtime.
- `APP_URL`: The hosting address (for redirects or hooks). Auto-injected in production.
