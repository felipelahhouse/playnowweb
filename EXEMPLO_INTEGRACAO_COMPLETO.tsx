/**
 * 📚 EXEMPLO COMPLETO - Como Integrar Todas as Otimizações
 * 
 * Este arquivo mostra a integração completa dos hooks otimizados
 * e componentes de monitoramento em um componente multiplayer.
 * 
 * Use como referência para implementar em seus componentes!
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, X, Users } from 'lucide-react';

// ✨ IMPORTAR OS HOOKS OTIMIZADOS
import { usePeerJSPlayer } from '@/hooks/usePeerJSPlayer';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// ✨ IMPORTAR COMPONENTES DE DEBUG
import { MultiplayerDebugPanel } from '@/components/Multiplayer/MultiplayerDebugPanel';

interface ExampleMultiplayerPlayerProps {
  sessionId: string;
  hostPeerId: string;
  onClose?: () => void;
}

/**
 * EXEMPLO: Componente PLAYER com Otimizações Completas
 * ======================================================
 * 
 * Este exemplo mostra:
 * 1. Usar o hook otimizado (com metrics)
 * 2. Adicionar Debug Panel
 * 3. Integrar Performance Monitor
 * 4. Handling de qualidade adaptativa
 */
export const ExampleMultiplayerPlayer: React.FC<ExampleMultiplayerPlayerProps> = ({
  sessionId,
  hostPeerId,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameTitle, setGameTitle] = useState('Jogo Multiplayer');

  // 📊 PASSO 1: Usar o hook otimizado
  // ===================================
  const {
    peerId,
    isConnected,
    stream,
    connectionError,
    sendInput,
    metrics // ← NOVO: Métricas em tempo real!
  } = usePeerJSPlayer({
    sessionId,
    hostPeerId,
    userId: 'user123',
    
    // Callbacks para qualidade dinâmica
    onStreamReceived: (remoteStream) => {
      console.log('📹 Stream recebido');
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.play().catch(err => console.error('Erro ao reproduzir:', err));
      }
    },
    
    onLatencyUpdate: (latency) => {
      // Pode usar para atualizar UI
      console.log(`⏱️ Latência: ${latency}ms`);
    },
    
    onQualityChange: (quality) => {
      // Notificar usuário se qualidade mudou
      console.log(`✨ Qualidade alterada para: ${quality}`);
    },
    
    onDisconnected: () => {
      console.log('❌ Desconectado do HOST');
    }
  });

  // 📈 PASSO 2: Adicionar Performance Monitor (opcional)
  // ===================================================
  const { performance, alerts } = usePerformanceMonitor(true);

  // 🎮 PASSO 3: Capturar inputs do teclado
  // ========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      sendInput({
        type: 'keydown',
        code: e.code,
        key: e.key,
        timestamp: Date.now()
      });

      console.log('🎮 Tecla pressionada:', e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      sendInput({
        type: 'keyup',
        code: e.code,
        key: e.key,
        timestamp: Date.now()
      });

      console.log('🎮 Tecla solta:', e.code);
    };

    if (isConnected && stream) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isConnected, stream, sendInput]);

  // 📡 PASSO 4: Atualizar stream quando mudar
  // ==========================================
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error('Erro ao reproduzir:', err));
    }
  }, [stream]);

  // 🎨 RENDERIZAR UI COM TUDO INTEGRADO
  // ====================================
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <div>
            <h1 className="text-white font-semibold">{gameTitle}</h1>
            <p className="text-sm text-gray-400">
              {/* STATUS INDICATOR COM MÉTRICAS */}
              {isConnected && stream
                ? `✅ Conectado | Latência: ${metrics?.latency?.toFixed(0)}ms`
                : '⏳ Conectando...'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {/* Loading State */}
        {!hostPeerId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-white">Aguardando HOST iniciar...</p>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {hostPeerId && !isConnected && !connectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-white">Conectando ao HOST...</p>
              <p className="text-gray-400 text-sm mt-2 font-mono">{hostPeerId}</p>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <p className="text-white text-lg mb-2">Erro de conexão</p>
              <p className="text-gray-400 text-sm">{connectionError}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Status Indicator */}
        {isConnected && stream && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">🟢 Ao vivo</span>
          </div>
        )}

        {/* Controls Hint */}
        {isConnected && stream && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3">
            <p className="text-white text-sm text-center">
              Use as <strong>setas do teclado</strong> para controlar
            </p>
          </div>
        )}
      </div>

      {/* DEBUG PANEL - PASSO 5: Adicionar o Painel! */}
      {/* ============================================ */}
      <MultiplayerDebugPanel
        playerMetrics={metrics}
        isHost={false}
        isConnected={isConnected}
        peerId={peerId}
        hostPeerId={hostPeerId}
      />

      {/* PERFORMANCE ALERTS (Opcional) */}
      {alerts.length > 0 && (
        <div className="fixed top-20 right-4 space-y-2 max-w-xs">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-sm font-medium ${
                alert.level === 'critical'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : alert.level === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * EXEMPLO: Componente HOST com Otimizações Completas
 * ===================================================
 */

import { usePeerJSHost } from '@/hooks/usePeerJSHost';

interface ExampleMultiplayerHostProps {
  sessionId: string;
  onClose?: () => void;
}

export const ExampleMultiplayerHost: React.FC<ExampleMultiplayerHostProps> = ({
  sessionId,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 📊 PASSO 1: Usar o hook otimizado do HOST
  // ==========================================
  const {
    peerId,
    isReady: peerReady,
    connectedPlayers,
    startStreaming,
    isStreaming,
    metrics, // ← NOVO: Métricas do HOST!
    recordFrame, // ← NOVO: Contar frames
    updateQuality, // ← NOVO: Alterar qualidade dinamicamente
    onQualityChange // ← Callback
  } = usePeerJSHost({
    sessionId,
    userId: 'host123',
    
    onPlayerJoined: (playerId) => {
      console.log('🎉 Player conectado:', playerId);
      // Pode atualizar qualidade baseado em novo player
      updateQuality('high'); // ou calcular automaticamente
    },
    
    onPlayerLeft: (playerId) => {
      console.log('👋 Player desconectou:', playerId);
    },
    
    onInputReceived: (playerId, input) => {
      console.log('🎮 Input recebido:', input);
      injectInputToEmulator(input);
    },
    
    onQualityChange: (newQuality) => {
      console.log(`✨ Qualidade alterada para: ${newQuality}`);
      // Atualizar UI, mostrar notificação, etc
    },
    
    onMetricsUpdate: (hostMetrics) => {
      console.log('📊 Métricas:', {
        fps: hostMetrics.fps,
        quality: hostMetrics.quality,
        activePlayers: hostMetrics.activePlayers
      });
    }
  });

  // Injetar input no emulador
  const injectInputToEmulator = useCallback((input: any) => {
    if (!iframeRef.current?.contentWindow) return;
    
    iframeRef.current.contentWindow.postMessage({
      type: 'inject-input',
      input
    }, '*');
  }, []);

  // Capturar canvas e iniciar streaming
  useEffect(() => {
    if (!peerReady || !canvasRef.current) return;

    // Encontrar canvas do EmulatorJS
    const gameContainer = iframeRef.current?.contentDocument?.getElementById('game');
    const canvas = gameContainer?.querySelector('canvas') as HTMLCanvasElement;

    if (canvas) {
      // ✨ Iniciar streaming
      startStreaming(canvas);
    }
  }, [peerReady, startStreaming]);

  // Loop de renderização
  useEffect(() => {
    const renderLoop = () => {
      recordFrame(); // ← Contar cada frame para cálculo de FPS
      requestAnimationFrame(renderLoop);
    };
    
    const raf = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(raf);
  }, [recordFrame]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-40">
      {/* Header com Métricas */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold">🟢 HOST - Multiplayer</h1>
          
          {/* Status ao vivo */}
          {isStreaming && (
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-300 text-xs font-medium">AO VIVO</span>
            </div>
          )}

          {/* Players conectados */}
          <div className="text-sm text-gray-400">
            Players: <span className="text-white font-bold">{connectedPlayers.length}</span>
          </div>

          {/* Qualidade */}
          {metrics && (
            <div className="text-sm text-gray-400">
              Qualidade: 
              <span className={`ml-2 font-bold ${
                metrics.quality === 'full' ? 'text-green-400' :
                metrics.quality === 'high' ? 'text-blue-400' :
                metrics.quality === 'medium' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {metrics.quality.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Emulator Iframe */}
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          src="/universal-player.html?rom=..."
          className="w-full h-full border-0"
        />
      </div>

      {/* DEBUG PANEL do HOST */}
      <MultiplayerDebugPanel
        hostMetrics={metrics}
        isHost={true}
        isConnected={peerReady}
        peerId={peerId}
      />
    </div>
  );
};

/**
 * DICAS DE INTEGRAÇÃO
 * ===================
 * 
 * 1. COPIAR ESTRUTURA
 *    - Use usePeerJSPlayer/Host com todos os callbacks
 *    - Extractar 'metrics' do return
 * 
 * 2. ADICIONAR DEBUG PANEL
 *    - <MultiplayerDebugPanel playerMetrics={metrics} ... />
 *    - Vai aparecer no bottom-left automáticamente
 * 
 * 3. USAR CALLBACKS
 *    - onLatencyUpdate: Atualizar UI com latência
 *    - onQualityChange: Notificar quando qualidade muda
 *    - onMetricsUpdate: Coletar dados de analytics
 * 
 * 4. RECORDAR FRAMES
 *    - Chamar recordFrame() em cada ciclo de renderização
 *    - Isso permite calcular FPS real
 * 
 * 5. TESTAR
 *    - Abrir DevTools → Network → Throttle para "Slow 3G"
 *    - Debug Panel deve mostrar qualidade mudando
 *    - Console deve mostrar batches de inputs
 */

export default ExampleMultiplayerPlayer;