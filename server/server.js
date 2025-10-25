import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ExpressPeerServer } from 'peer';

const app = express();
const httpServer = createServer(app);

// 🔧 Função para validar CORS dinamicamente
const corsOriginValidator = (origin, callback) => {
  // Allowed origins
  const allowedOrigins = [
    'https://playnowemulator.com',
    'https://www.playnowemulator.com',
    'https://planowemulator.web.app',
  'http://localhost:5173',
  'http://localhost:5174',
    'http://localhost:5000',
    'http://localhost:3000'
  ];

  // Aceitar qualquer replit.dev domain
  if (origin && origin.includes('.replit.dev')) {
    return callback(null, true);
  }

  // Aceitar origens na whitelist
  if (allowedOrigins.includes(origin) || !origin) {
    return callback(null, true);
  }

  // Rejeitar outros
  callback(new Error('Not allowed by CORS'));
};

// Configuração CORS
app.use(cors({
  origin: corsOriginValidator,
  credentials: true
}));

// ============================================================
// 🔒 SECURITY HEADERS & CACHE CONTROL
// ============================================================

// Headers de segurança globais
app.use((req, res, next) => {
  // Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // URLs do Socket.IO permitidas
  const socketUrls = [
    'https://play-now-emulator-felipelars.replit.app',
    'wss://play-now-emulator-felipelars.replit.app',
    'https://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev',
    'wss://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev',
    'http://localhost:5000',
    'ws://localhost:5000',
    'http://localhost:3000',
  'ws://localhost:3000',
  'http://localhost:5174',
  'ws://localhost:5174'
  ];

  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    `connect-src 'self' ${socketUrls.join(' ')}`,
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-src 'self'",
    "frame-ancestors 'self'"
  ].join('; '));

  // Forçar charset correto em HTML
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
  }

  next();
});

