import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Ghost, Snowflake, Zap, Sparkles } from 'lucide-react';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { 
      id: 'default' as const, 
      name: 'Original', 
      icon: Sparkles, 
      colors: ['cyan', 'purple', 'pink'],
      emoji: '🎮'
    },
    { 
      id: 'halloween' as const, 
      name: 'Halloween', 
      icon: Ghost, 
      colors: ['orange', 'purple', 'black'],
      emoji: '🎃'
    },
    { 
      id: 'christmas' as const, 
      name: 'Natal', 
      icon: Snowflake, 
      colors: ['red', 'green', 'white'],
      emoji: '🎄'
    },
    { 
      id: 'neon' as const, 
      name: 'Neon', 
      icon: Zap, 
      colors: ['pink', 'yellow', 'cyan'],
      emoji: '⚡'
    },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 hover:scale-105 group"
        title="Change Theme"
      >
        <Palette className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xl">{currentTheme.emoji}</span>
        <span className="hidden sm:inline text-purple-300 font-bold text-sm">{currentTheme.name}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 bg-black/95 backdrop-blur-2xl rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden z-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />
            <div className="p-2 mt-2">
              <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Escolher Tema
              </p>
              {themes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                      theme === t.id
                        ? 'bg-purple-500/20 border border-purple-400/50'
                        : 'hover:bg-purple-500/10 border border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-purple-400" />
                        <p className={`font-bold text-sm ${
                          theme === t.id ? 'text-purple-300' : 'text-gray-300'
                        }`}>
                          {t.name}
                        </p>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {t.colors.map((color, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full bg-${color}-500`}
                            style={{
                              background: color === 'orange' ? '#f97316' : 
                                         color === 'purple' ? '#a855f7' :
                                         color === 'cyan' ? '#06b6d4' :
                                         color === 'pink' ? '#ec4899' :
                                         color === 'red' ? '#ef4444' :
                                         color === 'green' ? '#22c55e' :
                                         color === 'yellow' ? '#eab308' :
                                         color === 'white' ? '#fff' : '#000'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {theme === t.id && (
                      <div className="w-2 h-2 bg-purple-400 rounded-full relative">
                        <div className="absolute inset-0 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
