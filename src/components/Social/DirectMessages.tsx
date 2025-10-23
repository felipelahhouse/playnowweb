// 💬 DIRECT MESSAGES - Sistema de mensagens diretas entre usuários
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, MessageCircle, Check, CheckCheck, Smile } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../User/UserAvatar';
import type { User } from '../../types';

interface DirectMessagesProps {
  recipientId?: string; // Se fornecido, abre conversa direto com este usuário
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
}

interface Conversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastTimestamp: Timestamp;
  unreadCount: number;
  is_online?: boolean;
  email?: string;
  created_at?: string;
  last_seen?: string;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ recipientId, onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(recipientId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientData, setRecipientData] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carregar conversas
  useEffect(() => {
    if (!user?.id) {
      console.log('[MESSAGES] Usuário não logado, saindo...');
      return;
    }

    console.log('[MESSAGES] Carregando conversas para usuário:', user.id);

    // ✅ SOLUÇÃO: Fazer 2 queries separadas e combinar (sem usar or())
    const sentQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', user.id),
      orderBy('timestamp', 'desc')
    );

    const receivedQuery = query(
      collection(db, 'direct_messages'),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'desc')
    );

    const loadMessages = async () => {
      try {
        console.log('[MESSAGES] Buscando mensagens...');
        const conversationsMap = new Map<string, Conversation>();

        // Buscar ambas as queries
        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(sentQuery),
          getDocs(receivedQuery)
        ]);

        console.log('[MESSAGES] Mensagens encontradas:', {
          enviadas: sentSnap.size,
          recebidas: receivedSnap.size
        });

        // Combinar todas as mensagens
        const allMessages = [
          ...sentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message)),
          ...receivedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message))
        ].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        console.log('[MESSAGES] Total de mensagens:', allMessages.length);

        for (const msg of allMessages) {
          const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

          if (!conversationsMap.has(otherUserId)) {
            // Buscar dados do outro usuário
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            const userData = userDoc.data();

            conversationsMap.set(otherUserId, {
              userId: otherUserId,
              username: userData?.username || 'Unknown',
              avatar: userData?.avatar_url,
              is_online: userData?.is_online || false,
              email: userData?.email,
              created_at: userData?.created_at,
              last_seen: userData?.last_seen,
              lastMessage: msg.message,
              lastTimestamp: msg.timestamp,
              unreadCount: 0
            });
          }

          // Contar mensagens não lidas
          if (msg.receiverId === user.id && !msg.read) {
            const conv = conversationsMap.get(otherUserId)!;
            conv.unreadCount++;
          }
        }

        const conversations = Array.from(conversationsMap.values());
        console.log('[MESSAGES] Conversas carregadas:', conversations.length);
        setConversations(conversations);
        setLoading(false); // Define loading como false após carregar
      } catch (error) {
        console.error('[MESSAGES] Erro ao carregar conversas:', error);
        setConversations([]); // Define array vazio em caso de erro
        setLoading(false); // Define loading como false mesmo em erro
      }
    };

    // Carregar mensagens inicialmente
    loadMessages();

    // Listener para mensagens enviadas
    const unsubscribe1 = onSnapshot(sentQuery, () => {
      console.log('[MESSAGES] Nova mensagem enviada detectada');
      loadMessages();
    });
    
    // Listener para mensagens recebidas
    const unsubscribe2 = onSnapshot(receivedQuery, () => {
      console.log('[MESSAGES] Nova mensagem recebida detectada');
      loadMessages();
    });

    return () => {
      console.log('[MESSAGES] Limpando listeners');
      unsubscribe1();
      unsubscribe2();
    };
  }, [user?.id]);

  // Carregar mensagens da conversa selecionada
  useEffect(() => {
    if (!user?.id || !selectedConversation) return;

    // ✅ CORREÇÃO: 2 queries separadas sem or()
    const sentMessagesQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', user.id),
      where('receiverId', '==', selectedConversation),
      orderBy('timestamp', 'asc')
    );

    const receivedMessagesQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', selectedConversation),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'asc')
    );

    let allMessages: Message[] = [];

    // Listener para mensagens enviadas
    const unsubscribe1 = onSnapshot(sentMessagesQuery, async (snapshot) => {
      const sentMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      // Combinar e ordenar todas as mensagens
      allMessages = [...sentMsgs, ...allMessages.filter(m => m.senderId !== user.id)];
      allMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      
      setMessages([...allMessages]);
    });

    // Listener para mensagens recebidas
    const unsubscribe2 = onSnapshot(receivedMessagesQuery, async (snapshot) => {
      const receivedMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      // Combinar e ordenar todas as mensagens
      allMessages = [...allMessages.filter(m => m.receiverId !== user.id), ...receivedMsgs];
      allMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      
      setMessages([...allMessages]);

      // Marcar mensagens como lidas
      const unreadMessages = receivedMsgs.filter(msg => !msg.read);
      for (const msg of unreadMessages) {
        await updateDoc(doc(db, 'direct_messages', msg.id), { read: true });
      }
    });

    // Carregar dados do destinatário
    const loadRecipient = async () => {
      const userDoc = await getDoc(doc(db, 'users', selectedConversation));
      if (userDoc.exists()) {
        setRecipientData({ id: userDoc.id, ...userDoc.data() });
      }
    };

    loadRecipient();

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user?.id, selectedConversation]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !selectedConversation) return;

    console.log('[MESSAGES] Enviando mensagem:', {
      senderId: user.id,
      receiverId: selectedConversation,
      message: newMessage.trim()
    });

    try {
      const messageData = {
        senderId: user.id,
        receiverId: selectedConversation,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      };

      const docRef = await addDoc(collection(db, 'direct_messages'), messageData);
      console.log('[MESSAGES] ✅ Mensagem enviada com sucesso! ID:', docRef.id);

      setNewMessage('');
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error('[MESSAGES] ❌ Erro ao enviar mensagem:', error);
      console.error('[MESSAGES] Código do erro:', err.code);
      console.error('[MESSAGES] Mensagem do erro:', err.message);
      alert(`Erro ao enviar mensagem: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0">
      <div className="relative w-full h-full sm:max-w-6xl sm:h-[90vh] bg-gray-900 sm:rounded-2xl sm:border-2 border-cyan-500/30 overflow-hidden flex flex-col sm:flex-row">
        
        {/* Lista de Conversas - Sidebar */}
        <div className={`w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-gray-800 flex flex-col ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-950">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span className="hidden sm:inline">Mensagens</span>
                <span className="sm:hidden">Chats</span>
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 touch-manipulation"
              />
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-400 border-t-transparent mb-3"></div>
                <p className="text-sm">Carregando conversas...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm text-center">
                  {conversations.length === 0 
                    ? 'Nenhuma conversa ainda' 
                    : 'Nenhuma conversa encontrada'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv.userId)}
                    className={`w-full p-3 sm:p-4 flex items-start gap-3 hover:bg-gray-800/50 transition-colors text-left touch-manipulation active:scale-[0.98] ${
                      selectedConversation === conv.userId ? 'bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar 
                        user={{ ...conv, id: conv.userId }} 
                        size="md" 
                        showOnline 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold text-sm truncate">
                          {conv.username}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTimestamp(conv.lastTimestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Header da Conversa */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                {recipientData && (
                  <>
                    <UserAvatar user={recipientData} size="md" showOnline />
                    <div>
                      <h3 className="text-white font-bold">{recipientData.username}</h3>
                      <p className="text-xs text-gray-400">
                        {recipientData.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMyMessage = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMyMessage
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        isMyMessage ? 'text-cyan-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                        {isMyMessage && (
                          msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
