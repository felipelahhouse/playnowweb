const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors());

// Socket.IO com CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Estrutura de dados
const rooms = new Map();
const players = new Map();

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PlayNowEmulator Socket.IO',
    rooms: rooms.size,
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/stats', (req, res) => {
  const roomStats = [];
  rooms.forEach((room, roomId) => {
    roomStats.push({
      roomId,
      players: room.players.length,
      host: room.host
    });
  });
  
  res.json({
    totalRooms: rooms.size,
    totalPlayers: players.size,
    rooms: roomStats
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id);
  
  socket.on('join-room', (data) => {
    const { sessionId, gameCore, gameRom, playerName } = data;
    
    socket.join(sessionId);
    
    let room = rooms.get(sessionId);
    let isHost = false;
    
    if (!room) {
      isHost = true;
      room = {
        id: sessionId,
        host: socket.id,
        players: [],
        gameCore,
        gameRom,
        createdAt: Date.now()
      };
      rooms.set(sessionId, room);
    }
    
    const player = {
      id: socket.id,
      sessionId,
      isHost,
      name: playerName || `Player ${room.players.length + 1}`,
      joinedAt: Date.now()
    };
    
    room.players.push(player);
    players.set(socket.id, player);
    
    socket.emit('joined-room', {
      success: true,
      isHost,
      playerId: socket.id,
      sessionId,
      players: room.players.length
    });
    
    io.to(sessionId).emit('player-joined', {
      player,
      totalPlayers: room.players.length,
      players: room.players
    });
  });
  
  socket.on('input', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    socket.to(player.sessionId).emit('player-input', {
      playerId: socket.id,
      playerName: player.name,
      key: data.key,
      type: data.type,
      timestamp: data.timestamp || Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id);
    
    const player = players.get(socket.id);
    if (!player) return;
    
    const room = rooms.get(player.sessionId);
    if (!room) return;
    
    room.players = room.players.filter(p => p.id !== socket.id);
    players.delete(socket.id);
    
    io.to(player.sessionId).emit('player-left', {
      playerId: socket.id,
      playerName: player.name,
      totalPlayers: room.players.length,
      players: room.players
    });
    
    if (player.isHost && room.players.length > 0) {
      const newHost = room.players[0];
      newHost.isHost = true;
      room.host = newHost.id;
      
      io.to(newHost.id).emit('promoted-to-host', {
        message: 'Você é o novo HOST!',
        players: room.players
      });
    }
    
    if (room.players.length === 0) {
      rooms.delete(player.sessionId);
    }
  });
  
  socket.on('heartbeat', () => {
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });
});

// Limpeza automática
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > oneHour && room.players.length === 0) {
      rooms.delete(roomId);
      console.log('🧹 Cleaned room:', roomId);
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🎮 PlayNowEmulator Socket.IO        ║
║  ✅ Server running on port ${PORT}    ║
╚═══════════════════════════════════════╝
  `);
});
