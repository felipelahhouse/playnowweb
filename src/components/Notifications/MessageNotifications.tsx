// 💬 MESSAGE NOTIFICATIONS - Sistema de notificações de mensagens
import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface MessageNotificationsProps {
  onOpenMessages: () => void;
}

interface UnreadMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  message: string;
  timestamp: Timestamp | null;
}

const MessageNotifications: React.FC<MessageNotificationsProps> = ({ onOpenMessages }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<UnreadMessage[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Listener para mensagens não lidas
    const unreadQuery = query(
      collection(db, 'direct_messages'),
      where('receiverId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, async (snapshot) => {
      const count = snapshot.size;
      setUnreadCount(count);

      // Carregar dados dos remetentes das mensagens recentes
      const messages: UnreadMessage[] = [];
      
      for (const doc of snapshot.docs.slice(0, 3)) {
        const data = doc.data();
        
        // Buscar username do remetente
        const senderQuery = query(
          collection(db, 'users'),
          where('__name__', '==', data.senderId)
        );
        
        const senderSnap = await getDocs(senderQuery);
        const senderData = senderSnap.docs[0]?.data();
        
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          senderUsername: senderData?.username || 'Usuário',
          message: data.message,
          timestamp: data.timestamp
        });
      }

      setRecentMessages(messages);

      // Mostrar notificação toast para nova mensagem
      if (count > 0 && messages.length > 0) {
        showToastNotification(messages[0]);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const showToastNotification = (msg: UnreadMessage) => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nova mensagem de ${msg.senderUsername}`, {
        body: msg.message.substring(0, 100),
        icon: '/icons/message-icon.png',
        badge: '/icons/badge-icon.png',
        tag: `message-${msg.id}`,
        requireInteraction: false,
        silent: false
      });
    }
  };

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTimeAgo = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  return (
    <div className="relative">
      {/* Botão de notificação */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="relative p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200 group"
        title="Mensagens"
      >
        <MessageCircle className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        
        {/* Badge de contagem */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-[10px] font-bold text-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* Preview de mensagens não lidas */}
      {showPreview && unreadCount > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400 animate-bounce" />
                <h3 className="font-bold text-white">Novas Mensagens</h3>
              </div>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Lista de mensagens recentes */}
          <div className="max-h-96 overflow-y-auto">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={onOpenMessages}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {msg.senderUsername.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">
                        {msg.senderUsername}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <button
            onClick={onOpenMessages}
            className="w-full p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border-t border-cyan-500/30 text-cyan-400 font-semibold text-sm transition-all duration-200"
          >
            Ver todas as mensagens →
          </button>
        </div>
      )}

      {/* Click fora para fechar */}
      {showPreview && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default MessageNotifications;
