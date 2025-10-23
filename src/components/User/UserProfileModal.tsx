// 👤 USER PROFILE MODAL - Modal simplificado para visualizar perfil de outros usuários
import React, { useEffect, useState, useCallback } from 'react';
import { X, Trophy, Gamepad2, Clock, Award, Star, Shield, MessageCircle, UserPlus, Crown } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from './UserAvatar';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  is_online: boolean;
  badge?: string;
  created_at?: Timestamp;
  last_seen?: Timestamp;
  createdAt?: Timestamp;
  lastSeen?: Timestamp;
  bio?: string;
}

interface GameHistory {
  gameTitle: string;
  platform: string;
  playedAt: Timestamp | Date;
  duration: number;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose, onSendMessage, onAddFriend }) => {
  const { user: currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlayTime: 0,
    favoriteGenre: 'Action',
    achievements: 0
  });
  const [loading, setLoading] = useState(true);
  
  const isOwnProfile = currentUser?.id === userId;

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);

      // Carregar dados do usuário
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() } as UserData);
      }

      // Carregar histórico de jogos (últimos 10)
      try {
        const historyQuery = query(
          collection(db, 'game_history'),
          where('userId', '==', userId),
          orderBy('playedAt', 'desc'),
          limit(10)
        );
        const historySnapshot = await getDocs(historyQuery);
        const history = historySnapshot.docs.map(doc => doc.data() as GameHistory);
        setGameHistory(history);

        // Calcular estatísticas
        const totalGames = historySnapshot.size;
        const totalPlayTime = history.reduce((sum, game) => sum + (game.duration || 0), 0);
        
        setStats({
          totalGames,
          totalPlayTime: Math.floor(totalPlayTime / 60), // em minutos
          favoriteGenre: 'Action',
          achievements: Math.floor(totalGames * 1.5) // Mock
        });
      } catch (error) {
        console.log('[PROFILE] Histórico não disponível:', error);
        // Stats padrão se não houver histórico
        setStats({
          totalGames: 0,
          totalPlayTime: 0,
          favoriteGenre: 'Action',
          achievements: 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('[PROFILE] Erro ao carregar perfil:', error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const getBadgeInfo = (badge?: string): { color: string; icon: typeof Shield; label: string } | null => {
    const badges: Record<string, { color: string; icon: typeof Shield; label: string }> = {
      admin: { color: 'from-red-500 to-orange-500', icon: Crown, label: 'Admin' },
      moderator: { color: 'from-blue-500 to-cyan-500', icon: Shield, label: 'Moderator' },
      streamer: { color: 'from-purple-500 to-pink-500', icon: Star, label: 'Streamer' },
      vip: { color: 'from-yellow-500 to-orange-500', icon: Trophy, label: 'VIP' },
      beta_tester: { color: 'from-green-500 to-emerald-500', icon: Award, label: 'Beta Tester' },
      pro: { color: 'from-cyan-500 to-blue-500', icon: Star, label: 'PRO' }
    };
    return badges[badge || ''] || null;
  };

  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp instanceof Date ? timestamp : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border-2 border-cyan-500/30 rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-bold">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const badgeInfo = getBadgeInfo(userData.badge);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar com Badge Animado e Status Online */}
            <div className="relative">
              <UserAvatar user={userData as any} size="xl" showBadge={true} showOnline={true} />
            </div>
            
            <div className="flex-1">
              {/* Badge acima do nome */}
              {badgeInfo && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${badgeInfo.color} rounded-lg mb-2 shadow-lg`}>
                  <badgeInfo.icon className="w-4 h-4 text-white animate-pulse-slow" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">{badgeInfo.label}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-black text-white">{userData.username}</h2>
                {userData.is_online && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400 font-bold">ONLINE</span>
                  </div>
                )}
              </div>

              {userData.bio && (
                <p className="text-gray-400 text-sm mt-2">{userData.bio}</p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>Joined {formatDate(userData.createdAt || userData.created_at)}</span>
                {!userData.is_online && (userData.lastSeen || userData.last_seen) && (
                  <span>Last seen {formatDate(userData.lastSeen || userData.last_seen)}</span>
                )}
              </div>

              {/* Action Buttons - Só aparecem se não for o próprio perfil */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {onSendMessage && (
                    <button
                      onClick={() => onSendMessage(userId)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-bold text-sm transition-all touch-manipulation active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar Mensagem
                    </button>
                  )}
                  {onAddFriend && (
                    <button
                      onClick={() => onAddFriend(userId)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-bold text-sm transition-all touch-manipulation active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar Amigo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-800">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Gamepad2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white mb-1">{stats.totalGames}</div>
            <div className="text-xs text-gray-400">Games Played</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white mb-1">{formatPlayTime(stats.totalPlayTime)}</div>
            <div className="text-xs text-gray-400">Play Time</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white mb-1">{stats.achievements}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
            <Star className="w-8 h-8 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white mb-1">{stats.favoriteGenre}</div>
            <div className="text-xs text-gray-400">Favorite Genre</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Activity
          </h3>

          {gameHistory.length > 0 ? (
            <div className="space-y-2">
              {gameHistory.map((game, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{game.gameTitle}</div>
                      <div className="text-xs text-gray-400">{game.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{formatDate(game.playedAt)}</div>
                    {game.duration && (
                      <div className="text-xs text-cyan-400">{formatPlayTime(Math.floor(game.duration / 60))}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
