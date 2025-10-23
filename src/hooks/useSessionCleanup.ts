import { useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook para limpar automaticamente salas inativas
 * Executa a cada 5 minutos
 */
export const useSessionCleanup = () => {
  useEffect(() => {
    const cleanupInactiveSessions = async () => {
      try {
        const sessionsRef = collection(db, 'game_sessions');
        
        // Buscar salas em waiting há mais de 1 hora
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const waitingQuery = query(
          sessionsRef,
          where('status', '==', 'waiting')
        );

        const snapshot = await getDocs(waitingQuery);
        
        let closedCount = 0;

        for (const sessionDoc of snapshot.docs) {
          const data = sessionDoc.data();
          const createdAt = data.createdAt;

          if (createdAt) {
            const createdDate = createdAt instanceof Timestamp 
              ? createdAt.toDate() 
              : new Date(createdAt);

            // Fechar salas criadas há mais de 1 hora
            if (createdDate < oneHourAgo) {
              await updateDoc(doc(db, 'game_sessions', sessionDoc.id), {
                status: 'closed',
                closedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              closedCount++;
              console.log(`🧹 Sala inativa fechada: ${sessionDoc.id}`);
            }
          }

          // Fechar salas sem jogadores
          if (data.currentPlayers === 0) {
            await updateDoc(doc(db, 'game_sessions', sessionDoc.id), {
              status: 'closed',
              closedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            closedCount++;
            console.log(`🧹 Sala vazia fechada: ${sessionDoc.id}`);
          }
        }

        if (closedCount > 0) {
          console.log(`✅ Limpeza automática: ${closedCount} salas fechadas`);
        }
      } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
      }
    };

    // Executar imediatamente
    cleanupInactiveSessions();

    // Executar a cada 5 minutos
    const interval = setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
};
