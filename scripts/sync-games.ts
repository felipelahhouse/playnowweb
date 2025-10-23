// 🔧 ADMIN TOOLS - Script para gerenciar jogos do Firebase Storage
// Execute: npm run admin:sync-games

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { syncGamesToFirestore, listGamesFromStorage } from '../src/lib/gameStorage';

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDDH54AKiI4iGwujCT6Jf1aDL_0V-ubZMQ",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "881925952635",
  appId: "1:881925952635:web:4eee2c2e09f36ee8f33feb"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

console.log('🔥 Firebase Admin Tools');
console.log('📦 Storage:', storage.app.options.storageBucket);
console.log('🗃️  Firestore:', db.app.options.projectId);
console.log('');

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list': {
      console.log('📋 Listando jogos do Storage...\n');
      const games = await listGamesFromStorage();
      console.table(games.map(g => ({
        Nome: g.name,
        Plataforma: g.platform,
        Tamanho: `${(g.size / 1024).toFixed(0)} KB`,
        'Última modificação': g.lastModified.toLocaleDateString()
      })));
      break;
    }

    case 'sync': {
      console.log('🔄 Sincronizando Storage → Firestore...\n');
      const result = await syncGamesToFirestore();
      console.log('\n✅ Sincronização concluída!');
      console.log(`   Sucessos: ${result.success}`);
      console.log(`   Erros: ${result.errors}`);
      break;
    }

    default:
      console.log('Comandos disponíveis:');
      console.log('  npm run admin:sync-games list  - Lista jogos do Storage');
      console.log('  npm run admin:sync-games sync  - Sincroniza Storage → Firestore');
      break;
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
