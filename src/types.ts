export interface Message {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  timestamp: string; // ISO String
  status?: 'sent' | 'delivered' | 'read';
  isSystem?: boolean; // True for join/leave messages
}

export interface User {
  id: string;
  username: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

export interface TypingState {
  [username: string]: {
    isTyping: boolean;
    timestamp: number;
  };
}
