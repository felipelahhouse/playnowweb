import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyDK-7qFQMr7L-VvtYSJEf0T_VQPq1e5SNo",
  authDomain: "planowemulator.firebaseapp.com",
  projectId: "planowemulator",
  storageBucket: "planowemulator.appspot.com",
  messagingSenderId: "870551990622",
  appId: "1:870551990622:web:dfd59d44fa2eb5eedb03f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Platform {
  name: string;
  folder: string;
  extensions: string[];
  displayName: string;
}

const platforms: Platform[] = [
  { name: 'gba', folder: 'public/roms/gba', extensions: ['.zip'], displayName: 'Game Boy Advance' },
  { name: 'gbc', folder: 'public/roms/gbc', extensions: ['.zip', '.gbc'], displayName: 'Game Boy Color' },
  { name: 'n64', folder: 'public/roms/n64', extensions: ['.zip'], displayName: 'Nintendo 64' },
  { name: 'snes', folder: 'public/roms/snes', extensions: ['.smc', '.sfc'], displayName: 'Super Nintendo' },
  { name: 'genesis', folder: 'public/roms/genesis', extensions: ['.zip'], displayName: 'Sega Genesis' }
];

function cleanGameTitle(filename: string): string {
  return filename
    .replace(/\.(zip|smc|sfc|gbc)$/i, '') // Remove extensão
    .replace(/\s*\([^)]*\)/g, '') // Remove (U), (E), etc
    .replace(/\s*\[[^\]]*\]/g, '') // Remove [!], [hI], etc
    .replace(/\s*-\s*$/, '') // Remove traço final
    .replace(/_/g, ' ') // Substitui _ por espaço
    .replace(/\s+/g, ' ') // Remove espaços duplos
    .trim();
}

async function gameExists(title: string, platform: string): Promise<boolean> {
  const q = query(
    collection(db, 'games'),
    where('title', '==', title),
    where('platform', '==', platform)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

async function importRoms() {
  console.log('🎮 Importando ROMs para o Firestore...\n');
  
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const platform of platforms) {
    console.log(`\n📦 Processando ${platform.displayName}...`);
    console.log('='.repeat(50));
    
    const folderPath = path.join(process.cwd(), platform.folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  Pasta não encontrada: ${folderPath}`);
      continue;
    }
    
    const files = fs.readdirSync(folderPath)
      .filter(file => platform.extensions.some(ext => file.toLowerCase().endsWith(ext)))
      .sort();
    
    console.log(`📁 Encontrados ${files.length} arquivos\n`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const filename of files) {
      const title = cleanGameTitle(filename);
      
      try {
        // Verifica se já existe
        const exists = await gameExists(title, platform.name);
        
        if (exists) {
          console.log(`⏭️  ${title} - já existe`);
          skipped++;
          totalSkipped++;
          continue;
        }
        
        // Determina o caminho correto
        const romPath = `/roms/${platform.name}/${filename}`;
        const coverPath = `/covers/${platform.name}/${filename.replace(/\.(zip|smc|sfc|gbc)$/i, '.png')}`;
        
        // Adiciona ao Firestore
        await addDoc(collection(db, 'games'), {
          title: title,
          platform: platform.name,
          console: platform.displayName,
          romPath: romPath,
          coverUrl: coverPath,
          coverPath: coverPath,
          description: `${title} para ${platform.displayName}`,
          genre: 'Action', // Placeholder
          year: 2000, // Placeholder
          players: 1, // Placeholder
          rating: 4.5,
          plays: 0,
          favorites: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ ${title} - adicionado`);
        added++;
        totalAdded++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ ${title} - ERRO: ${errorMsg}`);
        errors++;
        totalErrors++;
      }
    }
    
    console.log(`\n${platform.displayName}: ✅ ${added} adicionados | ⏭️  ${skipped} existentes | ❌ ${errors} erros`);
  }
  
  console.log('\n');
  console.log('='.repeat(50));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(50));
  console.log(`✅ Total de jogos adicionados: ${totalAdded}`);
  console.log(`⏭️  Total de jogos já existentes: ${totalSkipped}`);
  console.log(`❌ Total de erros: ${totalErrors}`);
  console.log('='.repeat(50));
  console.log('\n✨ Importação concluída!');
}

importRoms().catch(console.error);
