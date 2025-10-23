import { onRequest } from 'firebase-functions/v2/https';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

// Estrutura para salas e jogadores
const rooms = new Map();
const players = new Map();
const lobbySessions = new Map();

// Criar Express app
const app = express();

// Criar servidor HTTP verdadeiro
const httpServer = createServer(app);

// IMPORTANTE: Inicializar o servidor para ativar o Socket.IO engine
// Usar porta 0 = porta aleatória disponível
httpServer.listen(0, () => {
  console.log('🚀 Socket.IO HTTP Server initialized');
});

// Middleware para CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Configurar rotas Express
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PlayNowEmulator Socket.IO Server',
    version: '1.0.0',
    rooms: rooms.size,
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/stats', (req, res) => {
  const roomStats = Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    players: room.players.length,
    host: room.host,
    gameCore: room.gameCore,
    gameRom: room.gameRom
  }));

  res.json({
    totalRooms: rooms.size,
    totalPlayers: players.size,
    rooms: roomStats
  });
});

// Criar instância do Socket.IO e anexar ao servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io/'
});

// Configurar Socket.IO handlers
io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);
    
    socket.on('join-room', (data) => {
      const { sessionId, gameCore, gameRom, playerName } = data;
      
      console.log(`🎮 Player ${socket.id} joining room: ${sessionId}`);
      
      socket.join(sessionId);
      
      let room = rooms.get(sessionId);
      let isHost = false;
      
      if (!room) {
        isHost = true;
        room = {
          id: sessionId,
          host: socket.id,
          players: [],
          gameCore: gameCore,
          gameRom: gameRom,
          createdAt: Date.now()
        };
        rooms.set(sessionId, room);
        console.log(`👑 Room created by HOST: ${socket.id}`);
      }
      
      const player = {
        id: socket.id,
        sessionId: sessionId,
        isHost: isHost,
        name: playerName || `Player ${room.players.length + 1}`,
        joinedAt: Date.now()
      };
      
      room.players.push(player);
      players.set(socket.id, player);
      
      socket.emit('joined-room', {
        success: true,
        isHost: isHost,
        playerId: socket.id,
        sessionId: sessionId,
        players: room.players.length
      });
      
      io.to(sessionId).emit('player-joined', {
        player: player,
        totalPlayers: room.players.length,
        players: room.players
      });
      
      console.log(`📊 Room ${sessionId}: ${room.players.length} players`);
    });
    
    socket.on('input', (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      
      const { key, type, timestamp } = data;
      
      socket.to(player.sessionId).emit('player-input', {
        playerId: socket.id,
        playerName: player.name,
        key: key,
        type: type,
        timestamp: timestamp || Date.now()
      });
    });
    
    socket.on('sync-state', (data) => {
      const player = players.get(socket.id);
      if (!player || !player.isHost) return;
      
      const { state, timestamp } = data;
      
      socket.to(player.sessionId).emit('game-state', {
        state: state,
        timestamp: timestamp || Date.now()
      });
    });
    
    socket.on('chat-message', (data) => {
      const player = players.get(socket.id);
      if (!player) return;
      
      const { message } = data;
      
      io.to(player.sessionId).emit('chat-message', {
        playerId: socket.id,
        playerName: player.name,
        message: message,
        timestamp: Date.now()
      });
    });
    
    socket.on('leave-room', () => {
      const player = players.get(socket.id);
      if (!player) return;
      
      console.log(`🚪 Player ${socket.id} leaving room: ${player.sessionId}`);
      handlePlayerLeave(socket.id, player);
    });
    
    socket.on('rejoin-room', (data) => {
      const { sessionId, playerId } = data;
      console.log(`🔄 Player ${socket.id} trying to rejoin: ${sessionId}`);
      
      const room = rooms.get(sessionId);
      if (!room) {
        socket.emit('rejoin-failed', {
          error: 'Room not found'
        });
        return;
      }
      
      const existingPlayer = room.players.find(p => p.id === playerId);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        players.delete(playerId);
        players.set(socket.id, existingPlayer);
        socket.join(sessionId);
        
        socket.emit('rejoined-room', {
          success: true,
          isHost: existingPlayer.isHost,
          players: room.players.length
        });
        
        io.to(sessionId).emit('player-rejoined', {
          playerId: socket.id,
          playerName: existingPlayer.name
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id}`);
      
      const player = players.get(socket.id);
      if (!player) return;
      
      handlePlayerLeave(socket.id, player);
    });
    
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack', { timestamp: Date.now() });
    });
    
    socket.on('get-room-info', (data) => {
      const { sessionId } = data;
      const room = rooms.get(sessionId);
      
      if (!room) {
        socket.emit('room-info', { error: 'Room not found' });
        return;
      }
      
      socket.emit('room-info', {
        roomId: room.id,
        host: room.host,
        players: room.players,
        gameCore: room.gameCore,
        gameRom: room.gameRom,
        createdAt: room.createdAt
      });
    });

    // 🎮 LOBBY EVENTS - Para a tela de Multiplayer Lobby
    socket.on('get-lobby-sessions', () => {
      console.log('📋 Solicitando lista de sessões para lobby');
      
      // Enviar lista atual de sessões do lobby
      const sessions = Array.from(lobbySessions.values());
      socket.emit('lobby-sessions', { sessions });
    });

    socket.on('create-session', (data) => {
      console.log('📥 [create-session] Evento recebido do cliente:', socket.id);
      console.log('📥 [create-session] Dados recebidos:', JSON.stringify(data, null, 2));
      
      try {
        const { sessionName, gameTitle, gamePlatform, maxPlayers, isPublic, hostUserId, hostName, gameId, gameCover } = data;
        
        // Validação dos dados obrigatórios
        if (!sessionName || !sessionName.trim()) {
          console.error('❌ [create-session] Erro: sessionName vazio');
          socket.emit('session-error', { error: 'Nome da sessão é obrigatório' });
          return;
        }

        if (!gameTitle || !gameTitle.trim()) {
          console.error('❌ [create-session] Erro: gameTitle vazio');
          socket.emit('session-error', { error: 'Título do jogo é obrigatório' });
          return;
        }

        if (!gamePlatform || !gamePlatform.trim()) {
          console.error('❌ [create-session] Erro: gamePlatform vazio');
          socket.emit('session-error', { error: 'Plataforma é obrigatória' });
          return;
        }

        if (!hostUserId || !hostUserId.trim()) {
          console.error('❌ [create-session] Erro: hostUserId vazio');
          socket.emit('session-error', { error: 'ID do host é obrigatório' });
          return;
        }

        if (!hostName || !hostName.trim()) {
          console.error('❌ [create-session] Erro: hostName vazio');
          socket.emit('session-error', { error: 'Nome do host é obrigatório' });
          return;
        }

        console.log(`✅ [create-session] Validação OK. Criando sessão: ${sessionName}`);
        
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
          id: sessionId,
          hostUserId,
          hostName,
          gameId: gameId || gameTitle.toLowerCase().replace(/\s+/g, '_'),
          gameTitle,
          gamePlatform,
          sessionName,
          isPublic: isPublic !== undefined ? isPublic : true,
          maxPlayers: maxPlayers || 4,
          currentPlayers: 1,
          players: [hostUserId],
          status: 'waiting',
          createdAt: new Date().toISOString(),
          gameCover: gameCover || null
        };
        
        lobbySessions.set(sessionId, session);
        console.log(`💾 [create-session] Sessão salva no Map. Total de sessões: ${lobbySessions.size}`);
        
        // 1. Responder ao socket que criou a sessão (IMPORTANTE!)
        console.log(`📤 [create-session] Enviando session-created para o cliente ${socket.id}`);
        socket.emit('session-created', session);
        
        // 2. Notificar outros clientes também (excluindo quem criou)
        console.log(`📤 [create-session] Enviando broadcast session-created para outros clientes`);
        socket.broadcast.emit('session-created', session);
        
        console.log(`✅ [create-session] Sessão criada com sucesso: ${sessionId}`);
      } catch (error) {
        console.error('❌ [create-session] Erro ao processar:', error);
        console.error('❌ [create-session] Stack:', error.stack);
        socket.emit('session-error', { error: 'Erro interno ao criar sessão. Tente novamente.' });
      }
    });
  });

function handlePlayerLeave(socketId, player) {
  const room = rooms.get(player.sessionId);
  if (!room) return;
  
  room.players = room.players.filter(p => p.id !== socketId);
  players.delete(socketId);
  
  io.to(player.sessionId).emit('player-left', {
    playerId: socketId,
    playerName: player.name,
    totalPlayers: room.players.length,
    players: room.players
  });
  
  if (player.isHost && room.players.length > 0) {
    const newHost = room.players[0];
    newHost.isHost = true;
    room.host = newHost.id;
    
    io.to(newHost.id).emit('promoted-to-host', {
      message: 'Você agora é o HOST!',
      players: room.players
    });
    
    io.to(player.sessionId).emit('new-host', {
      hostId: newHost.id,
      hostName: newHost.name
    });
    
    console.log(`👑 New host promoted: ${newHost.id}`);
  }
  
  if (room.players.length === 0) {
    rooms.delete(player.sessionId);
    console.log(`🗑️ Room deleted: ${player.sessionId}`);
  } else {
    console.log(`📊 Room ${player.sessionId}: ${room.players.length} players remaining`);
  }
}

// Limpeza de salas inativas
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > oneHour && room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned inactive room: ${roomId}`);
    }
  });
}, 5 * 60 * 1000);

// Export como Cloud Function - emitir requisições para o httpServer
export const socketio = onRequest({
  timeoutSeconds: 540,
  memory: '512MiB',
  cors: true,
  maxInstances: 10
}, (req, res) => {
  // Forçar httpServer a processar a requisição
  // Isso faz tanto Express quanto Socket.IO funcionarem
  httpServer.emit('request', req, res);
});
