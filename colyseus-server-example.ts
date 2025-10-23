/**
 * 🎮 Servidor Colyseus - Exemplo Completo para Multiplayer Emulator
 * 
 * Instruções:
 * 1. Criar pasta: mkdir colyseus-server
 * 2. Copiar este arquivo como server.ts
 * 3. npm init -y
 * 4. npm install colyseus express typescript ts-node
 * 5. npm install -D @types/node
 * 6. npx ts-node server.ts
 */

import { Server, LobbyRoom, Client, Room } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws";
import { Schema, MapSchema, type } from "@colyseus/schema";
import express from "express";
import cors from "cors";

// ============================================================
// STATE SCHEMAS
// ============================================================

class PlayerData extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("boolean") isHost: boolean = false;
  @type("number") joinedAt: number = 0;
}

class GameSessionState extends Schema {
  @type("string") gameId: string = "";
  @type("string") gameTitle: string = "";
  @type("string") gamePlatform: string = "";
  @type("number") maxPlayers: number = 4;
  @type("number") currentPlayers: number = 0;
  @type({ map: PlayerData }) players = new MapSchema<PlayerData>();
  @type("string") status: string = "waiting"; // waiting, playing, finished
}

// ============================================================
// GAME SESSION ROOM
// ============================================================

export class GameSession extends Room<GameSessionState> {
  maxClients: number = 4;

  /**
   * Executado quando a sala é criada
   */
  onCreate(options: any) {
    console.log("🏠 [GameSession] Nova sala criada com opções:", options);

    // Inicializar estado
    const state = new GameSessionState();
    state.gameId = options.gameId || "";
    state.gameTitle = options.gameTitle || "Jogo Desconhecido";
    state.gamePlatform = options.gamePlatform || "snes";
    state.maxPlayers = options.maxPlayers || 4;
    state.currentPlayers = 0;
    
    this.setState(state);

    // Lock the room when it's full
    this.onMessage("start-game", (client, message) => {
      console.log("🎮 [GameSession] Host iniciou o jogo");
      this.state.status = "playing";
      this.broadcast("game-started", { timestamp: Date.now() });
      this.maxClients = this.clients.length; // Lock
    });

    this.onMessage("input-command", (client, input) => {
      // Enviar input para todos EXCETO o remetente
      this.broadcast("input-command", input, { except: client });
    });

    this.onMessage("game-frame", (client, frameData) => {
      // Host envia frame para todos os players
      const player = this.state.players.get(client.sessionId);
      if (player && player.isHost) {
        this.broadcast("game-frame", frameData, { except: client });
      }
    });

    this.onMessage("chat-message", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("chat-message", {
          sender: player.username,
          message: data.message,
          timestamp: Date.now()
        });
      }
    });

    this.onMessage("player-update", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        Object.assign(player, data);
      }
    });

    // Sync estado quando necessário
    this.onMessage("request-state", (client) => {
      client.send("state-sync", this.state.toJSON());
    });

    console.log("✅ [GameSession] Sala " + this.roomId + " pronta!");
  }

  /**
   * Executado quando um cliente entra na sala
   */
  onJoin(client: Client, options: any) {
    console.log(
      `👤 [GameSession] Cliente ${client.sessionId} entrou. Total: ${this.clients.length}/${this.maxClients}`
    );

    // Criar dados do jogador
    const playerData = new PlayerData();
    playerData.userId = options.userId || "";
    playerData.username = options.username || `Player ${this.clients.length}`;
    playerData.isHost = this.clients.length === 1; // Primeiro a entrar é host
    playerData.joinedAt = Date.now();

    // Adicionar ao estado
    this.state.players.set(client.sessionId, playerData);
    this.state.currentPlayers = this.clients.length;

    // Notificar todos que novo jogador entrou
    this.broadcast("player-joined", {
      playerId: client.sessionId,
      username: playerData.username,
      isHost: playerData.isHost
    });

    // Enviar estado atual para o novo cliente
    client.send("room-state", {
      roomId: this.roomId,
      players: Array.from(this.state.players.entries()).map(([id, p]) => ({
        sessionId: id,
        username: p.username,
        isHost: p.isHost
      }))
    });

    console.log(
      `✅ [GameSession] Jogadores na sala: ${this.state.currentPlayers}`
    );
  }

  /**
   * Executado quando cliente sai
   */
  onLeave(client: Client) {
    console.log(
      `👋 [GameSession] Cliente ${client.sessionId} saiu. Total: ${
        this.clients.length - 1
      }/${this.maxClients}`
    );

    // Remover do estado
    this.state.players.delete(client.sessionId);
    this.state.currentPlayers = this.clients.length - 1;

    // Notificar todos que jogador saiu
    this.broadcast("player-left", { playerId: client.sessionId });

    // Se host saiu, promover novo host
    if (this.state.currentPlayers > 0) {
      const firstPlayer = this.state.players.values().next().value;
      if (firstPlayer) {
        firstPlayer.isHost = true;
        this.broadcast("host-changed", {
          newHostId: Array.from(this.state.players.entries())[0][0]
        });
      }
    }
  }

  /**
   * Executado quando sala é descartada
   */
  onDispose() {
    console.log(`🗑️ [GameSession] Sala ${this.roomId} descartada`);
  }
}

// ============================================================
// LOBBY ROOM (Optional - para debug/admin)
// ============================================================

class LobbyState extends Schema {
  @type({ map: "number" }) roomsCount = new MapSchema<number>();
}

export class Lobby extends LobbyRoom<LobbyState> {
  onCreate() {
    this.setState(new LobbyState());
    console.log("🎪 [Lobby] Lobby criado");
  }

  onJoin(client: Client) {
    console.log("👤 [Lobby] Cliente entrou no lobby");
    this.send(client, "welcome", {
      message: "Bem-vindo ao Multiplayer Emulator!"
    });
  }
}

// ============================================================
// SERVER SETUP
// ============================================================

const app = express();
const port = process.env.PORT || 2567;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Stats endpoint
app.get("/stats", (req, res) => {
  res.json({
    port,
    timestamp: Date.now(),
    message: "Servidor Colyseus rodando"
  });
});

// Criar servidor Colyseus
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: require("http").createServer(app)
  })
});

// Registrar rooms
gameServer.define("game_session", GameSession);
gameServer.define("lobby", Lobby);

// Monitorar conexões
gameServer.onConnection((client) => {
  console.log(`🔌 [SERVER] Cliente conectado: ${client.sessionId}`);
});

gameServer.onDisconnection((client) => {
  console.log(`🔌 [SERVER] Cliente desconectado: ${client.sessionId}`);
});

// Listen
gameServer.listen(port as number);

console.log("");
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║      🎮 Servidor Colyseus Multiplayer Emulator        ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log("");
console.log(`✅ Servidor rodando em ws://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/health`);
console.log(`📈 Stats: http://localhost:${port}/stats`);
console.log("");
console.log("Rooms disponíveis:");
console.log("  • game_session  - Salas de jogo multiplayer");
console.log("  • lobby         - Lobby (opcional)");
console.log("");
console.log("Aguardando conexões...");
console.log("");