// 📊 USER REGISTRATION LOGS
// Histórico de registros de contas no sistema
import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar, Mail, Clock, TrendingUp, Users, Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface UserRegistration {
  id: string;
  username: string;
  email: string;
  created_at: any;
  badge?: string;
  is_online?: boolean;
}

interface RegistrationStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  admins: number;
}

const UserRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      
      // Busca todos os usuários ordenados por data de criação
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('created_at', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserRegistration[];

      setRegistrations(users);
      calculateStats(users);
      setLoading(false);
    } catch (error) {
      console.error('[REGISTRATIONS] Erro ao carregar:', error);
      setLoading(false);
    }
  };

  const calculateStats = (users: UserRegistration[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: RegistrationStats = {
      total: users.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      admins: 0
    };

    users.forEach(user => {
      const createdAt = user.created_at?.toDate?.() || new Date(user.created_at);
      
      if (createdAt >= todayStart) stats.today++;
      if (createdAt >= weekStart) stats.thisWeek++;
      if (createdAt >= monthStart) stats.thisMonth++;
      if (user.badge === 'admin') stats.admins++;
    });

    setStats(stats);
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days} dias atrás`;
    return formatDate(timestamp);
  };

  const filteredRegistrations = registrations.filter(user => {
    if (filter === 'all') return true;
    
    const createdAt = user.created_at?.toDate?.() || new Date(user.created_at);
    const now = new Date();
    
    if (filter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return createdAt >= todayStart;
    }
    
    if (filter === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return createdAt >= weekStart;
    }
    
    if (filter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return createdAt >= monthStart;
    }
    
    return true;
  });

  const getBadgeColor = (badge?: string) => {
    const colors: Record<string, string> = {
      admin: 'from-red-500 to-orange-500',
      moderator: 'from-blue-500 to-cyan-500',
      streamer: 'from-purple-500 to-pink-500',
      vip: 'from-yellow-500 to-orange-500',
      beta_tester: 'from-green-500 to-emerald-500',
      pro: 'from-cyan-500 to-blue-500'
    };
    return colors[badge || ''] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Carregando registros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-300">Total</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.total}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Hoje</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.today}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">7 dias</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.thisWeek}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-300">30 dias</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.thisMonth}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-300">Admins</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.admins}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Todos ({registrations.length})
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'today'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Hoje ({stats.today})
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'week'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          7 dias ({stats.thisWeek})
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'month'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          30 dias ({stats.thisMonth})
        </button>
      </div>

      {/* Registrations List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-cyan-400" />
          Registros Recentes
        </h3>

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-xl">
            <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum registro encontrado neste período</p>
          </div>
        ) : (
          filteredRegistrations.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{user.username}</span>
                    {user.badge && (
                      <span className={`px-2 py-0.5 bg-gradient-to-r ${getBadgeColor(user.badge)} rounded-full text-xs text-white font-bold`}>
                        {user.badge}
                      </span>
                    )}
                    {user.is_online && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Online
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">
                  {formatDate(user.created_at)}
                </div>
                <div className="text-xs text-cyan-400 font-semibold">
                  {getRelativeTime(user.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserRegistrations;
