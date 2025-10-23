import { initializeApp } from 'firebase/app';
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
const db = getFirestore(app);

interface Game {
  id: string;
  title: string;
  platform?: string;
  console?: string;
  coverUrl?: string;
  [key: string]: unknown;
}

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

// Função para fazer match entre arquivo e jogo
function findMatchingFile(gameTitle: string, files: string[]): string | null {
  const normalizedTitle = normalizeGameTitle(gameTitle);
  
  for (const file of files) {
    const normalizedFile = normalizeFileName(file.replace('.png', ''));
    
    // Match exato
    if (normalizedFile === normalizedTitle) {
      return file;
    }
    
    // Match parcial
    if (normalizedFile.includes(normalizedTitle) || normalizedTitle.includes(normalizedFile)) {
      return file;
    }
  }
  
  return null;
}

async function updateGBCCovers() {
  console.log('🎮 Atualizando covers GBC para URLs locais...\n');
  
  const coversDir = path.join(process.cwd(), 'public', 'covers', 'gbc');
  
  if (!fs.existsSync(coversDir)) {
    console.error('❌ Pasta "public/covers/gbc" não encontrada!');
    return;
  }
  
  // Lista todos os arquivos PNG disponíveis
  const availableFiles = fs.readdirSync(coversDir)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  console.log(`📁 Encontrados ${availableFiles.length} arquivos PNG disponíveis\n`);
  
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
  
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  
  for (const game of gbcGames) {
    console.log(`🎮 Processando: ${game.title}`);
    
    // Tenta encontrar arquivo correspondente
    const matchedFile = findMatchingFile(game.title, availableFiles);
    
    if (matchedFile) {
      const cleanFileName = matchedFile.replace('.png', '').replace(/-thumb$/i, '');
      const localUrl = `/covers/gbc/${matchedFile}`;
      
      console.log(`   ✓ Match encontrado: ${matchedFile}`);
      
      // Verifica se já tem essa URL
      if (game.coverUrl === localUrl) {
        console.log(`   ⏭️  URL já está correta, pulando...\n`);
        skippedCount++;
        continue;
      }
      
      try {
        // Atualiza Firestore
        await updateDoc(doc(db, 'games', game.id), {
          coverUrl: localUrl,
          coverPath: `covers/gbc/${cleanFileName}.png`,
          updatedAt: new Date()
        });
        
        updatedCount++;
        console.log(`   ✅ Cover atualizado! URL: ${localUrl}\n`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`   ❌ Erro ao atualizar: ${errorMessage}\n`);
      }
      
    } else {
      console.log(`   ⚠️  Nenhum arquivo correspondente encontrado\n`);
      notFoundCount++;
    }
  }
  
  // Resumo final
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESUMO DA ATUALIZAÇÃO');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Total de jogos GBC processados: ${gbcGames.length}`);
  console.log(`📤 Covers atualizados com sucesso: ${updatedCount}`);
  console.log(`⏭️  Covers já corretos (pulados): ${skippedCount}`);
  console.log(`⚠️  Jogos sem cover encontrado: ${notFoundCount}`);
  console.log(`📁 Arquivos disponíveis: ${availableFiles.length}`);
  
  console.log('\n✨ Processo concluído!');
}

// Executa
updateGBCCovers().catch(console.error);
