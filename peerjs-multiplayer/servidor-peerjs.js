// ==========================================
// 🎮 SERVIDOR PEERJS MULTIPLAYER
// WebRTC P2P + PeerJS Server
// Deploy: Render.com
// ==========================================

const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// BANCO DE DADOS DE SALAS (em memória)
// ==========================================
const salas = new Map();
// Estrutura: { roomId: { host: peerId, players: [peerId], name: string, game: string, created: timestamp } }

// ==========================================
// API REST - GERENCIAMENTO DE SALAS
// ==========================================

// Listar todas as salas disponíveis
app.get('/api/salas', (req, res) => {
  const salasArray = Array.from(salas.entries()).map(([id, sala]) => ({
    id,
    name: sala.name,
    game: sala.game,
    host: sala.host,
    players: sala.players.length,
    maxPlayers: 4,
    created: sala.created,
    isFull: sala.players.length >= 4
  }));
  
  console.log(`📋 [API] Listando ${salasArray.length} salas disponíveis`);
  res.json({ salas: salasArray, total: salasArray.length });
});

// Criar nova sala
app.post('/api/salas/criar', (req, res) => {
  const { roomId, hostPeerId, name, game } = req.body;
  
  if (!roomId || !hostPeerId || !name) {
    return res.status(400).json({ error: 'roomId, hostPeerId e name são obrigatórios' });
  }

  if (salas.has(roomId)) {
    return res.status(409).json({ error: 'Sala já existe com este ID' });
  }

  const novaSala = {
    host: hostPeerId,
    players: [],
    name,
    game: game || 'Jogo não especificado',
    created: Date.now()
  };

  salas.set(roomId, novaSala);
  
  console.log('\n' + '='.repeat(60));
  console.log('🏠 NOVA SALA CRIADA');
  console.log(`   ID: ${roomId}`);
  console.log(`   Nome: ${name}`);
  console.log(`   Host: ${hostPeerId}`);
  console.log(`   Jogo: ${novaSala.game}`);
  console.log('='.repeat(60) + '\n');

  res.json({ 
    success: true, 
    roomId, 
    sala: novaSala 
  });
});

// Entrar em uma sala
app.post('/api/salas/entrar', (req, res) => {
  const { roomId, playerPeerId } = req.body;
  
  if (!roomId || !playerPeerId) {
    return res.status(400).json({ error: 'roomId e playerPeerId são obrigatórios' });
  }

  const sala = salas.get(roomId);
  
  if (!sala) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }

  if (sala.players.length >= 4) {
    return res.status(403).json({ error: 'Sala cheia (máximo 4 jogadores)' });
  }

  if (sala.players.includes(playerPeerId)) {
    return res.status(409).json({ error: 'Você já está nesta sala' });
  }

  sala.players.push(playerPeerId);
  
  console.log('\n' + '='.repeat(60));
  console.log('👤 JOGADOR ENTROU NA SALA');
  console.log(`   Sala: ${roomId}`);
  console.log(`   Player: ${playerPeerId}`);
  console.log(`   Total: ${sala.players.length}/4`);
  console.log('='.repeat(60) + '\n');

  res.json({ 
    success: true, 
    sala,
    playerIndex: sala.players.length
  });
});

// Sair de uma sala
app.post('/api/salas/sair', (req, res) => {
  const { roomId, playerPeerId } = req.body;
  
  if (!roomId || !playerPeerId) {
    return res.status(400).json({ error: 'roomId e playerPeerId são obrigatórios' });
  }

  const sala = salas.get(roomId);
  
  if (!sala) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }

  // Remover player da lista
  sala.players = sala.players.filter(id => id !== playerPeerId);
  
  // Se o host saiu, deletar a sala
  if (sala.host === playerPeerId) {
    salas.delete(roomId);
    console.log(`🗑️  [API] Sala ${roomId} deletada (host saiu)`);
    return res.json({ success: true, salaFechada: true });
  }

  console.log(`👋 [API] Player ${playerPeerId} saiu da sala ${roomId}`);
  res.json({ success: true, sala });
});

