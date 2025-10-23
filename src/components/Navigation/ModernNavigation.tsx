import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, Radio, Users, Trophy, TrendingUp, Flame } from 'lucide-react';

type ViewType = 'streams' | 'games' | 'multiplayer' | 'tournaments';

interface ModernNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  counters?: {
    streams?: number;
    games?: number;
    multiplayer?: number;
    tournaments?: number;
  };
}

const ModernNavigation: React.FC<ModernNavigationProps> = ({
  currentView,
  onViewChange,
  counters = {},
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    {
      id: 'games' as ViewType,
      label: 'Games',
      icon: Gamepad2,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      count: counters.games,
    },
    {
      id: 'streams' as ViewType,
      label: 'Live Streams',
      icon: Radio,
      color: 'red',
      gradient: 'from-red-500 to-orange-500',
      count: counters.streams,
      pulse: true,
    },
    {
      id: 'multiplayer' as ViewType,
      label: 'Multiplayer',
      icon: Users,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      count: counters.multiplayer,
    },
    {
      id: 'tournaments' as ViewType,
      label: 'Tournaments',
      icon: Trophy,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500',
      count: counters.tournaments,
    },
  ];

  // Update indicator position
  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentView);
    const currentTab = tabsRef.current[currentIndex];

    if (currentTab && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = currentTab.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [currentView, tabs]);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border-t border-gray-800 sticky top-16 z-40 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative" ref={containerRef}>
          {/* Tabs */}
          <div className="flex items-center gap-2 sm:gap-4 py-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const isActive = currentView === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => onViewChange(tab.id)}
                  className={`
                    relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base
                    transition-all duration-300 whitespace-nowrap group
                    ${isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl`
                      : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/80'
                    }
                  `}
                >
                  {/* Icon with animation */}
                  <div className={`relative ${isActive ? 'animate-bounce-subtle' : ''}`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${tab.pulse && isActive ? 'animate-pulse' : ''}`} />
                    
                    {/* Glow effect */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} blur-xl opacity-50`} />
                    )}
                  </div>

                  {/* Label */}
                  <span className="relative z-10">
                    {tab.label}
                  </span>

                  {/* Counter Badge */}
                  {tab.count !== undefined && tab.count > 0 && (
                    <div className={`
                      flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : `bg-${tab.color}-500/20 text-${tab.color}-400`
                      }
                      ${tab.pulse ? 'animate-pulse' : ''}
                    `}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </div>
                  )}

                  {/* Trending indicator */}
                  {tab.id === 'streams' && counters.streams && counters.streams > 0 && (
                    <TrendingUp className="w-4 h-4 text-orange-400 animate-bounce" />
                  )}

                  {/* Hot indicator */}
                  {tab.id === 'multiplayer' && counters.multiplayer && counters.multiplayer > 5 && (
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  )}

                  {/* Hover effect */}
                  <div className={`
                    absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    bg-gradient-to-r ${tab.gradient} blur-xl -z-10
                  `} style={{ transform: 'scale(0.9)' }} />
                </button>
              );
            })}
          </div>

          {/* Floating Indicator (Desktop only) */}
          <div
            className="hidden sm:block absolute bottom-2 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full transition-all duration-500 ease-out"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 blur-lg opacity-75" />
          </div>
        </div>
      </div>

      {/* Bottom border with animation */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer-slow" />
        </div>
      </div>
    </div>
  );
};

export default ModernNavigation;
