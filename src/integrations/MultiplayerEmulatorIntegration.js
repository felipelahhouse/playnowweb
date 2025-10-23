/**
 * Exemplo de integração do Socket.IO com EmulatorJS
 * Este arquivo mostra como sincronizar inputs e estado entre jogadores
 */

import multiplayerService from '../services/multiplayerService';

class MultiplayerEmulatorIntegration {
  constructor(emulatorInstance) {
    this.emulator = emulatorInstance;
    this.isHost = false;
    this.sessionId = null;
    this.socket = null;
    this.syncInterval = null;
    this.inputQueue = [];
    this.lastStateSync = 0;
    this.syncFrequency = 100; // ms entre sincronizações
  }

  /**
   * Inicializar multiplayer
   */
  async initialize(sessionId, playerName, gameCore, gameRom) {
    try {
      // Conectar ao servidor
      this.socket = multiplayerService.connect();

      // Entrar na sala
      const result = await multiplayerService.joinRoom(
        sessionId,
        playerName,
        gameCore,
        gameRom
      );

      this.isHost = result.isHost;
      this.sessionId = sessionId;

      console.log(`🎮 Multiplayer initialized. Host: ${this.isHost}`);

      // Configurar listeners
      this.setupEventListeners();

      // Se for host, iniciar sincronização
      if (this.isHost) {
        this.startStateSynchronization();
      }

      // Iniciar heartbeat
      multiplayerService.startHeartbeat(30000);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize multiplayer:', error);
      return false;
    }
  }

  /**
   * Configurar event listeners do Socket.IO
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Receber input de outros jogadores
    this.socket.on('player-input', (data) => {
      this.handleRemoteInput(data);
    });

    // Receber estado do jogo (guest players)
    if (!this.isHost) {
      this.socket.on('game-state', (data) => {
        this.handleGameState(data);
      });
    }

    // Player promovido a host
    this.socket.on('promoted-to-host', () => {
      console.log('👑 You are now the host!');
      this.isHost = true;
      this.startStateSynchronization();
    });

    // Novo host designado
    this.socket.on('new-host', (data) => {
      console.log('👑 New host:', data.hostName);
      this.isHost = false;
      this.stopStateSynchronization();
    });
  }

  /**
   * Capturar inputs locais e enviar para outros jogadores
   */
  captureLocalInput(key, type) {
    // Processar input localmente primeiro (para responsividade)
    this.processInput(key, type, true);

    // Enviar para outros jogadores
    multiplayerService.sendInput(key, type);

    console.log(`🎮 Local input: ${key} (${type})`);
  }

  /**
   * Processar input de jogador remoto
   */
  handleRemoteInput(data) {
    const { key, type, playerId, playerName } = data;

    console.log(`🎮 Remote input from ${playerName}: ${key} (${type})`);

    // Adicionar à fila de inputs
    this.inputQueue.push({
      key,
      type,
      playerId,
      timestamp: Date.now()
    });

    // Processar input no emulador
    this.processInput(key, type, false);
  }

  /**
   * Processar input no emulador
   */
  processInput(key, type, isLocal = false) {
    if (!this.emulator) return;

    // Mapear tecla para botão do emulador
    const buttonMap = {
      'up': 12,
      'down': 13,
      'left': 14,
      'right': 15,
      'a': 8,
      'b': 0,
      'x': 9,
      'y': 1,
      'start': 3,
      'select': 2,
      'l': 4,
      'r': 5
    };

    const button = buttonMap[key.toLowerCase()];
    if (button === undefined) return;

    try {
      // EmulatorJS usa EJS_pressed para simular input
      if (type === 'keydown') {
        this.emulator.EJS_pressed(button);
      } else if (type === 'keyup') {
        this.emulator.EJS_released(button);
      }
    } catch (error) {
      console.error('Error processing input:', error);
    }
  }

  /**
   * Iniciar sincronização de estado (apenas HOST)
   */
  startStateSynchronization() {
    if (!this.isHost || this.syncInterval) return;

    console.log('🔄 Starting state synchronization...');

    this.syncInterval = setInterval(() => {
      this.syncGameState();
    }, this.syncFrequency);
  }

