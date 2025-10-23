import React, { useState } from 'react';
import { Play, Users, Star, TrendingUp, Flame, Clock, Heart, Share2, Eye } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  platform: string;
  cover?: string;
  coverUrl?: string;
  rating?: number;
  playCount?: number;
  genre?: string;
  year?: number;
  players?: string;
}

interface ImprovedGameCardProps {
  game: Game;
  onlineCount?: number;
  onPlay: (game: Game) => void;
  onFavorite?: (gameId: string) => void;
  isFavorite?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
}

const ImprovedGameCard: React.FC<ImprovedGameCardProps> = ({
  game,
  onlineCount = 0,
  onPlay,
  onFavorite,
  isFavorite = false,
  isNew = false,
  isPopular = false,
  isTrending = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const coverImage = game.coverUrl || game.cover || '/covers/placeholder.png';

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      'snes': 'from-purple-500 to-purple-600',
      'gba': 'from-blue-500 to-blue-600',
      'gbc': 'from-yellow-500 to-yellow-600',
      'genesis': 'from-red-500 to-red-600',
      'n64': 'from-green-500 to-green-600',
      'ps1': 'from-gray-500 to-gray-600'
    };
    return colors[platform?.toLowerCase()] || 'from-cyan-500 to-cyan-600';
  };

  const getPlatformName = (platform: string): string => {
    const names: Record<string, string> = {
      'snes': 'SNES',
      'gba': 'GBA',
      'gbc': 'GBC',
      'genesis': 'Genesis',
      'n64': 'N64',
      'ps1': 'PS1'
    };
    return names[platform?.toLowerCase()] || platform?.toUpperCase() || 'ROM';
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl overflow-hidden border-2 border-gray-800 transition-all duration-500 hover:border-cyan-500/50"
        style={{
          transform: isHovered ? 'rotateY(5deg) rotateX(-5deg) scale(1.05)' : 'rotateY(0) rotateX(0) scale(1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />

        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {/* Skeleton Loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
          )}

          <img
            src={coverImage}
            alt={game.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isHovered ? 'scale-110 blur-sm' : 'scale-100 blur-0'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = '/covers/placeholder.png';
              setImageLoaded(true);
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
            {/* Platform Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getPlatformColor(game.platform)} shadow-lg backdrop-blur-sm`}>
              {getPlatformName(game.platform)}
            </span>

            {/* Status Badges */}
            <div className="flex flex-col gap-2">
              {isNew && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                  <Flame className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">NEW</span>
                </div>
              )}
              {isPopular && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg">
                  <Flame className="w-3 h-3 text-white animate-pulse" />
                  <span className="text-xs font-bold text-white">HOT</span>
                </div>
              )}
              {isTrending && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">TREND</span>
                </div>
              )}
            </div>
          </div>

          {/* Online Players Count */}
          {onlineCount > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <Users className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400">{onlineCount}</span>
            </div>
          )}

          {/* Quick Actions Overlay (Visible on Hover) */}
          <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={() => onPlay(game)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-110 transition-transform duration-300 shadow-2xl shadow-cyan-500/50"
            >
              <Play className="w-5 h-5" />
              <span>PLAY NOW</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.(game.id);
                }}
                className="p-2.5 bg-gray-900/80 backdrop-blur-sm border border-pink-500/30 rounded-lg hover:bg-pink-500/20 hover:border-pink-500 transition-all duration-300 group/btn"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-pink-400'} group-hover/btn:scale-125 transition-transform`} />
              </button>

              <button className="p-2.5 bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg hover:bg-purple-500/20 hover:border-purple-500 transition-all duration-300 group/btn">
                <Eye className="w-5 h-5 text-purple-400 group-hover/btn:scale-125 transition-transform" />
              </button>

              <button className="p-2.5 bg-gray-900/80 backdrop-blur-sm border border-blue-500/30 rounded-lg hover:bg-blue-500/20 hover:border-blue-500 transition-all duration-300 group/btn">
                <Share2 className="w-5 h-5 text-blue-400 group-hover/btn:scale-125 transition-transform" />
              </button>
            </div>
          </div>

          {/* Rating Stars (Bottom Left) */}
          {game.rating && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < (game.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="p-4 bg-gradient-to-b from-gray-900 to-black">
          {/* Title */}
          <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors duration-300">
            {game.title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{game.year || '199X'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{game.players || '1-2'}</span>
            </div>
            {game.playCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{game.playCount}+</span>
              </div>
            )}
          </div>

          {/* Genre Tag */}
          {game.genre && (
            <div className="inline-block px-2.5 py-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg text-xs font-medium text-cyan-400">
              {game.genre}
            </div>
          )}
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
        </div>
      </div>

      {/* 3D Shadow */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          transform: isHovered ? 'translateY(10px) scale(0.95)' : 'translateY(0) scale(1)',
        }}
      />
    </div>
  );
};

export default ImprovedGameCard;
