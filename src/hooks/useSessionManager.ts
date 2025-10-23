import { useEffect, useRef } from 'react';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  onSnapshot,
  writeBatch,
  collection,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseSessionManagerOptions {
  sessionId: string;
  userId: string;
  isHost: boolean;
  onSessionClosed?: () => void;
}

export const useSessionManager = ({
  sessionId,
  userId,
  isHost,
  onSessionClosed
}: UseSessionManagerOptions) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupDoneRef = useRef(false);

  // Função para promover novo host
  const promoteNewHost = async () => {
    try {
      const playersRef = collection(db, 'game_sessions', sessionId, 'players');
      const playersSnapshot = await getDocs(playersRef);
      
      if (playersSnapshot.empty) {
        // Sem jogadores, fechar sala
        await closeSession();
        return;
      }

      // Encontrar o jogador que entrou primeiro (menor playerNumber)
      let newHostId: string | null = null;
      let lowestPlayerNumber = Infinity;
      
      playersSnapshot.forEach((playerDoc) => {
        const playerData = playerDoc.data();
        const playerNum = playerData.playerNumber || 999;
        if (playerNum < lowestPlayerNumber) {
          lowestPlayerNumber = playerNum;
          newHostId = playerDoc.id;
        }
      });

      if (newHostId) {
        // Atualizar sessão com novo host
        const sessionRef = doc(db, 'game_sessions', sessionId);
        await updateDoc(sessionRef, {
          host_user_id: newHostId,
          hostUserId: newHostId,
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Novo host promovido: ${newHostId}`);
      } else {
        await closeSession();
      }
    } catch (error) {
      console.error('❌ Erro ao promover novo host:', error);
      await closeSession();
    }
  };

  // Função para fechar a sessão
  const closeSession = async () => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    try {
      console.log('🗑️ Fechando sessão:', sessionId);
      
      const batch = writeBatch(db);
      const sessionRef = doc(db, 'game_sessions', sessionId);

      // Marcar sessão como fechada
      batch.update(sessionRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Deletar todos os jogadores
      const playersRef = collection(db, 'game_sessions', sessionId, 'players');
      const playersSnapshot = await getDocs(playersRef);
      playersSnapshot.forEach((playerDoc) => {
        batch.delete(playerDoc.ref);
      });

      // Deletar presença
      const presenceRef = collection(db, 'game_sessions', sessionId, 'presence');
      const presenceSnapshot = await getDocs(presenceRef);
      presenceSnapshot.forEach((presenceDoc) => {
        batch.delete(presenceDoc.ref);
      });

      await batch.commit();

      // Depois de 5 segundos, deletar a sessão completamente
      setTimeout(async () => {
        try {
          await deleteDoc(sessionRef);
          console.log('✅ Sessão deletada completamente');
        } catch (error) {
          console.error('❌ Erro ao deletar sessão:', error);
        }
      }, 5000);

      if (onSessionClosed) {
        onSessionClosed();
      }
    } catch (error) {
      console.error('❌ Erro ao fechar sessão:', error);
    }
  };

  // Função para sair da sessão
  const leaveSession = async () => {
    try {
      console.log(`👋 Jogador ${userId} saindo da sessão ${sessionId}`);

      // Remover jogador
      const playerRef = doc(db, 'game_sessions', sessionId, 'players', userId);
      await deleteDoc(playerRef);

      // Remover presença
      const presenceRef = doc(db, 'game_sessions', sessionId, 'presence', userId);
      await deleteDoc(presenceRef);

      // Atualizar contador de jogadores na sessão
      const sessionRef = doc(db, 'game_sessions', sessionId);
      await updateDoc(sessionRef, {
        currentPlayers: Math.max(0, (await getDocs(collection(db, 'game_sessions', sessionId, 'players'))).size - 1),
        updatedAt: serverTimestamp()
      });

      if (isHost) {
        // Se era host, promover novo ou fechar
        await promoteNewHost();
      }
    } catch (error) {
      console.error('❌ Erro ao sair da sessão:', error);
    }
  };

  // Heartbeat para manter presença ativa
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const presenceRef = doc(db, 'game_sessions', sessionId, 'presence', userId);
        await setDoc(presenceRef, {
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('❌ Erro no heartbeat:', error);
      }
    }, 10000); // A cada 10 segundos
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Monitorar se o host saiu
  useEffect(() => {
    if (isHost) return; // Host não precisa monitorar a si mesmo

    const sessionRef = doc(db, 'game_sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Sessão foi deletada
        if (onSessionClosed) {
          onSessionClosed();
        }
        return;
      }

      const data = snapshot.data();
      const currentHostId = data.host_user_id || data.hostUserId;

      // Verificar se o host mudou
      if (currentHostId && currentHostId !== userId) {
        // Host ainda existe e é outra pessoa
        return;
      }

      // Se status está fechado
      if (data.status === 'closed') {
        if (onSessionClosed) {
          onSessionClosed();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, userId, isHost, onSessionClosed]);

  // Cleanup ao desmontar
  useEffect(() => {
    startHeartbeat();

    return () => {
      stopHeartbeat();
      leaveSession();
    };
  }, [sessionId, userId]);

  return {
    closeSession,
    leaveSession,
    promoteNewHost
  };
};
