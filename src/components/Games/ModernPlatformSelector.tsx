import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

interface ModernPlatformSelectorProps {
  onPlatformChange: (platform: string) => void;
}

const platforms = [
  { id: 'all', name: 'Todas', icon: '🎮', color: 'from-cyan-500 to-blue-600', count: 548 },
  { id: 'snes', name: 'SNES', icon: '🎮', color: 'from-purple-500 to-purple-700', count: 180 },
  { id: 'nes', name: 'NES', icon: '🕹️', color: 'from-red-500 to-red-700', count: 120 },
  { id: 'gba', name: 'GBA', icon: '🎯', color: 'from-orange-500 to-red-600', count: 95 },
  { id: 'gbc', name: 'GBC', icon: '💎', color: 'from-blue-500 to-indigo-600', count: 50 },
  { id: 'gb', name: 'GB', icon: '📱', color: 'from-gray-500 to-gray-700', count: 40 },
  { id: 'n64', name: 'N64', icon: '🎪', color: 'from-blue-600 to-blue-800', count: 25 },
  { id: 'genesis', name: 'GENESIS', icon: '💠', color: 'from-indigo-500 to-purple-600', count: 15 },
  { id: 'ps1', name: 'PS1', icon: '⚡', color: 'from-gray-600 to-gray-800', count: 12 },
  { id: 'sms', name: 'SMS', icon: '🎨', color: 'from-pink-500 to-rose-600', count: 8 },
  { id: 'gg', name: 'GG', icon: '⚡', color: 'from-yellow-500 to-orange-600', count: 3 },
];

const ModernPlatformSelector: React.FC<ModernPlatformSelectorProps> = ({ onPlatformChange }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const handlePlatformClick = (platformId: string) => {
    setSelectedPlatform(platformId);
    onPlatformChange(platformId);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-black text-lg">Choose Platform</h3>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatform === platform.id;
          
          return (
            <button
              key={platform.id}
              onClick={() => handlePlatformClick(platform.id)}
              className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                isSelected
                  ? 'scale-105 shadow-2xl'
                  : 'hover:scale-105 hover:shadow-xl'
              }`}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${platform.color} transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`}
              />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              {/* Border Glow */}
              {isSelected && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-600 blur opacity-75 animate-pulse" />
              )}
              
              {/* Content */}
              <div className="relative px-4 py-3 flex flex-col items-center gap-2">
                {/* Icon */}
                <span className="text-2xl filter drop-shadow-lg">{platform.icon}</span>
                
                {/* Name */}
                <span className={`font-bold text-sm transition-all ${
                  isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                }`}>
                  {platform.name}
                </span>
                
                {/* Count Badge */}
                <div className={`absolute -top-2 -right-2 bg-black/80 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-white/30 text-white/70 group-hover:border-white group-hover:text-white'
                }`}>
                  {platform.count}
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModernPlatformSelector;
