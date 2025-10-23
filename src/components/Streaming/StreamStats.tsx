/**
 * 📊 Componente de Estatísticas de Stream
 * Exibe métricas e informações sobre streams
 */

import React from 'react';
import { Radio, Eye, Heart, Clock, TrendingUp, Users } from 'lucide-react';

interface StreamStatsProps {
  totalStreams: number;
  liveStreams: number;
  totalViewers: number;
  averageViewers: number;
  className?: string;
}

const StreamStats: React.FC<StreamStatsProps> = ({
  totalStreams,
  liveStreams,
  totalViewers,
  averageViewers,
  className = ''
}) => {
  const stats = [
    {
      icon: Radio,
      label: 'Streams Ao Vivo',
      value: liveStreams,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    {
      icon: Users,
      label: 'Total de Streams',
      value: totalStreams,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      icon: Eye,
      label: 'Espectadores',
      value: totalViewers.toLocaleString(),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: TrendingUp,
      label: 'Média de Viewers',
      value: averageViewers,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-xl p-4 transition-all hover:scale-105`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StreamStats;

/**
 * 📈 Componente de Performance da Stream
 * Exibe métricas de performance em tempo real
 */

interface StreamPerformanceProps {
  fps: number;
  quality: 'high' | 'medium' | 'low';
  bandwidth: string;
  uptime: number;
  framesSent?: number;
  className?: string;
}

export const StreamPerformance: React.FC<StreamPerformanceProps> = ({
  fps,
  quality,
  bandwidth,
  uptime,
  framesSent = 0,
  className = ''
}) => {
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getQualityColor = (q: string): string => {
    switch (q) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const metrics = [
    { label: 'FPS', value: fps, unit: '' },
    { label: 'Qualidade', value: quality.toUpperCase(), unit: '' },
    { label: 'Banda', value: bandwidth, unit: '' },
    { label: 'Uptime', value: formatUptime(uptime), unit: '' },
    { label: 'Frames', value: framesSent.toLocaleString(), unit: '' }
  ];

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-bold">Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">{metric.label}</p>
            <p className={`font-bold text-sm ${index === 1 ? getQualityColor(quality) : 'text-white'}`}>
              {metric.value}
              {metric.unit && <span className="text-gray-500 ml-1">{metric.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 🎯 Componente de Status da Stream
 * Indicador visual do status da stream
 */

interface StreamStatusProps {
  isLive: boolean;
  viewers: number;
  likes: number;
  duration: string;
  className?: string;
}

export const StreamStatus: React.FC<StreamStatusProps> = ({
  isLive,
  viewers,
  likes,
  duration,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* Status LIVE */}
      {isLive && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500 rounded-full">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-red-500 font-bold text-sm">AO VIVO</span>
        </div>
      )}

      {/* Viewers */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
        <Eye className="w-4 h-4 text-purple-400" />
        <span className="text-purple-400 font-bold text-sm">{viewers.toLocaleString()}</span>
      </div>

      {/* Likes */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-full">
        <Heart className="w-4 h-4 text-pink-400" />
        <span className="text-pink-400 font-bold text-sm">{likes.toLocaleString()}</span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 font-bold text-sm">{duration}</span>
      </div>
    </div>
  );
};

/**
 * 🏆 Componente de Top Streamers
 * Lista dos streamers mais populares
 */

interface TopStreamer {
  id: string;
  username: string;
  avatar?: string;
  viewers: number;
  isLive: boolean;
}

interface TopStreamersProps {
  streamers: TopStreamer[];
  className?: string;
}

export const TopStreamers: React.FC<TopStreamersProps> = ({
  streamers,
  className = ''
}) => {
  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-bold">Top Streamers</h3>
      </div>

      <div className="space-y-3">
        {streamers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            Nenhum streamer online
          </p>
        ) : (
          streamers.map((streamer, index) => (
            <div
              key={streamer.id}
              className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-all cursor-pointer"
            >
              {/* Ranking */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {index + 1}
              </div>

              {/* Avatar */}
              {streamer.avatar ? (
                <img
                  src={streamer.avatar}
                  alt={streamer.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  {streamer.username[0]?.toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{streamer.username}</p>
                <div className="flex items-center gap-2">
                  {streamer.isLive && (
                    <span className="text-red-400 text-xs font-bold">● LIVE</span>
                  )}
                  <span className="text-gray-400 text-xs">
                    {streamer.viewers.toLocaleString()} viewers
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};