/**
 * 🛠️ Multiplayer DEBUG Panel - Real-time Performance Monitoring
 * Mostra latência, FPS, qualidade, bandwidth e outras métricas em tempo real
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Activity, Wifi, Zap, BarChart3 } from 'lucide-react';

interface PerformanceMetrics {
  latency: number;
  averageLatency: number;
  packetLoss: number;
  bandwidth: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'full' | 'high' | 'medium' | 'low';
  inputQueue: number;
  fps?: number;
  activePlayers?: number;
  cpu?: number;
}

interface MultiplayerDebugPanelProps {
  playerMetrics?: PerformanceMetrics;
  hostMetrics?: PerformanceMetrics;
  isHost?: boolean;
  isConnected?: boolean;
  peerId?: string;
  hostPeerId?: string;
}

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent':
    case 'full':
    case 'high':
      return 'text-green-400 bg-green-400/10';
    case 'good':
      return 'text-blue-400 bg-blue-400/10';
    case 'fair':
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'poor':
    case 'low':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
};

const getQualityIcon = (quality: string) => {
  switch (quality) {
    case 'excellent':
    case 'full':
    case 'high':
      return '🟢';
    case 'good':
      return '🔵';
    case 'fair':
    case 'medium':
      return '🟡';
    case 'poor':
    case 'low':
      return '🔴';
    default:
      return '⚪';
  }
};

export const MultiplayerDebugPanel: React.FC<MultiplayerDebugPanelProps> = ({
  playerMetrics,
  hostMetrics,
  isHost = false,
  isConnected = false,
  peerId,
  hostPeerId
}) => {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<{
    latency: number[];
    fps: number[];
    quality: string[];
  }>({
    latency: [],
    fps: [],
    quality: []
  });

  const metrics = isHost ? hostMetrics : playerMetrics;

  // Atualizar histórico para gráficos
  useEffect(() => {
    if (!metrics) return;

    setHistory(prev => ({
      latency: [...prev.latency.slice(-19), metrics.latency || 0],
      fps: [...prev.fps.slice(-19), metrics.fps || 0],
      quality: [...prev.quality.slice(-19), metrics.quality || 'unknown']
    }));
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="fixed bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-400 border border-gray-700">
        📊 Métricas indisponíveis
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Botão Collapse/Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-2 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Mini View (sempre visível) */}
      {!expanded && (
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700 text-xs space-y-2 min-w-[250px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`${getQualityColor(metrics.quality)} px-2 py-1 rounded text-xs font-semibold`}>
              {getQualityIcon(metrics.quality)} {metrics.quality.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Latência:</span>
            <span className="text-white font-mono">{Math.round(metrics.latency)}ms</span>
          </div>

          {metrics.fps !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">FPS:</span>
              <span className="text-white font-mono">{metrics.fps}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Bandwidth:</span>
            <span className="text-white font-mono">{(metrics.bandwidth / 1000000).toFixed(1)}Mbps</span>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="bg-gray-800/95 backdrop-blur-md rounded-lg p-4 border border-gray-700 text-xs space-y-4 min-w-[320px] max-w-md">
          {/* Header */}
          <div className="border-b border-gray-700 pb-3">
            <h3 className="text-white font-bold flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              {isHost ? '🟢 HOST Performance' : '🎮 PLAYER Performance'}
            </h3>
            <p className="text-gray-400 text-xs">{isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          </div>

          {/* Qualidade */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Qualidade
              </span>
              <span className={`${getQualityColor(metrics.quality)} px-2 py-1 rounded font-semibold`}>
                {getQualityIcon(metrics.quality)} {metrics.quality.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Latência */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <Wifi className="w-3 h-3" /> Latência
              </span>
              <span className="text-white font-mono font-bold">{Math.round(metrics.latency)}ms</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Média:</span>
              <span>{Math.round(metrics.averageLatency)}ms</span>
            </div>
            {metrics.packetLoss > 0 && (
              <div className="flex items-center justify-between text-xs text-red-400">
                <span>Perda:</span>
                <span>{metrics.packetLoss.toFixed(1)}%</span>
              </div>
            )}
            {/* Latency Graph */}
            <div className="flex items-end gap-0.5 h-12 bg-gray-900/50 p-1 rounded">
              {history.latency.map((lat, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-blue-500/70 rounded-t min-h-1"
                  style={{
                    height: `${(lat / 300) * 100}%`,
                    opacity: 0.5 + (idx / history.latency.length) * 0.5
                  }}
                  title={`${Math.round(lat)}ms`}
                />
              ))}
            </div>
          </div>

          {/* FPS (apenas HOST) */}
          {metrics.fps !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> FPS
                </span>
                <span className="text-white font-mono font-bold">{metrics.fps}</span>
              </div>
              {/* FPS Graph */}
              <div className="flex items-end gap-0.5 h-8 bg-gray-900/50 p-1 rounded">
                {history.fps.map((fps, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-green-500/70 rounded-t min-h-1"
                    style={{
                      height: `${(fps / 60) * 100}%`,
                      opacity: 0.5 + (idx / history.fps.length) * 0.5
                    }}
                    title={`${fps}fps`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bandwidth */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bandwidth</span>
              <span className="text-white font-mono font-bold">
                {(metrics.bandwidth / 1000000).toFixed(1)}Mbps
              </span>
            </div>
          </div>

          {/* Input Queue */}
          {metrics.inputQueue !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Input Queue</span>
                <span className="text-white font-mono">{metrics.inputQueue}</span>
              </div>
            </div>
          )}

          {/* Players (apenas HOST) */}
          {metrics.activePlayers !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Jogadores Ativos</span>
                <span className="text-white font-mono">{metrics.activePlayers}</span>
              </div>
            </div>
          )}

          {/* IDs */}
          <div className="border-t border-gray-700 pt-3 space-y-1">
            <div className="text-xs">
              <span className="text-gray-500">Seu ID:</span>
              <br />
              <span className="text-gray-400 font-mono break-all text-xs">{peerId || 'N/A'}</span>
            </div>
            {!isHost && hostPeerId && (
              <div className="text-xs">
                <span className="text-gray-500">HOST ID:</span>
                <br />
                <span className="text-gray-400 font-mono break-all text-xs">{hostPeerId}</span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-400/5 border border-blue-400/20 rounded p-2 text-xs text-blue-300">
            <strong>💡 Dica:</strong> Se a qualidade baixar para RED, verifique sua conexão de internet.
            A qualidade é ajustada automaticamente baseada na latência e players.
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerDebugPanel;