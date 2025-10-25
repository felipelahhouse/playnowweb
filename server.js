import express from 'express';
import { createServer } from 'http';
// ❌ REMOVIDO: Socket.IO não é necessário - usamos apenas PeerJS/WebRTC
// import { Server } from 'socket.io';
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
    'https://playnowweb.onrender.com', // ✅ Render.com
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    'http://localhost:3000'
  ];

  // Aceitar qualquer replit.dev domain
  if (origin && origin.includes('.replit.dev')) {
    return callback(null, true);
  }

  // Aceitar qualquer onrender.com domain
  if (origin && origin.includes('.onrender.com')) {
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
// 🎮 PEERJS SERVER INTEGRATION - OTIMIZADO PARA RENDER.COM
// ============================================================
const peerServer = ExpressPeerServer(httpServer, {
  debug: true, // ✅ Sempre ativar debug para ver logs
  path: '/peerjs', // ✅ Path completo
  allow_discovery: true,
  proxied: true, // ✅ Importante para Render.com (reverse proxy)
  alive_timeout: 60000,
  key: 'peerjs',
  concurrent_limit: 5000
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`🔌 [PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`🔌 [PeerJS] Client disconnected: ${client.getId()}`);
});

peerServer.on('error', (error) => {
  console.error('❌ [PeerJS] Server Error:', error);
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

// ❌ REMOVIDO: Socket.IO - Sistema usa apenas PeerJS/WebRTC
// Todo o código de multiplayer é feito via WebRTC peer-to-peer
// Não precisamos de Socket.IO para sincronização

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PlayNowEmulator PeerJS Server',
    version: '2.0.0',
    protocol: 'WebRTC',
    peerjs: {
      path: '/peerjs',
      debug: process.env.NODE_ENV !== 'production'
    },
    timestamp: new Date().toISOString()
  });
});

// ❌ REMOVIDO: Todo código Socket.IO - Sistema usa apenas PeerJS/WebRTC
// O multiplayer funciona completamente peer-to-peer via WebRTC
// Não há necessidade de servidor centralizado para sincronização

const PORT = process.env.PORT || 10000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║  🎮 PlayNowEmulator PeerJS Server                 ║
║  ✅ Server running on port ${PORT}                 ║
║  🌐 WebRTC signaling ready                        ║
║  📡 Path: /peerjs                                 ║
╚═══════════════════════════════════════════════════╝
  `);
});
