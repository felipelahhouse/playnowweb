#!/usr/bin/env node

/**
 * 🔍 VERIFICAR DEPLOY
 * Verifica se todos os arquivos necessários estão prontos para deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ========================================');
console.log('🔍 VERIFICANDO ARQUIVOS PARA DEPLOY');
console.log('🔍 ========================================\n');

const checks = [
  {
    name: 'dist/index.html',
    path: path.join(__dirname, 'dist', 'index.html'),
    required: true
  },
  {
    name: 'dist/version.json',
    path: path.join(__dirname, 'dist', 'version.json'),
    required: true
  },
  {
    name: 'dist/auto-reload.js',
    path: path.join(__dirname, 'dist', 'auto-reload.js'),
    required: true
  },
  {
    name: 'public/version.json',
    path: path.join(__dirname, 'public', 'version.json'),
    required: true
  },
  {
    name: 'public/auto-reload.js',
    path: path.join(__dirname, 'public', 'auto-reload.js'),
    required: true
  },
  {
    name: 'index.html (com auto-reload)',
    path: path.join(__dirname, 'index.html'),
    required: true,
    checkContent: (content) => content.includes('auto-reload.js')
  }
];

let allOk = true;

for (const check of checks) {
  const exists = fs.existsSync(check.path);
  
  if (exists) {
    if (check.checkContent) {
      const content = fs.readFileSync(check.path, 'utf-8');
      if (check.checkContent(content)) {
        console.log('✅', check.name);
      } else {
        console.log('⚠️ ', check.name, '- arquivo existe mas conteúdo incorreto');
        allOk = false;
      }
    } else {
      console.log('✅', check.name);
      
      // Mostra versão se for version.json
      if (check.name.includes('version.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(check.path, 'utf-8'));
          console.log('   📦 Versão:', data.version);
          console.log('   📅 Data:', data.buildDate);
        } catch (e) {
          console.log('   ⚠️  Erro ao ler JSON');
        }
      }
    }
  } else {
    if (check.required) {
      console.log('❌', check.name, '- ARQUIVO NÃO ENCONTRADO');
      allOk = false;
    } else {
      console.log('⚠️ ', check.name, '- não encontrado (opcional)');
    }
  }
}

console.log('\n' + '='.repeat(50));

if (allOk) {
  console.log('✅ TUDO OK! Pronto para deploy!');
  console.log('\nPara fazer deploy, execute:');
  console.log('  npm run deploy');
  console.log('\nOu:');
  console.log('  firebase deploy --only hosting');
} else {
  console.log('❌ PROBLEMAS ENCONTRADOS!');
  console.log('\nExecute o build primeiro:');
  console.log('  npm run build');
  console.log('\nOu execute o deploy completo:');
  console.log('  npm run deploy');
  process.exit(1);
}

console.log('');