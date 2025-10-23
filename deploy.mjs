#!/usr/bin/env node

/**
 * 🚀 DEPLOY SCRIPT COMPLETO
 * Script completo de deploy com atualização automática de versão
 * Faz deploy de TUDO: Hosting + Functions + Firestore + Storage
 * Uso: node deploy.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ========================================');
console.log('🚀 INICIANDO DEPLOY COMPLETO - PlayNow Emulator');
console.log('🚀 ========================================\n');

// 1. Atualiza version.json
console.log('📦 [1/7] Atualizando version.json...');
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
console.log('🔨 [2/7] Fazendo build do projeto...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build concluído com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}

// 3. Copia version.json para dist/
console.log('📋 [3/7] Copiando version.json para dist/...');
const distPath = path.join(__dirname, 'dist', 'version.json');
fs.writeFileSync(distPath, JSON.stringify(versionData, null, 2));
console.log('✅ version.json copiado para dist/\n');

// 4. Copia auto-reload.js para dist/
console.log('📋 [4/7] Copiando auto-reload.js para dist/...');
const autoReloadSrc = path.join(__dirname, 'public', 'auto-reload.js');
const autoReloadDest = path.join(__dirname, 'dist', 'auto-reload.js');
if (fs.existsSync(autoReloadSrc)) {
  fs.copyFileSync(autoReloadSrc, autoReloadDest);
  console.log('✅ auto-reload.js copiado para dist/\n');
}

// 5. Instala dependências das Functions
console.log('📦 [5/7] Instalando dependências das Functions...');
try {
  execSync('npm install', { 
    cwd: path.join(__dirname, 'functions'),
    stdio: 'inherit' 
  });
  console.log('✅ Dependências das Functions instaladas!\n');
} catch (error) {
  console.error('⚠️  Aviso: Erro ao instalar dependências das Functions:', error.message);
  console.log('Continuando com o deploy...\n');
}

// 6. Deploy Firestore Rules
console.log('🔥 [6/7] Fazendo deploy das Firestore Rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore Rules deployadas!\n');
} catch (error) {
  console.error('⚠️  Aviso: Erro no deploy das Firestore Rules:', error.message);
  console.log('Continuando com o deploy...\n');
}

// 7. Deploy COMPLETO no Firebase
console.log('🔥 [7/7] Fazendo deploy COMPLETO no Firebase...');
console.log('📌 Isso inclui:');
console.log('   - Hosting (site)');
console.log('   - Functions (Node.js)');
console.log('   - Functions Python (multiplayer)');
console.log('   - Storage Rules');
console.log('   - Firestore Rules');
console.log('');

let deploySuccess = false;
let deployedComponents = [];

try {
  // Tenta deploy de tudo de uma vez
  console.log('🔥 Tentando deploy completo...\n');
  execSync('firebase deploy', { stdio: 'inherit' });
  console.log('\n✅ Deploy COMPLETO concluído com sucesso!\n');
  deploySuccess = true;
  deployedComponents = ['Hosting', 'Functions Node.js', 'Functions Python', 'Storage Rules', 'Firestore Rules'];
} catch (error) {
  console.error('⚠️  Deploy completo falhou, tentando deploy individual...\n');
  
  // Tenta deploy individual se falhar
  // 1. Hosting (sempre funciona)
  try {
    console.log('🔥 [1/4] Deploy do Hosting...');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    console.log('✅ Hosting deployado com sucesso!\n');
    deployedComponents.push('Hosting');
  } catch (hostingError) {
    console.error('❌ Erro no deploy do Hosting:', hostingError.message);
  }
  
  // 2. Storage Rules
  try {
    console.log('🔥 [2/4] Deploy das Storage Rules...');
    execSync('firebase deploy --only storage', { stdio: 'inherit' });
    console.log('✅ Storage Rules deployadas com sucesso!\n');
    deployedComponents.push('Storage Rules');
  } catch (storageError) {
    console.error('⚠️  Erro no deploy das Storage Rules:', storageError.message);
  }
  
  // 3. Functions Node.js
  try {
    console.log('🔥 [3/4] Deploy das Functions Node.js...');
    execSync('firebase deploy --only functions:socketio', { stdio: 'inherit' });
    console.log('✅ Functions Node.js deployadas com sucesso!\n');
    deployedComponents.push('Functions Node.js');
  } catch (functionsError) {
    console.error('⚠️  Erro no deploy das Functions Node.js:', functionsError.message);
    console.log('Continuando...\n');
  }
  
  // 4. Functions Python (pode falhar, não é crítico)
  try {
    console.log('🔥 [4/4] Deploy das Functions Python (multiplayer)...');
    execSync('firebase deploy --only functions:python-multiplayer', { stdio: 'inherit' });
    console.log('✅ Functions Python deployadas com sucesso!\n');
    deployedComponents.push('Functions Python');
  } catch (pythonError) {
    console.error('⚠️  Erro no deploy das Functions Python:', pythonError.message);
    console.log('⚠️  O servidor multiplayer Python não foi deployado.');
    console.log('⚠️  Você pode usar o servidor Node.js Socket.IO como alternativa.\n');
  }
  
  if (deployedComponents.length > 0) {
    deploySuccess = true;
  }
}

if (!deploySuccess) {
  console.error('\n❌ Nenhum componente foi deployado com sucesso!');
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
deployedComponents.forEach(component => {
  console.log(`   ✓ ${component}`);
});

if (!deployedComponents.includes('Functions Python')) {
  console.log('');
  console.log('⚠️  Nota: Functions Python não foram deployadas.');
  console.log('   O servidor multiplayer Node.js Socket.IO está disponível como alternativa.');
}

console.log('');