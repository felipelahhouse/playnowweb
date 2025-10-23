#!/usr/bin/env node

/**
 * 🚀 DEPLOY SIMPLES - SEM FUNCTIONS
 * Deploy apenas de Hosting + Firestore Rules + Storage Rules
 * Uso: node deploy-simples.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ========================================');
console.log('🚀 DEPLOY SIMPLES - PlayNow Emulator');
console.log('🚀 (Hosting + Rules apenas)');
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

// 5. Deploy APENAS Hosting + Rules (SEM FUNCTIONS)
console.log('🔥 [5/5] Deploy no Firebase...');
console.log('📌 Componentes:');
console.log('   ✓ Hosting (site)');
console.log('   ✓ Firestore Rules');
console.log('   ✓ Storage Rules');
console.log('   ✗ Functions (DESABILITADO)');
console.log('');

try {
  // Deploy SEM functions para evitar erro do Eventarc
  console.log('🔥 Fazendo deploy...\n');
  execSync('firebase deploy --only hosting,firestore:rules,storage:rules', { stdio: 'inherit' });
  console.log('\n✅ Deploy concluído com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  console.error('\n⚠️  Se o erro persistir, tente:');
  console.error('   1. firebase deploy --only hosting');
  console.error('   2. firebase deploy --only firestore:rules');
  console.error('   3. firebase deploy --only storage:rules');
  process.exit(1);
}

console.log('🎉 ========================================');
console.log('🎉 DEPLOY FINALIZADO!');
console.log('🎉 ========================================');
console.log('');
console.log('📦 Versão deployada:', versionData.version);
console.log('🌐 Site: https://playnowemulator.com');
console.log('🔄 Auto-reload ativo: Os usuários serão notificados automaticamente');
console.log('⏱️  Tempo de propagação: ~30-60 segundos');
console.log('');
console.log('✅ Componentes deployados:');
console.log('   ✓ Hosting (site principal)');
console.log('   ✓ Firestore Rules (segurança do banco)');
console.log('   ✓ Storage Rules (segurança dos arquivos)');
console.log('');
console.log('📝 Nota: Functions foram DESABILITADAS para evitar erro do Eventarc.');
console.log('   O site funciona normalmente sem elas (multiplayer usa P2P).');
console.log('');
