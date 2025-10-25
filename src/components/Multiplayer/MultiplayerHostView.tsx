/**
 * 🎮 Multiplayer Host View
 * Componente que integra o emulador com o sistema de multiplayer como host
 */

declare global {
  interface Window {
    frameLogCount: number;
  }
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Users, Copy, Check, Crown, Wifi, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot, collection, query, where, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { usePeerJSHost } from '../../hooks/usePeerJSHost';

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
  const { user } = useAuth();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initLoggedRef = useRef(false); // ✅ Evita logs duplicados no StrictMode
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<'loading' | 'starting' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processedRomUrl, setProcessedRomUrl] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [emulatorLoaded, setEmulatorLoaded] = useState(false);
  const [canvasFound, setCanvasFound] = useState(false);

  // ✅ Log inicial em useEffect (uma vez)
  useEffect(() => {
    if (!initLoggedRef.current) {
      initLoggedRef.current = true;
      console.log('🟢 [MULTIPLAYER HOST VIEW] Iniciado', { sessionId, gameTitle, platform });
    }
  }, []);

  // URL para compartilhar
  const shareUrl = `${window.location.origin}/?join=${sessionId}`;

  // 🎮 PeerJS Hook - HOST streaming
  const { 
    peerId, 
    isReady: peerReady, 
    connectedPlayers, 
    startStreaming,
    isStreaming 
  } = usePeerJSHost({
    sessionId,
    userId: user?.id || 'anonymous',
    onPlayerJoined: (playerId) => {
      console.log('🎉 [HOST] Novo player conectado:', playerId);
    },
    onPlayerLeft: (playerId) => {
      console.log('👋 [HOST] Player desconectou:', playerId);
    },
    onInputReceived: (playerId, input) => {
      console.log('🎮 [HOST] Input recebido do player:', playerId, input);
      injectInputToEmulator(input);
    }
  });

  // 💉 Injetar input no EmulatorJS
  const injectInputToEmulator = useCallback((input: { type: string; code: string; timestamp: number }) => {
    if (!iframeRef.current?.contentWindow) {
      console.warn('⚠️ [HOST] Iframe não disponível para injetar input');
      return;
    }

    console.log('💉 [HOST] Injetando input no emulador:', input);
    
    // Envia input para o EmulatorJS via postMessage
    iframeRef.current.contentWindow.postMessage({
      type: 'inject-input',
      input: input
    }, '*');
  }, []);

  // 📡 Atualiza Firestore com PeerJS ID quando estiver pronto
  useEffect(() => {
    if (peerId && peerReady) {
      console.log('📡 [HOST] Atualizando Firestore com PeerJS ID:', peerId);
      const sessionRef = doc(db, 'multiplayer_sessions', sessionId);
      updateDoc(sessionRef, {
        hostPeerId: peerId,
        peerServerReady: true
      }).then(() => {
        console.log('✅ [HOST] Firestore atualizado com PeerJS ID');
      }).catch((error) => {
        console.error('❌ [HOST] Erro ao atualizar Firestore:', error);
      });
    }
  }, [peerId, peerReady, sessionId]);

  // Processa a ROM URL (converte Firebase Storage path para download URL)
  useEffect(() => {
    const processRomUrl = async () => {
      try {
        console.log('[HOST VIEW] 📦 Processando ROM URL:', romPath);
        
        // Se já é uma URL HTTP, valida e usa diretamente
        if (romPath.startsWith('http://') || romPath.startsWith('https://') || romPath.startsWith('blob:')) {
          console.log('[HOST VIEW] ✅ URL direta detectada');
          
          // Valida se a URL é acessível
          if (romPath.startsWith('http')) {
            try {
              const response = await fetch(romPath, { method: 'HEAD' });
              if (!response.ok) {
                console.warn('[HOST VIEW] ⚠️ ROM URL retorna status:', response.status);
              }
            } catch (e) {
              console.warn('[HOST VIEW] ⚠️ Não foi possível validar ROM URL:', e);
            }
          }
          
          setProcessedRomUrl(romPath);
          setStatus('ready');
          setEmulatorLoaded(true);
          return;
        }
        
        // ✅ CORRIGIDO: Se começa com "roms/", apenas adiciona "/" no início (ROMs estão em /public/roms/)
        if (romPath.startsWith('roms/')) {
          const publicPath = `/${romPath}`;
          console.log('[HOST VIEW] 🔄 Convertendo Firestore path para público:', publicPath);
          console.log('[HOST VIEW] ✅ Caminho correto:', publicPath);
          
          // Valida se o arquivo existe
          try {
            const response = await fetch(publicPath, { method: 'HEAD' });
            console.log('[HOST VIEW] 📦 ROM acessível (Status: ' + response.status + ')');
          } catch (e) {
            console.warn('[HOST VIEW] ⚠️ Aviso ao validar ROM:', e);
          }
          
          setProcessedRomUrl(publicPath);
          setStatus('ready');
          setEmulatorLoaded(true);
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
          setEmulatorLoaded(true);
          return;
        }
        
        // Fallback: tenta usar como caminho relativo
        console.log('[HOST VIEW] ⚠️ Usando caminho como URL relativa');
        setProcessedRomUrl(romPath);
        setStatus('ready');
        setEmulatorLoaded(true);
      } catch (err) {
        console.error('[HOST VIEW] ❌ Erro ao processar ROM URL:', err);
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('[HOST VIEW] Erro completo:', errorMsg);
        setError(`Erro ao carregar ROM: ${errorMsg}`);
        setStatus('error');
      }
    };
    
    processRomUrl();
  }, [romPath]);

  // 👥 Escuta mudanças nos players + AUTO-CLEANUP quando sala vazia
  useEffect(() => {
    const playersQuery = query(
      collection(db, 'multiplayer_sessions', sessionId, 'players')
    );

    let emptyRoomTimeout: NodeJS.Timeout | null = null;

    const unsubscribe = onSnapshot(playersQuery, async (snapshot) => {
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

      // Limpar timeout anterior
      if (emptyRoomTimeout) {
        clearTimeout(emptyRoomTimeout);
        emptyRoomTimeout = null;
      }

      // 🗑️ AUTO-CLEANUP: Se sala ficou COMPLETAMENTE vazia (sem nenhum player)
      if (playersList.length === 0) {
        console.warn('[HOST VIEW] ⚠️ Sala sem nenhum player! Iniciando contagem regressiva...');
        
        // Aguarda 10 segundos para dar chance de alguém entrar
        emptyRoomTimeout = setTimeout(async () => {
          // Verifica novamente se ainda está vazia
          const checkSnapshot = await getDocs(playersQuery);
          if (checkSnapshot.empty) {
            console.log('[HOST VIEW] 🗑️ Sala continua vazia após 10s, FECHANDO AUTOMATICAMENTE...');
            try {
              const sessionRef = doc(db, 'multiplayer_sessions', sessionId);
              await deleteDoc(sessionRef);
              console.log('[HOST VIEW] ✅ Sessão vazia deletada automaticamente');
              alert('🚪 Sala fechada automaticamente (sem players por 10 segundos)');
              onClose();
            } catch (error) {
              console.error('[HOST VIEW] ❌ Erro ao deletar sessão vazia:', error);
            }
          } else {
            console.log('[HOST VIEW] ✅ Players entraram, sala continua ativa');
          }
        }, 10000); // 10 segundos
      } else {
        console.log(`[HOST VIEW] 👥 ${playersList.length} player(s) na sala`);
      }
    });

    return () => {
      unsubscribe();
      if (emptyRoomTimeout) {
        clearTimeout(emptyRoomTimeout);
      }
    };
  }, [sessionId, onClose]);

  // 🔥 CLEANUP: Deletar sessão quando HOST sair (beforeunload)
  useEffect(() => {
    const deleteSession = async () => {
      try {
        console.log('[HOST VIEW] 🗑️ HOST saindo - Deletando sessão:', sessionId);
        
        // Deletar da collection correta (multiplayer_sessions)
        const sessionRef = doc(db, 'multiplayer_sessions', sessionId);
        await deleteDoc(sessionRef);
        
        console.log('[HOST VIEW] ✅ Sessão deletada');
      } catch (error) {
        console.error('[HOST VIEW] ❌ Erro ao deletar sessão:', error);
      }
    };

    // Deletar APENAS quando usuário fechar a aba/navegador OU clicar em fechar
    const handleBeforeUnload = () => {
      deleteSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // NÃO deletar no cleanup do useEffect para evitar deletar durante re-renders
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // � Capturar canvas do EmulatorJS e iniciar streaming WebRTC
  useEffect(() => {
    if (!peerReady || !iframeRef.current) {
      console.log('[HOST] ⏳ Aguardando PeerJS e iframe...');
      return;
    }

    console.log('[HOST] 🎬 Tentando capturar canvas do EmulatorJS...');

    let captureAttempts = 0;
    const maxCaptureAttempts = 30; // 30 tentativas = ~60 segundos com delay aumentado
    let captureTimeout: NodeJS.Timeout | null = null;

    const attemptCapture = () => {
      captureAttempts++;
      try {
        const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
        if (!iframeDoc) {
          if (captureAttempts < maxCaptureAttempts) {
            console.warn(`[HOST] ⚠️ Não foi possível acessar documento do iframe (tentativa ${captureAttempts}/${maxCaptureAttempts})`);
            captureTimeout = setTimeout(attemptCapture, 2000);
          } else {
            console.error('[HOST] ❌ Falha permanente ao acessar iframe');
            setError('Não foi possível acessar o emulador');
          }
          return;
        }

        // Procura pelo canvas do EmulatorJS dentro do container #game
        const gameContainer = iframeDoc.getElementById('game');
        if (!gameContainer) {
          if (captureAttempts < maxCaptureAttempts) {
            if (captureAttempts % 5 === 0) {
              console.warn(`[HOST] ⚠️ Container #game não encontrado (tentativa ${captureAttempts}/${maxCaptureAttempts})`);
            }
            captureTimeout = setTimeout(attemptCapture, 2000);
          }
          return;
        }

        // ✅ USAR querySelector PARA ENCONTRAR O CANVAS (não tem ID)
        const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas || !canvas.width || !canvas.height) {
          if (captureAttempts < maxCaptureAttempts) {
            if (captureAttempts % 5 === 0) {
              const status = canvas 
                ? `Canvas sem dimensões válidas (${canvas.width}x${canvas.height})` 
                : 'Sem canvas encontrado';
              console.warn(`[HOST] ⚠️ ${status} (tentativa ${captureAttempts}/${maxCaptureAttempts})`);
            }
            captureTimeout = setTimeout(attemptCapture, 2000);
          } else {
            console.warn('[HOST] ⚠️ Canvas ainda não pronto após ' + maxCaptureAttempts + ' tentativas');
            // Continuar tentando indefinidamente em background
            captureTimeout = setTimeout(attemptCapture, 5000);
          }
          return;
        }

        console.log('[HOST] ✅ Canvas encontrado!', {
          width: canvas.width,
          height: canvas.height
        });

        setCanvasFound(true);
        setEmulatorLoaded(true);

        // Inicia streaming via PeerJS
        const stream = startStreaming(canvas);
        if (stream) {
          console.log('[HOST] 🎉 Streaming WebRTC iniciado com sucesso!');
          console.log('[HOST] 📹 Stream ID:', stream.id);
          console.log('[HOST] 🎬 Tracks:', stream.getTracks().length);
          setStatus('ready');
        } else {
          console.error('[HOST] ❌ Falha ao iniciar streaming');
          setStatus('error');
          setError('Falha ao iniciar streaming WebRTC');
        }
      } catch (error) {
        console.error('[HOST] ❌ Erro ao capturar canvas:', error);
        if (captureAttempts < maxCaptureAttempts) {
          captureTimeout = setTimeout(attemptCapture, 2000);
        }
      }
    };

    // Tenta capturar após um maior delay para garantir que EmulatorJS carregou
    // ✅ Aumentado para 5 segundos inicial (EmulatorJS pode levar tempo)
    captureTimeout = setTimeout(attemptCapture, 5000);

    return () => {
      if (captureTimeout) clearTimeout(captureTimeout);
    };
  }, [peerReady, startStreaming]);

  // 🔍 DEBUG: Listener global para todas as mensagens + CANVAS READY
  useEffect(() => {
    const debugListener = (event: MessageEvent) => {
      // Log apenas mensagens importantes (não spam)
      if (event.data?.type && event.data.type !== 'emulator-frame') {
        console.log('[HOST VIEW DEBUG] 📨 Mensagem:', event.data.type);
        
        // ✅ Canvas está pronto - atualizar status
        if (event.data.type === 'canvas-ready') {
          console.log('[HOST VIEW] ✅ Canvas pronto no iframe!', event.data);
          setCanvasFound(true);
        }
      }
    };
    
    window.addEventListener('message', debugListener);
    
    return () => window.removeEventListener('message', debugListener);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = async () => {
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

    // Build URL with Socket.IO parameters for multiplayer + desabilitar controles mobile
    const params = new URLSearchParams({
      rom: processedRomUrl,
      title: gameTitle,
      platform: platform,
      socketUrl: socketUrl,
      sessionId: sessionId,
      userId: user.id,
      username: user.username || 'Host',
      mobile: 'false', // ✅ DESABILITAR CONTROLES MOBILE
      touch: 'false',   // ✅ DESABILITAR TOUCH
      v: cacheBuster.toString()
    });

    // Garantir que sempre exista uma barra inicial para o caminho relativo ao servidor
    const normalizedBasePath = emulatorBasePath.startsWith('/')
      ? emulatorBasePath
      : `/${emulatorBasePath}`;

    return `${normalizedBasePath}?${params.toString()}`;
  }, [processedRomUrl, gameTitle, platform, sessionId, user?.id, user?.username]); // Recalcula se qualquer dependência mudar

  // Log da URL do emulador + Diagnóstico detalhado
  useEffect(() => {
    if (emulatorUrl) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('[HOST VIEW] 🎮 URL do emulador construída');
      console.log('[HOST VIEW] Emulator URL:', emulatorUrl);
      console.log('[HOST VIEW] 📦 ROM URL:', processedRomUrl);
      console.log('[HOST VIEW] 🎯 Platform:', platform);
      console.log('[HOST VIEW] 📝 Title:', gameTitle);
      console.log('[HOST VIEW] Session ID:', sessionId);
      console.log('[HOST VIEW] User ID:', user?.id);
      console.log('[HOST VIEW] Status:', status);
      console.log('[HOST VIEW] PeerJS Ready:', peerReady);
      console.log('[HOST VIEW] Emulator Loaded:', emulatorLoaded);
      console.log('═══════════════════════════════════════════════════════');
      
      // Log periodicamente para verificar se está progredindo
      const debugInterval = setInterval(() => {
        if (emulatorLoaded && !peerReady) {
          console.log('[HOST VIEW DEBUG] ⏳ Emulador carregado, aguardando PeerJS...');
        } else if (peerReady && !isStreaming) {
          console.log('[HOST VIEW DEBUG] ⏳ PeerJS pronto, aguardando stream...');
        }
      }, 5000);
      
      return () => clearInterval(debugInterval);
    }
  }, [emulatorUrl, processedRomUrl, platform, gameTitle, peerReady, isStreaming, emulatorLoaded, status, sessionId, user]);

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
                allow="gamepad; autoplay; microphone; camera; payment; fullscreen; accelerometer; gyroscope; magnetometer"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-orientation-lock allow-presentation allow-pointer-lock"
                title="Emulator"
                style={{
                  minHeight: '100%',
                  overflow: 'auto',
                  backgroundColor: '#000'
                }}
                onLoad={() => {
                  console.log('🟢 [IFRAME] Iframe loaded successfully');
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
          {/* Status - MELHORADO */}
          <div className="p-4 border-b border-gray-800">
            {/* Status Principal */}
            <div className="mb-4">
              {peerReady && isStreaming ? (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
                    <span className="text-green-400 font-bold">🎮 Transmissão Ativa!</span>
                  </div>
                  <p className="text-xs text-green-300 mt-1">Players podem ver e jogar</p>
                </div>
              ) : peerReady && canvasFound ? (
                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                    <span className="text-yellow-400 font-medium">⏳ Iniciando stream...</span>
                  </div>
                  <p className="text-xs text-yellow-300 mt-1">Canvas capturado, conectando...</p>
                </div>
              ) : peerReady && emulatorLoaded ? (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-medium">🎮 Procurando canvas...</span>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Emulador carregado</p>
                </div>
              ) : peerReady ? (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    <span className="text-purple-400 font-medium">📦 Carregando emulador...</span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">PeerJS pronto</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-gray-400 font-medium">🔌 Conectando servidor...</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Aguarde...</p>
                </div>
              )}
            </div>

            {/* Checklist de Status */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                {peerReady ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <span className={peerReady ? 'text-green-400' : 'text-gray-400'}>
                  Servidor PeerJS
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {emulatorLoaded ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <span className={emulatorLoaded ? 'text-green-400' : 'text-gray-400'}>
                  Emulador carregado
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {canvasFound ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <span className={canvasFound ? 'text-green-400' : 'text-gray-400'}>
                  Canvas capturado
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isStreaming ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <span className={isStreaming ? 'text-green-400' : 'text-gray-400'}>
                  WebRTC Streaming
                </span>
              </div>
            </div>

            {/* PeerJS Info */}
            {peerId && (
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">PeerJS ID:</p>
                <p className="text-xs text-white font-mono truncate">{peerId}</p>
              </div>
            )}

            {/* Streaming Info */}
            {isStreaming && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-green-400 mb-1">✅ WebRTC Streaming</p>
                <p className="text-xs text-gray-300">
                  {connectedPlayers.length} player{connectedPlayers.length !== 1 ? 's' : ''} assistindo
                </p>
              </div>
            )}

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
                Players conectados ({connectedPlayers.length})
              </h3>
            </div>

            <div className="space-y-2">
              {/* Host (você) */}
              <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between border-2 border-purple-600">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">{user?.username || 'Você'}</p>
                    <p className="text-xs text-purple-400">🎮 HOST (jogando)</p>
                  </div>
                </div>
              </div>

              {/* Players conectados via PeerJS */}
              {connectedPlayers.map((playerId, index) => (
                <div
                  key={playerId}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Player {index + 1}</p>
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{playerId}</p>
                    </div>
                  </div>
                  
                  <span className="text-xs text-green-400 font-medium">🟢 Conectado</span>
                </div>
              ))}

              {/* Mensagem quando nenhum player conectado */}
              {connectedPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aguardando players se conectarem...</p>
                  <p className="text-xs mt-2">Compartilhe o link acima!</p>
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