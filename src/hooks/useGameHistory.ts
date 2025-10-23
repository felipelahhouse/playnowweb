// 🎮 HOOK - useGameHistory
// Hook React para histórico de jogos do usuário

import { useState, useEffect } from 'react';
import { getRecentGames, getMostPlayedGames, getUserGameStats } from '../lib/gameHistory';
import type { GameHistoryEntry } from '../lib/gameHistory';

export function useGameHistory(userId: string | null) {
  const [recentGames, setRecentGames] = useState<GameHistoryEntry[]>([]);
  const [mostPlayed, setMostPlayed] = useState<{ gameId: string; title: string; playCount: number }[]>([]);
  const [stats, setStats] = useState({
    totalGamesPlayed: 0,
    totalSessions: 0,
    totalHours: 0,
    averageSessionDuration: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        
        const [recent, most, statistics] = await Promise.all([
          getRecentGames(userId, 10),
          getMostPlayedGames(userId, 5),
          getUserGameStats(userId)
        ]);

        setRecentGames(recent);
        setMostPlayed(most);
        setStats(statistics);
      } catch (error) {
        console.error('[useGameHistory] Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  return {
    recentGames,
    mostPlayed,
    stats,
    loading
  };
}
