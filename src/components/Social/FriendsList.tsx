// 👥 FRIENDS SYSTEM - Sistema de amizades com solicitações
import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search,
  Users,
  Check,
  MessageCircle,
  Gamepad2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../User/UserAvatar';

interface FriendsListProps {
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
}

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
  email: string;
  created_at: string;
  last_seen: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: any;
}

const FriendsList: React.FC<FriendsListProps> = ({ onClose, onSendMessage }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar amigos
  useEffect(() => {
    if (!user?.id) return;

    const loadFriends = async () => {
      // ✅ SOLUÇÃO: Fazer 2 queries separadas e combinar (sem usar or())
      const friendshipsAsUser1 = query(
        collection(db, 'friendships'),
        where('user1Id', '==', user.id),
        where('status', '==', 'accepted')
      );

      const friendshipsAsUser2 = query(
        collection(db, 'friendships'),
        where('user2Id', '==', user.id),
        where('status', '==', 'accepted')
      );

      const unsubscribe1 = onSnapshot(friendshipsAsUser1, () => loadFriendsList());
      const unsubscribe2 = onSnapshot(friendshipsAsUser2, () => loadFriendsList());

      const loadFriendsList = async () => {
        const [snap1, snap2] = await Promise.all([
          getDocs(friendshipsAsUser1),
          getDocs(friendshipsAsUser2)
        ]);

        const allFriendships = [...snap1.docs, ...snap2.docs];
        const friendsData: Friend[] = [];

        for (const docSnap of allFriendships) {
          const friendship = docSnap.data();
          const friendId = friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id;

          // Buscar dados do amigo
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            friendsData.push({ 
              id: friendDoc.id, 
              ...friendDoc.data() 
            } as Friend);
          }
        }

        setFriends(friendsData);
      };

      loadFriendsList();

      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    };

    loadFriends();
  }, [user?.id]);

  // Carregar solicitações recebidas
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
    });

    return unsubscribe;
  }, [user?.id]);

  // Carregar solicitações enviadas
  useEffect(() => {
    if (!user?.id) return;

    const sentQuery = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(sentQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];

      setSentRequests(requests);
    });

    return unsubscribe;
  }, [user?.id]);

  // Buscar usuários
  const handleSearch = async () => {
    if (!searchTerm.trim() || !user?.id) return;

    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Friend))
        .filter(u => 
          u.id !== user.id && 
          u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar solicitação de amizade
  const sendFriendRequest = async (receiverId: string, receiverUsername: string) => {
    if (!user?.id) return;

    try {
      // Verificar se já existe solicitação
      const existingQuery = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', user.id),
        where('receiverId', '==', receiverId),
        where('status', '==', 'pending')
      );
      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        alert('Você já enviou uma solicitação para este usuário!');
        return;
      }

      // ✅ Verificar se já são amigos (sem or())
      const friendshipsCheck1 = query(
        collection(db, 'friendships'),
        where('user1Id', '==', user.id),
        where('status', '==', 'accepted')
      );
      const friendshipsCheck2 = query(
        collection(db, 'friendships'),
        where('user2Id', '==', user.id),
        where('status', '==', 'accepted')
      );
      
      const [snap1, snap2] = await Promise.all([
        getDocs(friendshipsCheck1),
        getDocs(friendshipsCheck2)
      ]);
      
      const allFriendships = [...snap1.docs, ...snap2.docs];
      const alreadyFriends = allFriendships.some(doc => {
        const data = doc.data();
        return (data.user1Id === receiverId || data.user2Id === receiverId);
      });

      if (alreadyFriends) {
        alert('Vocês já são amigos!');
        return;
      }

      await addDoc(collection(db, 'friend_requests'), {
        senderId: user.id,
        senderUsername: user.username,
        senderAvatar: user.avatar_url || null,
        receiverId,
        receiverUsername,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      alert('✅ Solicitação de amizade enviada!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('❌ Erro ao enviar solicitação');
    }
  };

  // Aceitar solicitação
  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user?.id) return;

    try {
      // Atualizar status da solicitação
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'accepted'
      });

      // Criar relação de amizade
      await addDoc(collection(db, 'friendships'), {
        user1Id: senderId,
        user2Id: user.id,
        status: 'accepted',
        createdAt: serverTimestamp()
      });

      // Opcional: deletar a solicitação após 30 dias
      setTimeout(async () => {
        await deleteDoc(doc(db, 'friend_requests', requestId));
      }, 30 * 24 * 60 * 60 * 1000);

    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('❌ Erro ao aceitar solicitação');
    }
  };

  // Rejeitar solicitação
  const rejectFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'rejected'
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  // Remover amigo
  const removeFriend = async (friendId: string) => {
    if (!user?.id || !confirm('Tem certeza que deseja remover este amigo?')) return;

    try {
      // ✅ Buscar friendship sem or()
      const friendshipCheck1 = query(
        collection(db, 'friendships'),
        where('user1Id', '==', user.id),
        where('status', '==', 'accepted')
      );
      const friendshipCheck2 = query(
        collection(db, 'friendships'),
        where('user2Id', '==', user.id),
        where('status', '==', 'accepted')
      );

      const [snap1, snap2] = await Promise.all([
        getDocs(friendshipCheck1),
        getDocs(friendshipCheck2)
      ]);

      const allDocs = [...snap1.docs, ...snap2.docs];
      const friendshipDoc = allDocs.find(doc => {
        const data = doc.data();
        return (data.user1Id === friendId || data.user2Id === friendId);
      });

      if (friendshipDoc) {
        await deleteDoc(doc(db, 'friendships', friendshipDoc.id));
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('❌ Erro ao remover amigo');
    }
  };

  const isRequestSent = (userId: string) => {
    return sentRequests.some(req => req.receiverId === userId);
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl h-[90vh] bg-gray-900 rounded-2xl sm:rounded-3xl border-2 border-cyan-500/30 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Amigos
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation active:scale-95"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                activeTab === 'friends'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Amigos ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all touch-manipulation active:scale-95 relative ${
                activeTab === 'requests'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Solicitações ({friendRequests.length})
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                activeTab === 'search'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Lista de Amigos */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Você ainda não tem amigos</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-colors"
                  >
                    Adicionar Amigos
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={friend} size="md" showOnline />
                      <div>
                        <h3 className="text-white font-bold">{friend.username}</h3>
                        <p className="text-xs text-gray-400">
                          {friend.is_online ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSendMessage && (
                        <button
                          onClick={() => onSendMessage(friend.id)}
                          className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors touch-manipulation active:scale-95"
                          title="Enviar mensagem"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors touch-manipulation active:scale-95"
                        title="Remover amigo"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Solicitações */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 border border-cyan-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        user={{ 
                          id: request.senderId,
                          username: request.senderUsername,
                          avatar_url: request.senderAvatar,
                          email: '',
                          created_at: '',
                          is_online: false,
                          last_seen: ''
                        }} 
                        size="md" 
                      />
                      <div>
                        <h3 className="text-white font-bold">{request.senderUsername}</h3>
                        <p className="text-xs text-gray-400">Quer ser seu amigo</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptFriendRequest(request.id, request.senderId)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 touch-manipulation active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Aceitar
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(request.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 touch-manipulation active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Buscar Usuários */}
          {activeTab === 'search' && (
            <div>
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar usuários por nome..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  Buscar
                </button>
              </div>

              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={result} size="md" showOnline />
                      <div>
                        <h3 className="text-white font-bold">{result.username}</h3>
                        <p className="text-xs text-gray-400">
                          {result.is_online ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                    </div>

                    {isFriend(result.id) ? (
                      <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Amigos
                      </span>
                    ) : isRequestSent(result.id) ? (
                      <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg font-bold text-sm">
                        Solicitação Enviada
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(result.id, result.username)}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 touch-manipulation active:scale-95"
                      >
                        <UserPlus className="w-4 h-4" />
                        Adicionar
                      </button>
                    )}
                  </div>
                ))}

                {searchResults.length === 0 && searchTerm && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
