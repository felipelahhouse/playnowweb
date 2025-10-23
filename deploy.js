#!/usr/bin/env node

/**
 * 🚀 DEPLOY SCRIPT
 * Script completo de deploy com atualização automática de versão
 * Uso: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ========================================');
console.log('🚀 INICIANDO DEPLOY - PlayNow Emulator');
console.log('🚀 ========================================\n');

// 1. Atualiza version.json
console.log('📦 [1/5] Atualizando version.json...');
const timestamp = Date.now();
const buildDate = new Date().toISOString();
const versionData = {
  version: timestamp.toString(),
  buildDate: buildDate,
  timestamp: timestamp
};

const publicPath = path.join(__dirname, 'public', 'version.json');
fs.writeFileSync(publicPath, JSON.stringify(versionData, null, 2));
console.log('✅ Version atualizada:', versionData.version);
console.log('📅 Data:', versionData.buildDate);
console.log('');

// 2. Build do projeto
console.log('🔨 [2/5] Fazendo build do projeto...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}

// 3. Copia version.json para dist/
console.log('📋 [3/5] Copiando version.json para dist/...');
const distPath = path.join(__dirname, 'dist', 'version.json');
fs.writeFileSync(distPath, JSON.stringify(versionData, null, 2));
console.log('✅ version.json copiado para dist/\n');

// 4. Copia auto-reload.js para dist/
console.log('📋 [4/5] Copiando auto-reload.js para dist/...');
const autoReloadSrc = path.join(__dirname, 'public', 'auto-reload.js');
const autoReloadDest = path.join(__dirname, 'dist', 'auto-reload.js');
if (fs.existsSync(autoReloadSrc)) {
  fs.copyFileSync(autoReloadSrc, autoReloadDest);
  console.log('✅ auto-reload.js copiado para dist/\n');
}

// 5. Deploy no Firebase
console.log('🔥 [5/5] Fazendo deploy no Firebase...');
try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('\n✅ Deploy concluído com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  process.exit(1);
}

console.log('🎉 ========================================');
console.log('🎉 DEPLOY FINALIZADO COM SUCESSO!');
console.log('🎉 ========================================');
console.log('');
console.log('📦 Versão deployada:', versionData.version);
console.log('🌐 Site: https://playnowemulator.com');
console.log('🔄 Auto-reload ativo: Os usuários serão notificados automaticamente');
console.log('⏱️  Tempo de propagação: ~30 segundos');
console.log('');