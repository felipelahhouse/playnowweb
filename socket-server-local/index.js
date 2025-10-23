import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// ============================================
// EXPRESS & SOCKET.IO SETUP
// ============================================

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io/',
  maxHttpBufferSize: 1e6
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());

// ============================================
// DATA STRUCTURES
// ============================================

const lobbySessions = new Map();
const players = new Map();

// ============================================
// REST ENDPOINTS
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PlayNowEmulator Socket.IO Server (LOCAL)',
    version: '2.0.0',
    deployment: 'Local Development',
    timestamp: new Date().toISOString(),
    stats: {
      lobbySessions: lobbySessions.size,
      connectedPlayers: players.size
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/stats', (req, res) => {
  const roomStats = Array.from(lobbySessions.values()).map(session => ({
    sessionId: session.id,
    gameTitle: session.gameTitle,
    gamePlatform: session.gamePlatform,
    hostName: session.hostName,
    currentPlayers: session.currentPlayers,
    maxPlayers: session.maxPlayers,
    status: session.status,
    createdAt: session.createdAt
  }));

  res.json({
    timestamp: new Date().toISOString(),
    lobbySessions: lobbySessions.size,
    connectedPlayers: players.size,
    sessions: roomStats
  });
});

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`✅ [${socket.id}] Player connected`);

  // -------- LOBBY EVENTS --------

  socket.on('get-lobby-sessions', () => {
    console.log(`📡 [${socket.id}] Requesting lobby sessions`);
    const sessions = Array.from(lobbySessions.values()).filter(
      s => s.status === 'waiting' || s.status === 'playing'
    );
    socket.emit('lobby-sessions', { sessions });
  });

  socket.on('create-session', async (data) => {
    try {
      const {
        sessionName,
        gameId,
        gameTitle,
        gamePlatform,
        gameCover,
        maxPlayers,
        isPublic,
        hostUserId,
        hostName
      } = data;

      console.log(`🎮 [${socket.id}] Creating session: ${sessionName}`);

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = {
        id: sessionId,
        sessionName,
        gameId,
        gameTitle,
        gamePlatform,
        gameCover,
        maxPlayers,
        currentPlayers: 1,
        isPublic,
        hostUserId,
        hostName,
        players: [
          {
            id: socket.id,
            userId: hostUserId,
            name: hostName,
            isHost: true,
            joinedAt: Date.now()
          }
        ],
        status: 'waiting',
        createdAt: new Date().toISOString()
      };

      lobbySessions.set(sessionId, session);
      socket.join(sessionId);

      // Notify all players about new session
      io.emit('session-created', session);
      console.log(`✅ Session created: ${sessionId}`);

    } catch (error) {
      console.error(`❌ [${socket.id}] Error creating session:`, error);
      socket.emit('session-error', { error: error.message });
    }
  });

  socket.on('join-session', async (data) => {
    try {
      const { sessionId, userId, userName } = data;

      console.log(`🚪 [${socket.id}] Joining session: ${sessionId}`);

      const session = lobbySessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.currentPlayers >= session.maxPlayers) {
        throw new Error('Session is full');
      }

      // Add player to session
      const player = {
        id: socket.id,
        userId,
        name: userName,
        isHost: false,
        joinedAt: Date.now()
      };

      session.players.push(player);
      session.currentPlayers++;

      players.set(socket.id, {
        sessionId,
        userId,
        userName,
        isHost: false
      });

      socket.join(sessionId);

      // Notify session creator
      socket.emit('joined-session', {
        success: true,
        sessionId,
        session,
        playerId: socket.id
      });

      // Notify all in session about new player
      io.to(sessionId).emit('player-joined-session', {
        player,
        totalPlayers: session.currentPlayers,
        players: session.players
      });

      // Update lobby with new player count
      io.emit('session-updated', session);

      console.log(`✅ [${socket.id}] Joined session: ${sessionId} (${session.currentPlayers}/${session.maxPlayers})`);

    } catch (error) {
      console.error(`❌ [${socket.id}] Error joining session:`, error);
      socket.emit('session-error', { error: error.message });
    }
  });

  socket.on('start-session', (data) => {
    try {
      const { sessionId } = data;
      const session = lobbySessions.get(sessionId);

      if (!session) throw new Error('Session not found');
      if (session.status !== 'waiting') throw new Error('Session is not in waiting state');

      session.status = 'playing';
      io.to(sessionId).emit('session-started', { session });
      io.emit('session-updated', session);

      console.log(`🎮 Session started: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error starting session:`, error);
      socket.emit('session-error', { error: error.message });
    }
  });

  socket.on('leave-session', (data) => {
    try {
      const { sessionId } = data;
      const session = lobbySessions.get(sessionId);

      if (!session) return;

      session.players = session.players.filter(p => p.id !== socket.id);
      session.currentPlayers--;

      socket.leave(sessionId);
      players.delete(socket.id);

      if (session.currentPlayers === 0) {
        lobbySessions.delete(sessionId);
        io.emit('session-removed', { sessionId });
        console.log(`🗑️ Session deleted: ${sessionId}`);
      } else {
        // Promote new host if host left
        if (session.players.length > 0) {
          const newHost = session.players[0];
          newHost.isHost = true;
          io.to(sessionId).emit('new-host', {
            hostId: newHost.id,
            hostName: newHost.name
          });
        }

        io.emit('session-updated', session);
        console.log(`👤 Player left session: ${sessionId} (${session.currentPlayers} remaining)`);
      }
    } catch (error) {
      console.error(`❌ Error leaving session:`, error);
    }
  });

  // -------- GAME EVENTS --------

  socket.on('player-input', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const { sessionId } = player;
    const { key, type, playerIndex } = data;

    socket.to(sessionId).emit('input-received', {
      playerId: socket.id,
      playerName: player.userName,
      key,
      type,
      playerIndex,
      timestamp: Date.now()
    });
  });

  socket.on('sync-state', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.isHost) return;

    const { sessionId } = player;
    socket.to(sessionId).emit('state-synced', {
      hostId: socket.id,
      state: data.state,
      timestamp: Date.now()
    });
  });

  socket.on('chat-message', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const { sessionId } = player;
    const { message } = data;

    io.to(sessionId).emit('chat-received', {
      playerId: socket.id,
      playerName: player.userName,
      message,
      timestamp: Date.now()
    });
  });

  socket.on('heartbeat', () => {
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });

  // -------- DISCONNECT --------

  socket.on('disconnect', () => {
    console.log(`❌ [${socket.id}] Player disconnected`);

    const player = players.get(socket.id);
    if (!player) return;

    const session = lobbySessions.get(player.sessionId);
    if (session) {
      session.players = session.players.filter(p => p.id !== socket.id);
      session.currentPlayers--;

      if (session.currentPlayers === 0) {
        lobbySessions.delete(player.sessionId);
        io.emit('session-removed', { sessionId: player.sessionId });
      } else {
        // Promote new host if needed
        if (session.players.some(p => p.isHost === false)) {
          const newHost = session.players[0];
          newHost.isHost = true;
          io.to(player.sessionId).emit('new-host', {
            hostId: newHost.id,
            hostName: newHost.name
          });
        }

        io.emit('session-updated', session);
        io.to(player.sessionId).emit('player-left-session', {
          playerId: socket.id,
          totalPlayers: session.currentPlayers,
          players: session.players
        });
      }
    }

    players.delete(socket.id);
  });
});

// ============================================
// CLEANUP INTERVAL
// ============================================

setInterval(() => {
  const now = Date.now();
  const SESSION_TIMEOUT = 3600000; // 1 hour

  lobbySessions.forEach((session, sessionId) => {
    if (now - new Date(session.createdAt).getTime() > SESSION_TIMEOUT && session.currentPlayers === 0) {
      lobbySessions.delete(sessionId);
      console.log(`🧹 Cleaned inactive session: ${sessionId}`);
    }
  });
}, 300000); // Check every 5 minutes

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Local Socket.IO server running on port ${PORT}`);
  console.log(`📍 WebSocket path: /socket.io/`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`💻 Connect from: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});