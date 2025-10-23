import React from 'react';
import { Trophy, Star, Users, TrendingUp, Zap, Crown, Play, Flame, Radio, Sparkles, Rocket } from 'lucide-react';

const Dashboard: React.FC = () => {
  const featuredGames = [
    { id: 1, title: 'Super Mario World', platform: 'SNES', players: '1.2K', trending: true },
    { id: 2, title: 'Donkey Kong Country', platform: 'SNES', players: '2.1K', trending: true },
    { id: 3, title: 'Aladdin', platform: 'SNES', players: '890', trending: true },
  ];

  const scrollToGames = () => {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />

      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px),
          linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-3 mb-8">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-60 animate-pulse" />
                <Sparkles className="w-10 h-10 text-cyan-400 relative" />
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-none">
              <span className="block text-white mb-2">PLAY</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                NOW EMU
              </span>
            </h1>

            <p className="text-gray-400 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed mb-8 font-medium">
              Experience the golden age of gaming with our advanced browser-based emulator.
              <span className="block mt-2 text-cyan-400">Play classic SNES games instantly, no downloads required.</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {[
                { icon: Zap, label: 'Instant Play', color: 'cyan' },
                { icon: Rocket, label: '60 FPS', color: 'blue' },
                { icon: Crown, label: 'HD Quality', color: 'purple' },
                { icon: Users, label: 'Multiplayer', color: 'pink' }
              ].map((feature, i) => (
                <div key={i} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative flex items-center space-x-3 bg-gray-900/80 backdrop-blur-sm border-2 border-gray-800 group-hover:border-cyan-400/50 rounded-2xl px-6 py-4 transition-all duration-300">
                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                    <span className="text-white font-bold">{feature.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={scrollToGames}
                className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-black text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <Play className="w-6 h-6" />
                  <span>START PLAYING NOW</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button className="px-12 py-5 bg-gray-900/50 backdrop-blur-sm border-2 border-cyan-500/30 text-cyan-400 font-bold text-lg rounded-2xl hover:bg-gray-900/70 hover:border-cyan-400/50 transition-all duration-300">
                Browse Library
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Play, label: 'Games', value: '500+', color: 'from-cyan-500 to-blue-500', glow: 'cyan' },
              { icon: Users, label: 'Players', value: '50K+', color: 'from-blue-500 to-purple-500', glow: 'blue' },
              { icon: Trophy, label: 'Achievements', value: '2.5K', color: 'from-purple-500 to-pink-500', glow: 'purple' },
              { icon: Star, label: 'Rating', value: '4.9', color: 'from-pink-500 to-red-500', glow: 'pink' }
            ].map((stat, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500`} />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border-2 border-gray-800 group-hover:border-gray-700 rounded-3xl p-8 transition-all duration-500 hover:scale-105">
                  <div className={`inline-flex p-4 bg-gradient-to-br ${stat.color} rounded-2xl mb-4 shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-5xl font-black text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400 font-bold text-lg">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-60 animate-pulse" />
                    <Flame className="w-8 h-8 text-orange-400 relative" />
                  </div>
                  <h2 className="text-4xl font-black text-white">TRENDING GAMES</h2>
                </div>
                <button
                  onClick={scrollToGames}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors flex items-center space-x-2 group"
                >
                  <span>View All</span>
                  <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-4">
                {featuredGames.map((game) => (
                  <div key={game.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gray-900/80 backdrop-blur-sm border-2 border-gray-800 group-hover:border-cyan-400/50 rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
                      <div className="flex items-center p-6">
                        <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 mr-6 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-black/20" />
                          <Play className="w-14 h-14 text-white relative z-10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="px-3 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-black rounded-lg flex items-center space-x-1 border border-orange-500/30">
                              <TrendingUp className="w-3 h-3" />
                              <span>HOT</span>
                            </div>
                            <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-xs font-black rounded-lg border border-cyan-500/30">
                              {game.platform}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors truncate">
                            {game.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span className="font-bold">{game.players} playing now</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-bold">4.9</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={scrollToGames}
                          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-105"
                        >
                          <Play className="w-5 h-5" />
                          <span>PLAY</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-60 animate-pulse" />
                    <Radio className="w-6 h-6 text-red-400 relative" />
                  </div>
                  <span>LIVE NOW</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { streamer: 'RetroKing77', game: 'Super Metroid', viewers: '1.2K' },
                    { streamer: 'PixelMaster', game: 'Chrono Trigger', viewers: '890' }
                  ].map((stream, i) => (
                    <div key={i} className="group bg-gray-900/80 backdrop-blur-sm border-2 border-gray-800 hover:border-red-400/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-105">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold group-hover:text-red-400 transition-colors truncate">
                            {stream.streamer}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{stream.game}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-red-400 text-xs font-black">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span>LIVE</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400 text-sm font-bold">
                          <Users className="w-4 h-4" />
                          <span>{stream.viewers}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-purple-900/30 to-pink-900/30 rounded-3xl" />
                <div className="relative bg-gray-900/80 backdrop-blur-sm border-2 border-cyan-500/30 rounded-3xl p-8">
                  <h3 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <span>QUICK START</span>
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={scrollToGames}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/50"
                    >
                      Random Game
                    </button>
                    <button
                      onClick={scrollToGames}
                      className="w-full py-4 bg-purple-500/20 border-2 border-purple-500/30 text-purple-300 font-bold rounded-xl hover:bg-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                    >
                      Browse Library
                    </button>
                    <button className="w-full py-4 bg-pink-500/20 border-2 border-pink-500/30 text-pink-300 font-bold rounded-xl hover:bg-pink-500/30 hover:border-pink-400/50 transition-all duration-300">
                      Multiplayer Lobby
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
