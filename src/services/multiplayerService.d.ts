import { Socket } from 'socket.io-client';

interface JoinRoomResponse {
  success: boolean;
  isHost: boolean;
  players: string[];
  playerId: string;
}

declare class MultiplayerService {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: string | null;
  isHost: boolean;
  playerId: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  heartbeatInterval?: NodeJS.Timeout;

  connect(): Socket;
  setupEventHandlers(): void;
  joinRoom(sessionId: string, playerName: string, gameCore?: string, gameRom?: string): Promise<JoinRoomResponse>;
  rejoinRoom(): void;
  sendInput(key: string, type: string, playerIndex?: number): void;
  syncGameState(state: Record<string, unknown>): void;
  sendChatMessage(message: string): void;
  leaveRoom(): void;
  disconnect(): void;
  isSocketConnected(): boolean;
  getSocketId(): string | null;
  isRoomHost(): boolean;
  sendHeartbeat(): void;
  startHeartbeat(interval?: number): void;
  stopHeartbeat(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback?: (...args: unknown[]) => void): void;
  once(event: string, callback: (...args: unknown[]) => void): void;
  emit(event: string, data?: Record<string, unknown> | string | number): void;
  getServerStats(): Promise<Record<string, unknown> | null>;
  checkServerHealth(): Promise<Record<string, unknown> | null>;
}

declare const multiplayerService: MultiplayerService;

export default multiplayerService;
export { MultiplayerService };
