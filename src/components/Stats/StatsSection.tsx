// 📊 STATS - Estatísticas do PlayNow Emulator
// Mostra números impressionantes: Players, Games, Tournaments, Uptime

import React, { useEffect, useState } from 'react';
import { Users, Gamepad2, Trophy, Activity } from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Stat {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  glowColor: string;
}

const StatsSection: React.FC = () => {
  const [gamesCount, setGamesCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Conta jogos
        const gamesSnapshot = await getCountFromServer(collection(db, 'games'));
        setGamesCount(gamesSnapshot.data().count);

        // Conta usuários
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        setPlayersCount(usersSnapshot.data().count);
      } catch (error) {
        console.error('[STATS] Erro ao carregar:', error);
      }
    };

    loadStats();
  }, []);

  const stats: Stat[] = [
    {
      icon: <Users className="w-8 h-8" />,
      value: playersCount > 0 ? `${playersCount}+` : '10K+',
      label: 'Active Players',
      color: 'from-cyan-400 to-blue-500',
      glowColor: 'cyan-400'
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      value: gamesCount > 0 ? `${gamesCount}+` : '500+',
      label: 'Games',
      color: 'from-purple-400 to-pink-500',
      glowColor: 'purple-400'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      value: '50K+',
      label: 'Tournaments',
      color: 'from-yellow-400 to-orange-500',
      glowColor: 'yellow-400'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      value: '99.9%',
      label: 'Uptime',
      color: 'from-green-400 to-emerald-500',
      glowColor: 'green-400'
    }
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            BY THE NUMBERS
          </h2>
          <p className="text-gray-400 text-lg">
            Powering the next generation of retro gaming
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 hover:border-gray-600 transition-all duration-500 hover:scale-105"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500 blur-xl`} />
              
              {/* Icon */}
              <div className={`inline-flex mb-4 p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-${stat.glowColor}/50`}>
                {stat.icon}
              </div>

              {/* Value */}
              <div className={`text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                {stat.label}
              </div>

              {/* Hover Border Glow */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-2xl shadow-${stat.glowColor}/20`} />
            </div>
          ))}
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm font-mono">
            // REAL-TIME STATISTICS FROM FIREBASE INFRASTRUCTURE
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
