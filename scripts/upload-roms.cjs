const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎮 UPLOAD DE JOGOS PARA FIREBASE STORAGE\n');

const romsDir = path.join(__dirname, '..', 'public', 'roms');
const coversDir = path.join(__dirname, '..', 'public', 'covers');

let uploadedRoms = 0;
let uploadedCovers = 0;
let errors = 0;

// Upload ROMs
console.log('📁 Fazendo upload de ROMs...');
const romFiles = fs.readdirSync(romsDir).filter(f => 
  f.endsWith('.smc') || f.endsWith('.sfc') || f.endsWith('.zip')
);

for (const file of romFiles) {
  const localPath = path.join(romsDir, file);
  try {
    console.log(`   Uploading: ${file}...`);
    execSync(`firebase storage:upload "${localPath}" roms/${file}`, { stdio: 'inherit' });
    uploadedRoms++;
    console.log('   ✅ Upload concluído\n');
  } catch (error) {
    console.error(`   ❌ Erro ao fazer upload de ${file}\n`);
    errors++;
  }
}

// Upload Covers  
console.log('\n🖼️  Fazendo upload de Covers...');
if (fs.existsSync(coversDir)) {
  const coverFiles = fs.readdirSync(coversDir).filter(f => 
    f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp')
  );

  for (const file of coverFiles) {
    const localPath = path.join(coversDir, file);
    try {
      console.log(`   Uploading: ${file}...`);
      execSync(`firebase storage:upload "${localPath}" covers/${file}`, { stdio: 'inherit' });
      uploadedCovers++;
      console.log('   ✅ Upload concluído\n');
    } catch (error) {
      console.error(`   ❌ Erro ao fazer upload de ${file}\n`);
      errors++;
    }
  }
}

// Resumo
console.log('\n═══════════════════════════════════════');
console.log('📊 RESUMO DO UPLOAD');
console.log('═══════════════════════════════════════');
console.log(`ROMs:    ${uploadedRoms} arquivos`);
console.log(`Covers:  ${uploadedCovers} arquivos`);
console.log(`Total:   ${uploadedRoms + uploadedCovers} arquivos`);
console.log(`Erros:   ${errors}`);
console.log('═══════════════════════════════════════\n');

console.log('✅ Upload concluído!');
console.log('🌐 Próximo passo: Acesse o site e clique em "Sincronizar Storage"');
console.log('   URL: https://planowemulator.web.app\n');
