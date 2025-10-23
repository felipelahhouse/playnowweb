// SIMPLE MESSAGES - Simplified direct messaging modal
import React, { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle, User } from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc as firestoreDoc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleMessagesProps {
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Timestamp | null;
  read: boolean;
}

interface Chat {
  userId: string;
  username: string;
  lastMessage: string;
  unread: number;
  timestamp: Timestamp | null;
}

const SimpleMessages: React.FC<SimpleMessagesProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    const sentQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const receivedQuery = query(
      collection(db, 'direct_messages'),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    let active = true;

    const loadChats = async () => {
      if (!active) return;

      try {
        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(sentQuery),
          getDocs(receivedQuery)
        ]);

        const allDocs = [...sentSnap.docs, ...receivedSnap.docs];
        const otherIds = new Set<string>();

        allDocs.forEach((docSnap) => {
          const data = docSnap.data();
          const sender = data.senderId as string | undefined;
          const receiver = data.receiverId as string | undefined;
          const otherId = sender === user.id ? receiver : sender;
          if (otherId) {
            otherIds.add(otherId);
          }
        });

        const usernameCache = new Map<string, string>();
        await Promise.all(
          Array.from(otherIds).map(async (otherId) => {
            try {
              const profileSnap = await getDoc(firestoreDoc(db, 'users', otherId));
              const profileData = profileSnap.data() as { username?: string } | undefined;
              usernameCache.set(otherId, profileData?.username || 'Usuario');
            } catch (error) {
              console.error('Error loading user profile:', error);
              usernameCache.set(otherId, 'Usuario');
            }
          })
        );

        const conversations = new Map<string, Chat>();

        allDocs.forEach((docSnap) => {
          const data = docSnap.data() as {
            senderId?: string;
            receiverId?: string;
            message?: string;
            timestamp?: Timestamp;
            read?: boolean;
          };

          const senderId = data.senderId;
          const receiverId = data.receiverId;
          if (!senderId || !receiverId) {
            return;
          }

          const otherId = senderId === user.id ? receiverId : senderId;
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp : null;
          const isUnread = receiverId === user.id && !data.read;

          if (!conversations.has(otherId)) {
            conversations.set(otherId, {
              userId: otherId,
              username: usernameCache.get(otherId) ?? 'Usuario',
              lastMessage: '',
              unread: 0,
              timestamp: null
            });
          }

          const conversation = conversations.get(otherId)!;

          if (isUnread) {
            conversation.unread += 1;
          }

          const newTime = timestamp ? timestamp.toMillis() : 0;
          const currentTime = conversation.timestamp ? conversation.timestamp.toMillis() : 0;

          if (newTime >= currentTime) {
            conversation.lastMessage = data.message || '';
            conversation.timestamp = timestamp;
          }
        });

        const sortedChats = Array.from(conversations.values()).sort((a, b) => {
          const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
          return timeB - timeA;
        });

        if (active) {
          setChats(sortedChats);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        if (active) {
          setChats([]);
          setLoading(false);
        }
      }
    };

    loadChats();

    const unsubscribeSent = onSnapshot(sentQuery, loadChats);
    const unsubscribeReceived = onSnapshot(receivedQuery, loadChats);

    return () => {
      active = false;
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selected) {
      setMessages([]);
      return;
    }

    const sentMessagesQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', user.id),
      where('receiverId', '==', selected),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const receivedMessagesQuery = query(
      collection(db, 'direct_messages'),
      where('senderId', '==', selected),
      where('receiverId', '==', user.id),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    let sentMessages: Message[] = [];
    let receivedMessages: Message[] = [];
    let active = true;

    const normalizeMessage = (data: any, id: string): Message => {
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp : null;
      return {
        id,
        senderId: data.senderId || '',
        receiverId: data.receiverId || '',
        message: data.message || '',
        timestamp,
        read: Boolean(data.read)
      };
    };

    const mergeAndSet = () => {
      if (!active) return;

      const combined = [...sentMessages, ...receivedMessages].sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
        return timeA - timeB;
      });

      setMessages(combined);
    };

    const unsubscribeSent = onSnapshot(sentMessagesQuery, (snapshot) => {
      sentMessages = snapshot.docs.map((docSnap) => normalizeMessage(docSnap.data(), docSnap.id));
      mergeAndSet();
    });

    const unsubscribeReceived = onSnapshot(receivedMessagesQuery, (snapshot) => {
      receivedMessages = snapshot.docs.map((docSnap) => normalizeMessage(docSnap.data(), docSnap.id));

      const unreadMessages = receivedMessages.filter((msg) => !msg.read);
      unreadMessages.forEach((msg) => {
        updateDoc(firestoreDoc(db, 'direct_messages', msg.id), { read: true }).catch((error) => {
          console.error('Error marking message as read:', error);
        });
      });

      mergeAndSet();
    });

    return () => {
      active = false;
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user?.id, selected]);

  const send = async () => {
    if (!text.trim() || !user?.id || !selected) return;

    try {
      await addDoc(collection(db, 'direct_messages'), {
        senderId: user.id,
        receiverId: selected,
        message: text.trim(),
        timestamp: serverTimestamp(),
        read: false
      });

      setText('');
    } catch (error) {
      console.error('Send error:', error);
      alert('Erro ao enviar mensagem');
    }
  };

  const formatTime = (timestamp?: Timestamp | null) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const diff = Date.now() - date.getTime();

    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/20">
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Mensagens</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-gray-800 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Nenhuma conversa ainda</p>
                <p className="text-gray-600 text-sm mt-2">Envie uma mensagem para comecar</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.userId}
                  onClick={() => {
                    setSelected(chat.userId);
                    setChats((prev) =>
                      prev.map((c) => (c.userId === chat.userId ? { ...c, unread: 0 } : c))
                    );
                  }}
                  className={`w-full p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors text-left ${
                    selected === chat.userId ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white truncate">{chat.username}</span>
                        <span className="text-xs text-gray-400">{formatTime(chat.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                            {chat.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {selected ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.message}</p>
                          <span className="text-xs opacity-70 mt-1 block">{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      onClick={send}
                      disabled={!text.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Enviar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Selecione uma conversa</p>
                  <p className="text-gray-600 text-sm mt-2">Escolha um chat na lista ao lado</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMessages;
