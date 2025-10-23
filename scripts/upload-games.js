#!/usr/bin/env node

/**
 * 📤 UPLOAD DE JOGOS PARA FIREBASE STORAGE
 * 
 * Este script faz upload de todas as ROMs e Covers
 * da pasta public/ para o Firebase Storage
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
// IMPORTANTE: Você precisa baixar a chave de serviço do Firebase Console
// https://console.firebase.google.com/project/planowemulator/settings/serviceaccounts/adminsdk
// E salvar como 'firebase-admin-key.json' na raiz do projeto

try {
  const serviceAccount = require('../firebase-admin-key.json');
  
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'planowemulator.appspot.com'
  });
  
  console.log('✅ Firebase Admin inicializado!');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin.');
  console.error('📝 Você precisa baixar a chave de serviço:');
  console.error('   1. Acesse: https://console.firebase.google.com/project/planowemulator/settings/serviceaccounts/adminsdk');
  console.error('   2. Clique em "Gerar nova chave privada"');
  console.error('   3. Salve o arquivo como "firebase-admin-key.json" na raiz do projeto');
  process.exit(1);
}

const bucket = getStorage().bucket();

/**
 * Faz upload de um arquivo para o Storage
 */
async function uploadFile(localPath, remotePath) {
  try {
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        cacheControl: 'public, max-age=31536000', // 1 ano de cache
      }
    });
    
    const file = bucket.file(remotePath);
    const [metadata] = await file.getMetadata();
    const size = (metadata.size / 1024).toFixed(2);
    
    console.log(`✅ Upload: ${remotePath} (${size} KB)`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao fazer upload de ${remotePath}:`, error.message);
    return false;
  }
}

/**
 * Faz upload de todos os arquivos de uma pasta
 */
async function uploadDirectory(localDir, remoteDir, extensions = []) {
  const files = fs.readdirSync(localDir);
  let uploaded = 0;
  let errors = 0;
  
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);
    
    if (stat.isFile()) {
      // Verifica extensão se filtro foi especificado
      if (extensions.length > 0) {
        const ext = path.extname(file).toLowerCase();
        if (!extensions.includes(ext)) {
          continue;
        }
      }
      
      const remotePath = `${remoteDir}/${file}`;
      const success = await uploadFile(localPath, remotePath);
      
      if (success) {
        uploaded++;
      } else {
        errors++;
      }
    }
  }
  
  return { uploaded, errors };
}

/**
 * Script principal
 */
async function main() {
  console.log('🎮 UPLOAD DE JOGOS PARA FIREBASE STORAGE\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  
  // 1. Upload de ROMs
  console.log('📁 Fazendo upload de ROMs...');
  const romsDir = path.join(publicDir, 'roms');
  const romsResult = await uploadDirectory(
    romsDir, 
    'roms',
    ['.smc', '.sfc', '.zip', '.md', '.bin', '.gen', '.gba', '.gbc', '.gb', '.iso', '.n64', '.z64']
  );
  console.log(`   ✅ ${romsResult.uploaded} ROMs enviadas, ${romsResult.errors} erros\n`);
  
  // 2. Upload de Covers
  console.log('🖼️  Fazendo upload de Covers...');
  const coversDir = path.join(publicDir, 'covers');
  const coversResult = await uploadDirectory(
    coversDir,
    'covers',
    ['.jpg', '.jpeg', '.png', '.webp']
  );
  console.log(`   ✅ ${coversResult.uploaded} covers enviados, ${coversResult.errors} erros\n`);
  
  // Resumo
  console.log('═══════════════════════════════════════');
  console.log('📊 RESUMO DO UPLOAD');
  console.log('═══════════════════════════════════════');
  console.log(`ROMs:    ${romsResult.uploaded} arquivos`);
  console.log(`Covers:  ${coversResult.uploaded} arquivos`);
  console.log(`Total:   ${romsResult.uploaded + coversResult.uploaded} arquivos`);
  console.log(`Erros:   ${romsResult.errors + coversResult.errors}`);
  console.log('═══════════════════════════════════════\n');
  
  console.log('✅ Upload concluído!');
  console.log('🌐 Próximo passo: Acesse o site e clique em "Sincronizar Storage"');
  console.log('   URL: https://planowemulator.web.app\n');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