// Deletar sala (apenas host)
app.delete('/api/salas/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { hostPeerId } = req.body;
  
  const sala = salas.get(roomId);
  
  if (!sala) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }

  if (sala.host !== hostPeerId) {
    return res.status(403).json({ error: 'Apenas o host pode deletar a sala' });
  }

  salas.delete(roomId);
  console.log(`🗑️  [API] Sala ${roomId} deletada pelo host`);
  
  res.json({ success: true });
});

// Obter informações de uma sala específica
app.get('/api/salas/:roomId', (req, res) => {
  const { roomId } = req.params;
  const sala = salas.get(roomId);
  
  if (!sala) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }

  res.json({ 
    id: roomId,
    ...sala,
    playersCount: sala.players.length,
    isFull: sala.players.length >= 4
  });
});

// ==========================================
// PÁGINA INICIAL
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎮 PeerJS Multiplayer Server</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(0,0,0,0.3);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .status {
          background: rgba(76, 175, 80, 0.3);
          border: 2px solid #4CAF50;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .info {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: left;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          background: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s;
        }
        .btn:hover {
          background: #45a049;
          transform: scale(1.05);
        }
        code {
          background: rgba(0,0,0,0.5);
          padding: 5px 10px;
          border-radius: 5px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 PeerJS Multiplayer Server</h1>
        
        <div class="status">
          ✅ Servidor Online e Funcionando!
        </div>

        <div class="info">
          <h3>📡 Informações do Servidor:</h3>
          <p><strong>PeerJS Server:</strong> <code>wss://${req.get('host') || 'localhost:' + PORT}/peerjs</code></p>
          <p><strong>API REST:</strong> <code>https://${req.get('host') || 'localhost:' + PORT}/api</code></p>
          <p><strong>Porta:</strong> ${PORT}</p>
        </div>

        <div class="info">
          <h3>🎯 Endpoints Disponíveis:</h3>
          <p>• <code>GET /api/salas</code> - Listar todas as salas</p>
          <p>• <code>POST /api/salas/criar</code> - Criar nova sala</p>
          <p>• <code>POST /api/salas/entrar</code> - Entrar em uma sala</p>
          <p>• <code>POST /api/salas/sair</code> - Sair de uma sala</p>
          <p>• <code>GET /api/salas/:roomId</code> - Info de uma sala</p>
        </div>

        <div>
          <a href="/lobby.html" class="btn">🏠 Ir para Lobby</a>
          <a href="/api/salas" class="btn">📋 Ver Salas (JSON)</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ==========================================
// SERVIDOR HTTP
// ==========================================
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 PEERJS MULTIPLAYER SERVER');
  console.log('='.repeat(60));
  console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 PeerJS Server: ws://localhost:${PORT}/peerjs`);
  console.log('='.repeat(60) + '\n');
});

// ==========================================
// PEERJS SERVER
// ==========================================
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  debug: true,
  allow_discovery: true
});

app.use('/peerjs', peerServer);

// Event listeners do PeerJS
peerServer.on('connection', (client) => {
  console.log(`🔌 [PEER] Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`❌ [PEER] Cliente desconectado: ${client.getId()}`);
  
  // Remover de todas as salas
  salas.forEach((sala, roomId) => {
    const clientId = client.getId();
    
    // Se era o host, deletar sala
    if (sala.host === clientId) {
      salas.delete(roomId);
      console.log(`🗑️  [PEER] Sala ${roomId} deletada (host desconectou)`);
    } 
    // Se era player, remover da lista
    else if (sala.players.includes(clientId)) {
      sala.players = sala.players.filter(id => id !== clientId);
      console.log(`👋 [PEER] Player removido da sala ${roomId}`);
    }
  });
});

// ==========================================
// LIMPEZA AUTOMÁTICA DE SALAS ANTIGAS
// ==========================================
setInterval(() => {
  const agora = Date.now();
  const TIMEOUT = 30 * 60 * 1000; // 30 minutos

  salas.forEach((sala, roomId) => {
    if (agora - sala.created > TIMEOUT) {
      salas.delete(roomId);
      console.log(`🧹 [CLEANUP] Sala ${roomId} removida (timeout)`);
    }
  });
}, 5 * 60 * 1000); // Verificar a cada 5 minutos

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada:', reason);
});
