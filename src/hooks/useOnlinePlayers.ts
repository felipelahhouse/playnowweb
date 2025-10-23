import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OnlinePlayer {
  id: string;
  username: string;
  avatar_url?: string;
  last_seen: string;
}

export const useOnlinePlayers = () => {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('is_online', '==', true));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const players: OnlinePlayer[] = snapshot.docs
        .map((doc) => {
          const data = doc.data() as Partial<OnlinePlayer>;
          return {
            id: doc.id,
            username: data.username ?? 'Player',
            avatar_url: data.avatar_url,
            last_seen: data.last_seen ?? new Date().toISOString(),
          } satisfies OnlinePlayer;
        })
        .filter((player) => {
          const lastSeen = new Date(player.last_seen ?? Date.now()).getTime();
          return Number.isFinite(lastSeen) ? lastSeen >= fiveMinutesAgo : true;
        })
        .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

      setOnlinePlayers(players);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching online players:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { onlinePlayers, loading };
};
