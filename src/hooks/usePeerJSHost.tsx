import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';

export type PeerInputType = 'keydown' | 'keyup';

export interface PeerInputMessage {
  type: PeerInputType;
  code: string;
  key: string;
  timestamp: number;
}

interface UsePeerJSHostProps {
  sessionId: string;
  userId: string;
  onPlayerJoined?: (playerId: string) => void;
  onPlayerLeft?: (playerId: string) => void;
  onInputReceived?: (playerId: string, input: PeerInputMessage) => void;
}

// 🌐 LISTA DE SERVIDORES PEERJS COM FALLBACK
const PEER_SERVERS = [
  {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    name: 'PeerJS Cloud'
  }
];

// ⚠️ Flag para desabilitar PeerJS se falhar permanentemente
let PEERJS_DISABLED = false;

const isPeerInputMessage = (value: unknown): value is PeerInputMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PeerInputMessage>;
  return (
    (candidate.type === 'keydown' || candidate.type === 'keyup') &&
    typeof candidate.code === 'string' &&
    typeof candidate.key === 'string' &&
    typeof candidate.timestamp === 'number'
  );
};

export const usePeerJSHost = ({
  sessionId,
  userId,
  onPlayerJoined,
  onPlayerLeft,
  onInputReceived
}: UsePeerJSHostProps) => {
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [peerId, setPeerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<Map<string, DataConnection>>(new Map());
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // 🔗 Conectar ao servidor PeerJS
  const connectToPeerServer = useCallback(
    (serverIndex: number = 0) => {
      // ⚠️ Se PeerJS foi desabilitado, não tenta mais
      if (PEERJS_DISABLED) {
        console.warn('⚠️ [HOST] PeerJS desabilitado (servidor indisponível)');
        setIsReady(false);
        return;
      }

      // ⚠️ Limita a apenas 2 tentativas totais (evita loop infinito)
      if (serverIndex >= PEER_SERVERS.length) {
        if (connectionAttempts < 2) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts((prev) => prev + 1);
            connectToPeerServer(0);
          }, 8000); // 8 segundos entre tentativas
        } else {
          console.error('❌ [HOST] PeerJS indisponível após 2 tentativas. Desabilitado.');
          PEERJS_DISABLED = true;
          setIsReady(false);
        }
        return;
      }

      const server = PEER_SERVERS[serverIndex];
      const hostPeerId = `host-${sessionId}-${userId}-${Date.now()}`;

      try {
        const peer = new Peer(hostPeerId, {
          host: server.host,
          port: server.port,
          path: server.path,
          secure: server.secure,
          debug: 0, // ✅ Desabilita debug verbose (causa muitos logs)
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        peer.on('open', (id) => {
          console.log(`✅ [HOST] PeerJS conectado: ${id}`);
          setPeerId(id);
          setIsReady(true);
          setConnectionAttempts(0);
          PEERJS_DISABLED = false;
        });

        // 👥 Receber conexões de PLAYERS
        peer.on('connection', (dataConnection) => {
          console.log('👤 [HOST] Player conectando:', dataConnection.peer);

          setConnectedPlayers((prev) => {
            const updated = new Map(prev);
            updated.set(dataConnection.peer, dataConnection);
            return updated;
          });

          onPlayerJoined?.(dataConnection.peer);

          // Receber dados do player
          dataConnection.on('data', (payload: unknown) => {
            if (isPeerInputMessage(payload)) {
              onInputReceived?.(dataConnection.peer, payload);
            }
          });

          // Player desconectou
          dataConnection.on('close', () => {
            console.log('👋 [HOST] Player desconectou:', dataConnection.peer);
            setConnectedPlayers((prev) => {
              const updated = new Map(prev);
              updated.delete(dataConnection.peer);
              return updated;
            });
            mediaCallsRef.current.delete(dataConnection.peer);
            onPlayerLeft?.(dataConnection.peer);
          });

          dataConnection.on('error', (error) => {
            // ✅ Suprime erros de DataChannel que não são críticos
            if (error.message && !error.message.includes('destroyed')) {
              console.warn('⚠️ [HOST] Aviso DataChannel:', error.message);
            }
          });

          // Se já tem stream, enviar para o novo player
          const activeStream = streamRef.current;
          if (activeStream && peer) {
            console.log('📹 [HOST] Enviando stream para novo player');
            const call = peer.call(dataConnection.peer, activeStream);
            mediaCallsRef.current.set(dataConnection.peer, call);
            
            call.on('error', (error) => {
              if (error.message && !error.message.includes('destroyed')) {
                console.warn('⚠️ [HOST] Aviso stream:', error.message);
              }
            });
          }
        });

        peer.on('error', (error) => {
          // ✅ Apenas loga erros de rede/servidor
          if (error.type === 'network' || error.type === 'server-error') {
            console.warn(`⚠️ [HOST] Erro de conexão: ${server.name}`);
            peer.destroy();
            setTimeout(() => connectToPeerServer(serverIndex + 1), 1500);
          }
        });

        peer.on('disconnected', () => {
          // ✅ Silencia logs de desconexão se estiver destruído
          if (!peer.destroyed) {
            console.log('🔄 [HOST] Reconectando...');
            peer.reconnect();
          }
        });

        peerRef.current = peer;
      } catch (error) {
        console.warn('⚠️ [HOST] Falha ao conectar, tentando próximo servidor...');
        setTimeout(() => connectToPeerServer(serverIndex + 1), 1500);
      }
    },
    [connectionAttempts, onInputReceived, onPlayerJoined, onPlayerLeft, sessionId, userId]
  );

  // Inicializar
  useEffect(() => {
    connectToPeerServer(0);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const mediaCalls = mediaCallsRef.current;
      mediaCalls.forEach((call) => call.close());
      mediaCalls.clear();

      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;

      peerRef.current?.destroy();
    };
  }, [connectToPeerServer]);

  // 🎬 Iniciar streaming do canvas
  const startStreaming = useCallback(
    (canvas: HTMLCanvasElement) => {
      try {
        console.log('🎬 [HOST] Capturando canvas (60 FPS)...');
        const stream = canvas.captureStream(60);
        streamRef.current = stream;

        // Enviar para todos os players conectados
        const peer = peerRef.current;
        if (peer) {
          connectedPlayers.forEach((_, playerId) => {
            console.log('📤 [HOST] Enviando stream para:', playerId);
            const call = peer.call(playerId, stream);
            mediaCallsRef.current.set(playerId, call);
            
            call.on('error', (error) => {
              console.error('❌ [HOST] Erro stream:', error);
            });
          });
        }

        return stream;
      } catch (error) {
        console.error('❌ [HOST] Erro ao capturar canvas:', error);
        return null;
      }
    },
    [connectedPlayers]
  );

  // 🛑 Parar streaming
  const stopStreaming = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaCallsRef.current.forEach((call) => call.close());
    mediaCallsRef.current.clear();
  }, []);

  // 📤 Broadcast para todos os players
  const broadcastToPlayers = useCallback(
    (data: unknown) => {
      let delivered = 0;
      connectedPlayers.forEach((connection) => {
        if (connection.open) {
          connection.send(data);
          delivered++;
        }
      });

      if (delivered > 0) {
        console.log(`📤 [HOST] Broadcast para ${delivered} players`);
      }
    },
    [connectedPlayers]
  );

  // 📤 Enviar para player específico
  const sendToPlayer = useCallback(
    (playerId: string, data: unknown) => {
      const connection = connectedPlayers.get(playerId);
      if (connection?.open) {
        connection.send(data);
      }
    },
    [connectedPlayers]
  );

  return {
    peerId,
    isReady,
    connectedPlayers: Array.from(connectedPlayers.keys()),
    startStreaming,
    stopStreaming,
    broadcastToPlayers,
    sendToPlayer,
    isStreaming: streamRef.current !== null
  };
};
