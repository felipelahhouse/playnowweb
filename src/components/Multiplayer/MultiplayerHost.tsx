/**
 * 🎮 Multiplayer Host Component
 * Componente para criar e hospedar sessão multiplayer
 * Usa Socket.IO para sincronização
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Users, Copy, Check, Crown, Wifi, WifiOff, AlertCircle } from 'lucide-react';
// @ts-expect-error - JavaScript module with types in .d.ts file
import multiplayerService from '../../services/multiplayerService';
import { useAuth } from '../../contexts/AuthContext';

interface MultiplayerHostProps {
  sessionId: string;
  gameTitle: string;
  onClose: () => void;
}

const MultiplayerHostComponent: React.FC<MultiplayerHostProps> = ({
  sessionId,
  gameTitle,
  onClose
}) => {
  const { user } = useAuth();
  const socketRef = useRef<any>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<Map<string, string>>(new Map());
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // URL para compartilhar
  const shareUrl = `${window.location.origin}/multiplayer/join/${sessionId}`;

  useEffect(() => {
    if (!user?.id || !user?.username) {
      setError('Você precisa estar logado');
      setStatus('error');
      return;
    }

    let isMounted = true;

    const setupHost = async () => {
      try {
        console.log('👑 [HOST] Inicializando host para sala:', sessionId);
        
        // Conectar ao servidor Socket.IO
        const socket = multiplayerService.connect();
        if (!socket) {
          throw new Error('Socket não inicializado');
        }

        socketRef.current = socket;

        // Aguardar conexão
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000);
          
          if (socket.connected) {
            clearTimeout(timeout);
            resolve();
          } else {
            socket.once('connect', () => {
              clearTimeout(timeout);
              resolve();
            });
            socket.once('connect_error', () => {
              clearTimeout(timeout);
              reject(new Error('Falha ao conectar'));
            });
          }
        });

        if (!isMounted) return;

        // Emitir evento para o servidor indicar que é HOST
        socket.emit('host-session', {
          sessionId,
          hostName: user.username,
          hostId: user.id,
          gameTitle
        });

        if (!isMounted) return;

        console.log('✅ [HOST] Host iniciado!');
        setStatus('ready');

        // Escutar quando players entram
        socket.on('player-joined', (data: any) => {
          if (isMounted) {
            console.log('👥 [HOST] Player entrou:', data.playerName);
            setPlayers(prev => new Map(prev).set(data.playerId, data.playerName));
          }
        });

        // Escutar quando players saem
        socket.on('player-left', (data: any) => {
          if (isMounted) {
            console.log('👋 [HOST] Player saiu:', data.playerId);
            setPlayers(prev => {
              const newMap = new Map(prev);
              newMap.delete(data.playerId);
              return newMap;
            });
          }
        });

        // Escutar inputs dos players
        socket.on('player-input', (data: any) => {
          console.log('🎮 [HOST] Input recebido de', data.playerId, ':', data.input);
          // Aqui você pode processar os inputs dos players
          // Por exemplo: atualizar estado do jogo, simular pressionamento de teclas, etc.
        });

        socket.on('disconnect', () => {
          if (isMounted) {
            setStatus('error');
            setError('Desconectado do servidor');
          }
        });

        socket.on('connect_error', (error: any) => {
          if (isMounted) {
            setError(error.message);
            setStatus('error');
          }
        });

      } catch (err: any) {
        if (isMounted) {
          console.error('❌ [HOST] Erro:', err);
          setError(err.message || 'Erro ao inicializar host');
          setStatus('error');
        }
      }
    };

    setupHost();

    return () => {
      isMounted = false;
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.emit('close-session', { sessionId });
      }
    };
  }, [sessionId, user?.id, user?.username, gameTitle]);

  // ========== INICIAR STREAMING ==========
  const startStreaming = () => {
    if (!socketRef.current || streamIntervalRef.current) {
      console.warn('⚠️ [HOST] Socket não conectado ou streaming já iniciado');
      return;
    }

    console.log('🎬 [HOST] Iniciando captura de frames...');
    setIsStreaming(true);

    // Capturar frames a cada 100ms (10 FPS)
    streamIntervalRef.current = setInterval(() => {
      try {
        // Tentar encontrar o canvas do EmulatorJS dentro do iframe
        const iframe = document.querySelector('iframe#game-iframe') as HTMLIFrameElement;
        if (!iframe || !iframe.contentWindow) {
          console.warn('⚠️ [HOST] Iframe do jogo não encontrado');
          return;
        }

        // Acessar o canvas dentro do iframe
        const iframeDoc = iframe.contentWindow.document;
        const canvas = iframeDoc.querySelector('canvas') as HTMLCanvasElement;
        
        if (!canvas) {
          console.warn('⚠️ [HOST] Canvas do emulador não encontrado');
          return;
        }

        // Capturar o frame como base64
        const frameData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Enviar frame para todos os players
        socketRef.current.emit('game-frame', {
          sessionId,
          frame: frameData,
          timestamp: Date.now()
        });

        setFrameCount(prev => prev + 1);
      } catch (error) {
        console.error('❌ [HOST] Erro ao capturar frame:', error);
      }
    }, 100); // 10 FPS

    console.log('✅ [HOST] Streaming iniciado!');
  };

  // ========== PARAR STREAMING ==========
  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
      setIsStreaming(false);
      console.log('⏹️ [HOST] Streaming parado');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (socketRef.current) {
      socketRef.current.emit('close-session', { sessionId });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-purple-500/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Você é o HOST</h2>
              <p className="text-sm text-gray-400">{gameTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl">
            {status === 'starting' && (
              <>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 font-medium">Iniciando host...</span>
              </>
            )}
            {status === 'ready' && (
              <>
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Host ativo - Aguardando players</span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Erro ao iniciar host</span>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Share URL */}
          {status === 'ready' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                Compartilhe este link com seus amigos:
              </label>
              <div className="flex gap-2">
                <input
                  id="share"
                  name="share-url"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono overflow-auto"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Players List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Players Conectados
              </label>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 rounded-full">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-bold">{players.size}/4</span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {players.size === 0 ? (
                <div className="p-4 bg-gray-800/30 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">Nenhum player conectado ainda</p>
                </div>
              ) : (
                Array.from(players.entries()).map(([playerId, username]) => (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium text-sm truncate">{username}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Streaming Controls */}
          {status === 'ready' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Transmissão de Vídeo
                </label>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isStreaming ? 'bg-green-900/30' : 'bg-gray-800/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isStreaming ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {isStreaming ? `ATIVO (${frameCount} frames)` : 'INATIVO'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={startStreaming}
                  disabled={isStreaming}
                  className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium ${
                    isStreaming
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  ▶️ Iniciar Streaming
                </button>
                <button
                  onClick={stopStreaming}
                  disabled={!isStreaming}
                  className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium ${
                    !isStreaming
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  ⏹️ Parar Streaming
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-xs leading-relaxed">
              💡 <strong>Como funciona:</strong> Clique em "Iniciar Streaming" para transmitir o jogo para os players conectados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerHostComponent;