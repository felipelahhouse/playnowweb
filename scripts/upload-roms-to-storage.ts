import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, listAll } from 'firebase/storage';
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

// Mapeamento de pastas locais para plataformas no Storage
const FOLDER_MAPPING = {
  'GBA': 'gba',
  'GBC': 'gbc',
  'snes roms': 'snes',
  'MEGADRIVE': 'mega drive',
  'N64': 'n64'
};

interface UploadStats {
  platform: string;
  total: number;
  uploaded: number;
  skipped: number;
  failed: number;
  errors: string[];
}

async function getExistingFiles(platform: string): Promise<Set<string>> {
  try {
    const folderRef = ref(storage, `roms/${platform}`);
    const result = await listAll(folderRef);
    return new Set(result.items.map(item => item.name));
  } catch {
    console.log(`📁 Pasta roms/${platform} não existe ainda, será criada.`);
    return new Set();
  }
}

async function uploadFile(localPath: string, storagePath: string): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, fileBuffer, {
      contentType: localPath.endsWith('.zip') ? 'application/zip' : 
                   localPath.endsWith('.smc') ? 'application/octet-stream' :
                   localPath.endsWith('.sfc') ? 'application/octet-stream' :
                   localPath.endsWith('.gbc') ? 'application/octet-stream' :
                   'application/octet-stream'
    });
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erro ao fazer upload: ${error}`);
    return false;
  }
}

async function uploadPlatformRoms(
  localFolder: string,
  platform: string,
  stats: UploadStats
): Promise<void> {
  console.log(`\n🎮 Processando ${platform.toUpperCase()}...`);
  console.log(`📂 Pasta local: ${localFolder}`);
  
  if (!fs.existsSync(localFolder)) {
    console.log(`   ⚠️  Pasta não encontrada, pulando...`);
    return;
  }
  
  // Lista arquivos existentes no Storage
  const existingFiles = await getExistingFiles(platform);
  console.log(`   📊 ${existingFiles.size} arquivos já existem no Storage`);
  
  // Lista todos os arquivos da pasta local
  const files = fs.readdirSync(localFolder).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.zip' || ext === '.smc' || ext === '.sfc' || ext === '.gbc';
  });
  
  stats.total = files.length;
  console.log(`   📦 ${files.length} ROMs encontradas localmente\n`);
  
  // Upload cada arquivo
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = path.join(localFolder, file);
    const storagePath = `roms/${platform}/${file}`;
    
    // Verifica se já existe
    if (existingFiles.has(file)) {
      console.log(`   ⏭️  [${i + 1}/${files.length}] ${file} (já existe)`);
      stats.skipped++;
      continue;
    }
    
    // Faz upload
    process.stdout.write(`   ⬆️  [${i + 1}/${files.length}] Enviando ${file}...`);
    const success = await uploadFile(localPath, storagePath);
    
    if (success) {
      process.stdout.write(` ✅\n`);
      stats.uploaded++;
    } else {
      process.stdout.write(` ❌\n`);
      stats.failed++;
      stats.errors.push(`${file}: Falha no upload`);
    }
    
    // Pequeno delay para não sobrecarregar
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

async function main() {
  console.log('🚀 UPLOAD DE ROMS PARA FIREBASE STORAGE');
  console.log('═══════════════════════════════════════════════════\n');
  
  const baseDir = path.join(process.cwd());
  const allStats: UploadStats[] = [];
  
  // Processa cada plataforma
  for (const [localFolder, platform] of Object.entries(FOLDER_MAPPING)) {
    const stats: UploadStats = {
      platform,
      total: 0,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    const folderPath = path.join(baseDir, localFolder);
    await uploadPlatformRoms(folderPath, platform, stats);
    allStats.push(stats);
  }
  
  // Resumo final
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMO FINAL DO UPLOAD');
  console.log('═══════════════════════════════════════════════════\n');
  
  let totalFiles = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  allStats.forEach(stats => {
    if (stats.total > 0) {
      console.log(`🎮 ${stats.platform.toUpperCase()}:`);
      console.log(`   📦 Total: ${stats.total}`);
      console.log(`   ✅ Enviados: ${stats.uploaded}`);
      console.log(`   ⏭️  Pulados: ${stats.skipped}`);
      console.log(`   ❌ Falhas: ${stats.failed}`);
      console.log('');
      
      totalFiles += stats.total;
      totalUploaded += stats.uploaded;
      totalSkipped += stats.skipped;
      totalFailed += stats.failed;
    }
  });
  
  console.log('───────────────────────────────────────────────────');
  console.log(`📊 TOTAL GERAL:`);
  console.log(`   📦 Arquivos processados: ${totalFiles}`);
  console.log(`   ✅ Novos uploads: ${totalUploaded}`);
  console.log(`   ⏭️  Já existiam: ${totalSkipped}`);
  console.log(`   ❌ Falhas: ${totalFailed}`);
  console.log(`   📈 Taxa de sucesso: ${((totalUploaded / (totalUploaded + totalFailed)) * 100).toFixed(1)}%`);
  
  // Mostra erros se houver
  const allErrors = allStats.flatMap(s => s.errors);
  if (allErrors.length > 0) {
    console.log('\n⚠️  ERROS ENCONTRADOS:');
    allErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n✨ Upload concluído!');
}

main().catch(console.error);
