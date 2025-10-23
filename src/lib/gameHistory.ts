// 🎮 GAME HISTORY - Sistema de histórico de jogos
// Rastreia jogos recentes do usuário

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface GameHistoryEntry {
  id?: string;
  userId: string;
  gameId: string;
  gameTitle: string;
  gameCover: string | null;
  platform: string;
  playedAt: Date;
  sessionDuration?: number; // em minutos
}

/**
 * 📝 Registra que o usuário jogou um jogo
 */
export async function recordGamePlay(
  userId: string,
  gameId: string,
  gameTitle: string,
  gameCover: string | null,
  platform: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'game_history'), {
      userId,
      gameId,
      gameTitle,
      gameCover,
      platform,
      playedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    });

    console.log(`[GAME HISTORY] ✅ Registrado: ${gameTitle} para ${userId}`);
  } catch (error) {
    console.error('[GAME HISTORY] ❌ Erro ao registrar:', error);
  }
}

/**
 * 📚 Busca jogos recentes do usuário
 */
export async function getRecentGames(userId: string, limitCount: number = 10): Promise<GameHistoryEntry[]> {
  try {
    const q = query(
      collection(db, 'game_history'),
      where('userId', '==', userId),
      orderBy('playedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const games: GameHistoryEntry[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      games.push({
        id: doc.id,
        userId: data.userId,
        gameId: data.gameId,
        gameTitle: data.gameTitle,
        gameCover: data.gameCover || null,
        platform: data.platform,
        playedAt: data.playedAt?.toDate() || new Date(),
        sessionDuration: data.sessionDuration
      });
    });

    console.log(`[GAME HISTORY] ✅ ${games.length} jogos recentes carregados`);
    return games;
  } catch (error) {
    console.error('[GAME HISTORY] ❌ Erro ao buscar jogos recentes:', error);
    return [];
  }
}

/**
 * 🎯 Busca jogos mais jogados do usuário
 */
export async function getMostPlayedGames(userId: string, limitCount: number = 5): Promise<{ gameId: string; title: string; playCount: number }[]> {
  try {
    const q = query(
      collection(db, 'game_history'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const gamePlayCounts: Record<string, { title: string; count: number }> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const gameId = data.gameId;
      
      if (!gamePlayCounts[gameId]) {
        gamePlayCounts[gameId] = {
          title: data.gameTitle,
          count: 0
        };
      }
      
      gamePlayCounts[gameId].count++;
    });

    // Converte para array e ordena por quantidade
    const mostPlayed = Object.entries(gamePlayCounts)
      .map(([gameId, data]) => ({
        gameId,
        title: data.title,
        playCount: data.count
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limitCount);

    return mostPlayed;
  } catch (error) {
    console.error('[GAME HISTORY] ❌ Erro ao buscar jogos mais jogados:', error);
    return [];
  }
}

/**
 * 📊 Estatísticas de jogo do usuário
 */
export async function getUserGameStats(userId: string) {
  try {
    const q = query(
      collection(db, 'game_history'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const uniqueGames = new Set<string>();
    let totalSessions = 0;
    let totalDuration = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      uniqueGames.add(data.gameId);
      totalSessions++;
      totalDuration += data.sessionDuration || 0;
    });

    return {
      totalGamesPlayed: uniqueGames.size,
      totalSessions,
      totalHours: Math.round(totalDuration / 60),
      averageSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
    };
  } catch (error) {
    console.error('[GAME HISTORY] ❌ Erro ao buscar estatísticas:', error);
    return {
      totalGamesPlayed: 0,
      totalSessions: 0,
      totalHours: 0,
      averageSessionDuration: 0
    };
  }
}
