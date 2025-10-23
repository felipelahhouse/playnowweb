import { io } from 'socket.io-client';
import Logger from './Logger';
import ConnectionMonitor from './ConnectionMonitor';
import RetryManager from './RetryManager';
import ValidationService from './ValidationService';

// Detectar ambiente
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// URLs do servidor Socket.IO (ordem de prioridade)
const SOCKET_URLS = [
  'http://localhost:3000',                                                    // 1. Local Node.js server - Desenvolvimento
  'https://play-now-emulator-felipelars.replit.app',                         // 2. Replit Production Server - Domain Fixo 🚀
  'https://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev', // 3. Replit Dev URL - Backup
  'http://localhost:5000'                                                     // 4. Local Flask server (Python) - Backup
];

// Determinar URL primária
let SOCKET_URL;
if (import.meta.env.VITE_SOCKET_URL) {
  // Usar variável de ambiente se definida
  SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  console.log('🔧 [SOCKET] Usando URL da variável de ambiente:', SOCKET_URL);
} else if (isDevelopment) {
  // Em desenvolvimento, tentar local primeiro
  SOCKET_URL = SOCKET_URLS[0]; // localhost:3000
  console.log('🔧 [SOCKET] Modo desenvolvimento - usando localhost:3000');
} else {
  // Em produção, usar Replit Domain fixo
  SOCKET_URL = SOCKET_URLS[1]; // https://play-now-emulator-felipelars.replit.app
  console.log('🔧 [SOCKET] Modo produção - usando Replit Domain:', SOCKET_URL);
}

console.log(`🔌 Socket.IO Primary URL: ${SOCKET_URL} (isDevelopment: ${isDevelopment})`);
console.log(`🔄 Fallback URLs available: ${SOCKET_URLS.length - 1}`);

