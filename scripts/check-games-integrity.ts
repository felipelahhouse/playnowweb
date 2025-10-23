import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDK-7qFQMr7L-VvtYSJEf0T_VQPq1e5SNo",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.appspot.com",
  messagingSenderId: "870551990622",
  appId: "1:870551990622:web:dfd59d44fa2eb5eedb03f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function checkGamesIntegrity() {
  console.log('🔍 Verificando integridade dos jogos...\n');
  
  // Busca todos os jogos do Firestore
  const gamesSnapshot = await getDocs(collection(db, 'games'));
  const games = gamesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Array<{
    id: string;
    title: string;
    romUrl?: string;
    platform?: string;
  }>;
  
  console.log(`📊 Total de jogos no Firestore: ${games.length}\n`);
  
  let romsOk = 0;
  let romsMissing = 0;
  let romsError = 0;
  const missingRoms: string[] = [];
  const errorRoms: { game: string; error: string }[] = [];
  
  for (const game of games) {
    const romUrl = game.romUrl;
    
    if (!romUrl) {
      console.log(`❌ ${game.title}: SEM ROM URL`);
      romsMissing++;
      missingRoms.push(game.title);
      continue;
    }
    
    try {
      // Se é um caminho do Storage
      if (romUrl.startsWith('roms/') || romUrl.startsWith('gs://')) {
        const cleanPath = romUrl.replace(/^gs:\/\/[^/]+\//, '');
        const romRef = ref(storage, cleanPath);
        
        try {
          await getDownloadURL(romRef);
          console.log(`✅ ${game.title}: ROM OK (${cleanPath})`);
          romsOk++;
        } catch (error) {
          const firebaseError = error as { code?: string; message?: string };
          if (firebaseError.code === 'storage/object-not-found') {
            console.log(`❌ ${game.title}: ROM NÃO ENCONTRADA (${cleanPath})`);
            romsMissing++;
            missingRoms.push(`${game.title} (${cleanPath})`);
          } else {
            console.log(`⚠️  ${game.title}: ERRO (${firebaseError.message || 'Erro desconhecido'})`);
            romsError++;
            errorRoms.push({ game: game.title, error: firebaseError.message || 'Erro desconhecido' });
          }
        }
      } else {
        // URL direta - testa com HEAD request
        const response = await fetch(romUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ ${game.title}: ROM OK (URL direta)`);
          romsOk++;
        } else {
          console.log(`❌ ${game.title}: ROM INACESSÍVEL (${response.status})`);
          romsMissing++;
          missingRoms.push(`${game.title} (${romUrl})`);
        }
      }
    } catch (error) {
      const err = error as Error;
      console.log(`⚠️  ${game.title}: ERRO (${err.message})`);
      romsError++;
      errorRoms.push({ game: game.title, error: err.message });
    }
  }
  
  // Resumo
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ ROMs OK: ${romsOk}`);
  console.log(`❌ ROMs Faltando: ${romsMissing}`);
  console.log(`⚠️  Erros de verificação: ${romsError}`);
  console.log(`📈 Taxa de sucesso: ${((romsOk / games.length) * 100).toFixed(1)}%`);
  
  if (missingRoms.length > 0) {
    console.log('\n📋 ROMS FALTANDO:');
    missingRoms.forEach(rom => console.log(`   - ${rom}`));
  }
  
  if (errorRoms.length > 0) {
    console.log('\n⚠️  ERROS:');
    errorRoms.forEach(({ game, error }) => console.log(`   - ${game}: ${error}`));
  }
  
  // Lista ROMs disponíveis no Storage
  console.log('\n📁 Verificando ROMs no Storage...');
  const romsRef = ref(storage, 'roms');
  const romsList = await listAll(romsRef);
  
  console.log(`\n✅ Total de ROMs no Storage raiz: ${romsList.items.length}`);
  
  // Lista pastas
  if (romsList.prefixes.length > 0) {
    console.log(`📂 Pastas encontradas: ${romsList.prefixes.length}`);
    for (const folder of romsList.prefixes) {
      const folderContents = await listAll(folder);
      console.log(`   - ${folder.name}: ${folderContents.items.length} arquivos`);
    }
  }
}

// Executa
checkGamesIntegrity().catch(console.error);
