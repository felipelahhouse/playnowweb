/**
 * 🎮 Multiplayer Host View
 * Componente que integra o emulador com o sistema de multiplayer como host
 */

declare global {
  interface Window {
    frameLogCount: number;
  }
}

import React, { useEffect, useRef, useState } from 'react';
import { X, Users, Copy, Check, Crown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
// @ts-expect-error - JavaScript module with types in .d.ts file
import multiplayerService from '../../services/multiplayerService';

interface MultiplayerHostViewProps {
  sessionId: string;
  gameId: string;
  romPath: string;
  gameTitle: string;
  platform: string;
  onClose: () => void;
}

interface Player {
  id: string;
  username: string;
  playerNumber: number;
  isReady: boolean;
}

const MultiplayerHostView: React.FC<MultiplayerHostViewProps> = ({
  sessionId,
  gameId,
  romPath,
  gameTitle,
  platform,
  onClose
}) => {
  console.log('🟢🟢🟢 [MULTIPLAYER HOST VIEW] COMPONENTE INICIADO 🟢🟢🟢');
  console.log('[HOST VIEW] Props recebidas:', {
    sessionId,
    gameId,
    romPath,
    gameTitle,
    platform
  });
  
  const { user } = useAuth();
  
  console.log('[HOST VIEW] Usuário logado:', user);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<any>(null);
  const lastFrameRef = useRef<string | null>(null);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<'loading' | 'starting' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processedRomUrl, setProcessedRomUrl] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // ✅ NOVO: Estado para controlar sidebar
  const [fullscreen, setFullscreen] = useState(false); // ✅ NOVO: Estado para tela cheia

  // URL para compartilhar
  const shareUrl = `${window.location.origin}/?join=${sessionId}`;

  // Processa a ROM URL (converte Firebase Storage path para download URL)
  useEffect(() => {
    const processRomUrl = async () => {
      try {
        console.log('[HOST VIEW] 📦 Processando ROM URL:', romPath);
        
        // Se já é uma URL HTTP, usa diretamente
        if (romPath.startsWith('http://') || romPath.startsWith('https://') || romPath.startsWith('blob:')) {
          console.log('[HOST VIEW] ✅ URL direta detectada');
          setProcessedRomUrl(romPath);
          setStatus('ready');
          return;
        }
        
        // ✅ CORRIGIDO: Se começa com "roms/", apenas adiciona "/" no início (ROMs estão em /public/roms/)
        if (romPath.startsWith('roms/')) {
          const publicPath = `/${romPath}`;
          console.log('[HOST VIEW] 🔄 Convertendo Firestore path para público:', publicPath);
          console.log('[HOST VIEW] ✅ Caminho correto:', publicPath);
          setProcessedRomUrl(publicPath);
          setStatus('ready');
          return;
        }
        
        // Se é um caminho do Firebase Storage com gs://
        if (romPath.startsWith('gs://')) {
          console.log('[HOST VIEW] 🔥 Buscando URL de download do Firebase Storage...');
          const cleanPath = romPath.replace(/^gs:\/\/[^/]+\//, '');
          const romRef = storageRef(storage, cleanPath);
          const downloadUrl = await getDownloadURL(romRef);
          console.log('[HOST VIEW] ✅ URL de download obtida');
          setProcessedRomUrl(downloadUrl);
          setStatus('ready');
          return;
        }
        
        // Fallback: tenta usar como caminho relativo
        console.log('[HOST VIEW] ⚠️ Usando caminho como URL relativa');
        setProcessedRomUrl(romPath);
        setStatus('ready');
      } catch (err) {
        console.error('[HOST VIEW] ❌ Erro ao processar ROM URL:', err);
        setError(`Erro ao carregar ROM: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setStatus('error');
      }
    };
    
    processRomUrl();
  }, [romPath]);

  // Escuta mudanças nos players
  useEffect(() => {
    const playersQuery = query(
      collection(db, 'game_sessions', sessionId, 'players')
    );

    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersList: Player[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        playersList.push({
          id: doc.id,
          username: data.username || 'Player',
          playerNumber: data.playerNumber || 0,
          isReady: data.isReady || false
        });
      });
      
      // Ordenar por playerNumber
      playersList.sort((a, b) => a.playerNumber - b.playerNumber);
      setPlayers(playersList);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // 🔥 CLEANUP: Deletar sessão quando aba fechar
  useEffect(() => {
    const deleteSession = async () => {
      try {
        console.log('[HOST VIEW] 🗑️ Deletando sessão do Firestore:', sessionId);
        const sessionRef = doc(db, 'game_sessions', sessionId);
        await deleteDoc(sessionRef);
        console.log('[HOST VIEW] ✅ Sessão deletada');
      } catch (error) {
        console.error('[HOST VIEW] ❌ Erro ao deletar sessão:', error);
      }
    };

    // Deletar APENAS quando usuário fechar a aba/navegador
    const handleBeforeUnload = () => {
      deleteSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // NÃO deletar no cleanup do useEffect para evitar deletar durante re-renders
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // 🎥 Capturar e transmitir frames do emulador via Socket.IO
  const captureAndStreamFrame = React.useCallback((canvasDataUrl: string) => {
    console.log('[HOST DEBUG] 🔍 captureAndStreamFrame CHAMADA!');
    console.log('[HOST DEBUG] Socket conectado?', socketRef.current?.connected);
    
    try {
      const frameSizeKB = Math.round(canvasDataUrl.length / 1024);
      
      // Limite de segurança - Socket.IO suporta até ~1MB por mensagem
      if (frameSizeKB > 900) {
        console.warn(`[HOST] ⚠️ Frame muito grande (${frameSizeKB}KB), pulando...`);
        return;
      }
      
      // ✅ VERIFICAR SE SOCKET ESTÁ CONECTADO
      if (socketRef.current && socketRef.current.connected) {
        console.log('[HOST DEBUG] ✅ Enviando frame via Socket.IO...');
        socketRef.current.emit('stream-frame', {
          frame: canvasDataUrl,
          timestamp: Date.now(),
          frameNumber: window.frameLogCount || 0,
          sizeKB: frameSizeKB
        });
        
        // Log apenas nos primeiros 10 frames ou a cada 50
        if (!window.frameLogCount) window.frameLogCount = 0;
        window.frameLogCount++;
        
        if (window.frameLogCount <= 10 || window.frameLogCount % 50 === 0) {
          console.log(`[HOST] ✅ Frame #${window.frameLogCount} enviado via Socket.IO (${frameSizeKB}KB)`);
        }
      } else {
        console.error('[HOST DEBUG] ❌ Socket.IO NÃO CONECTADO!');
        console.error('[HOST DEBUG] socketRef.current:', socketRef.current);
        console.error('[HOST DEBUG] connected:', socketRef.current?.connected);
      }
      
    } catch (error) {
      console.error('[HOST] ❌ Erro ao enviar frame:', error);
    }
  }, []);

  // 🎯 Wrapper para sincronizar frames com novo player
  const captureAndStreamFrameWithSync = React.useCallback((canvasDataUrl: string) => {
    console.log('[HOST DEBUG] 🎯 captureAndStreamFrameWithSync CHAMADA!');
    lastFrameRef.current = canvasDataUrl;
    console.log('[HOST DEBUG] 💾 Frame salvo em lastFrameRef');
    captureAndStreamFrame(canvasDataUrl);
    console.log('[HOST DEBUG] ✅ captureAndStreamFrame acionada');
  }, [captureAndStreamFrame]);

  // 🔍 DEBUG: Listener global para todas as mensagens
  useEffect(() => {
    const debugListener = (event: MessageEvent) => {
      console.log('[HOST VIEW DEBUG] 🌍 Mensagem recebida de qualquer origem:', {
        origin: event.origin,
        hasData: !!event.data,
        dataType: event.data?.type,
        dataKeys: event.data ? Object.keys(event.data) : [],
        source: event.source === iframeRef.current?.contentWindow ? 'IFRAME' : 'OUTRO'
      });
    };
    
    window.addEventListener('message', debugListener);
    console.log('[HOST VIEW DEBUG] 🔍 Debug listener GLOBAL ativado');
    
    return () => window.removeEventListener('message', debugListener);
  }, []);

  // Inicializa o emulador e captura frames para streaming
  useEffect(() => {
    console.log('[HOST VIEW] 🎧 Configurando listener de mensagens...');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('[HOST VIEW] 📬 handleMessage chamado!', {
        hasData: !!event.data,
        dataType: event.data?.type
      });
      
      // Ignora mensagens que não são do emulador
      if (!event.data || !event.data.type) {
        console.log('[HOST VIEW] ⏭️ Mensagem ignorada (sem data ou type)');
        return;
      }
      
      // Log reduzido - só loga tipos importantes
      if (event.data.type !== 'emulator-frame') {
        console.log('[HOST VIEW] 📨 Mensagem recebida:', event.data.type);
      }
      
      if (event.data.type === 'emulator-ready') {
        console.log('[HOST VIEW] 🎮 Emulador pronto!');
        // Emulador está pronto para jogar
      } else if (event.data.type === 'emulator-error') {
        console.error('[HOST VIEW] ❌ Erro do emulador:', event.data.message);
        setError(event.data.message || 'Erro ao carregar emulador');
        setStatus('error');
      } else if (event.data.type === 'emulator-frame' && event.data.canvas) {
        // Log SEMPRE nos primeiros 10 frames
        if (event.data.frameNumber === 1) {
          console.log('[FRAMEUPLOAD] 🎬 PRIMEIRO FRAME RECEBIDO DO IFRAME! Iniciando upload para Firestore...');
          console.log('[FRAMEUPLOAD] Frame size:', event.data.sizeKB + 'KB');
        } else if (event.data.frameNumber <= 10) {
          console.log(`[FRAMEUPLOAD] 🎬 Frame #${event.data.frameNumber} recebido (${event.data.sizeKB}KB)`);
        } else if (event.data.frameNumber % 50 === 0) {
          console.log(`[FRAMEUPLOAD] 🎬 Frame #${event.data.frameNumber} recebido (${event.data.sizeKB}KB)`);
        }
        // Recebeu frame do emulador para streaming
        console.log('[HOST] 📬 Frame recebido do emulador, enviando via Socket.IO...');
        captureAndStreamFrameWithSync(event.data.canvas);
      }
    };

    // Adiciona listener imediatamente, sem verificar iframeRef
    window.addEventListener('message', handleMessage);
    console.log('[HOST VIEW] ✅ Listener de mensagens ativo');

    return () => {
      console.log('[HOST VIEW] 🔌 Removendo listener de mensagens');
      window.removeEventListener('message', handleMessage);
    };
  }, [captureAndStreamFrameWithSync]); // Atualizado para usar a função com sincronização

  // 🎯 Socket.IO: Setup para sincronização em tempo real
  useEffect(() => {
    if (!user?.id || !user?.username) {
      console.log('[HOST VIEW SOCKET] ⚠️ Aguardando autenticação...');
      return;
    }

    let isMounted = true;
    let socket = socketRef.current;

    const setupSocketConnection = async () => {
      try {
        console.log('[HOST VIEW SOCKET] 🔌 Conectando ao Socket.IO...');
        
        // Conectar ao servidor Socket.IO
        socket = multiplayerService.connect();
        if (!socket) {
          throw new Error('Socket não inicializado');
        }

        socketRef.current = socket;

        // Aguardar conexão
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
          
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

        console.log('[HOST VIEW SOCKET] ✅ Conectado ao Socket.IO!');
        console.log('✅✅✅ [HOST SOCKET] CONECTADO! Socket ID:', socket.id);

        // ✅ CORRIGIDO: Usar 'join-or-create-session' como HOST
        socket.emit('join-or-create-session', {
          sessionId,
          userId: user.id,
          username: user.username,
          isHost: true,
          gameTitle,
          timestamp: new Date().toISOString()
        });
        
        console.log('[HOST VIEW SOCKET] 📤 Enviado evento: join-or-create-session (como HOST)');
        console.log('[HOST SOCKET] 📊 Estado do socket após join:', {
          id: socket.id,
          connected: socket.connected,
          hasListeners: !!socket.listeners('stream-frame')
        });

        // 🎯 ESCUTAR PEDIDO DE SINCRONIZAÇÃO DE NOVO PLAYER
        socket.on('request-sync', (data: any) => {
          console.log('[HOST VIEW SOCKET] 📡 Pedido de sincronização do novo player:', data.new_player_id);
          
          // Se temos um frame capturado, enviar para o novo player
          if (lastFrameRef.current) {
            console.log('[HOST VIEW SOCKET] 📨 Enviando frame para sincronizar novo player...');
            socket.emit('sync-state', {
              frame: lastFrameRef.current,
              timestamp: Date.now(),
              forPlayerId: data.new_player_id
            });
            console.log('[HOST VIEW SOCKET] ✅ Frame de sincronização enviado!');
          } else {
            console.warn('[HOST VIEW SOCKET] ⚠️ Nenhum frame disponível para sincronizar ainda');
          }
        });

        // Outras listeners do Socket.IO
        socket.on('player-joined', (data: any) => {
          if (isMounted) {
            console.log('[HOST VIEW SOCKET] 👥 Player entrou:', data.playerName);
          }
        });

        socket.on('disconnect', () => {
          if (isMounted) {
            console.log('[HOST VIEW SOCKET] 🔌 Desconectado do Socket.IO');
          }
        });

        socket.on('connect_error', (error: any) => {
          if (isMounted) {
            console.error('[HOST VIEW SOCKET] ❌ Erro de conexão:', error);
          }
        });

        // 🔌 DEBUG: Listener para evento de conexão
        socket.on('connect', () => {
          console.log('🟢🟢🟢 [HOST SOCKET] RECONECTADO! Socket ID:', socket.id);
          console.log('[HOST SOCKET] Disponível para enviar frames!');
        });

      } catch (err: any) {
        console.error('[HOST VIEW SOCKET] ❌ Erro ao conectar:', err);
      }
    };

    setupSocketConnection();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit('close-session', { sessionId });
        // NÃO desconectar imediatamente para permitir que outros eventos sejam processados
      }
    };
  }, [sessionId, user?.id, user?.username, gameTitle]);

  // Atualizar o último frame quando um novo for capturado
  useEffect(() => {
    // lastFrameRef já está sendo atualizado em captureAndStreamFrameWithSync
    // Não precisa fazer nada aqui
  }, [captureAndStreamFrame]);

  /*
  const startMultiplayerHost = async (canvas: HTMLCanvasElement) => {
    if (!user?.id) return;

    try {
      setStatus('starting');
      
      const host = new WebRTCHost(sessionId, user.id);
      hostRef.current = host;

      // Callbacks
      host.onPlayerJoined = (playerId: string, username: string) => {
        console.log('[HOST VIEW] 👤 Player entrou:', username);
      };

      host.onPlayerLeft = (playerId: string) => {
        console.log('[HOST VIEW] 👋 Player saiu:', playerId);
      };

      host.onInputReceived = (playerId: string, input: any) => {
        console.log('[HOST VIEW] 🎮 Input recebido de', playerId, ':', input);
        
        // Enviar input para o emulador
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'gamepad-input',
            playerId,
            input
          }, '*');
        }
      };

      host.onError = (errorMsg: string) => {
        console.error('[HOST VIEW] ❌ Erro:', errorMsg);
        setError(errorMsg);
        setStatus('error');
      };

      // Inicia host
      await host.start(canvas);
      console.log('[HOST VIEW] ✅ Host iniciado!');
      setStatus('ready');
    } catch (err: any) {
      console.error('[HOST VIEW] ❌ Erro ao iniciar host:', err);
      setError(`Erro ao iniciar: ${err.message}`);
      setStatus('error');
    }
  };
  */

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = async () => {
    if (hostRef.current) {
      // hostRef.current.stop();
    }
    
    // 🔥 DELETAR SESSÃO DO FIRESTORE quando host sair
    try {
      console.log('[HOST VIEW] 🗑️ Deletando sessão do Firestore:', sessionId);
      
      // Deletar documento da sessão
      const sessionRef = doc(db, 'game_sessions', sessionId);
      await deleteDoc(sessionRef);
      
      console.log('[HOST VIEW] ✅ Sessão deletada com sucesso');
    } catch (error) {
      console.error('[HOST VIEW] ❌ Erro ao deletar sessão:', error);
    }
    
    onClose();
  };

  // Construir URL do emulador usando universal-player.html (somente quando ROM estiver processada)
  // ✅ CACHE BUSTER: Usa useMemo para calcular apenas UMA VEZ e não recarregar iframe
  const emulatorUrl = React.useMemo(() => {
    if (!processedRomUrl || !user?.id || !user?.username) return null;
    const cacheBuster = Date.now();

    // Get Socket.IO URL and base emulator HTML from environment
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    const emulatorBasePath = (import.meta.env.VITE_MULTIPLAYER_EMULATOR || '/universal-player.html').trim();

    // Build URL with Socket.IO parameters for multiplayer
    const params = new URLSearchParams({
      rom: processedRomUrl,
      title: gameTitle,
      platform: platform,
      socketUrl: socketUrl,
      sessionId: sessionId,
      userId: user.id,
      username: user.username || 'Host',
      v: cacheBuster.toString()
    });

    // Garantir que sempre exista uma barra inicial para o caminho relativo ao servidor
    const normalizedBasePath = emulatorBasePath.startsWith('/')
      ? emulatorBasePath
      : `/${emulatorBasePath}`;

    return `${normalizedBasePath}?${params.toString()}`;
  }, [processedRomUrl, gameTitle, platform, sessionId, user?.id, user?.username]); // Recalcula se qualquer dependência mudar

  // Log da URL do emulador
  useEffect(() => {
    if (emulatorUrl) {
      console.log('[HOST VIEW] 🎮 URL do emulador construída:', emulatorUrl);
      console.log('[HOST VIEW] 📦 ROM URL:', processedRomUrl);
      console.log('[HOST VIEW] 🎯 Platform:', platform);
      console.log('[HOST VIEW] 📝 Title:', gameTitle);
    }
  }, [emulatorUrl, processedRomUrl, platform, gameTitle]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold text-white">{gameTitle}</h2>
            <p className="text-sm text-purple-200">Você é o Host</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={sidebarOpen ? "Esconder sidebar" : "Mostrar sidebar"}
          >
            <Users className="w-5 h-5" />
          </button>
          
          {/* Botão Fechar */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Emulator */}
        <div className={`flex-1 bg-black relative transition-all duration-300 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-white">Carregando emulador...</p>
              </div>
            </div>
          )}
          
          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-white">Iniciando multiplayer...</p>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center max-w-md">
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <p className="text-white text-lg mb-2">Erro ao iniciar</p>
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
          
          {emulatorUrl && (
            <>
              <iframe
                ref={iframeRef}
                src={emulatorUrl}
                className="w-full h-full border-0"
                allow="gamepad; autoplay; microphone; camera; speaker; payment"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-orientation-lock"
                title="Emulator"
                style={{
                  minHeight: '100%',
                  overflow: 'auto'
                }}
              />
              
              {/* Botões de Controle Flutuantes */}
              {!fullscreen && (
                <button
                  onClick={() => setFullscreen(true)}
                  className="absolute bottom-4 right-4 p-3 bg-purple-600/90 hover:bg-purple-700 rounded-lg transition-all z-20 shadow-xl group"
                  title="Ver em tela cheia"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Tela Cheia
                  </span>
                </button>
              )}
              
              {fullscreen && (
                <button
                  onClick={() => setFullscreen(false)}
                  className="absolute top-4 right-4 p-3 bg-purple-600/90 hover:bg-purple-700 rounded-lg transition-all z-20 shadow-xl"
                  title="Sair da tela cheia"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Agora collapsible */}
        <div className={`bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-0 border-0 overflow-hidden'
        }`}>
          {/* Status */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              {status === 'ready' ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Host ativo</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400 font-medium">Iniciando...</span>
                </>
              )}
            </div>

            {/* Share URL */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Compartilhe este link:</p>
              <div className="flex gap-2">
                <input
                  id="share-url"
                  name="share-url"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">
                Players ({players.length}/4)
              </h3>
            </div>

            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {player.id === user?.id && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{player.username}</p>
                      <p className="text-xs text-gray-400">Player {player.playerNumber}</p>
                    </div>
                  </div>
                  
                  {player.isReady ? (
                    <span className="text-xs text-green-400 font-medium">Pronto</span>
                  ) : (
                    <span className="text-xs text-gray-500">Aguardando...</span>
                  )}
                </div>
              ))}

              {players.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aguardando players...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerHostView;