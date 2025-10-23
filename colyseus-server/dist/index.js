"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const colyseus_1 = require("colyseus");
const ws_transport_1 = require("@colyseus/ws-transport");
const schema_1 = require("@colyseus/schema");
class PlayerState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.userId = '';
        this.username = '';
        this.isHost = false;
        this.joinedAt = 0;
    }
}
__decorate([
    (0, schema_1.type)('string')
], PlayerState.prototype, "userId", void 0);
__decorate([
    (0, schema_1.type)('string')
], PlayerState.prototype, "username", void 0);
__decorate([
    (0, schema_1.type)('boolean')
], PlayerState.prototype, "isHost", void 0);
__decorate([
    (0, schema_1.type)('number')
], PlayerState.prototype, "joinedAt", void 0);
class GameSessionState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.gameId = '';
        this.gameTitle = '';
        this.gamePlatform = 'snes';
        this.maxPlayers = 4;
        this.currentPlayers = 0;
        this.players = new schema_1.MapSchema();
        this.status = 'waiting';
    }
}
__decorate([
    (0, schema_1.type)('string')
], GameSessionState.prototype, "gameId", void 0);
__decorate([
    (0, schema_1.type)('string')
], GameSessionState.prototype, "gameTitle", void 0);
__decorate([
    (0, schema_1.type)('string')
], GameSessionState.prototype, "gamePlatform", void 0);
__decorate([
    (0, schema_1.type)('number')
], GameSessionState.prototype, "maxPlayers", void 0);
__decorate([
    (0, schema_1.type)('number')
], GameSessionState.prototype, "currentPlayers", void 0);
__decorate([
    (0, schema_1.type)({ map: PlayerState })
], GameSessionState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)('string')
], GameSessionState.prototype, "status", void 0);
class GameSessionRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate(options) {
        console.log('🏠 [GameSession] Criando sala com opções:', options);
        this.setState(new GameSessionState());
        this.state.gameId = options.gameId ?? '';
        this.state.gameTitle = options.gameTitle ?? 'Jogo Desconhecido';
        this.state.gamePlatform = options.gamePlatform ?? 'snes';
        this.state.maxPlayers = options.maxPlayers ?? 4;
        this.maxClients = this.state.maxPlayers;
        this.onMessage('start-game', () => {
            if (this.state.status !== 'waiting') {
                return;
            }
            this.state.status = 'playing';
            this.broadcast('game-started', { timestamp: Date.now() });
            console.log('🎮 [GameSession] Jogo iniciado na sala', this.roomId);
        });
        this.onMessage('input-command', (client, payload) => {
            this.broadcast('input-command', payload, { except: client });
        });
        this.onMessage('game-frame', (client, frame) => {
            const player = this.state.players.get(client.sessionId);
            if (player?.isHost) {
                this.broadcast('game-frame', frame, { except: client });
            }
        });
        this.onMessage('chat-message', (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) {
                return;
            }
            this.broadcast('chat-message', {
                sender: player.username,
                message: message.message,
                timestamp: Date.now()
            });
        });
        this.onMessage('player-update', (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) {
                return;
            }
            Object.assign(player, data);
        });
        this.onMessage('request-state', (client) => {
            client.send('state-sync', this.state.toJSON());
        });
        console.log('✅ [GameSession] Sala pronta:', this.roomId);
    }
    onJoin(client, options) {
        const totalClients = this.clients.length;
        console.log(`👤 [GameSession] Cliente ${client.sessionId} entrou (${totalClients}/${this.maxClients})`);
        const player = new PlayerState();
        player.userId = options.userId ?? '';
        player.username = options.username ?? `Jogador ${totalClients}`;
        player.joinedAt = Date.now();
        player.isHost = totalClients === 1;
        this.state.players.set(client.sessionId, player);
        this.state.currentPlayers = totalClients;
        this.broadcast('player-joined', {
            playerId: client.sessionId,
            username: player.username,
            isHost: player.isHost
        });
        client.send('room-state', {
            roomId: this.roomId,
            players: Array.from(this.state.players.entries()).map(([sessionId, data]) => ({
                sessionId,
                username: data.username,
                isHost: data.isHost
            }))
        });
    }
    onLeave(client) {
        const player = this.state.players.get(client.sessionId);
        this.state.players.delete(client.sessionId);
        this.state.currentPlayers = Math.max(0, this.clients.length);
        this.broadcast('player-left', { playerId: client.sessionId });
        console.log(`👋 [GameSession] Cliente ${client.sessionId} saiu. Restam ${this.state.currentPlayers}`);
        if (player?.isHost && this.state.currentPlayers > 0) {
            const [newHostId, newHost] = Array.from(this.state.players.entries())[0];
            if (newHost) {
                newHost.isHost = true;
                this.broadcast('host-changed', { hostId: newHostId, username: newHost.username });
                console.log(`👑 [GameSession] Novo host definido: ${newHost.username}`);
            }
        }
    }
    onDispose() {
        console.log(`🗑️ [GameSession] Sala ${this.roomId} descartada`);
    }
}
const app = (0, express_1.default)();
// Configuração CORS para permitir conexões do frontend
app.use((0, cors_1.default)({
    origin: true, // Aceitar todas as origens no Colyseus Cloud
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    try {
        res.json({ status: 'ok', timestamp: Date.now() });
    }
    catch (err) {
        console.error('❌ [Health] Erro:', err);
        res.status(500).json({ status: 'error' });
    }
});
// Stats
app.get('/stats', (_req, res) => {
    try {
        res.json({ status: 'running', timestamp: Date.now() });
    }
    catch (err) {
        console.error('❌ [Stats] Erro:', err);
        res.status(500).json({ status: 'error' });
    }
});
// Welcome endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'PlayNowEmulator - Colyseus Server',
        status: 'running',
        timestamp: Date.now()
    });
});
const port = Number(process.env.PORT ?? 2567);
try {
    const httpServer = (0, http_1.createServer)(app);
    const gameServer = new colyseus_1.Server({
        transport: new ws_transport_1.WebSocketTransport({
            server: httpServer
        })
    });
    gameServer.define('game_session', GameSessionRoom);
    gameServer.onShutdown(() => {
        console.log('🛑 [Server] Encerrando servidor Colyseus');
    });
    httpServer.listen(port, '0.0.0.0', () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║      🎮 PlayNowEmulator - Colyseus Cloud Server      ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        console.log(`🚀 Servidor escutando em 0.0.0.0:${port}`);
        console.log('📡 Endpoint de saúde: /health');
        console.log('📊 Endpoint de stats: /stats');
        console.log('');
        console.log('✅ Servidor pronto para aceitar conexões!');
        console.log('');
    });
    // Tratamento de erros do servidor HTTP
    httpServer.on('error', (err) => {
        console.error('❌ [HTTP Server] Erro:', err);
        process.exit(1);
    });
    // Tratamento de erros não capturados
    process.on('uncaughtException', (err) => {
        console.error('❌ [Uncaught Exception]', err);
        process.exit(1);
    });
    process.on('unhandledRejection', (err) => {
        console.error('❌ [Unhandled Rejection]', err);
        process.exit(1);
    });
}
catch (error) {
    console.error('❌ [Init] Erro ao inicializar servidor:', error);
    process.exit(1);
}
