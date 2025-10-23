import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ImprovedGameCard from '../Games/ImprovedGameCard';
import ModernNavigation from '../Navigation/ModernNavigation';
import UserDashboardRich from '../User/UserDashboardRich';
import type { Game } from '../../types';

type ViewType = 'streams' | 'games' | 'multiplayer' | 'tournaments';
type DemoType = 'cards' | 'navigation' | 'dashboard' | 'all';

const ImprovementsShowcase: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('games');
  const [currentDemo, setCurrentDemo] = useState<DemoType>('all');

  // Mock games data
  const mockGames = [
    {
      id: '1',
      title: 'Super Mario World',
      platform: 'snes',
      cover: '/covers/snes/Super_Mario_World_Coverart.png',
      rating: 5,
      playCount: 1234,
      genre: 'Platform',
      year: 1990,
      players: '1-2',
    },
    {
      id: '2',
      title: 'Donkey Kong Country',
      platform: 'snes',
      cover: '/covers/snes/Donkey_Kong_Country_SNES_cover.png',
      rating: 5,
      playCount: 890,
      genre: 'Platform',
      year: 1994,
      players: '1-2',
    },
    {
      id: '3',
      title: 'Street Fighter Alpha 2',
      platform: 'snes',
      cover: '/covers/snes/Street Fighter Alpha 2 (U) [!].jpg',
      rating: 4,
      playCount: 567,
      genre: 'Fighting',
      year: 1996,
      players: '1-2',
    },
    {
      id: '4',
      title: 'Castlevania: Dracula X',
      platform: 'snes',
      cover: '/covers/snes/Castlevania_Dracula_X_cover_art.png',
      rating: 5,
      playCount: 432,
      genre: 'Action',
      year: 1995,
      players: '1',
    },
  ];

  const handlePlay = (game: { id: string; title: string }) => {
    alert(`Playing: ${game.title}`);
  };

  const demoOptions: DemoType[] = ['all', 'cards', 'navigation', 'dashboard'];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-gray-900 to-black border-b border-cyan-500/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-cyan-400" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                    UI Improvements Showcase
                  </h1>
                </div>
                <p className="text-sm text-gray-400 mt-1">Preview all the new improvements</p>
              </div>
            </div>

            {/* Demo Selector */}
            <div className="flex items-center gap-2">
              {demoOptions.map((demo) => (
                <button
                  key={demo}
                  onClick={() => setCurrentDemo(demo)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    currentDemo === demo
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {demo.charAt(0).toUpperCase() + demo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Demo */}
      {(currentDemo === 'all' || currentDemo === 'navigation') && (
        <div className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Modern Navigation with Floating Indicator
            </h2>
          </div>
          <ModernNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            counters={{
              streams: 8,
              games: 1234,
              multiplayer: 12,
              tournaments: 3,
            }}
          />
        </div>
      )}

      {/* Game Cards Demo */}
      {(currentDemo === 'all' || currentDemo === 'cards') && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Premium Game Cards with 3D Effects
          </h2>
          <p className="text-gray-400 mb-8">
            Hover over cards to see 3D rotation, shine effects, and quick actions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockGames.map((game, index) => (
              <ImprovedGameCard
                key={game.id}
                game={game}
                onlineCount={index === 0 ? 12 : index === 1 ? 8 : 0}
                onPlay={handlePlay}
                onFavorite={(id) => console.log('Favorite:', id)}
                isFavorite={index === 0}
                isNew={index === 0}
                isPopular={index === 1}
                isTrending={index === 2}
              />
            ))}
          </div>

          {/* Features List */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="3D Hover Effects"
              description="Cards rotate in 3D space when you hover, creating depth"
              gradient="from-cyan-500 to-blue-500"
            />
            <FeatureCard
              title="Smart Badges"
              description="NEW, HOT, and TRENDING badges with animations"
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              title="Quick Actions"
              description="Play, favorite, preview, and share directly from card"
              gradient="from-green-500 to-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Dashboard Demo */}
      {(currentDemo === 'all' || currentDemo === 'dashboard') && (
        <div className="bg-gradient-to-b from-black via-gray-950 to-black py-12">
          <div className="container mx-auto px-4 mb-8">
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Rich User Dashboard
            </h2>
            <p className="text-gray-400">
              Complete stats, activity charts, achievements, and recent games
            </p>
          </div>
          
          <UserDashboardRich />

          {/* Features List */}
          <div className="container mx-auto px-4 mt-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FeatureCard
                title="Level & XP System"
                description="Visual progress with animated XP bar"
                gradient="from-yellow-500 to-orange-500"
                small
              />
              <FeatureCard
                title="Activity Charts"
                description="Weekly gaming activity visualization"
                gradient="from-cyan-500 to-blue-500"
                small
              />
              <FeatureCard
                title="Recent Games"
                description="Timeline of recently played games"
                gradient="from-purple-500 to-pink-500"
                small
              />
              <FeatureCard
                title="Achievements"
                description="Showcase unlocked achievements with rarity"
                gradient="from-red-500 to-orange-500"
                small
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {currentDemo === 'all' && (
        <div className="container mx-auto px-4 py-16">
          <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-12 border-2 border-cyan-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to Apply These Improvements?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                All features are optimized, responsive, and ready for production
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:scale-105 transition-transform">
                  ✅ Apply to Production
                </button>
                <button className="px-8 py-4 bg-gray-800 border-2 border-cyan-500/30 text-white font-bold rounded-2xl hover:border-cyan-500 transition-colors">
                  📝 Customize More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description: string;
  gradient: string;
  small?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, gradient, small }) => {
  return (
    <div className={`relative bg-gradient-to-br from-gray-900 to-black rounded-2xl ${small ? 'p-4' : 'p-6'} border-2 border-gray-800 overflow-hidden group`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
      
      <div className="relative z-10">
        <h3 className={`${small ? 'text-base' : 'text-lg'} font-black text-white mb-2`}>{title}</h3>
        <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>{description}</p>
      </div>
    </div>
  );
};

export default ImprovementsShowcase;
