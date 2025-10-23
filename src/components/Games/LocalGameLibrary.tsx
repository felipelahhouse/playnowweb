import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Star, Users, Calendar, Gamepad2, Radio, Globe } from 'lucide-react';
import type { Game, Platform } from '../../types';
import GamePlayer from './GamePlayer';
import PlatformSelector from './PlatformSelector';
import { useRealTimePlayers } from '../../hooks/useRealTimePlayers';

interface LocalGameLibraryProps {
  onStartStream?: (game: Game) => void;
  onCreateMultiplayer?: (game: Game) => void;
}

const LocalGameLibrary: React.FC<LocalGameLibraryProps> = ({ onStartStream, onCreateMultiplayer }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { getPlayersForGame } = useRealTimePlayers();

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        // Cache busting: adiciona timestamp para forçar reload
        const timestamp = new Date().getTime();
        const response = await fetch(`/games-database.json?v=${timestamp}`);
        const data = await response.json();
        
        setGames(data.games);
        console.log(`✅ ${data.games.length} jogos carregados do banco local`);
      } catch (error) {
        console.error('❌ Erro ao carregar jogos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const genres = useMemo(() => {
    const genreSet = new Set(['all']);
    games.forEach(game => {
      if (game.genre) genreSet.add(game.genre);
    });
    return Array.from(genreSet);
  }, [games]);

  const filteredGames = useMemo(() => {
    let filtered = games;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(search) ||
        game.description?.toLowerCase().includes(search) ||
        game.genre?.toLowerCase().includes(search)
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(game => game.genre === selectedGenre);
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(game => game.platform === selectedPlatform);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === 'newest') {
        return (b.year ?? 0) - (a.year ?? 0);
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return (b.playCount ?? 0) - (a.playCount ?? 0);
    });

    return filtered;
  }, [games, searchTerm, selectedGenre, selectedPlatform, sortBy]);

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
  };

  if (selectedGame) {
    return (
      <GamePlayer
        gameTitle={selectedGame.title}
        romPath={selectedGame.romUrl}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <section className="relative min-h-screen bg-black pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />

      <div className="container mx-auto relative z-10 px-4 pt-8">

        <div className="bg-gray-900/50 backdrop-blur-xl border-2 border-cyan-500/20 rounded-3xl p-6 mb-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for your favorite retro games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-950/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 transition-all duration-300 font-medium"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative min-w-[180px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  aria-label="Filter games by genre"
                  title="Filter games by genre"
                  className="w-full pl-11 pr-4 py-4 bg-gray-950/50 border-2 border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/20 transition-all duration-300 appearance-none cursor-pointer font-medium"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-gray-900">
                      {genre === 'all' ? 'All Genres' : genre}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort games by popularity, rating, release date, or alphabetical order"
                title="Sort games"
                className="px-4 py-4 bg-gray-950/50 border-2 border-gray-800 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/20 transition-all duration-300 appearance-none cursor-pointer min-w-[160px] font-medium"
              >
                <option value="popular" className="bg-gray-900">Most Popular</option>
                <option value="rating" className="bg-gray-900">Highest Rated</option>
                <option value="newest" className="bg-gray-900">Newest</option>
                <option value="alphabetical" className="bg-gray-900">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            Choose Platform
          </h3>
          <PlatformSelector
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4" />
            <p className="text-cyan-400 text-xl font-bold">Loading games...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-24 h-24 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">No games found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {filteredGames.map((game, index) => {
              const playersOnThisGame = getPlayersForGame(game.id);
              const hasOnlinePlayers = playersOnThisGame.length > 0;
              
              return (
                <div
                  key={game.id}
                  className="group relative perspective-1000"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Card com efeito 3D */}
                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl border-2 border-gray-800 overflow-hidden transition-all duration-500 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-400/30 hover:scale-105 hover:-translate-y-3 transform-gpu">
                    
                    {/* Shine effect ao hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-transparent group-hover:via-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 z-10" />
                    
                    {/* Glow colorido no hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />

                    {/* Badge de plataforma */}
                    <div className="absolute top-2 left-2 z-20">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700 group-hover:border-cyan-400/50 transition-colors">
                        <span className="text-xs font-bold text-cyan-400 uppercase">{game.platform}</span>
                      </div>
                    </div>

                    {/* Rating badge */}
                    {game.rating && (
                      <div className="absolute top-2 right-2 z-20">
                        <div className="bg-yellow-500/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                          <Star className="w-3 h-3 text-white fill-white" />
                          <span className="text-xs font-bold text-white">{game.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {/* Imagem do jogo */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-cyan-900/30 to-purple-900/30">
                      {game.cover ? (
                        <img 
                          src={game.cover} 
                          alt={game.title} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gamepad2 className="w-20 h-20 text-cyan-400/20" />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <button
                            onClick={() => handlePlayGame(game)}
                            className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-110 animate-bounce-subtle"
                          >
                            <span className="flex items-center space-x-2">
                              <Gamepad2 className="w-6 h-6" />
                              <span className="text-lg">PLAY NOW</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Online players indicator */}
                    {hasOnlinePlayers && (
                      <div className="absolute bottom-3 right-3 z-20">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm border-2 border-green-400/50 rounded-full shadow-lg shadow-green-500/50 animate-pulse">
                          <div className="relative flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping" />
                          </div>
                          <Users className="w-3 h-3 text-white" />
                          <span className="text-white text-xs font-bold">
                            {playersOnThisGame.length} Online
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Info section */}
                    <div className="relative p-4 space-y-3">
                      <h3 className="text-white font-black text-base mb-2 group-hover:text-cyan-400 transition-colors duration-300 leading-tight line-clamp-2">
                        {game.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span className="font-bold">{(game.players ?? '1')}P</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span className="font-bold">{game.year ?? '—'}</span>
                        </div>
                        {game.genre && (
                          <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-bold">
                            {game.genre}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          onClick={() => handlePlayGame(game)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-2 px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transform hover:scale-105 flex items-center justify-center gap-1 text-xs"
                          title="Play Solo"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Play</span>
                        </button>

                        <button
                          onClick={() => onStartStream?.(game)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 transform hover:scale-105 flex items-center justify-center gap-1 text-xs"
                          title="Start Live Stream"
                        >
                          <Radio className="w-4 h-4" />
                          <span>Live</span>
                        </button>

                        <button
                          onClick={() => onCreateMultiplayer?.(game)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transform hover:scale-105 flex items-center justify-center gap-1 text-xs"
                          title="Create Multiplayer Session"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Online</span>
                        </button>
                      </div>
                    </div>

                    {/* Hover glow overlay */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 via-purple-400/5 to-pink-400/5" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredGames.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-4 bg-gray-900/50 backdrop-blur-sm border-2 border-cyan-500/20 rounded-2xl px-8 py-4">
              <div className="text-center">
                <div className="text-4xl font-black text-cyan-400 mb-1">{filteredGames.length}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Games Available</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocalGameLibrary;
