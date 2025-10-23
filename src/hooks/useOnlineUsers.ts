import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserWithTimestamp {
  id: string;
  username?: string;
  last_seen?: string | Timestamp | { seconds: number };
  [key: string]: unknown;
}

export function useOnlineUsers() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<UserWithTimestamp[]>([]);

  useEffect(() => {
    console.log('[ONLINE USERS] Configurando listener...');

    // Query para usuários que marcaram is_online = true
    const onlineUsersQuery = query(
      collection(db, 'users'),
      where('is_online', '==', true)
    );

    const unsubscribe = onSnapshot(onlineUsersQuery, 
      (snapshot) => {
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000; // 2 minutos em milissegundos

        const users = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as UserWithTimestamp))
          .filter(user => {
            // Verificar se is_online está marcado como true
            if (!(user as any).is_online) {
              console.log(`[ONLINE USERS] ⚠️ Usuário ${user.username} está offline (is_online = false)`);
              return false;
            }

            // Verificar se last_seen existe e é recente
            const lastSeen = user.last_seen;
            
            if (!lastSeen) {
              console.log(`[ONLINE USERS] ⚠️ Usuário ${user.username} sem last_seen`);
              return false;
            }

            // Converter last_seen para timestamp
            let lastSeenTime: number;
            
            if (lastSeen instanceof Timestamp) {
              lastSeenTime = lastSeen.toMillis();
            } else if (typeof lastSeen === 'string') {
              lastSeenTime = new Date(lastSeen).getTime();
            } else if (typeof lastSeen === 'object' && 'seconds' in lastSeen) {
              // Firestore Timestamp object com propriedade 'seconds'
              lastSeenTime = (lastSeen as any).seconds * 1000;
            } else if (typeof lastSeen === 'object' && 'toMillis' in lastSeen) {
              // Firestore Timestamp object com método toMillis
              lastSeenTime = (lastSeen as any).toMillis();
            } else {
              console.log(`[ONLINE USERS] ⚠️ Formato inválido de last_seen para ${user.username}:`, typeof lastSeen, lastSeen);
              return false;
            }

            const timeDiff = now - lastSeenTime;
            // 🔧 FIX: Aumentado para 5 minutos para dar mais margem
            const isRecentlyActive = timeDiff <= TWO_MINUTES;

            if (!isRecentlyActive) {
              console.log(`[ONLINE USERS] ⏱️ Usuário ${user.username} inativo há ${Math.round(timeDiff / 1000)}s`);
            } else {
              console.log(`[ONLINE USERS] ✅ Usuário ${user.username} ativo (${Math.round(timeDiff / 1000)}s atrás)`);
            }

            return isRecentlyActive;
          });
        
        setOnlineUsers(users);
        setOnlineCount(users.length);
        
        console.log(`[ONLINE USERS] ✅ ${users.length} usuários realmente online:`, users.map(u => u.username));
      },
      (error) => {
        console.error('[ONLINE USERS] ❌ Erro ao escutar usuários online:', error);
        // Em caso de erro, manter contadores zerados
        setOnlineCount(0);
        setOnlineUsers([]);
      }
    );

    return () => {
      console.log('[ONLINE USERS] Desconectando listener...');
      unsubscribe();
    };
  }, []);

  return { onlineCount, onlineUsers };
}