// Arquivos estáticos com cache otimizado (assets com hash)
app.use('/assets', express.static('dist/assets', {
  setHeaders: (res, filePath) => {
    const path = require('path');
    const basename = path.basename(filePath);
    
    // Se o arquivo tem hash no nome (ex: index.abc123def.js)
    if (/\.[a-f0-9]{8,}\./.test(basename)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Sem hash = cache moderado
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// ROMs com cache permanente (arquivos estáveis)
app.use('/roms', express.static('public/roms', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// ============================================================
// 🎮 PEERJS SERVER INTEGRATION
// ============================================================
const peerServer = ExpressPeerServer(httpServer, {
  debug: process.env.NODE_ENV !== 'production',
  path: '/',
  allow_discovery: true
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`🔌 [PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`🔌 [PeerJS] Client disconnected: ${client.getId()}`);
});

console.log('🎮 [PeerJS] Server initialized on /peerjs');

// ============================================================
// 📦 BACKUP - CONFIGURAÇÃO ANTERIOR (COMENTADA)
// ============================================================
/*
// CONFIGURAÇÃO ORIGINAL (ANTES DE 18/10/2025):
// - Sem headers de segurança
// - Sem cache otimizado
// - Sem CSP (Content Security Policy)

// Exemplo:
// app.use(cors({
//   origin: corsOriginValidator,
//   credentials: true
// }));
*/
// ============================================================

// Socket.IO com CORS
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Estrutura para armazenar salas e jogadores
const rooms = new Map();
const players = new Map();

// Health check endpoint
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

io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`);
  console.log(`   Hora: ${new Date().toLocaleTimeString()}`);
  console.log(`   Total conectados: ${io.engine.clientsCount}`);
  
  // 🔥 NOVO: Player join notification
  socket.on('player-join', (data) => {
    const { sessionId, userId, username } = data;
    console.log(`👤 [PLAYER JOIN] ${username} (${userId}) joining session ${sessionId}`);
    
    // Notificar host que novo player entrou
    io.to(sessionId).emit('player-joined-notification', {
      userId: userId,
      username: username,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  });
  
  // 🔥 FIX: Criar sala
  socket.on('create-room', (data) => {
    const { game, username } = data;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log(`👑 Creating room: ${roomCode} by ${socket.id}`);
    
    const room = {
      id: roomCode,
      host: socket.id,
      players: [],
      game: game,
      createdAt: Date.now()
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    const player = {
      id: socket.id,
      sessionId: roomCode,
      isHost: true,
      name: username || 'Host',
      joinedAt: Date.now()
    };
    
    room.players.push(player);
    players.set(socket.id, player);
    
    socket.emit('room-created', {
      room_code: roomCode,
      role: 'host',
      game: game
    });
    
    console.log(`✅ Room ${roomCode} created`);
  });
  
  // 🔥 FIX: Entrar em sala existente
  socket.on('join-room', (data) => {
    const { roomCode, username } = data;
    
    console.log(`🎮 Player ${socket.id} joining room: ${roomCode}`);
    
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    socket.join(roomCode);
    
    const player = {
      id: socket.id,
      sessionId: roomCode,
      isHost: false,
      name: username || `Player ${room.players.length + 1}`,
      joinedAt: Date.now()
    };
    
    room.players.push(player);
    players.set(socket.id, player);
    
    socket.emit('room-joined', {
      room_code: roomCode,
      role: 'spectator',
      game: room.game
    });
    
    // Notificar outros jogadores
    socket.to(roomCode).emit('player-joined', {
      username: player.name,
      totalPlayers: room.players.length
    });
    
    console.log(`✅ Player joined room ${roomCode}`);
  });
  
  // 🔥 FIX: Join or create session (compatibilidade)
  socket.on('join-or-create-session', (data) => {
    const { sessionId, game, username } = data;
    
    console.log(`🎮 Player ${socket.id} join-or-create: ${sessionId}`);
    
    // Adicionar socket à sala
    socket.join(sessionId);
    
    // Verificar se a sala já existe
    let room = rooms.get(sessionId);
    let isHost = false;
    
    if (!room) {
      // Primeira pessoa = HOST
      isHost = true;
      room = {
        id: sessionId,
        host: socket.id,
        players: [],
        game: game,
        createdAt: Date.now()
      };
      rooms.set(sessionId, room);
      console.log(`👑 Room created by HOST: ${socket.id}`);
    }
    
    // Adicionar jogador à sala
    const player = {
      id: socket.id,
      sessionId: sessionId,
      isHost: isHost,
      name: username || `Player ${room.players.length + 1}`,
      joinedAt: Date.now()
    };
    
    room.players.push(player);
    players.set(socket.id, player);
    
    // Confirmar conexão para o jogador
    socket.emit('joined-room', {
      success: true,
      isHost: isHost,
      playerId: socket.id,
      sessionId: sessionId,
      players: room.players.length
    });
    
    // Notificar todos na sala sobre novo jogador
    io.to(sessionId).emit('player-joined', {
      player: player,
      totalPlayers: room.players.length,
      players: room.players
    });
    
    console.log(`📊 Room ${sessionId}: ${room.players.length} players`);
  });
  
  // Receber input do jogador e broadcast para outros
  socket.on('input', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const { key, type, timestamp } = data;
    
    // Broadcast para todos na sala EXCETO o sender
    socket.to(player.sessionId).emit('player-input', {
      playerId: socket.id,
      playerName: player.name,
      key: key,
      type: type,
      timestamp: timestamp || Date.now()
    });
  });
  
  // 🔥 FIX: Sincronizar frames do jogo (60 FPS)
  socket.on('sync-state', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.isHost) return; // Apenas HOST pode enviar frames
    
    const { frame, state, timestamp } = data;
    
    // 🚀 OTIMIZAÇÃO: Broadcast frames para todos os guests
    socket.to(player.sessionId).emit('state-update', {
      frame: frame,
      state: state,
      timestamp: timestamp || Date.now()
    });
  });
  
  // 🎥 🔥 NOVO: Receber frames do HOST via stream-frame (MultiplayerHostView)
  socket.on('stream-frame', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.isHost) {
      console.warn(`[STREAM-FRAME] ❌ Player ${socket.id} not a host, ignoring frame`);
      return; // Apenas HOST pode enviar frames
    }
    
    const { frame, timestamp, frameNumber, sizeKB } = data;
    
    // Log a cada 30 frames
    if (frameNumber % 30 === 0) {
      console.log(`[STREAM-FRAME] 📤 HOST ${socket.id} enviando frame #${frameNumber} (${sizeKB}KB) para sala ${player.sessionId}`);
    }
    
    // 🚀 CRÍTICO: Broadcast frames para TODOS OS PLAYERS na sala (exceto o host)
    socket.to(player.sessionId).emit('game-frame', {
      frame: frame,
      timestamp: timestamp || Date.now(),
      frameNumber: frameNumber,
      sizeKB: sizeKB
    });
  });
  
  // Mensagens de chat (opcional)
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
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    
    const player = players.get(socket.id);
    if (!player) return;
    
    const room = rooms.get(player.sessionId);
    if (!room) return;
    
    // Remover jogador da sala
    room.players = room.players.filter(p => p.id !== socket.id);
    players.delete(socket.id);
    
    // Notificar outros jogadores
    io.to(player.sessionId).emit('player-left', {
      playerId: socket.id,
      playerName: player.name,
      totalPlayers: room.players.length,
      players: room.players
    });
    
    // Se era o host, promover novo host
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
    
    // Se sala ficou vazia, deletar
    if (room.players.length === 0) {
      rooms.delete(player.sessionId);
      console.log(`🗑️ Room deleted: ${player.sessionId}`);
    }
    
    console.log(`📊 Room ${player.sessionId}: ${room.players.length} players remaining`);
  });
  
  // Heartbeat para manter conexão ativa
  socket.on('heartbeat', () => {
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });
});

// Limpeza de salas inativas (após 1 hora)
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > oneHour && room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned inactive room: ${roomId}`);
    }
  });
}, 5 * 60 * 1000); // Verifica a cada 5 minutos

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║  🎮 PlayNowEmulator Socket.IO Server              ║
║  ✅ Server running on port ${PORT}                 ║
║  🌐 Ready to accept connections                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
