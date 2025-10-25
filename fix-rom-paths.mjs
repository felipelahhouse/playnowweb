#!/usr/bin/env node
/**
 * 🔧 Fix ROM Paths Script
 * Verifica e corrige os caminhos dos ROMs no banco de dados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DB_PATH = path.join(__dirname, 'public', 'games-database.json');
const ROMS_BASE_PATH = path.join(__dirname, 'public', 'roms');

console.log('🔧 Verificando e corrigindo paths de ROMs...\n');

// Lê banco de dados
const gamesDb = JSON.parse(fs.readFileSync(GAMES_DB_PATH, 'utf8'));
console.log(`📖 Banco de dados carregado: ${gamesDb.games.length} jogos\n`);

let fixedCount = 0;
let missingCount = 0;
const missingGames = [];

// Verifica cada jogo
gamesDb.games.forEach((game, index) => {
    const romPath = game.romUrl;
    
    // Converte para caminho local
    let localPath = romPath;
    if (romPath.startsWith('/')) {
        localPath = romPath.substring(1); // Remove / inicial
    }
    
    const fullPath = path.join(ROMS_BASE_PATH, localPath.replace(/^roms\//, ''));
    
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ ROM não encontrada: ${game.title}`);
        console.log(`   Caminho esperado: ${fullPath}`);
        console.log(`   romUrl no DB: ${romPath}\n`);
        
        missingCount++;
        missingGames.push({
            title: game.title,
            platform: game.platform,
            romUrl: romPath
        });
    } else {
        console.log(`✅ ${game.title} - OK`);
    }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`📊 RESUMO:`);
console.log(`${'='.repeat(60)}`);
console.log(`Total de jogos: ${gamesDb.games.length}`);
console.log(`✅ Encontrados: ${gamesDb.games.length - missingCount}`);
console.log(`❌ Não encontrados: ${missingCount}`);

if (missingGames.length > 0) {
    console.log(`\n⚠️  JOGOS COM ROM FALTANDO:\n`);
    missingGames.forEach(game => {
        console.log(`- ${game.title} (${game.platform})`);
    });
}

console.log(`\n${'='.repeat(60)}`);
console.log('✨ Verificação completa!\n');