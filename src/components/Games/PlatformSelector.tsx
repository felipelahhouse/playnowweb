import React from 'react';
import { Platform } from '../../types';
import { getAllPlatforms } from '../../lib/platforms';

interface PlatformSelectorProps {
  selectedPlatform: Platform | 'all';
  onPlatformChange: (platform: Platform | 'all') => void;
  className?: string;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange,
  className = ''
}) => {
  const platforms = getAllPlatforms();

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {/* Botão "Todas" - MELHORADO */}
      <button
        onClick={() => onPlatformChange('all')}
        className={`group relative px-5 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 overflow-hidden ${
          selectedPlatform === 'all'
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-200 scale-105 shadow-lg shadow-cyan-500/30'
            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20'
        }`}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        {/* Glow on selected */}
        {selectedPlatform === 'all' && (
          <div className="absolute -inset-1 bg-cyan-500/20 blur-xl animate-pulse" />
        )}
        
        <span className="text-xl relative z-10">🎮</span>
        <span className="font-bold relative z-10">Todas</span>
      </button>

      {/* Botões das plataformas - MELHORADOS */}
      {platforms.map((platform) => {
        const isSelected = selectedPlatform === platform.id;
        
        return (
          <button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={`group relative px-5 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 overflow-hidden ${
              isSelected
                ? `${platform.backgroundColor} ${platform.borderColor} ${platform.color} scale-105 shadow-lg`
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:scale-105 hover:shadow-lg'
            }`}
            title={platform.fullName}
            style={isSelected ? { boxShadow: `0 10px 25px ${platform.borderColor.replace('border-', 'rgba(').replace('-500', ', 0.3)')}` } : undefined}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            {/* Glow on selected */}
            {isSelected && (
              <div className="absolute -inset-1 blur-xl animate-pulse opacity-30" style={{ backgroundColor: platform.borderColor.replace('border-', '').replace('-500', '') }} />
            )}
            
            {/* Icon with bounce on hover */}
            <span className="text-xl relative z-10 group-hover:animate-bounce-subtle">{platform.icon}</span>
            
            {/* Name */}
            <span className="font-bold relative z-10">{platform.name}</span>
            
            {/* Selected indicator dot */}
            {isSelected && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlatformSelector;