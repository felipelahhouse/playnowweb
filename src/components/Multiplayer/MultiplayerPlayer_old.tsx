import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

interface MultiplayerPlayerProps {
  sessionId: string;
  onClose: () => void;
}

export const MultiplayerPlayer: React.FC<MultiplayerPlayerProps> = ({
  sessionId,
  onClose
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const fpsRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.id || !user?.username) {
      console.error('❌ [PLAYER] User not authenticated');
      return;
    }

    // Detectar URL do Socket.IO
    let SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    
    if (!SOCKET_URL) {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        SOCKET_URL = 'http://localhost:3000';
      } else {
        SOCKET_URL = `${protocol}//${hostname}`;
      }
    }
    
    console.log('[PLAYER] Conectando ao servidor Socket.IO...', SOCKET_URL);
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    // ========== CONEXÃO ==========
    socket.on('connect', () => {
      console.log('✅ [PLAYER] Socket conectado!', socket.id);
      setIsConnected(true);

      // Entrar na sessão como PLAYER
      console.log('[PLAYER] Entrando na sessão:', sessionId);
      socket.emit('join-or-create-session', {
        sessionId,
        userId: user.id,
        username: user.username,
        isHost: false
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ [PLAYER] Socket desconectado');
      setIsConnected(false);
      setStreamActive(false);
    });

    socket.on('error', (error: any) => {
      console.error('❌ [PLAYER] Erro:', error);
    });

    // ========== EVENTOS DE SALA ==========
    socket.on('room-created', (data: any) => {
      console.log('🏠 [PLAYER] Sala criada/joinada:', data);
    });

    socket.on('room-joined', (data: any) => {
      console.log('✅ [PLAYER] Entrou na sala:', data.room_code);
    });

    // ========== EVENTO CRÍTICO: RECEBER FRAMES ==========
    socket.on('stream-frame', (data: any) => {
      console.log('🎞️ [PLAYER] Frame recebido!', data?.frame ? `${data.frame.length} bytes` : 'SEM DADOS');
      
      if (!canvasRef.current) {
        console.warn('⚠️ [PLAYER] Canvas não encontrado!');
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        console.error('❌ [PLAYER] Contexto 2D não disponível!');
        return;
      }

      // Marcar stream como ativo
      if (!streamActive) {
        setStreamActive(true);
        console.log('🎬 [PLAYER] Stream iniciado!');
      }

      // Calcular FPS
      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      if (delta > 0) {
        fpsRef.current = Math.round(1000 / delta);
      }
      lastFrameTimeRef.current = now;

      // Desenhar o frame
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Ajustar tamanho do canvas para o frame recebido
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
          console.log(`📐 [PLAYER] Canvas redimensionado: ${img.width}x${img.height}`);
        }

        // Limpar canvas antes de desenhar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar frame no canvas
        ctx.drawImage(img, 0, 0);
        console.log(`✅ [PLAYER] Frame renderizado #${frameCount + 1}`);
        
        // Atualizar contador
        setFrameCount((prev) => prev + 1);
      };

      img.onerror = (err) => {
        console.error('❌ [PLAYER] Erro ao carregar imagem do frame:', err);
      };

      // Carregar imagem do frame (base64)
      img.src = data.frame;
    });

    // ========== SINCRONIZAÇÃO ==========
    socket.on('sync-state', (data: any) => {
      console.log('🔄 [PLAYER] Recebendo sync-state', data?.frame ? `${data.frame.length} bytes` : 'SEM DADOS');
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      if (!streamActive) {
        setStreamActive(true);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        console.log('✅ [PLAYER] Sync-state frame renderizado:', `${img.width}x${img.height}`);
      };

      img.onerror = (err) => {
        console.error('❌ [PLAYER] Erro ao carregar sync-state frame:', err);
      };

      img.src = data.frame;
    });

    // Cleanup
    return () => {
      console.log('[PLAYER] Desconectando...');
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id, user?.username]);

  const handleClose = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      {/* DEBUG INFO */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        borderRadius: 5,
        zIndex: 9999
      }}>
        <div>🎮 <strong>MULTIPLAYER PLAYER</strong></div>
        <div>Socket: {isConnected ? '✅ Conectado' : '❌ Desconectado'}</div>
        <div>Stream: {streamActive ? '✅ ATIVO' : '⏸️ Aguardando...'}</div>
        <div>Canvas: {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'N/A'}</div>
        <div>Frames: {frameCount}</div>
        <div>FPS: {fpsRef.current}</div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(255,0,0,0.7)',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 5,
          cursor: 'pointer',
          zIndex: 10000,
          fontSize: 14
        }}
      >
        ✕ Sair
      </button>

      {/* CANVAS - EXIBE O JOGO */}
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          backgroundColor: '#222',
          border: '2px solid #0f0'
        }}
      />

      {/* MENSAGEM SE NÃO TEM STREAM */}
      {!streamActive && isConnected && (
        <div style={{
          color: '#fff',
          fontSize: 20,
          textAlign: 'center',
          marginBottom: 20
        }}>
          ⏳ Aguardando host iniciar o jogo...
        </div>
      )}

      {!isConnected && (
        <div style={{
          color: '#f00',
          fontSize: 20,
          textAlign: 'center',
          marginBottom: 20
        }}>
          ❌ Desconectado. Tentando reconectar...
        </div>
      )}
    </div>
  );
};

export default MultiplayerPlayer;