// 🚀 SINCRONIZAÇÃO AUTOMÁTICA DE JOGOS
// Este script sincroniza jogos do Firebase Storage para Firestore

import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBh9pRJ2y-kHhtlXSEY48Xj8e0LYLf1j5A",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.firebasestorage.app",
  messagingSenderId: "1093025619337",
  appId: "1:1093025619337:web:95cc8cc20dac3d0ea92c55",
  measurementId: "G-7SYW93QGGN"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

console.log('🎮 SINCRONIZAÇÃO DE JOGOS DO STORAGE → FIRESTORE\n');

async function syncGames() {
  try {
    // 1. Listar jogos em roms/snes/
    console.log('📁 Buscando jogos em roms/snes/...');
    const romsRef = ref(storage, 'roms/snes');
    const result = await listAll(romsRef);
    
    console.log(`✅ Encontrados ${result.items.length} arquivos!\n`);
    
    let synced = 0;
    let errors = 0;
    
    // 2. Para cada jogo
    for (const itemRef of result.items) {
      try {
        const fileName = itemRef.name;
        console.log(`🎮 Processando: ${fileName}`);
        
        // Obter URL e metadados
        const [url, metadata] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef)
        ]);
        
        // Nome do jogo (sem extensão)
        const gameName = fileName.replace(/\.(smc|sfc|zip)$/i, '');
        const gameId = gameName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // Buscar cover
        let coverUrl = null;
        try {
          const coversRef = ref(storage, 'covers');
          const coversResult = await listAll(coversRef);
          
          const normalizedName = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          for (const coverItem of coversResult.items) {
            const coverName = coverItem.name.toLowerCase()
              .replace(/\.(jpg|jpeg|png|webp)$/i, '')
              .replace(/[^a-z0-9]/g, '');
            
            if (coverName.includes(normalizedName) || normalizedName.includes(coverName)) {
              coverUrl = await getDownloadURL(coverItem);
              console.log(`   🖼️  Cover encontrado: ${coverItem.name}`);
              break;
            }
          }
        } catch (e) {
          console.log('   ⚠️  Cover não encontrado');
        }
        
        // Criar documento no Firestore
        const gameData = {
          title: gameName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: `Jogo de Super Nintendo`,
          cover: coverUrl,
          coverUrl: coverUrl,
          romUrl: url,
          platform: 'snes',
          playCount: 0,
          multiplayerSupport: false,
          genre: 'Action',
          year: null,
          players: 1,
          rating: null,
          publisher: null,
          createdAt: new Date().toISOString()
        };
        
        const gameRef = doc(db, 'games', gameId);
        await setDoc(gameRef, gameData, { merge: true });
        
        console.log(`   ✅ Sincronizado! (${(metadata.size / 1024).toFixed(0)} KB)\n`);
        synced++;
        
      } catch (error) {
        console.error(`   ❌ Erro: ${error.message}\n`);
        errors++;
      }
    }
    
    // Resumo
    console.log('\n═══════════════════════════════════════');
    console.log('📊 SINCRONIZAÇÃO CONCLUÍDA');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Sincronizados: ${synced} jogos`);
    console.log(`❌ Erros: ${errors}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('🌐 Acesse o site: https://planowemulator.web.app');
    console.log('🎮 Os jogos devem aparecer na Biblioteca de Jogos!\n');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

// Executar
syncGames();
