import React, { useEffect, useState } from 'react';
import { X, Eye, User, MessageCircle, Send, Users, Radio } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface StreamSpectatorModalProps {
  streamId: string;
  streamData: {
    username: string;
    gameName: string;
    platform: string;
    viewers: number;
    thumbnail?: string;
  };
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

const StreamSpectatorModal: React.FC<StreamSpectatorModalProps> = ({ streamId, streamData, onClose }) => {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Listener para chat em tempo real
  useEffect(() => {
    const chatQuery = query(
      collection(db, 'streams', streamId, 'chat'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          username: data.username || 'Anonymous',
          message: data.message || '',
          timestamp: data.timestamp?.toMillis() || Date.now()
        });
      });
      // Inverter ordem para mostrar mais recentes embaixo
      setChatMessages(messages.reverse());
    });

    return () => unsubscribe();
  }, [streamId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'streams', streamId, 'chat'), {
        username: user.username || 'Anonymous',
        userId: user.id,
        message: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[95vh] md:h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
        {/* Header */}
        <div className="relative px-3 md:px-6 py-3 md:py-4 bg-black/40 backdrop-blur-sm border-b border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative">
                <Radio className="w-6 h-6 md:w-8 md:h-8 text-red-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg md:text-2xl font-black text-white truncate max-w-[150px] md:max-w-none">{streamData.username}</h2>
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-gray-400 text-xs md:text-sm truncate max-w-[180px] md:max-w-none">{streamData.gameName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-red-500/20 border border-red-500/30 rounded-lg md:rounded-xl">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                <span className="text-white font-bold text-sm md:text-base">{streamData.viewers}</span>
                <span className="hidden md:inline text-gray-400 text-sm">espectadores</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-red-500/20 rounded-lg md:rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 p-2 md:p-4 h-[calc(100%-65px)] md:h-[calc(100%-80px)]">
          {/* Stream Video (Left - 2/3) */}
          <div className="lg:col-span-2 bg-black rounded-xl md:rounded-2xl overflow-hidden border-2 border-red-500/20 relative h-[40vh] lg:h-auto">
            {/* Placeholder for video stream */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10 flex items-center justify-center">
              <div className="text-center">
                <Radio className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
                <p className="text-white text-xl font-bold mb-2">Stream ao Vivo</p>
                <p className="text-gray-400">Aguardando conexão com o emulador...</p>
                <div className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg inline-block">
                  <p className="text-red-400 text-sm font-semibold">
                    {streamData.platform.toUpperCase()} - {streamData.gameName}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-cyan-500/90 text-white text-sm font-bold rounded-lg backdrop-blur-sm">
              {streamData.platform.toUpperCase()}
            </div>

            {/* Live Indicator */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              AO VIVO
            </div>
          </div>

          {/* Chat (Right - 1/3) */}
          <div className="bg-gray-900/50 rounded-xl md:rounded-2xl border-2 border-gray-700 overflow-hidden flex flex-col h-[calc(60vh-80px)] lg:h-auto">
            {/* Chat Header */}
            <div className="px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border-b border-gray-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              <h3 className="text-white font-bold text-base md:text-lg">Chat ao Vivo</h3>
              <span className="ml-auto px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full">
                {chatMessages.length}
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-2 md:mb-3 opacity-50" />
                  <p className="text-gray-500 text-xs md:text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-gray-600 text-xs mt-1">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="animate-slideIn">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                        <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 font-bold text-xs md:text-sm truncate">
                            {msg.username}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs md:text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            {user ? (
              <div className="p-2 md:p-3 bg-black/40 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 px-3 py-2.5 md:py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm min-h-[44px] md:min-h-0"
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="px-3 md:px-4 py-2.5 md:py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[44px] min-h-[44px] md:min-h-0 md:min-w-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 md:p-3 bg-black/40 border-t border-gray-700">
                <p className="text-gray-400 text-xs md:text-sm text-center">
                  Faça login para participar do chat
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSpectatorModal;
