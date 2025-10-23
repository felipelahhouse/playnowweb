import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gera timestamp único para esta versão
const version = Date.now().toString();
const buildDate = new Date().toISOString();

// Cria objeto de versão
const versionData = {
  version,
  buildDate,
  timestamp: Date.now()
};

// Caminho para o arquivo version.json no public
const publicPath = path.join(__dirname, '..', 'public', 'version.json');

// Escreve o arquivo
fs.writeFileSync(publicPath, JSON.stringify(versionData, null, 2));

console.log('✅ Version file generated:', versionData);
console.log('📁 Location:', publicPath);