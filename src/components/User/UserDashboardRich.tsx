import React, { useState, useEffect } from 'react';
import { 
  Trophy, TrendingUp, Clock, Star, Gamepad2, Users, 
  Zap, Award, Target, Flame, Calendar, Activity
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  gamesPlayed: number;
  hoursPlayed: number;
  achievements: number;
  rank: string;
  level: number;
  experience: number;
  nextLevelXP: number;
  winRate: number;
  streak: number;
}

interface RecentGame {
  id: string;
  title: string;
  platform: string;
  playedAt: Date;
  duration: number;
  score?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

const UserDashboardRich: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    gamesPlayed: 0,
    hoursPlayed: 0,
    achievements: 0,
    rank: 'Bronze',
    level: 1,
    experience: 0,
    nextLevelXP: 1000,
    winRate: 0,
    streak: 0,
  });
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user stats
      // TODO: Implement real stats loading
      setStats({
        gamesPlayed: 42,
        hoursPlayed: 127,
        achievements: 18,
        rank: 'Gold',
        level: 15,
        experience: 7850,
        nextLevelXP: 10000,
        winRate: 68,
        streak: 7,
      });

      // Mock recent games
      setRecentGames([
        {
          id: '1',
          title: 'Super Mario World',
          platform: 'SNES',
          playedAt: new Date(),
          duration: 45,
          score: 9850,
        },
        // ... more games
      ]);

      // Mock achievements
      setAchievements([
        {
          id: '1',
          title: 'First Steps',
          description: 'Play your first game',
          icon: '🎮',
          rarity: 'common',
          unlockedAt: new Date(),
        },
        // ... more achievements
      ]);

      setLoading(false);
    } catch (error) {
      console.error('[Dashboard] Error loading:', error);
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Bronze': 'from-orange-700 to-orange-600',
      'Silver': 'from-gray-400 to-gray-500',
      'Gold': 'from-yellow-500 to-yellow-600',
      'Platinum': 'from-cyan-400 to-blue-500',
      'Diamond': 'from-purple-500 to-pink-500',
    };
    return colors[rank] || 'from-gray-600 to-gray-700';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'common': 'from-gray-500 to-gray-600',
      'rare': 'from-blue-500 to-blue-600',
      'epic': 'from-purple-500 to-purple-600',
      'legendary': 'from-yellow-500 to-orange-500',
    };
    return colors[rarity] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-2xl h-48" />
          ))}
        </div>
      </div>
    );
  }

  const experiencePercent = (stats.experience / stats.nextLevelXP) * 100;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with Level & XP */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-6 border-2 border-gray-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Level & Rank */}
            <div className="flex items-center gap-4">
              {/* Level Circle */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRankColor(stats.rank)} flex items-center justify-center shadow-2xl`}>
                  <div className="text-center">
                    <div className="text-xs font-bold text-white/80">LEVEL</div>
                    <div className="text-3xl font-black text-white">{stats.level}</div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white shadow-lg">
                  {stats.rank}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{user?.username}</span>!
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>{stats.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>{stats.achievements} achievements</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-gray-800/50 rounded-xl border border-cyan-500/30">
                <div className="text-2xl font-black text-cyan-400">{stats.gamesPlayed}</div>
                <div className="text-xs text-gray-400">Games</div>
              </div>
              <div className="text-center px-4 py-2 bg-gray-800/50 rounded-xl border border-purple-500/30">
                <div className="text-2xl font-black text-purple-400">{stats.hoursPlayed}h</div>
                <div className="text-xs text-gray-400">Played</div>
              </div>
              <div className="text-center px-4 py-2 bg-gray-800/50 rounded-xl border border-green-500/30">
                <div className="text-2xl font-black text-green-400">{stats.winRate}%</div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-400">
                Level {stats.level} → {stats.level + 1}
              </span>
              <span className="text-sm font-bold text-cyan-400">
                {stats.experience.toLocaleString()} / {stats.nextLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${experiencePercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Gamepad2}
          label="Games Played"
          value={stats.gamesPlayed}
          gradient="from-cyan-500 to-blue-500"
          change="+12%"
        />
        <StatCard
          icon={Clock}
          label="Hours Played"
          value={`${stats.hoursPlayed}h`}
          gradient="from-purple-500 to-pink-500"
          change="+8%"
        />
        <StatCard
          icon={Trophy}
          label="Achievements"
          value={stats.achievements}
          gradient="from-yellow-500 to-orange-500"
          change="+3"
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={`${stats.winRate}%`}
          gradient="from-green-500 to-emerald-500"
          change="+5%"
        />
      </div>

      {/* Activity Chart & Recent Games */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border-2 border-gray-800">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Weekly Activity
          </h3>
          
          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const hours = [2, 4, 3, 5, 8, 12, 10][i];
              const percent = (hours / 12) * 100;
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-8">{day}</span>
                  <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg transition-all duration-1000 flex items-center justify-end px-2"
                      style={{ width: `${percent}%` }}
                    >
                      <span className="text-xs font-bold text-white">{hours}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border-2 border-gray-800">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Recent Games
          </h3>

          <div className="space-y-3">
            {recentGames.slice(0, 5).map((game) => (
              <div key={game.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{game.title}</div>
                  <div className="text-xs text-gray-400">{game.platform} • {game.duration}min ago</div>
                </div>
                {game.score && (
                  <div className="text-sm font-bold text-cyan-400">{game.score.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border-2 border-gray-800">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Recent Achievements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.slice(0, 6).map((achievement) => (
            <div
              key={achievement.id}
              className={`group relative p-4 bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300`}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="text-sm font-bold text-white mb-1">{achievement.title}</div>
                <div className="text-xs text-gray-300 mb-2">{achievement.description}</div>
                <div className="text-xs text-white/60 capitalize">{achievement.rarity}</div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, gradient, change }) => {
  return (
    <div className="group relative bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 border-2 border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden">
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-black text-white mb-1">{value}</div>
        <div className="text-xs text-gray-400 mb-2">{label}</div>
        {change && (
          <div className="flex items-center gap-1 text-xs font-bold text-green-400">
            <TrendingUp className="w-3 h-3" />
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardRich;
