#!/usr/bin/env tsx
/**
 * Script para limpar salas multiplayer abertas/bugadas
 * 
 * Uso: npx tsx scripts/cleanup-sessions.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Configuração Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyC7VsOJ-Ct4Lc9wUBQHs8F2mjvRJZEzJDo",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "1066145265849",
  appId: "1:1066145265849:web:80e8e58ecaa1e0f8f0a4a4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupSessions() {
  console.log('🧹 Iniciando limpeza de sessões...\n');

  try {
    const sessionsRef = collection(db, 'game_sessions');
    
    // Buscar todas as sessões
    const allSessionsSnapshot = await getDocs(sessionsRef);
    console.log(`📊 Total de sessões encontradas: ${allSessionsSnapshot.size}\n`);

    let closedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;

    for (const sessionDoc of allSessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      const sessionId = sessionDoc.id;
      
      console.log(`\n🔍 Analisando sessão: ${sessionId}`);
      console.log(`   Nome: ${sessionData.sessionName || 'Sem nome'}`);
      console.log(`   Status: ${sessionData.status || 'desconhecido'}`);
      console.log(`   Host: ${sessionData.host_user_id || sessionData.hostUserId || 'desconhecido'}`);
      console.log(`   Jogadores: ${sessionData.currentPlayers || 0}/${sessionData.maxPlayers || 4}`);

      try {
        // Critérios para fechar/deletar sessão:
        // 1. Status já está 'closed'
        // 2. Sessão com 0 jogadores
        // 3. Sessão criada há mais de 24 horas e ainda 'waiting'
        
        const createdAt = sessionData.createdAt;
        let shouldDelete = false;
        let shouldClose = false;

        // Verificar se já está fechada
        if (sessionData.status === 'closed') {
          shouldDelete = true;
          console.log('   ❌ Sessão já fechada - deletando');
        }
        // Verificar jogadores
        else if (sessionData.currentPlayers === 0) {
          shouldClose = true;
          console.log('   ⚠️ Sessão sem jogadores - fechando');
        }
        // Verificar idade da sessão
        else if (createdAt) {
          const createdDate = createdAt instanceof Timestamp 
            ? createdAt.toDate() 
            : new Date(createdAt);
          const ageHours = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
          
          if (ageHours > 24 && sessionData.status === 'waiting') {
            shouldClose = true;
            console.log(`   ⏰ Sessão antiga (${ageHours.toFixed(1)}h) - fechando`);
          }
        }

        if (shouldDelete) {
          // Deletar subcoleções primeiro
          const batch = writeBatch(db);
          
          // Deletar players
          const playersSnapshot = await getDocs(collection(db, 'game_sessions', sessionId, 'players'));
          playersSnapshot.forEach(playerDoc => {
            batch.delete(playerDoc.ref);
          });

          // Deletar presence
          const presenceSnapshot = await getDocs(collection(db, 'game_sessions', sessionId, 'presence'));
          presenceSnapshot.forEach(presenceDoc => {
            batch.delete(presenceDoc.ref);
          });

          // Deletar game_inputs
          const inputsSnapshot = await getDocs(collection(db, 'game_sessions', sessionId, 'game_inputs'));
          inputsSnapshot.forEach(inputDoc => {
            batch.delete(inputDoc.ref);
          });

          // Deletar game_sync
          const syncSnapshot = await getDocs(collection(db, 'game_sessions', sessionId, 'game_sync'));
          syncSnapshot.forEach(syncDoc => {
            batch.delete(syncDoc.ref);
          });

          await batch.commit();

          // Deletar sessão principal
          await deleteDoc(doc(db, 'game_sessions', sessionId));
          deletedCount++;
          console.log('   ✅ Sessão deletada completamente');
        }
        else if (shouldClose) {
          // Apenas fechar sessão
          await updateDoc(doc(db, 'game_sessions', sessionId), {
            status: 'closed',
            closedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          closedCount++;
          console.log('   ✅ Sessão marcada como fechada');
        }
        else {
          console.log('   ✓ Sessão ativa - mantendo');
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Erro ao processar sessão: ${error}`);
      }
    }

    console.log('\n\n📊 RESUMO DA LIMPEZA:');
    console.log(`   ✅ Sessões fechadas: ${closedCount}`);
    console.log(`   🗑️ Sessões deletadas: ${deletedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📈 Total processadas: ${allSessionsSnapshot.size}`);
    console.log('\n✨ Limpeza concluída!\n');

  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  }
}

// Executar
cleanupSessions()
  .then(() => {
    console.log('👍 Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
