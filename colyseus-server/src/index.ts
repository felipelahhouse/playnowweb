import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Room, Server, Client } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { MapSchema, Schema, type } from '@colyseus/schema';

class PlayerState extends Schema {
  @type('string')
  public userId = '';

  @type('string')
  public username = '';

  @type('boolean')
  public isHost = false;

  @type('number')
  public joinedAt = 0;
}

class GameSessionState extends Schema {
  @type('string')
  public gameId = '';

  @type('string')
  public gameTitle = '';

  @type('string')
  public gamePlatform = 'snes';

  @type('number')
  public maxPlayers = 4;

  @type('number')
  public currentPlayers = 0;

  @type({ map: PlayerState })
  public players = new MapSchema<PlayerState>();

  @type('string')
  public status: 'waiting' | 'playing' | 'finished' = 'waiting';
}

interface GameSessionOptions {
  sessionName?: string;
  gameId?: string;
  gameTitle?: string;
  gamePlatform?: string;
  maxPlayers?: number;
  hostUserId?: string;
  hostName?: string;
}

class GameSessionRoom extends Room<GameSessionState> {
  public maxClients = 4;

  public onCreate(options: GameSessionOptions) {
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

    this.onMessage('chat-message', (client, message: { message: string }) => {
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

    this.onMessage('player-update', (client, data: Partial<PlayerState>) => {
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

  public onJoin(client: Client, options: { userId?: string; username?: string }) {
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

  public onLeave(client: Client) {
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

  public onDispose() {
    console.log(`🗑️ [GameSession] Sala ${this.roomId} descartada`);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/stats', (_req, res) => {
  res.json({ status: 'running', timestamp: Date.now() });
});

const port = Number(process.env.PORT ?? 2567);
const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer })
});

gameServer.define('game_session', GameSessionRoom);

gameServer.onShutdown(() => {
  console.log('🛑 [Server] Encerrando servidor Colyseus');
});

httpServer.listen(port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      🎮 PlayNowEmulator - Colyseus Cloud Server      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`🚀 Servidor escutando na porta ${port}`);
  console.log('📡 Endpoint de saúde: /health');
  console.log('');
});
