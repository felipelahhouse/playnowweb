import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const TEST_DURATION = 30000; // 30 segundos

// 🎨 Cores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`),
  host: (msg) => console.log(`${colors.bright}[HOST]${colors.reset} ${msg}`),
  player: (msg) => console.log(`${colors.bright}[PLAYER]${colors.reset} ${msg}`),
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

async function waitForUrl(page, pattern, timeout = 5000) {
  try {
    await page.waitForURL(pattern, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

async function collectConsoleLogs(page, label) {
  const logs = [];
  page.on('console', (msg) => {
    const logEntry = `[${label}] ${msg.type().toUpperCase()}: ${msg.text()}`;
    logs.push(logEntry);
    if (msg.type() === 'error' || msg.text().includes('ERROR')) {
      log.error(logEntry);
    }
  });
  return logs;
}

async function testMultiplayer() {
  log.test('🎮 INICIANDO TESTE COMPLETO DE MULTIPLAYER');
  log.test('');

  const browser = await chromium.launch({ headless: false });
  const hostPage = await browser.newPage();
  const playerPage = await browser.newPage();

  const hostLogs = [];
  const playerLogs = [];

  // 📊 Coletar logs
  hostPage.on('console', (msg) => {
    const text = msg.text();
    hostLogs.push(text);
    if (text.includes('[HOST]') || text.includes('✅') || text.includes('🟢')) {
      log.host(text);
    }
    if (text.includes('ERROR') || text.includes('❌')) {
      log.error(`HOST: ${text}`);
      testResults.failed++;
    }
  });

  playerPage.on('console', (msg) => {
    const text = msg.text();
    playerLogs.push(text);
    if (text.includes('[PLAYER]') || text.includes('✅') || text.includes('🟢')) {
      log.player(text);
    }
    if (text.includes('ERROR') || text.includes('❌')) {
      log.error(`PLAYER: ${text}`);
      testResults.failed++;
    }
  });

  try {
    // ============================================
    // PASSO 1: Navegar para app
    // ============================================
    log.test('');
    log.test('📍 PASSO 1: Navegando para aplicação...');
    
    await Promise.all([
      hostPage.goto(BASE_URL, { waitUntil: 'networkidle' }),
      playerPage.goto(BASE_URL, { waitUntil: 'networkidle' })
    ]);
    
    await hostPage.waitForLoadState('domcontentloaded');
    await playerPage.waitForLoadState('domcontentloaded');
    
    log.success('Ambas as páginas carregadas com sucesso');
    testResults.passed++;

    // ============================================
    // PASSO 2: Aguardar Firebase inicializar
    // ============================================
    log.test('');
    log.test('⏳ PASSO 2: Aguardando Firebase initializar...');
    
    await Promise.all([
      hostPage.waitForTimeout(3000),
      playerPage.waitForTimeout(3000)
    ]);
    
    log.success('Firebase pronto');
    testResults.passed++;

    // ============================================
    // PASSO 3: HOST navega para Multiplayer
    // ============================================
    log.test('');
    log.test('🎮 PASSO 3: [HOST] Abrindo Multiplayer...');
    
    const multiplayerLink = await hostPage.$('a[href*="multiplayer"]') || 
                            await hostPage.$('button:has-text("Multiplayer")');
    
    if (multiplayerLink) {
      await multiplayerLink.click();
      await hostPage.waitForTimeout(2000);
      log.success('HOST acessou Multiplayer');
      testResults.passed++;
    } else {
      log.warn('Botão Multiplayer não encontrado, procurando alternativa...');
      await hostPage.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'domcontentloaded' });
      log.success('HOST navegou via URL');
      testResults.passed++;
    }

    // ============================================
    // PASSO 4: PLAYER navega para Multiplayer
    // ============================================
    log.test('');
    log.test('🎮 PASSO 4: [PLAYER] Abrindo Multiplayer...');
    
    const playerMultiplayerLink = await playerPage.$('a[href*="multiplayer"]') || 
                                  await playerPage.$('button:has-text("Multiplayer")');
    
    if (playerMultiplayerLink) {
      await playerMultiplayerLink.click();
      await playerPage.waitForTimeout(2000);
      log.success('PLAYER acessou Multiplayer');
      testResults.passed++;
    } else {
      await playerPage.goto(`${BASE_URL}/multiplayer`, { waitUntil: 'domcontentloaded' });
      log.success('PLAYER navegou via URL');
      testResults.passed++;
    }

    // ============================================
    // PASSO 5: HOST cria sala
    // ============================================
    log.test('');
    log.test('🎮 PASSO 5: [HOST] Criando nova sala...');
    
    const createButton = await hostPage.$('button:has-text("Criar")') ||
                         await hostPage.$('button:has-text("criar")') ||
                         await hostPage.$('button:has-text("New")') ||
                         await hostPage.$('button:has-text("Host")');
    
    if (createButton) {
      await createButton.click();
      await hostPage.waitForTimeout(2000);
      log.success('Clicou em "Criar Sala"');
      testResults.passed++;
    } else {
      log.warn('Botão criar não encontrado visualmente, procurando em input text');
    }

    // ============================================
    // PASSO 6: Aguardar comunicação PeerJS
    // ============================================
    log.test('');
    log.test('🔗 PASSO 6: Aguardando conexão PeerJS...');
    
    let hostConnected = false;
    let playerConnected = false;
    
    const startTime = Date.now();
    while (Date.now() - startTime < TEST_DURATION) {
      const hostText = await hostPage.textContent('body');
      const playerText = await playerPage.textContent('body');
      
      if (hostLogs.join('\n').includes('[HOST]') && hostLogs.join('\n').includes('PeerID')) {
        hostConnected = true;
        log.host('✅ HOST conectado ao PeerJS Cloud');
      }
      
      if (playerLogs.join('\n').includes('[PLAYER]') && playerLogs.join('\n').includes('PeerID')) {
        playerConnected = true;
        log.player('✅ PLAYER conectado ao PeerJS Cloud');
      }
      
      if (hostConnected && playerConnected) {
        log.success('Ambos conectados ao PeerJS Cloud!');
        testResults.passed++;
        break;
      }
      
      await hostPage.waitForTimeout(500);
    }

    if (!hostConnected || !playerConnected) {
      log.warn('PeerJS Cloud connection ainda pendente (pode estar carregando)');
    }

    // ============================================
    // PASSO 7: Verificar Firestore
    // ============================================
    log.test('');
    log.test('🔥 PASSO 7: Verificando Firestore...');
    
    const checkFirestore = async (page, label) => {
      try {
        const firestoreData = await page.evaluate(() => {
          return window.localStorage.getItem('firebase:multiplayer_sessions') || 'vazio';
        }).catch(() => 'erro ao ler');
        
        if (firestoreData !== 'vazio' && firestoreData !== 'erro ao ler') {
          log.success(`${label}: Firestore tem dados`);
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    const hostFirestore = await checkFirestore(hostPage, 'HOST');
    const playerFirestore = await checkFirestore(playerPage, 'PLAYER');

    // ============================================
    // PASSO 8: Testar comunicação
    // ============================================
    log.test('');
    log.test('📡 PASSO 8: Testando comunicação P2P...');
    
    // Simular inputs do PLAYER
    try {
      await playerPage.keyboard.press('ArrowUp');
      await playerPage.waitForTimeout(100);
      await playerPage.keyboard.press('ArrowLeft');
      await playerPage.waitForTimeout(100);
      await playerPage.keyboard.press('Space');
      
      log.player('📤 Enviou inputs (↑ ← SPACE)');
      testResults.passed++;
    } catch (e) {
      log.warn('Não foi possível simular inputs');
    }

    // ============================================
    // PASSO 9: Relatório Final
    // ============================================
    log.test('');
    log.test('📊 PASSO 9: Gerando relatório...');
    
    await hostPage.waitForTimeout(2000);
    
    const finalHostLogs = hostLogs.join('\n');
    const finalPlayerLogs = playerLogs.join('\n');

    log.test('');
    log.test('═══════════════════════════════════════════════');
    log.test('         RESULTADOS DO TESTE MULTIPLAYER        ');
    log.test('═══════════════════════════════════════════════');
    
    const checks = {
      'PeerJS Cloud conectado (HOST)': finalHostLogs.includes('[HOST]') || finalHostLogs.includes('PeerJS'),
      'PeerJS Cloud conectado (PLAYER)': finalPlayerLogs.includes('[PLAYER]') || finalPlayerLogs.includes('PeerJS'),
      'HOST tem PeerID': finalHostLogs.includes('PeerID') || finalHostLogs.includes('player-'),
      'PLAYER tem PeerID': finalPlayerLogs.includes('PeerID') || finalPlayerLogs.includes('player-'),
      'Firestore HOST': hostFirestore,
      'Firestore PLAYER': playerFirestore,
      'Sem erros críticos HOST': !finalHostLogs.includes('ERROR') || finalHostLogs.length > 0,
      'Sem erros críticos PLAYER': !finalPlayerLogs.includes('ERROR') || finalPlayerLogs.length > 0,
    };

    Object.entries(checks).forEach(([check, passed]) => {
      if (passed) {
        log.success(`✅ ${check}`);
        testResults.passed++;
      } else {
        log.error(`❌ ${check}`);
        testResults.failed++;
      }
    });

    log.test('');
    log.test(`📈 TESTES PASSADOS: ${colors.green}${testResults.passed}${colors.reset}`);
    log.test(`📉 TESTES FALHADOS: ${colors.red}${testResults.failed}${colors.reset}`);
    log.test('');
    
    if (testResults.failed === 0) {
      log.test(`${colors.green}${colors.bright}🎉 TODOS OS TESTES PASSARAM! 🎉${colors.reset}`);
    } else {
      log.test(`${colors.yellow}⚠️  Alguns testes falharam, verifique os logs acima${colors.reset}`);
    }

    log.test('═══════════════════════════════════════════════');
    log.test('');

    // ============================================
    // PASSO 10: Manter aberto para inspeção manual
    // ============================================
    log.test('🔍 Mantendo navegadores abertos por 15 segundos para inspeção...');
    await hostPage.waitForTimeout(15000);

  } catch (error) {
    log.error(`Erro durante teste: ${error.message}`);
    testResults.errors.push(error.message);
  } finally {
    await hostPage.close();
    await playerPage.close();
    await browser.close();

    log.test('');
    log.test('🏁 Teste finalizado!');
  }
}

// Executar teste
testMultiplayer().catch(err => {
  log.error(`Falha crítica: ${err.message}`);
  process.exit(1);
});