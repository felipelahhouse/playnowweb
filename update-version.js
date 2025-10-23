#!/usr/bin/env node

/**
 * 🔄 UPDATE VERSION
 * Atualiza o version.json antes do deploy
 * Uso: node update-version.js
 */

const fs = require('fs');
const path = require('path');

const timestamp = Date.now();
const buildDate = new Date().toISOString();

const versionData = {
  version: timestamp.toString(),
  buildDate: buildDate,
  timestamp: timestamp
};

// Atualiza version.json no public/
const publicPath = path.join(__dirname, 'public', 'version.json');
fs.writeFileSync(publicPath, JSON.stringify(versionData, null, 2));
console.log('✅ version.json atualizado em public/');
console.log('📦 Versão:', versionData.version);
console.log('📅 Data:', versionData.buildDate);

// Atualiza version.json no dist/ (se existir)
const distPath = path.join(__dirname, 'dist', 'version.json');
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.writeFileSync(distPath, JSON.stringify(versionData, null, 2));
  console.log('✅ version.json atualizado em dist/');
}

console.log('\n🚀 Pronto para deploy!');