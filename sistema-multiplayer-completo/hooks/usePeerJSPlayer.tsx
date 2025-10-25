import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';

interface UsePeerJSPlayerProps {
  sessionId: string;
  hostPeerId: string;
  userId: string;
  onStreamReceived?: (stream: MediaStream) => void;
  onDisconnected?: () => void;
  onDataReceived?: (data: unknown) => void;
}

// 🌐 LISTA DE SERVIDORES PEERJS
const PEER_SERVERS = [
  {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    name: 'PeerJS Cloud'
  }
];

export const usePeerJSPlayer = ({
  sessionId,
  hostPeerId,
  userId,
  onStreamReceived,
  onDisconnected,
  onDataReceived
}: UsePeerJSPlayerProps) => {
  const peerRef = useRef<Peer | null>(null);
  const dataConnectionRef = useRef<DataConnection | null>(null);
  const mediaConnectionRef = useRef<MediaConnection | null>(null);
  
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // 🔗 Conectar ao HOST
  const connectToHost = useCallback((peer: Peer) => {
    if (!hostPeerId) {
      console.warn('⚠️ [PLAYER] HOST PeerID não disponível');
      return;
    }

    console.log('🔗 [PLAYER] Conectando ao HOST:', hostPeerId);
    
    // Conexão de dados
    const conn = peer.connect(hostPeerId, {
      reliable: true,
      serialization: 'json'
    });
    
    dataConnectionRef.current = conn;

    conn.on('open', () => {
      console.log('✅ [PLAYER] Conectado ao HOST!');
      setIsConnected(true);
      setConnectionError(null);
      setConnectionAttempts(0);
    });

    conn.on('data', (data) => {
      console.log('📨 [PLAYER] Dados recebidos:', data);
      onDataReceived?.(data);
    });

    conn.on('close', () => {
      console.log('❌ [PLAYER] Conexão fechada');
      setIsConnected(false);
      onDisconnected?.();
    });

    conn.on('error', (error) => {
      console.error('❌ [PLAYER] Erro na conexão:', error);
      setConnectionError(error.message);
      
      // Reconectar
      if (connectionAttempts < 5) {
        console.log('🔄 [PLAYER] Reconectando em 3s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts(prev => prev + 1);
          connectToHost(peer);
        }, 3000);
      }
    });
  }, [hostPeerId, onDataReceived, onDisconnected, connectionAttempts]);

  // 🔄 Conectar ao servidor PeerJS
  const connectToPeerServer = useCallback((serverIndex: number = 0) => {
    if (serverIndex >= PEER_SERVERS.length) {
      console.error('❌ [PLAYER] Todos os servidores falharam');
      if (connectionAttempts < 3) {
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts(prev => prev + 1);
          connectToPeerServer(0);
        }, 5000);
      }
      return;
    }

    const server = PEER_SERVERS[serverIndex];
    const playerPeerId = `player-${sessionId}-${userId}-${Date.now()}`;
    
    console.log(`🎮 [PLAYER] Conectando: ${server.name}`);
    
    try {
      const peer = new Peer(playerPeerId, {
        host: server.host,
        port: server.port,
        path: server.path,
        secure: server.secure,
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log(`🟢 [PLAYER] Conectado: ${server.name}`);
        console.log(`✅ [PLAYER] PeerID: ${id}`);
        setPeerId(id);
        setConnectionAttempts(0);
        
        // Conectar ao HOST
        if (hostPeerId) {
          connectToHost(peer);
        }
      });

      // 📹 Receber stream do HOST
      peer.on('call', (call) => {
        console.log('📞 [PLAYER] Recebendo chamada...');
        mediaConnectionRef.current = call;
        call.answer(); // Aceitar chamada
        
        call.on('stream', (remoteStream) => {
          console.log('📹 [PLAYER] Stream recebido!');
          setStream(remoteStream);
          onStreamReceived?.(remoteStream);
        });

        call.on('close', () => {
          console.log('📵 [PLAYER] Stream fechado');
          setStream(null);
        });

        call.on('error', (error) => {
          console.error('❌ [PLAYER] Erro stream:', error);
        });
      });

      peer.on('error', (error) => {
        console.error(`❌ [PLAYER] Erro: ${server.name}`, error);
        
        if (error.type === 'network' || error.type === 'server-error') {
          peer.destroy();
          setTimeout(() => {
            connectToPeerServer(serverIndex + 1);
          }, 1000);
        }
      });

      peer.on('disconnected', () => {
        console.warn('⚠️ [PLAYER] Desconectado! Reconectando...');
        setIsConnected(false);
        if (!peer.destroyed) {
          peer.reconnect();
        }
      });

      peerRef.current = peer;

    } catch (error) {
      console.error('❌ [PLAYER] Exceção:', error);
      setTimeout(() => {
        connectToPeerServer(serverIndex + 1);
      }, 1000);
    }
  }, [sessionId, userId, hostPeerId, connectToHost, connectionAttempts, onStreamReceived]);

  // Inicializar
  useEffect(() => {
    if (!hostPeerId) {
      console.log('⏳ [PLAYER] Aguardando HOST PeerID...');
      return;
    }

    connectToPeerServer(0);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      dataConnectionRef.current?.close();
      mediaConnectionRef.current?.close();
      peerRef.current?.destroy();
    };
  }, [hostPeerId, connectToPeerServer]);

  // 🎮 Enviar input para HOST
  const sendInput = useCallback((input: { 
    type: string; 
    code: string; 
    key: string; 
    timestamp: number 
  }) => {
    if (dataConnectionRef.current?.open) {
      dataConnectionRef.current.send(input);
      console.log('🎮 [PLAYER] Input enviado:', input.type);
    } else {
      console.warn('⚠️ [PLAYER] Conexão não está aberta');
    }
  }, []);

  // 📤 Enviar dados genéricos
  const sendData = useCallback((data: unknown) => {
    if (dataConnectionRef.current?.open) {
      dataConnectionRef.current.send(data);
      console.log('📤 [PLAYER] Dados enviados');
    } else {
      console.warn('⚠️ [PLAYER] Conexão não está aberta');
    }
  }, []);

  return {
    peerId,
    isConnected,
    stream,
    connectionError,
    sendInput,
    sendData
  };
};
