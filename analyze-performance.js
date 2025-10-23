/**
 * 📊 Script de Análise de Performance
 * 
 * Analisa o bundle gerado e fornece insights sobre otimizações
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = './dist';
const ASSETS_DIR = join(DIST_DIR, 'assets');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeBundle() {
  console.log(`\n${colors.bright}${colors.cyan}📊 ANÁLISE DE PERFORMANCE${colors.reset}\n`);
  console.log('━'.repeat(60));

  try {
    // Analisa arquivos JS
    const jsFiles = readdirSync(ASSETS_DIR)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file,
        size: getFileSize(join(ASSETS_DIR, file)),
        type: 'JavaScript'
      }));

    // Analisa arquivos CSS
    const cssFiles = readdirSync(ASSETS_DIR)
      .filter(file => file.endsWith('.css'))
      .map(file => ({
        name: file,
        size: getFileSize(join(ASSETS_DIR, file)),
        type: 'CSS'
      }));

    // Calcula totais
    const totalJS = jsFiles.reduce((acc, file) => acc + file.size, 0);
    const totalCSS = cssFiles.reduce((acc, file) => acc + file.size, 0);
    const totalSize = totalJS + totalCSS;

    // Exibe resumo
    console.log(`\n${colors.bright}📦 TAMANHO DO BUNDLE${colors.reset}`);
    console.log('─'.repeat(60));
    console.log(`JavaScript: ${colors.yellow}${formatBytes(totalJS)}${colors.reset}`);
    console.log(`CSS:        ${colors.magenta}${formatBytes(totalCSS)}${colors.reset}`);
    console.log(`Total:      ${colors.cyan}${formatBytes(totalSize)}${colors.reset}`);

    // Exibe arquivos maiores
    console.log(`\n${colors.bright}📁 MAIORES ARQUIVOS${colors.reset}`);
    console.log('─'.repeat(60));
    
    const allFiles = [...jsFiles, ...cssFiles]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    allFiles.forEach((file, index) => {
      const sizeColor = file.size > 100000 ? colors.red : 
                       file.size > 50000 ? colors.yellow : 
                       colors.green;
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   ${sizeColor}${formatBytes(file.size)}${colors.reset} (${file.type})`);
    });

    // Recomendações
    console.log(`\n${colors.bright}💡 RECOMENDAÇÕES${colors.reset}`);
    console.log('─'.repeat(60));

    const recommendations = [];

    if (totalJS > 500000) {
      recommendations.push(`${colors.yellow}⚠${colors.reset} Bundle JS grande (${formatBytes(totalJS)}). Considere mais code splitting.`);
    } else {
      recommendations.push(`${colors.green}✓${colors.reset} Bundle JS otimizado (${formatBytes(totalJS)})`);
    }

    if (totalCSS > 100000) {
      recommendations.push(`${colors.yellow}⚠${colors.reset} CSS grande (${formatBytes(totalCSS)}). Considere purge CSS.`);
    } else {
      recommendations.push(`${colors.green}✓${colors.reset} CSS otimizado (${formatBytes(totalCSS)})`);
    }

    const largeFiles = allFiles.filter(f => f.size > 100000);
    if (largeFiles.length > 0) {
      recommendations.push(`${colors.yellow}⚠${colors.reset} ${largeFiles.length} arquivo(s) > 100KB. Considere lazy loading.`);
    }

    if (jsFiles.length > 20) {
      recommendations.push(`${colors.yellow}⚠${colors.reset} Muitos arquivos JS (${jsFiles.length}). Considere consolidar chunks.`);
    } else {
      recommendations.push(`${colors.green}✓${colors.reset} Número de chunks otimizado (${jsFiles.length})`);
    }

    recommendations.forEach(rec => console.log(rec));

    // Score de performance
    console.log(`\n${colors.bright}🎯 SCORE DE PERFORMANCE${colors.reset}`);
    console.log('─'.repeat(60));

    let score = 100;
    if (totalJS > 500000) score -= 20;
    if (totalJS > 800000) score -= 20;
    if (totalCSS > 100000) score -= 10;
    if (largeFiles.length > 3) score -= 15;
    if (jsFiles.length > 20) score -= 10;

    const scoreColor = score >= 80 ? colors.green : 
                      score >= 60 ? colors.yellow : 
                      colors.red;

    console.log(`Score: ${scoreColor}${score}/100${colors.reset}`);
    
    if (score >= 80) {
      console.log(`${colors.green}🎉 Excelente! Bundle bem otimizado.${colors.reset}`);
    } else if (score >= 60) {
      console.log(`${colors.yellow}⚠ Bom, mas há espaço para melhorias.${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Necessita otimização urgente.${colors.reset}`);
    }

    // Comparação com benchmarks
    console.log(`\n${colors.bright}📈 BENCHMARKS${colors.reset}`);
    console.log('─'.repeat(60));
    console.log(`Ideal:     < 300KB total`);
    console.log(`Bom:       < 500KB total`);
    console.log(`Aceitável: < 800KB total`);
    console.log(`Atual:     ${colors.cyan}${formatBytes(totalSize)}${colors.reset}`);

    console.log('\n' + '━'.repeat(60) + '\n');

  } catch (error) {
    console.error(`${colors.red}❌ Erro ao analisar bundle:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}💡 Dica: Execute 'npm run build' primeiro${colors.reset}\n`);
  }
}

// Executa análise
analyzeBundle();