import { Client } from 'colyseus.js';

// 🎮 CONFIGURAÇÃO COLYSEUS CLOUD
const COLYSEUS_URL = import.meta.env.VITE_COLYSEUS_URL || 'wss://your-project.colyseus.dev';

console.log('🎮 [COLYSEUS] URL:', COLYSEUS_URL);

class ColyseusService {
  constructor() {
    this.client = null;
    this.room = null;
    this.isConnected = false;
    this.currentRoomId = null;
    this.playerId = null;
    this.isHost = false;
    this.eventHandlers = {};
  }

  /**
   * Conectar ao servidor Colyseus
   */
  async connect() {
    if (this.isConnected && this.client) {
      console.log('✅ [COLYSEUS] Já conectado ao servidor');
      return this.client;
    }

    try {
      console.log('🔌 [COLYSEUS] Conectando ao servidor...', COLYSEUS_URL);
      this.client = new Client(COLYSEUS_URL);
      console.log('✅ [COLYSEUS] Cliente Colyseus criado');
      this.isConnected = true;
      return this.client;
    } catch (error) {
      console.error('❌ [COLYSEUS] Erro ao conectar:', error);
      throw error;
    }
  }

  /**
   * Criar nova sala multiplayer
   */
  async createRoom(roomData) {
    if (!this.client) {
      await this.connect();
    }

    try {
      console.log('🏠 [COLYSEUS] Criando sala...', roomData);
      
      // room_name: nome da sala (ex: "game_session")
      // options: dados da sala
      this.room = await this.client.create('game_session', {
        sessionName: roomData.sessionName,
        gameId: roomData.gameId,
        gameTitle: roomData.gameTitle,
        gamePlatform: roomData.gamePlatform,
        hostUserId: roomData.hostUserId,
        hostName: roomData.hostName,
        maxPlayers: roomData.maxPlayers || 4,
        isPublic: roomData.isPublic ?? true,
        gameCover: roomData.gameCover
      });

      this.currentRoomId = this.room.roomId;
      this.playerId = this.room.sessionId;
      this.isHost = true;

      this.setupRoomHandlers();

      console.log('✅ [COLYSEUS] Sala criada:', this.currentRoomId);
      return this.room;
    } catch (error) {
      console.error('❌ [COLYSEUS] Erro ao criar sala:', error);
      throw error;
    }
  }

  /**
   * Listar salas disponíveis
   */
  async listRooms() {
    if (!this.client) {
      await this.connect();
    }

    try {
      console.log('📋 [COLYSEUS] Buscando salas disponíveis...');
      const availableRooms = await this.client.getAvailableRooms('game_session');
      console.log('✅ [COLYSEUS] Salas encontradas:', availableRooms.length);
      return availableRooms;
    } catch (error) {
      console.error('❌ [COLYSEUS] Erro ao listar salas:', error);
      throw error;
    }
  }

  /**
   * Entrar em uma sala existente
   */
  async joinRoom(roomId, playerData) {
    if (!this.client) {
      await this.connect();
    }

    try {
      console.log('🎮 [COLYSEUS] Entrando na sala:', roomId, playerData);
      
      this.room = await this.client.joinById(roomId, {
        userId: playerData.userId,
        username: playerData.username
      });

      this.currentRoomId = this.room.roomId;
      this.playerId = this.room.sessionId;
      this.isHost = false;

      this.setupRoomHandlers();

      console.log('✅ [COLYSEUS] Entrou na sala:', roomId);
      return this.room;
    } catch (error) {
      console.error('❌ [COLYSEUS] Erro ao entrar na sala:', error);
      throw error;
    }
  }

  /**
   * Configurar handlers de eventos da sala
   */
  setupRoomHandlers() {
    if (!this.room) return;

    // ========== STATE UPDATES ==========
    this.room.onStateChange.once(() => {
      console.log('🔄 [COLYSEUS] Estado inicial recebido');
      this.emit('state-change', this.room.state);
    });

    this.room.onStateChange((state) => {
      this.emit('state-updated', state);
    });

    // ========== MENSAGENS CUSTOMIZADAS ==========
    this.room.onMessage('game-frame', (message) => {
      this.emit('game-frame', message);
    });

    this.room.onMessage('input-command', (message) => {
      this.emit('input-command', message);
    });

    this.room.onMessage('chat-message', (message) => {
      this.emit('chat-message', message);
    });

    this.room.onMessage('player-update', (message) => {
      this.emit('player-update', message);
    });

    // ========== JOGADORES NA SALA ==========
    this.room.state.players?.onAdd((player, key) => {
      console.log('👤 [COLYSEUS] Novo jogador:', key, player);
      this.emit('player-joined', { playerId: key, player });
    });

    this.room.state.players?.onChange((player, key) => {
      this.emit('player-changed', { playerId: key, player });
    });

    this.room.state.players?.onRemove((player, key) => {
      console.log('👤 [COLYSEUS] Jogador saiu:', key);
      this.emit('player-left', { playerId: key });
    });

    // ========== DESCONEXÃO ==========
    this.room.onLeave((code) => {
      console.warn('⚠️ [COLYSEUS] Desconectado da sala. Código:', code);
      this.emit('disconnected', code);
      this.room = null;
    });

    this.room.onError((code, message) => {
      console.error('❌ [COLYSEUS] Erro na sala:', code, message);
      this.emit('error', { code, message });
    });
  }

  /**
   * Enviar comando de input
   */
  sendInputCommand(input) {
    if (!this.room) {
      console.warn('⚠️ [COLYSEUS] Não há sala ativa');
      return;
    }

    this.room.send('input-command', input);
  }

  /**
   * Enviar frame de jogo (host)
   */
  sendGameFrame(frameData) {
    if (!this.room || !this.isHost) {
      console.warn('⚠️ [COLYSEUS] Apenas o host pode enviar frames');
      return;
    }

    this.room.send('game-frame', frameData);
  }

  /**
   * Enviar mensagem de chat
   */
  sendChatMessage(message) {
    if (!this.room) {
      console.warn('⚠️ [COLYSEUS] Não há sala ativa');
      return;
    }

    this.room.send('chat-message', {
      timestamp: Date.now(),
      message
    });
  }

  /**
   * Atualizar estado do jogador
   */
  updatePlayerState(playerState) {
    if (!this.room) {
      console.warn('⚠️ [COLYSEUS] Não há sala ativa');
      return;
    }

    this.room.send('player-update', playerState);
  }

  /**
   * Event Emitter básico
   */
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(callback => callback(data));
    }
  }

  /**
   * Sair da sala
   */
  async leaveRoom() {
    if (this.room) {
      console.log('👋 [COLYSEUS] Saindo da sala...');
      await this.room.leave();
      this.room = null;
      this.currentRoomId = null;
      this.isHost = false;
    }
  }

  /**
   * Desconectar completamente
   */
  disconnect() {
    this.leaveRoom();
    if (this.client) {
      this.client.close();
      this.client = null;
      this.isConnected = false;
    }
    console.log('✅ [COLYSEUS] Desconectado');
  }

  /**
   * Getters
   */
  getRoom() {
    return this.room;
  }

  getRoomId() {
    return this.currentRoomId;
  }

  getPlayerId() {
    return this.playerId;
  }

  isRoomHost() {
    return this.isHost;
  }

  getPlayerCount() {
    if (!this.room?.state?.players) return 0;
    return Object.keys(this.room.state.players).length;
  }

  getPlayers() {
    if (!this.room?.state?.players) return {};
    return this.room.state.players;
  }
}

export default new ColyseusService();