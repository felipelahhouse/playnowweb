import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

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
const storage = getStorage(app);
const db = getFirestore(app);

// Normaliza nome do arquivo para comparação
function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/thumb$/i, '')
    .trim();
}

// Normaliza título do jogo para comparação
function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*-\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/gbc$/i, '')
    .replace(/gameboy(color)?/gi, '')
    .trim();
}

interface Game {
  id: string;
  title: string;
  platform?: string;
  console?: string;
  coverUrl?: string;
  [key: string]: unknown;
}

// Função para fazer match entre arquivo e jogo
function findMatchingGame(fileName: string, games: Game[]): Game | null {
  const normalizedFile = normalizeFileName(fileName);
  
  for (const game of games) {
    const normalizedTitle = normalizeGameTitle(game.title);
    
    // Match exato
    if (normalizedFile === normalizedTitle) {
      return game;
    }
    
    // Match parcial (arquivo contém título ou vice-versa)
    if (normalizedFile.includes(normalizedTitle) || normalizedTitle.includes(normalizedFile)) {
      return game;
    }
  }
  
  return null;
}

async function uploadGBCCovers() {
  console.log('🎮 Iniciando upload de capas Game Boy Color...\n');
  
  const coversDir = path.join(process.cwd(), 'GBC COVERS');
  
  if (!fs.existsSync(coversDir)) {
    console.error('❌ Pasta "GBC COVERS" não encontrada!');
    return;
  }
  
  // Lista todos os arquivos PNG
  const files = fs.readdirSync(coversDir)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  console.log(`📁 Encontrados ${files.length} arquivos PNG\n`);
  
  // Busca jogos GBC no Firestore
  console.log('🔍 Buscando jogos Game Boy Color no banco de dados...');
  const gamesSnapshot = await getDocs(collection(db, 'games'));
  const gbcGames: Game[] = gamesSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Game))
    .filter((game: Game) => 
      game.platform?.toLowerCase().includes('gbc') ||
      game.platform?.toLowerCase().includes('game boy color') ||
      game.console?.toLowerCase().includes('gbc') ||
      game.console?.toLowerCase().includes('game boy color')
    );
  
  console.log(`✅ Encontrados ${gbcGames.length} jogos GBC no banco\n`);
  
  let uploadedCount = 0;
  let matchedCount = 0;
  let skippedCount = 0;
  const unmatchedFiles: string[] = [];
  
  for (const fileName of files) {
    const filePath = path.join(coversDir, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Remove extensão e -thumb
    const cleanName = fileName
      .replace('.png', '')
      .replace(/-thumb$/i, '');
    
    console.log(`📄 Processando: ${cleanName}`);
    
    // Tenta encontrar jogo correspondente
    const matchedGame = findMatchingGame(cleanName, gbcGames);
    
    if (matchedGame) {
      console.log(`   ✓ Match encontrado: ${matchedGame.title}`);
      matchedCount++;
      
      // Verifica se já tem cover
      if (matchedGame.coverUrl && !matchedGame.coverUrl.includes('placeholder')) {
        console.log(`   ⏭️  Já possui cover, pulando...\n`);
        skippedCount++;
        continue;
      }
      
      try {
        // Upload para Storage
        const storageRef = ref(storage, `covers/gbc/${cleanName}.png`);
        await uploadBytes(storageRef, fileBuffer, {
          contentType: 'image/png',
          customMetadata: {
            game: matchedGame.title,
            platform: 'GBC',
            uploadedAt: new Date().toISOString()
          }
        });
        
        const downloadURL = await getDownloadURL(storageRef);
        
        // Atualiza Firestore
        await updateDoc(doc(db, 'games', matchedGame.id), {
          coverUrl: downloadURL,
          coverPath: `covers/gbc/${cleanName}.png`,
          updatedAt: new Date()
        });
        
        uploadedCount++;
        console.log(`   ✅ Upload completo! URL: ${downloadURL}\n`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`   ❌ Erro no upload: ${errorMessage}\n`);
      }
      
    } else {
      console.log(`   ⚠️  Nenhum jogo correspondente encontrado`);
      unmatchedFiles.push(fileName);
      
      // Upload mesmo sem match (para uso futuro)
      try {
        const storageRef = ref(storage, `covers/gbc/unmatched/${cleanName}.png`);
        await uploadBytes(storageRef, fileBuffer, {
          contentType: 'image/png',
          customMetadata: {
            originalName: fileName,
            status: 'unmatched',
            uploadedAt: new Date().toISOString()
          }
        });
        console.log(`   📦 Salvo em: covers/gbc/unmatched/\n`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`   ❌ Erro ao salvar: ${errorMessage}\n`);
      }
    }
  }
  
  // Resumo final
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESUMO DO UPLOAD');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Total de arquivos processados: ${files.length}`);
  console.log(`🎯 Jogos com match encontrado: ${matchedCount}`);
  console.log(`📤 Covers enviados com sucesso: ${uploadedCount}`);
  console.log(`⏭️  Covers já existentes (pulados): ${skippedCount}`);
  console.log(`⚠️  Arquivos sem match: ${unmatchedFiles.length}`);
  
  if (unmatchedFiles.length > 0) {
    console.log('\n📋 ARQUIVOS SEM MATCH (salvos em covers/gbc/unmatched/):');
    unmatchedFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  console.log('\n✨ Processo concluído!');
}

// Executa
uploadGBCCovers().catch(console.error);
