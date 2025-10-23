import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Trophy, Gamepad2, Clock, Star, LogOut, Shield, Bell, User, Trash2, AlertTriangle } from 'lucide-react';
import { getUserBadge, getBadgeIcon, getBadgeColor, isAdmin } from '../../lib/auth';
import ProfileSettings from './ProfileSettings';
import AdminPanel from '../Admin/AdminPanel';
import NotificationsTab from './NotificationsTab';
import { useGameHistory } from '../../hooks/useGameHistory';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const { recentGames, mostPlayed, stats, loading } = useGameHistory(user?.id || null);

  if (!isOpen || !user) return null;

  const badge = getUserBadge(user);
  const userIsAdmin = isAdmin(user);

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Por favor, insira sua senha para confirmar.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !user?.email) {
        throw new Error('Usuário não encontrado');
      }

      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Deletar dados do Firestore
      console.log('[DELETE ACCOUNT] Deletando dados do usuário:', user.id);

      // Deletar documento do usuário
      await deleteDoc(doc(db, 'users', user.id));

      // Deletar mensagens enviadas
      const sentMessages = await getDocs(
        query(collection(db, 'direct_messages'), where('senderId', '==', user.id))
      );
      await Promise.all(sentMessages.docs.map(d => deleteDoc(d.ref)));

      // Deletar mensagens recebidas
      const receivedMessages = await getDocs(
        query(collection(db, 'direct_messages'), where('receiverId', '==', user.id))
      );
      await Promise.all(receivedMessages.docs.map(d => deleteDoc(d.ref)));

      // Deletar sessões de jogo
      const gameSessions = await getDocs(
        query(collection(db, 'game_sessions'), where('user_id', '==', user.id))
      );
      await Promise.all(gameSessions.docs.map(d => deleteDoc(d.ref)));

      // Deletar a conta do Firebase Auth
      await deleteUser(currentUser);

      console.log('[DELETE ACCOUNT] ✅ Conta deletada com sucesso!');
      alert('Sua conta foi deletada com sucesso. Esperamos vê-lo novamente!');
      
      // Fechar modal e redirecionar
      onClose();
    } catch (error) {
      console.error('[DELETE ACCOUNT] Erro ao deletar conta:', error);
      
      const err = error as { code?: string; message: string };
      
      if (err.code === 'auth/wrong-password') {
        setDeleteError('Senha incorreta. Tente novamente.');
      } else if (err.code === 'auth/too-many-requests') {
        setDeleteError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setDeleteError('Erro ao deletar conta: ' + err.message);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (showSettings) {
    return <ProfileSettings onClose={() => setShowSettings(false)} />;
  }

  if (showAdminPanel) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  // Use real stats from Firebase or fallback to mock
  const displayStats = {
    gamesPlayed: stats?.totalGamesPlayed || 0,
    hoursPlayed: Math.round(stats?.totalHours || 0),
    achievements: 23, // TODO: Implement achievements system
    favoriteGame: mostPlayed[0]?.title || 'N/A',
    winRate: 78 // TODO: Implement win/loss tracking
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Badge - COROA ADMIN COM ANIMAÇÃO MELHORADA */}
              {badge && (
                <div className="absolute -top-2 -right-2 z-10">
                  {/* Glow effect animado */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getBadgeColor(badge)} rounded-full blur-md opacity-60 animate-glow`} />
                  {/* Ring effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getBadgeColor(badge)} rounded-full animate-ping opacity-20`} />
                  {/* Badge principal */}
                  <div className={`relative p-2 bg-gradient-to-br ${getBadgeColor(badge)} rounded-full shadow-2xl border-2 border-white/30`}>
                    <div className="text-lg animate-pulse-slow">
                      {getBadgeIcon(badge)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Online Status */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse" />
            </div>
            <div className="flex-1">
              {/* Badge acima do nome */}
              {badge && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${getBadgeColor(badge)} rounded-lg mb-2 shadow-lg`}>
                  <span className="text-lg animate-pulse-slow">{getBadgeIcon(badge)}</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{badge}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
              </div>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-green-400 mt-1">● Online now</p>
            </div>
            
            {/* Botões de Ação - Layout mobile-friendly */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
              {userIsAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/50 hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] flex-1 sm:flex-initial"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                  <span className="whitespace-nowrap">Admin</span>
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30 touch-manipulation min-h-[44px] flex-1 sm:flex-initial"
                title="Editar Perfil"
              >
                <User className="w-4 h-4" />
                <span className="whitespace-nowrap">Editar Perfil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex border-b border-gray-800 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === 'overview'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
              activeTab === 'notifications'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Mensagens & Notificações</span>
          </button>
        </div>

        {/* Content baseado na tab ativa */}
        {activeTab === 'overview' ? (
          <>
            {/* Stats */}
            <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gaming Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-medium">Games</span>
              </div>
              <p className="text-2xl font-bold text-white">{displayStats.gamesPlayed}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-medium">Hours</span>
              </div>
              <p className="text-2xl font-bold text-white">{displayStats.hoursPlayed}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Achievements</span>
              </div>
              <p className="text-2xl font-bold text-white">{displayStats.achievements}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{displayStats.winRate}%</p>
            </div>
          </div>

          {/* Recent Games */}
          <div>
            <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              Recent Games
            </h4>
            
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
                Loading game history...
              </div>
            ) : recentGames.length > 0 ? (
              <div className="space-y-3">
                {recentGames.slice(0, 5).map((game) => (
                  <div key={game.gameId} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all">
                    {game.gameCover ? (
                      <img src={game.gameCover} alt={game.gameTitle} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{game.gameTitle}</p>
                      <p className="text-sm text-gray-400">{game.platform}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(game.playedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No games played yet</p>
                <p className="text-sm">Start playing to see your history!</p>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          /* Tab de Notificações e Mensagens */
          <div className="p-6">
            <NotificationsTab />
          </div>
        )}

        {/* Footer com botão de Logout */}
        <div className="p-6 border-t border-gray-700/50 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/50"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 font-medium rounded-xl transition-all duration-200 border border-gray-700 hover:border-red-500/50"
          >
            <Trash2 className="w-5 h-5" />
            Deletar Conta
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Deletar Conta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl border-2 border-red-500/50 shadow-2xl shadow-red-500/20">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Deletar Conta</h2>
              </div>
              <p className="text-gray-400 mt-2">
                Esta ação é <span className="text-red-400 font-bold">permanente e irreversível</span>.
              </p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  O que será deletado:
                </h3>
                <ul className="text-sm text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Todos os seus dados de perfil</li>
                  <li>Histórico de jogos e estatísticas</li>
                  <li>Mensagens diretas (enviadas e recebidas)</li>
                  <li>Sessões de jogos salvos</li>
                  <li>Acesso à conta (não poderá fazer login novamente)</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Digite sua senha para confirmar:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={deleteLoading}
                />
              </div>

              {deleteError && (
                <div className="bg-red-950/50 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                  {deleteError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Deletar Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;