  /**
   * Parar sincronização de estado
   */
  stopStateSynchronization() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Stopped state synchronization');
    }
  }

  /**
   * Sincronizar estado do jogo (HOST → Guests)
   */
  syncGameState() {
    if (!this.isHost || !this.emulator) return;

    const now = Date.now();
    
    // Evitar sincronizar muito frequentemente
    if (now - this.lastStateSync < this.syncFrequency) return;

    try {
      // Obter save state do emulador
      const state = this.emulator.EJS_getState();
      
      if (state) {
        // Enviar apenas se estado mudou
        multiplayerService.syncGameState({
          state: state,
          timestamp: now
        });

        this.lastStateSync = now;
      }
    } catch (error) {
      console.error('Error syncing game state:', error);
    }
  }

  /**
   * Receber estado do jogo (GUESTS)
   */
  handleGameState(data) {
    if (this.isHost || !this.emulator) return;

    try {
      const { state, timestamp } = data;

      // Verificar se estado é mais recente
      if (timestamp > this.lastStateSync) {
        // Aplicar estado no emulador
        this.emulator.EJS_setState(state);
        this.lastStateSync = timestamp;
        
        console.log('📥 Game state updated from host');
      }
    } catch (error) {
      console.error('Error applying game state:', error);
    }
  }

  /**
   * Capturar teclas do teclado
   */
  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      const key = this.mapKeyboardToButton(e.key);
      if (key) {
        e.preventDefault();
        this.captureLocalInput(key, 'keydown');
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = this.mapKeyboardToButton(e.key);
      if (key) {
        e.preventDefault();
        this.captureLocalInput(key, 'keyup');
      }
    });
  }

  /**
   * Mapear teclas do teclado para botões do controle
   */
  mapKeyboardToButton(keyCode) {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'KeyZ': 'a',
      'KeyX': 'b',
      'KeyA': 'x',
      'KeyS': 'y',
      'Enter': 'start',
      'Shift': 'select',
      'KeyQ': 'l',
      'KeyW': 'r'
    };

    return keyMap[keyCode] || keyMap[`Key${keyCode.toUpperCase()}`] || null;
  }

  /**
   * Desconectar multiplayer
   */
  disconnect() {
    console.log('👋 Disconnecting multiplayer...');

    // Parar sincronização
    this.stopStateSynchronization();

    // Parar heartbeat
    multiplayerService.stopHeartbeat();

    // Sair da sala
    multiplayerService.leaveRoom();

    // Desconectar socket
    multiplayerService.disconnect();

    // Limpar referências
    this.socket = null;
    this.emulator = null;
    this.isHost = false;
    this.sessionId = null;
  }

  /**
   * Pausar sincronização (ex: quando jogo é pausado)
   */
  pause() {
    this.stopStateSynchronization();
    console.log('⏸️ Multiplayer paused');
  }

  /**
   * Retomar sincronização
   */
  resume() {
    if (this.isHost) {
      this.startStateSynchronization();
      console.log('▶️ Multiplayer resumed');
    }
  }

  /**
   * Ajustar frequência de sincronização
   */
  setSyncFrequency(ms) {
    this.syncFrequency = Math.max(50, Math.min(ms, 1000)); // Entre 50ms e 1000ms
    
    if (this.isHost && this.syncInterval) {
      this.stopStateSynchronization();
      this.startStateSynchronization();
    }

    console.log(`⚙️ Sync frequency set to ${this.syncFrequency}ms`);
  }

  /**
   * Obter estatísticas de rede
   */
  getNetworkStats() {
    return {
      isConnected: multiplayerService.isSocketConnected(),
      isHost: this.isHost,
      sessionId: this.sessionId,
      inputQueueSize: this.inputQueue.length,
      syncFrequency: this.syncFrequency,
      lastSync: this.lastStateSync
    };
  }
}

export default MultiplayerEmulatorIntegration;

/**
 * EXEMPLO DE USO:
 * 
 * import MultiplayerEmulatorIntegration from './MultiplayerEmulatorIntegration';
 * 
 * // Quando EmulatorJS estiver pronto
 * window.EJS_onGameStart = () => {
 *   const multiplayer = new MultiplayerEmulatorIntegration(window.EJS_emulator);
 *   
 *   // Inicializar multiplayer
 *   multiplayer.initialize('ABC123', 'Player1', 'snes', 'mario.sfc')
 *     .then(success => {
 *       if (success) {
 *         console.log('Multiplayer ready!');
 *         
 *         // Capturar inputs do teclado
 *         multiplayer.attachKeyboardListeners();
 *       }
 *     });
 * };
 * 
 * // Quando sair do jogo
 * window.EJS_onGameExit = () => {
 *   multiplayer.disconnect();
 * };
 */
