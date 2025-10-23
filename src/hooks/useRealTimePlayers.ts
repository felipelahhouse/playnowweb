import { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  last_seen: string;
  is_online: boolean;
  current_game_id?: string;
}

interface GamePlayers {
  [gameId: string]: Player[];
}

export const useRealTimePlayers = () => {
  const { user } = useAuth();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playersByGame, setPlayersByGame] = useState<GamePlayers>({});
  const [loading, setLoading] = useState(true);
  const heartbeatInitialized = useRef(false);

  useEffect(() => {
    if (!user || heartbeatInitialized.current) {
      return;
    }

    heartbeatInitialized.current = true;

    const updateStatus = async (isOnline: boolean) => {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating user status', error);
      }
    };

    void updateStatus(true);

    const handleBeforeUnload = () => {
      void updateStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      heartbeatInitialized.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void updateStatus(false);
    };
  }, [user?.id]);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('is_online', '==', true));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const now = Date.now();
      const TWO_MINUTES = 2 * 60 * 1000; // 2 minutos em milissegundos

      const onlinePlayers: Player[] = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as Partial<Player & { currentGameId?: string }>;
          return {
            id: docSnapshot.id,
            username: data.username ?? 'Player',
            avatar_url: data.avatar_url,
            last_seen: data.last_seen ?? new Date().toISOString(),
            is_online: true,
            current_game_id: data.current_game_id ?? data.currentGameId ?? undefined,
          } satisfies Player;
        })
        .filter((player) => {
          // Verificar se last_seen é recente (últimos 2 minutos)
          const lastSeenTime = new Date(player.last_seen ?? Date.now()).getTime();
          const timeDiff = now - lastSeenTime;
          const isRecentlyActive = Number.isFinite(lastSeenTime) && timeDiff <= TWO_MINUTES;
          
          if (!isRecentlyActive) {
            console.log(`[REAL TIME PLAYERS] ⏱️ Jogador ${player.username} inativo há ${Math.round(timeDiff / 1000)}s`);
          }
          
          return isRecentlyActive;
        })
        .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

      setAllPlayers(onlinePlayers);

      const grouped: GamePlayers = {};
      onlinePlayers.forEach((player) => {
        if (player.current_game_id) {
          if (!grouped[player.current_game_id]) {
            grouped[player.current_game_id] = [];
          }
          grouped[player.current_game_id].push(player);
        }
      });

      setPlayersByGame(grouped);
      setLoading(false);
      
      console.log(`[REAL TIME PLAYERS] ✅ ${onlinePlayers.length} jogadores realmente online`);
    }, (error) => {
      console.error('Error loading realtime players', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPlayersForGame = (gameId: string): Player[] => playersByGame[gameId] ?? [];

  const getTotalOnlinePlayers = (): number => allPlayers.length;

  return {
    allPlayers,
    playersByGame,
    loading,
    getPlayersForGame,
    getTotalOnlinePlayers,
  };
};