class MultiplayerService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.isHost = false;
    this.playerId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Conectar ao servidor Socket.IO
   */
  connect() {
    if (this.socket?.connected) {
      console.log('✅ [SOCKET] Já conectado ao servidor Socket.IO, ID:', this.socket.id);
      Logger.log('MultiplayerService', 'Already connected to Socket.IO', { socketId: this.socket.id });
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      console.log('🔄 [SOCKET] Socket existe mas não está conectado, reconectando...');
      Logger.log('MultiplayerService', 'Socket exists but not connected, reconnecting...');
      this.socket.connect();
      return this.socket;
    }

    console.log('🔌 [SOCKET] ═══════════════════════════════════════════════');
    console.log('🔌 [SOCKET] Iniciando conexão com servidor Socket.IO');
    console.log('🔌 [SOCKET] URL:', SOCKET_URL);
    console.log('🔌 [SOCKET] Modo:', isDevelopment ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('🔌 [SOCKET] ═══════════════════════════════════════════════');
    
    Logger.log('MultiplayerService', 'Connecting to Socket.IO server', { url: SOCKET_URL });

    try {
      console.log('🔧 [SOCKET] Criando instância do Socket.IO...');
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 30000,
        autoConnect: true,
        forceNew: false,
        query: {
          timestamp: Date.now()
        }
      });
      
      console.log('✅ [SOCKET] Instância criada, aguardando conexão...');

      this.setupEventHandlers();

      // Iniciar monitoramento de conexão
      if (!this.connectionMonitorActive) {
        ConnectionMonitor.start(SOCKET_URL);
        this.connectionMonitorActive = true;
      }

      return this.socket;
    } catch (error) {
      console.error('❌ [SOCKET] Erro ao inicializar Socket.IO:', error);
      Logger.error('MultiplayerService', 'Error initializing Socket.IO', error);
      this.socket = null;
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Configurar handlers de eventos
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Limpar handlers existentes para evitar duplicatas
    this.socket.removeAllListeners('connect');
    this.socket.removeAllListeners('disconnect');
    this.socket.removeAllListeners('connect_error');
    this.socket.removeAllListeners('reconnect_attempt');
    this.socket.removeAllListeners('reconnect');
    this.socket.removeAllListeners('reconnect_failed');
    this.socket.removeAllListeners('heartbeat-ack');

    // Conexão estabelecida
    this.socket.on('connect', () => {
      console.log('🎉 [SOCKET] ═══════════════════════════════════════════════');
      console.log('🎉 [SOCKET] CONECTADO AO SERVIDOR SOCKET.IO!');
      console.log('🎉 [SOCKET] Socket ID:', this.socket.id);
      console.log('🎉 [SOCKET] Transport:', this.socket.io.engine.transport.name);
      console.log('🎉 [SOCKET] URL:', SOCKET_URL);
      console.log('🎉 [SOCKET] ═══════════════════════════════════════════════');
      
      Logger.log('MultiplayerService', 'Connected to Socket.IO server', {
        socketId: this.socket.id,
        transport: this.socket.io.engine.transport.name
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.playerId = this.socket.id;
      ConnectionMonitor.reset();
    });

    // Desconectado
    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [SOCKET] Desconectado do servidor Socket.IO. Motivo:', reason);
      Logger.log('MultiplayerService', 'Disconnected from Socket.IO server', { reason });
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        console.warn('⚠️ [SOCKET] Servidor forçou desconexão - não vai reconectar automaticamente');
        Logger.warn('MultiplayerService', 'Server forced disconnect, will not auto-reconnect');
      }
    });

    // Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Erro de conexão:', error.message);
      console.error('❌ [SOCKET] Tipo:', error?.type);
      console.error('❌ [SOCKET] Descrição:', error?.description);
      console.error('❌ [SOCKET] URL tentada:', SOCKET_URL);
      
      Logger.error('MultiplayerService', 'Connection error', error, {
        type: error?.type,
        description: error?.description
      });
      this.reconnectAttempts++;
      this.isConnected = false;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        Logger.error('MultiplayerService', 'Max reconnection attempts reached', new Error('Max retries'));
      }
    });

    // Tentando reconectar
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      Logger.log('MultiplayerService', 'Reconnection attempt', {
        attemptNumber,
        maxAttempts: this.maxReconnectAttempts
      });
    });

    // Reconectado com sucesso
    this.socket.on('reconnect', (attemptNumber) => {
      Logger.log('MultiplayerService', 'Reconnected successfully', {
        afterAttempts: attemptNumber,
        newSocketId: this.socket.id
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.playerId = this.socket.id;
      
      if (this.currentRoom) {
        Logger.log('MultiplayerService', 'Rejoining room after reconnection', {
          currentRoom: this.currentRoom
        });
        this.rejoinRoom();
      }
    });

    // Falha ao reconectar
    this.socket.on('reconnect_failed', () => {
      Logger.error('MultiplayerService', 'Failed to reconnect after all attempts', new Error('Reconnect failed'));
      this.isConnected = false;
    });

    // Heartbeat para manter conexão viva
    this.socket.on('heartbeat-ack', (data) => {
      Logger.debug('MultiplayerService', 'Heartbeat acknowledged', { timestamp: data?.timestamp });
    });
  }

  /**
   * Entrar em uma sala
   */
  joinRoom(sessionId, playerName, gameCore, gameRom) {
    if (!this.socket) {
      Logger.error('MultiplayerService', 'Cannot join room: socket not initialized', new Error('Socket not initialized'));
      return Promise.reject(new Error('Socket not initialized'));
    }

    if (!this.isConnected) {
      Logger.error('MultiplayerService', 'Cannot join room: not connected', new Error('Not connected'), {
        hasSocket: !!this.socket,
        socketConnected: this.socket?.connected,
        isConnected: this.isConnected,
        hasSocketId: !!this.socket?.id
      });
      return Promise.reject(new Error('Not connected to server'));
    }

    return new Promise((resolve, reject) => {
      Logger.log('MultiplayerService', 'Joining room', {
        sessionId,
        playerName,
        socketId: this.socket.id,
        connected: this.socket.connected,
        transport: this.socket.io?.engine?.transport?.name
      });

      let timeoutId = null;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        this.socket.off('joined-session', onJoinedRoom);
        this.socket.off('session-error', onJoinError);
      };

      const onJoinedRoom = (data) => {
        Logger.log('MultiplayerService', 'Received joined-session event', { data });
        
        if (resolved) {
          Logger.debug('MultiplayerService', 'Already resolved, ignoring duplicate joined-session');
          return;
        }

        // Validar dados recebidos
        if (!ValidationService.validateSocketEvent('joined-session', data)) {
          resolved = true;
          cleanup();
          reject(new Error('Invalid joined-session data from server'));
          return;
        }

        if (data.success) {
          resolved = true;
          cleanup();
          
          Logger.log('MultiplayerService', 'Joined room successfully', {
            isHost: data.isHost,
            totalPlayers: data.players,
            playerId: data.playerId
          });
          
          this.currentRoom = sessionId;
          this.isHost = data.isHost;
          this.playerId = data.playerId;

          resolve(data);
        } else {
          resolved = true;
          cleanup();
          Logger.error('MultiplayerService', 'Server reported failed to join room', new Error(data.error), {
            error: data.error
          });
          reject(new Error(data.error || 'Failed to join room'));
        }
      };

      const onJoinError = (data) => {
        Logger.error('MultiplayerService', 'Join error event', new Error(data?.error || 'Join failed'), { data });
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error(data.error || 'Failed to join room'));
        }
      };

      // Registrar listeners ANTES de emitir
      this.socket.on('joined-session', onJoinedRoom);
      this.socket.on('session-error', onJoinError);

      // Timeout aumentado para 45s (melhor para conexões lentas)
      const TIMEOUT_MS = 45000;
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          Logger.error('MultiplayerService', 'Join room timeout after 45s', new Error('Timeout'), {
            connected: this.socket?.connected,
            socketId: this.socket?.id,
            transport: this.socket?.io?.engine?.transport?.name
          });
          reject(new Error('Join room timeout - o servidor não respondeu em 45s'));
        }
      }, TIMEOUT_MS);

      // Emitir evento com try/catch para capturar erros imediatos
      try {
        const emitted = this.socket.emit('join-session', {
          sessionId,
          userId: this.playerId,
          userName: playerName || `Player ${Date.now()}`
        });

        if (!emitted) {
          Logger.warn('MultiplayerService', 'Socket emit returned false - may be disconnected');
        }
      } catch (error) {
        Logger.error('MultiplayerService', 'Error emitting join-session', error);
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error(`Erro ao enviar join-session: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
    });
  }

  /**
   * Reentrar em uma sala após reconexão
   */
  rejoinRoom() {
    if (!this.currentRoom) return;

    // Emitir evento de rejoin (você pode adicionar no backend)
    this.socket.emit('rejoin-room', {
      sessionId: this.currentRoom,
      playerId: this.playerId
    });
  }

  /**
   * Enviar input do jogador
   */
  sendInput(key, type, playerIndex = 0) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('input', {
      key,
      type, // 'keydown' ou 'keyup'
      playerIndex,
      timestamp: Date.now()
    });
  }

  /**
   * Sincronizar estado do jogo (apenas HOST)
   */
  syncGameState(state) {
    if (!this.socket || !this.isConnected || !this.isHost) return;

    this.socket.emit('sync-state', {
      state,
      timestamp: Date.now()
    });
  }

  /**
   * Enviar mensagem de chat
   */
  sendChatMessage(message) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('chat-message', {
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Sair da sala
   */
  leaveRoom() {
    if (!this.socket || !this.currentRoom) return;

    console.log('🚪 Leaving room:', this.currentRoom);
    this.socket.emit('leave-room', {
      sessionId: this.currentRoom
    });

    this.currentRoom = null;
    this.isHost = false;
  }

  /**
   * Desconectar do servidor
   */
  disconnect() {
    if (this.socket) {
      console.log('👋 Disconnecting from Socket.IO server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      this.isHost = false;
      this.playerId = null;
    }
  }

  /**
   * Verificar se está conectado
   */
  isSocketConnected() {
    // Verificação mais robusta
    const hasSocket = !!this.socket;
    const socketConnected = this.socket?.connected || false;
    const flagConnected = this.isConnected;
    const hasSocketId = !!this.socket?.id;
    
    const connected = hasSocket && socketConnected && flagConnected && hasSocketId;
    
    // Debug log apenas quando não conectado e há socket
    if (!connected && hasSocket) {
      Logger.warn('MultiplayerService', 'Socket connection check failed', {
        hasSocket,
        socketConnected,
        isConnected: flagConnected,
        socketId: this.socket.id,
        transport: this.socket.io?.engine?.transport?.name
      });
    }
    
    return connected;
  }

  /**
   * Aguardar conexão ser estabelecida
   * @param {number} timeout - Timeout em ms (padrão: 30000)
   * @returns {Promise<boolean>} - true se conectado, false se timeout
   */
  async waitForConnection(timeout = 30000) {
    if (this.isSocketConnected()) {
      console.log('✅ Already connected');
      return true;
    }

    console.log('⏳ Waiting for connection...');

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout waiting for connection');
        this.socket?.off('connect', onConnect);
        resolve(false);
      }, timeout);

      const onConnect = () => {
        console.log('✅ Connection established');
        clearTimeout(timeoutId);
        this.socket?.off('connect', onConnect);
        resolve(true);
      };

      if (this.socket) {
        this.socket.on('connect', onConnect);
      } else {
        clearTimeout(timeoutId);
        resolve(false);
      }
    });
  }

  /**
   * Obter ID do socket
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Verificar se é o host da sala
   */
  isRoomHost() {
    return this.isHost;
  }

  /**
   * Enviar heartbeat manual
   */
  sendHeartbeat() {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('heartbeat');
  }

  /**
   * Iniciar heartbeat automático
   */
  startHeartbeat(interval = 30000) {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);

    console.log('💓 Heartbeat started (interval: ' + interval + 'ms)');
  }

  /**
   * Parar heartbeat automático
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💓 Heartbeat stopped');
    }
  }

  /**
   * Registrar listener customizado
   */
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  /**
   * Remover listener
   */
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  /**
   * Registrar listener que dispara uma vez
   */
  once(event, callback) {
    if (!this.socket) return;
    this.socket.once(event, callback);
  }

  /**
   * Emitir evento customizado
   */
  emit(event, data) {
    Logger.debug('MultiplayerService', `Attempting to emit event: ${event}`, { data });
    
    if (!this.socket) {
      Logger.error('MultiplayerService', `Cannot emit event "${event}": socket not initialized`, new Error('Socket not initialized'), {
        hasSocket: !!this.socket,
        isConnected: this.isConnected
      });
      return false;
    }
    
    if (!this.socket.connected) {
      Logger.error('MultiplayerService', `Cannot emit event "${event}": socket not connected`, new Error('Socket not connected'), {
        hasSocket: !!this.socket,
        socketConnected: this.socket.connected,
        isConnected: this.isConnected,
        socketId: this.socket.id
      });
      return false;
    }
    
    if (!this.isConnected) {
      Logger.error('MultiplayerService', `Cannot emit event "${event}": isConnected flag is false`, new Error('isConnected is false'), {
        hasSocket: !!this.socket,
        socketConnected: this.socket.connected,
        isConnected: this.isConnected,
        socketId: this.socket.id
      });
      return false;
    }
    
    Logger.debug('MultiplayerService', `Emitting event "${event}" to server`, { eventName: event });
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Obter estatísticas do servidor
   */
  async getServerStats() {
    try {
      const response = await fetch(`${SOCKET_URL}/stats`);
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('❌ Error fetching server stats:', error);
      return null;
    }
  }

  /**
   * Verificar saúde do servidor
   */
  async checkServerHealth() {
    try {
      const response = await fetch(SOCKET_URL);
      const health = await response.json();
      console.log('🏥 Server health:', health);
      return health;
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      return null;
    }
  }
}

// Exportar instância singleton
export default new MultiplayerService();

// Exportar também a classe para instâncias múltiplas se necessário
export { MultiplayerService };
