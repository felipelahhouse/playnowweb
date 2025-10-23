import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Smile, Hash } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface LiveChatProps {
  roomId?: string;
  streamId?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ roomId = 'general', isMinimized = false, onToggleMinimize }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app this would use Supabase realtime
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        user_id: 'user1',
        username: 'NeonGamer',
        message: 'Anyone up for some Street Fighter II?',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        room: roomId
      },
      {
        id: '2',
        user_id: 'user2',
        username: 'RetroKing',
        message: 'Just beat my high score in Pac-Man! 🎮',
        created_at: new Date(Date.now() - 3 * 60000).toISOString(),
        room: roomId
      },
      {
        id: '3',
        user_id: 'user3',
        username: 'PixelMaster',
        message: 'The new neon effects look amazing!',
        created_at: new Date(Date.now() - 1 * 60000).toISOString(),
        room: roomId
      }
    ];
    setMessages(mockMessages);
    setOnlineUsers(['NeonGamer', 'RetroKing', 'PixelMaster', user?.username || '']);
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      username: user.username,
      message: inputMessage,
      created_at: new Date().toISOString(),
      room: roomId
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onToggleMinimize}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-3 rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 animate-pulse"
        >
          <Hash className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col z-40">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <Hash className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-medium">Live Chat</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">{onlineUsers.length} online</span>
          </div>
        </div>
        
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            −
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className="flex space-x-2">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {message.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-cyan-400">{message.username}</span>
                <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">{message.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 pr-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-colors duration-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Online Users Indicator */}
      <div className="absolute top-4 right-16 flex -space-x-1">
        {onlineUsers.slice(0, 3).map((username, index) => (
          <div
            key={username}
            className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center"
            style={{ zIndex: 10 - index }}
          >
            <span className="text-xs font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
        {onlineUsers.length > 3 && (
          <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              +{onlineUsers.length - 3}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;