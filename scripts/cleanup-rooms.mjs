/**
 * 🧹 Script para limpar salas duplicadas do Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanupRooms() {
  try {
    console.log('🔍 Buscando salas no Firestore...\n');
    
    const snapshot = await db.collection('multiplayer_sessions').get();
    
    console.log(`📊 Total de salas encontradas: ${snapshot.size}\n`);
    
    if (snapshot.empty) {
      console.log('✅ Nenhuma sala para limpar!');
      return;
    }

    // Listar todas as salas
    const rooms = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      rooms.push({
        id: doc.id,
        name: data.sessionName || 'N/A',
        host: data.hostUserId || data.hostUsername || 'N/A',
        created: data.createdAt ? data.createdAt.toDate() : null,
        players: data.currentPlayers || 0
      });
    });

    // Ordenar por data de criação
    rooms.sort((a, b) => {
      if (!a.created) return 1;
      if (!b.created) return -1;
      return b.created - a.created;
    });

    // Exibir salas
    console.log('📋 SALAS EXISTENTES:\n');
    rooms.forEach((room, index) => {
      console.log(`${index + 1}. ID: ${room.id}`);
      console.log(`   Nome: ${room.name}`);
      console.log(`   Host: ${room.host}`);
      console.log(`   Players: ${room.players}`);
      console.log(`   Criada: ${room.created ? room.created.toLocaleString('pt-BR') : 'Desconhecido'}`);
      console.log('');
    });

    // Perguntar se quer deletar TODAS as salas
    console.log('⚠️  ATENÇÃO: Este script vai deletar TODAS as salas!');
    console.log('🗑️  Deletando todas as salas em 3 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Deletar todas as salas
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('✅ Todas as salas foram deletadas com sucesso!');
    console.log(`🧹 ${snapshot.size} salas removidas do Firestore\n`);

  } catch (error) {
    console.error('❌ Erro ao limpar salas:', error);
  }

  process.exit(0);
}

// Executar
cleanupRooms();
