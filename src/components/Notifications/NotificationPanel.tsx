// 🔔 NOTIFICATION PANEL - Painel de notificações com friend requests
import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, XCircle, Clock } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../User/UserAvatar';

interface NotificationPanelProps {
  onClose: () => void;
  onOpenFriendsList?: () => void;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: { toDate: () => Date } | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onOpenFriendsList }) => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const requestsQuery = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];

      setFriendRequests(requests);
      setLoading(false);
      console.log('[NOTIFICATIONS] Loaded', requests.length, 'pending friend requests');
    });

    return unsubscribe;
  }, [user?.id]);

  const acceptFriendRequest = async (requestId: string, senderId: string, senderUsername: string) => {
    if (!user?.id) return;
    
    setProcessingId(requestId);
    
    try {
      // 1. Marcar request como aceito
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      // 2. Criar amizade bidirecional
      await Promise.all([
        addDoc(collection(db, 'friendships'), {
          userId: user.id,
          friendId: senderId,
          friendUsername: senderUsername,
          createdAt: serverTimestamp()
        }),
        addDoc(collection(db, 'friendships'), {
          userId: senderId,
          friendId: user.id,
          friendUsername: user.username || 'Unknown',
          createdAt: serverTimestamp()
        })
      ]);

      // 3. Remover o request após aceitar
      setTimeout(async () => {
        await deleteDoc(doc(db, 'friend_requests', requestId));
      }, 1000);

      console.log('[NOTIFICATIONS] ✅ Friend request accepted:', senderUsername);
    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error accepting friend request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });

      // Remove após 1 segundo
      setTimeout(async () => {
        await deleteDoc(doc(db, 'friend_requests', requestId));
      }, 1000);

      console.log('[NOTIFICATIONS] ❌ Friend request rejected');
    } catch (error) {
      console.error('[NOTIFICATIONS] Error rejecting friend request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimestamp = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp?.toDate) return 'agora';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-start justify-center p-0 sm:p-4 sm:pt-20">
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-gray-900 sm:rounded-2xl sm:border-2 border-cyan-500/30 overflow-hidden flex flex-col sm:max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                </div>
                Notificações
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {friendRequests.length} {friendRequests.length === 1 ? 'pedido pendente' : 'pedidos pendentes'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation active:scale-95"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : friendRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-6">
              <Clock className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm text-center font-medium mb-1">Nenhuma notificação</p>
              <p className="text-xs text-center text-gray-600">
                Você está em dia com suas notificações!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 sm:p-5 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <UserAvatar 
                      user={{
                        id: request.senderId,
                        username: request.senderUsername,
                        avatar_url: request.senderAvatar
                      }}
                      size="md"
                      className="flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-white font-bold text-sm truncate">
                            {request.senderUsername}
                          </p>
                          <p className="text-xs text-gray-400">
                            quer ser seu amigo
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTimestamp(request.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request.id, request.senderId, request.senderUsername)}
                      disabled={processingId === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Aceitar
                    </button>
                    
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Abrir Lista de Amigos */}
        {onOpenFriendsList && (
          <div className="p-4 border-t border-gray-800 bg-gray-950">
            <button
              onClick={() => {
                onClose();
                onOpenFriendsList();
              }}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-xl font-bold text-sm transition-all touch-manipulation active:scale-95"
            >
              Ver Todos os Amigos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
