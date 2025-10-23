// 🔔 NOTIFICATIONS TAB - Aba de notificações e mensagens no perfil
import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell, Users, X } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import SimpleMessages from '../Social/SimpleMessages';

interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'game_invite' | 'achievement';
  from: string;
  fromName: string;
  text: string;
  time: any;
  read: boolean;
}

interface NotificationsTabProps {
  onClose?: () => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Contar mensagens não lidas
    const qMessages = query(
      collection(db, 'direct_messages'),
      where('receiverId', '==', user.id),
      where('read', '==', false)
    );

    const unsubMessages = onSnapshot(qMessages, (snap) => {
      setUnreadMessages(snap.size);
    });

    // TODO: Adicionar query para notificações reais
    // Por enquanto, mock de notificações
    setNotifications([]);

    return () => {
      unsubMessages();
    };
  }, [user?.id]);

  const handleOpenMessages = () => {
    setShowMessages(true);
  };

  return (
    <>
      <div className="bg-gray-900/50 rounded-xl border border-gray-800">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === 'messages'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Mensagens</span>
            {unreadMessages > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === 'notifications'
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Notificações</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'messages' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">
                  {unreadMessages > 0 
                    ? `Você tem ${unreadMessages} mensagem${unreadMessages > 1 ? 's' : ''} não lida${unreadMessages > 1 ? 's' : ''}`
                    : 'Nenhuma mensagem nova'
                  }
                </p>
                <button
                  onClick={handleOpenMessages}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir Chat
                </button>
              </div>

              {/* Preview de mensagens recentes */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h4 className="text-white font-semibold">Chat Direto</h4>
                    <p className="text-gray-400 text-xs">Envie mensagens para outros jogadores</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  Clique em "Abrir Chat" para ver todas as suas conversas e enviar mensagens.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma notificação</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Você será notificado sobre convites de amigos, conquistas e mais
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border transition-all ${
                      notif.read
                        ? 'bg-gray-800/30 border-gray-800'
                        : 'bg-purple-500/10 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notif.type === 'friend_request' ? 'bg-purple-500/20' :
                        notif.type === 'message' ? 'bg-cyan-500/20' :
                        notif.type === 'game_invite' ? 'bg-green-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        {notif.type === 'friend_request' ? <Users className="w-5 h-5" /> :
                         notif.type === 'message' ? <MessageCircle className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{notif.fromName}</p>
                        <p className="text-gray-400 text-sm mt-1">{notif.text}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(notif.time?.toDate()).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Mensagens */}
      {showMessages && (
        <SimpleMessages onClose={() => setShowMessages(false)} />
      )}
    </>
  );
};

export default NotificationsTab;
