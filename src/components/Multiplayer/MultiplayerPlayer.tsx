import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useColyseusConnection } from '../../hooks/useColyseusConnection';
import { Loader2, Send, Volume2, Users } from 'lucide-react';

interface MultiplayerPlayerProps {
  sessionId: string;
  onClose?: () => void;
  userId?: string;
  username?: string;
}

interface FramePayload {
  frame: string;        // data URL (base64)
  timestamp?: number;
  frameNumber?: number;
  sizeKB?: number;
}

export const MultiplayerPlayer: React.FC<MultiplayerPlayerProps> = ({
  sessionId,
  onClose,
  userId: propUserId,
  username: propUsername
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [players, setPlayers] = useState<string[]>([]);

  const lastFrameTimeRef = useRef<number>(Date.now());
  const fpsRef = useRef<number>(0);

  // Usar props se fornecidas, senão usar contexto auth
  const userId = propUserId || user?.id;
  const username = propUsername || user?.username;

  // ========== COLYSEUS HOOK ==========
  const {
    joinRoom,
    leaveRoom,
    sendFrame,
    sendMessage,
    currentRoom,
    isHost,
    getPlayerCount,
    addEventListener
  } = useColyseusConnection({
    onRoomJoined: (room) => {
      console.log('✅ [PLAYER] Entrou na sala:', room.roomId);
      setIsConnected(true);
    },
    onDisconnected: () => {
      console.log('❌ [PLAYER] Desconectado da sala');
      setIsConnected(false);
      setStreamActive(false);
    },
    onError: (error) => {
      console.error('❌ [PLAYER] Erro:', error);
    }
  });

  // ========== CONECTAR À SALA ==========
  useEffect(() => {
    if (!userId || !username) {
      console.error('❌ [PLAYER] Usuário não autenticado');
      return;
    }

    const connectToRoom = async () => {
      try {
        console.log('🎮 [PLAYER] Conectando à sala:', sessionId);
        
        await joinRoom(sessionId, {
          userId,
          username
        });

        console.log('✅ [PLAYER] Conectado com sucesso');
      } catch (error: any) {
        console.error('❌ [PLAYER] Erro ao conectar:', error.message);
      }
    };

    connectToRoom();

    return () => {
      console.log('👋 [PLAYER] Limpando conexão...');
      leaveRoom();
    };
  }, [sessionId, userId, username, joinRoom, leaveRoom]);

  // ========== LISTENER DE FRAMES ==========
  useEffect(() => {
    const handleGameFrame = (data: FramePayload) => {
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
      img.onload = () => {
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
          console.log(`📐 [PLAYER] Canvas redimensionado: ${img.width}x${img.height}`);
        }

        ctx.drawImage(img, 0, 0);
        setFrameCount((prev) => prev + 1);
      };

      img.onerror = () => {
        console.error('❌ [PLAYER] Erro ao carregar imagem de frame');
      };

      img.src = data.frame;
    };

    const handleChatMessage = (message: any) => {
      console.log('💬 [PLAYER] Mensagem recebida:', message);
      setChatMessages((prev) => [...prev, message]);
    };

    const handlePlayerUpdate = (data: any) => {
      console.log('👤 [PLAYER] Atualização de jogador:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    addEventListener('game-frame', handleGameFrame);
    addEventListener('chat-message', handleChatMessage);
    addEventListener('player-update', handlePlayerUpdate);

    return () => {
      // Listeners são removidos automaticamente quando o componente desmontar
    };
  }, [streamActive, addEventListener]);

  // ========== ENVIAR FRAME (HOST ONLY) ==========
  const handleSendFrame = (frameData: FramePayload) => {
    if (!isHost) {
      console.warn('⚠️ [PLAYER] Apenas host pode enviar frames');
      return;
    }

    sendFrame(frameData);
  };

  // ========== ENVIAR MENSAGEM DE CHAT ==========
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    console.log('💬 [PLAYER] Enviando mensagem:', chatInput);
    sendMessage(chatInput);
    
    setChatMessages((prev) => [...prev, {
      sender: username || 'You',
      message: chatInput
    }]);
    setChatInput('');
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Multiplayer Game</h2>
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Conectado
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <Loader2 className="animate-spin" size={16} />
              Conectando...
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            👥 {getPlayerCount()} jogadores
          </div>
          <div className="text-sm">
            🎬 {frameCount} frames
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Game Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
          </div>
          
          {/* FPS Display */}
          {streamActive && (
            <div className="mt-2 text-sm text-gray-400">
              📊 FPS: {fpsRef.current} | Frames: {frameCount}
            </div>
          )}
        </div>

        {/* Sidebar - Players & Chat */}
        <div className="w-64 flex flex-col gap-4">
          {/* Players List */}
          <div className="bg-gray-800 rounded-lg p-4 flex-shrink-0">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Users size={18} />
              Jogadores ({getPlayerCount()})
            </h3>
            <div className="space-y-1 text-sm">
              {players.map((player, idx) => (
                <div key={idx} className="text-gray-300">
                  • {player}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col overflow-hidden">
            <h3 className="font-bold mb-2">💬 Chat</h3>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto mb-3 space-y-2 text-sm">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500">Nenhuma mensagem ainda...</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="text-gray-300">
                    <span className="font-semibold text-purple-400">{msg.sender}:</span> {msg.message}
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mensagem..."
                className="flex-1 px-3 py-2 bg-gray-700 rounded text-white text-sm placeholder-gray-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-purple-600 hover:bg-purple-700 p-2 rounded"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Audio Control */}
          <div className="bg-gray-800 rounded-lg p-4">
            <button className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 py-2 rounded">
              <Volume2 size={18} />
              Som: ON
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {!isConnected && (
        <div className="bg-yellow-600/20 border-t border-yellow-600 p-3 text-yellow-200 text-sm">
          ⚠️ Conectando ao servidor Colyseus...
        </div>
      )}
    </div>
  );
};