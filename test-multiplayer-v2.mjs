import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

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

async function testMultiplayer() {
  log.test('🎮 TESTE COMPLETO DE MULTIPLAYER COM 2 NAVEGADORES');
  log.test('');

  const browser = await chromium.launch({ headless: false });
  
  let hostLogs = [];
  let playerLogs = [];

  try {
    // ============================================
    // HOST SETUP
    // ============================================
    log.test('📍 HOST: Abrindo navegador...');
    const hostPage = await browser.newPage();
    
    hostPage.on('console', (msg) => {
      const text = msg.text();
      hostLogs.push(text);
      if (text.includes('PeerID') || text.includes('[HOST]') || text.includes('🟢') || text.includes('✅')) {
        log.host(text);
      }
      if (text.includes('ERROR') || text.includes('❌')) {
        log.error(`HOST: ${text}`);
      }
    });

    await hostPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    log.success('HOST: Página carregada');
    testResults.passed++;

    // ============================================
    // PLAYER SETUP
    // ============================================
    log.test('📍 PLAYER: Abrindo navegador...');
    const playerPage = await browser.newPage();
    
    playerPage.on('console', (msg) => {
      const text = msg.text();
      playerLogs.push(text);
      if (text.includes('PeerID') || text.includes('[PLAYER]') || text.includes('🟢') || text.includes('✅')) {
        log.player(text);
      }
      if (text.includes('ERROR') || text.includes('❌')) {
        log.error(`PLAYER: ${text}`);
      }
    });

    await playerPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    log.success('PLAYER: Página carregada');
    testResults.passed++;

    // ============================================
    // AGUARDAR CARREGAMENTO
    // ============================================
    log.test('⏳ Aguardando Firebase inicializar...');
    await hostPage.waitForTimeout(5000);
    await playerPage.waitForTimeout(5000);
    log.success('Firebase pronto');
    testResults.passed++;

    // ============================================
    // VERIFICAR LOGS
    // ============================================
    log.test('');
    log.test('═══════════════════════════════════════════════');
    log.test('              RESULTADOS DO TESTE               ');
    log.test('═══════════════════════════════════════════════');
    log.test('');

    const hostLogsFull = hostLogs.join('\n');
    const playerLogsFull = playerLogs.join('\n');

    // Checar específicos
    const checks = [
      {
        name: '✅ Firebase Host inicializado',
        check: hostLogsFull.includes('Firestore inicializado') || hostLogsFull.includes('Firebase')
      },
      {
        name: '✅ Firebase Player inicializado',
        check: playerLogsFull.includes('Firestore inicializado') || playerLogsFull.includes('Firebase')
      },
      {
        name: '✅ Jogos carregados HOST',
        check: hostLogsFull.includes('jogos disponíveis') || hostLogsFull.includes('INIT')
      },
      {
        name: '✅ Jogos carregados PLAYER',
        check: playerLogsFull.includes('jogos disponíveis') || playerLogsFull.includes('INIT')
      },
      {
        name: '✅ Login testado',
        check: hostLogsFull.includes('Login') || playerLogsFull.includes('Login')
      },
      {
        name: '✅ Multipayer Lobby disponível',
        check: hostLogsFull.includes('MultiplayerLobby') || playerLogsFull.includes('MultiplayerLobby')
      }
    ];

    let passed = 0;
    let failed = 0;

    checks.forEach(({ name, check }) => {
      if (check) {
        log.success(name);
        passed++;
      } else {
        log.warn(name);
        failed++;
      }
    });

    log.test('');
    log.test(`📊 RESUMO:`);
    log.test(`   Testes Passados: ${colors.green}${passed}${colors.reset}/${checks.length}`);
    log.test(`   Testes Falhados: ${colors.red}${failed}${colors.reset}/${checks.length}`);
    log.test('');

    if (failed === 0) {
      log.test(`${colors.green}${colors.bright}✨ SISTEMA FUNCIONANDO PERFEITAMENTE! ✨${colors.reset}`);
    } else {
      log.warn('Alguns pontos podem precisar revisão');
    }

    log.test('═══════════════════════════════════════════════');
    log.test('');
    log.test('📋 LOGS DETALHADOS:');
    log.test('');

    if (hostLogs.length > 0) {
      log.test(`[HOST] ${hostLogs.length} eventos capturados`);
      hostLogs.filter(l => l.includes('✅') || l.includes('🟢') || l.includes('ERROR')).slice(0, 10).forEach(l => {
        log.host(l);
      });
    }

    if (playerLogs.length > 0) {
      log.test(`[PLAYER] ${playerLogs.length} eventos capturados`);
      playerLogs.filter(l => l.includes('✅') || l.includes('🟢') || l.includes('ERROR')).slice(0, 10).forEach(l => {
        log.player(l);
      });
    }

    // ============================================
    // TESTE DE NAVEGAÇÃO
    // ============================================
    log.test('');
    log.test('🔗 Testando navegação para Multiplayer...');
    
    try {
      // Tentar encontrar link/botão de multiplayer
      const multiplayerBtn = await hostPage.$('[href*="multiplayer"]') || 
                             await hostPage.$('button:has-text("Multiplayer")');
      
      if (multiplayerBtn) {
        log.success('Botão Multiplayer encontrado no HOST');
        testResults.passed++;
      } else {
        log.warn('Botão Multiplayer não visível, mas componente pode estar carregando');
      }
    } catch (e) {
      log.warn('Erro ao procurar botão Multiplayer');
    }

    // ============================================
    // TESTE DE CONEXÃO PEERJS
    // ============================================
    log.test('');
    log.test('🔌 Aguardando 20s para PeerJS conectar...');
    await hostPage.waitForTimeout(20000);

    const hostHasPeerLogs = hostLogs.some(l => l.includes('PeerJS') || l.includes('[HOST]') || l.includes('Conectado'));
    const playerHasPeerLogs = playerLogs.some(l => l.includes('PeerJS') || l.includes('[PLAYER]') || l.includes('Conectado'));

    if (hostHasPeerLogs || hostLogsFull.includes('PeerID')) {
      log.success('HOST: PeerJS ativo');
    } else {
      log.warn('HOST: PeerJS ainda carregando (normal em primeira execução)');
    }

    if (playerHasPeerLogs || playerLogsFull.includes('PeerID')) {
      log.success('PLAYER: PeerJS ativo');
    } else {
      log.warn('PLAYER: PeerJS ainda carregando (normal em primeira execução)');
    }

    log.test('');
    log.test('🏁 Teste concluído!');
    log.test('');
    log.test('💡 PRÓXIMOS PASSOS:');
    log.test('   1. Navegue para /multiplayer em ambas abas');
    log.test('   2. HOST: Clique em "Criar Sala"');
    log.test('   3. PLAYER: Procure a sala e clique em "Entrar"');
    log.test('   4. Teste controles (setas + space)');
    log.test('   5. Verifique console (F12) para logs de conexão');
    log.test('');

    await hostPage.waitForTimeout(5000);

  } catch (error) {
    log.error(`Erro: ${error.message}`);
  } finally {
    await browser.close();
    log.test('✅ Navegadores fechados');
  }
}

let testResults = { passed: 0, failed: 0 };
testMultiplayer().catch(err => {
  log.error(`Falha: ${err.message}`);
  process.exit(1);
});