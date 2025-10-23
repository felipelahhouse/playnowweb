import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HalloweenEffects: React.FC = () => {
  const { theme } = useTheme();

  if (theme !== 'halloween') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-purple-700/5 to-transparent" />
      <div className="absolute top-20 left-4 flex flex-col gap-4">
        <div className="text-6xl animate-bounce-slow drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] hover:scale-110 transition-transform duration-300">
          🎃
        </div>
        <div className="text-5xl animate-bounce-slow drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.5s' }}>
          🎃
        </div>
      </div>
      <div className="absolute top-24 left-8 w-16 h-16 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute top-40 left-8 w-14 h-14 bg-orange-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  );
};

export default HalloweenEffects;
