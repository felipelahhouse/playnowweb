import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Star, Users, Calendar, Gamepad2, Zap, TrendingUp, Radio, Globe } from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Game, Platform } from '../../types';
import GamePlayer from './GamePlayer';
import PlatformSelector from './PlatformSelector';
import { useRealTimePlayers } from '../../hooks/useRealTimePlayers';

interface GameLibraryProps {
  onStartStream?: (game: Game) => void;
  onCreateMultiplayer?: (game: Game) => void;
}

const GameLibrary: React.FC<GameLibraryProps> = ({ onStartStream, onCreateMultiplayer }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { getPlayersForGame, getTotalOnlinePlayers } = useRealTimePlayers();

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const gamesRef = collection(db, 'games');
        const gamesQuery = query(gamesRef, orderBy('playCount', 'desc'));
        const snapshot = await getDocs(gamesQuery);

        const loadedGames: Game[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            title: data.title || 'Untitled',
            description: data.description ?? null,
            cover: data.cover ?? null,
            coverUrl: data.coverUrl ?? data.cover ?? null,
            playCount: data.playCount ?? 0,
            multiplayerSupport: data.multiplayerSupport ?? false,
            romUrl: data.romUrl ?? '',
            platform: data.platform ?? 'snes',
            genre: data.genre ?? null,
            year: data.year ?? null,
            players: data.players ?? (data.multiplayerSupport ? 2 : 1),
            rating: data.rating ?? 4.5,
            publisher: data.publisher ?? null,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
          } satisfies Game;
        });

        setGames(loadedGames);
      } catch (error) {
        console.error('Error fetching games from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadGames();
  }, []);

  const genres = useMemo(() => {
    const baseGenres = new Set<string>(['all']);
    games.forEach((game) => {
      if (game.genre) {
        baseGenres.add(game.genre);
      }
    });
    return Array.from(baseGenres);
  }, [games]);

  const filteredGames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedGenre = selectedGenre.toLowerCase();

    return [...games]
      .filter((game) => {
        const titleMatch =
          normalizedSearch.length === 0 ||
          game.title.toLowerCase().includes(normalizedSearch) ||
          (game.genre ? game.genre.toLowerCase().includes(normalizedSearch) : false);

        const genreMatch =
          normalizedGenre === 'all' ||
          (game.genre ? game.genre.toLowerCase() === normalizedGenre : false);

        const platformMatch =
          selectedPlatform === 'all' ||
          game.platform === selectedPlatform;

        return titleMatch && genreMatch && platformMatch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return (b.playCount ?? 0) - (a.playCount ?? 0);
          case 'rating':
            return (b.rating ?? 0) - (a.rating ?? 0);
          case 'newest':
            return (b.year ?? 0) - (a.year ?? 0);
          case 'alphabetical':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [games, searchTerm, selectedGenre, selectedPlatform, sortBy]);

  const getCover = (game: Game) => game.coverUrl ?? game.cover ?? '/covers/placeholder.png';

  const handlePlayGame = async (game: Game) => {
    try {
      const gameRef = doc(db, 'games', game.id);
      await updateDoc(gameRef, {
        playCount: increment(1),
      });

      setGames((prevGames) =>
        prevGames.map((existing) =>
          existing.id === game.id
            ? { ...existing, playCount: (existing.playCount ?? 0) + 1 }
            : existing
        )
      );
    } catch (error) {
      console.error('Error updating play count:', error);
    } finally {
      setSelectedGame(game);
    }
  };

  return (
    <>
      <section id="games" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 pointer-events-none" />

        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400" />
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-60 animate-pulse" />
                <Gamepad2 className="w-12 h-12 text-cyan-400 relative animate-bounce" />
              </div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400" />
            </div>

            <h2 className="text-6xl md:text-7xl font-black text-white mb-4 leading-none">
              <span className="block">RETRO GAME</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                LIBRARY
              </span>
            </h2>

            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed mb-6">
              Play classic SNES games instantly in your browser with save states and HD rendering
            </p>

            <div className="flex items-center justify-center space-x-6 text-sm">
              {[
                { icon: Zap, label: 'Instant Play', color: 'cyan' },
                { icon: Star, label: '500+ Games', color: 'yellow' },
                { icon: TrendingUp, label: 'HD Graphics', color: 'purple' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                  <span className="text-gray-400 font-bold">{feature.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 h-1 w-48 mx-auto bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full" />
          </div>

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

          {/* Platform Selector */}
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
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                <p className="text-cyan-400 font-bold">Loading games...</p>
              </div>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8 sm:mb-12">
                {filteredGames.map((game, index) => {
                  const playersOnThisGame = getPlayersForGame(game.id);
                  const hasOnlinePlayers = playersOnThisGame.length > 0;
                  
                  return (
                  <div
                    key={game.id}
                    className="group relative bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-xl border-2 border-gray-800 overflow-hidden hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500 hover:scale-105 hover:-translate-y-1 sm:hover:-translate-y-2 active:scale-95 touch-manipulation"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-cyan-900/30 to-purple-900/30">
                      {getCover(game) ? (
                        <img src={getCover(game)} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gamepad2 className="w-16 sm:w-20 h-16 sm:h-20 text-cyan-400/20" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                      {/* Botão Play - Sempre visível no mobile, hover no desktop */}
                      <div className="absolute inset-0 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-sm">
                        <button
                          onClick={() => handlePlayGame(game)}
                          className="relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform sm:group-hover:scale-110 active:scale-95"
                        >
                          <span className="flex items-center space-x-2">
                            <Gamepad2 className="w-4 sm:w-5 h-4 sm:h-5" />
                            <span className="text-sm sm:text-base">PLAY NOW</span>
                          </span>
                        </button>
                      </div>

                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/90 backdrop-blur-sm rounded-lg text-[10px] sm:text-xs text-white border border-purple-400/30 font-bold shadow-lg uppercase">
                          {game.platform}
                        </span>
                      </div>

                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                        <Star className="w-3 sm:w-4 h-3 sm:h-4 text-white fill-current" />
                          <span className="text-white text-xs sm:text-sm font-bold">{(game.rating ?? 4.5).toFixed(1)}</span>
                      </div>
                      
                      {/* Indicador de Jogadores Online - Posicionado abaixo da estrela */}
                      {hasOnlinePlayers && (
                        <div className="absolute top-14 right-3 z-10">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm border border-green-400/50 rounded-full shadow-lg shadow-green-500/50">
                              <div className="relative flex items-center">
                                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                <div className="absolute inset-0 w-2 h-2 bg-green-300 rounded-full animate-ping" />
                              </div>
                              <span className="text-white text-xs font-bold">
                                {playersOnThisGame.length}
                              </span>
                            </div>
                            
                            {/* Avatares dos jogadores */}
                            <div className="flex -space-x-2">
                              {playersOnThisGame.slice(0, 3).map((player) => (
                                <div
                                  key={player.id}
                                  className="w-7 h-7 rounded-full border-2 border-gray-900 bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-lg"
                                  title={player.username}
                                >
                                  {player.username[0].toUpperCase()}
                                </div>
                              ))}
                              {playersOnThisGame.length > 3 && (
                                <div className="w-7 h-7 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                  +{playersOnThisGame.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative p-3 space-y-2">
                      <h3 className="text-white font-black text-sm mb-2 group-hover:text-cyan-400 transition-colors duration-300 leading-tight">
                        {game.title}
                      </h3>

                      <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {game.description ?? 'Description coming soon for this classic!'}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-800">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold">{(game.players ?? 1)}P</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span className="font-bold">{game.year ?? '—'}</span>
                        </div>
                        <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-bold">
                          {(game.playCount ?? 0).toLocaleString()} plays
                        </div>
                      </div>

                      {/* Botões de ação - Grid compacto mobile */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handlePlayGame(game)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-2 px-1 sm:px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs touch-manipulation"
                          title="Play Solo"
                        >
                          <Gamepad2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Play</span>
                        </button>

                        <button
                          onClick={() => onStartStream?.(game)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 px-1 sm:px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs touch-manipulation"
                          title="Start Live Stream"
                        >
                          <Radio className="w-3 h-3" />
                          <span className="hidden sm:inline">Live</span>
                        </button>

                        <button
                          onClick={() => onCreateMultiplayer?.(game)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-1 sm:px-2 rounded-lg font-bold transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs touch-manipulation"
                          title="Create Multiplayer Session"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="hidden sm:inline">Online</span>
                        </button>
                      </div>
                    </div>

                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10" />
                    </div>
                  </div>
                  );
                })}
              </div>

              {filteredGames.length > 0 && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-4 bg-gray-900/50 backdrop-blur-sm border-2 border-cyan-500/20 rounded-2xl px-8 py-4">
                    <div className="text-center">
                      <div className="text-4xl font-black text-cyan-400 mb-1">{filteredGames.length}</div>
                      <div className="text-sm text-gray-400 font-bold">Games Available</div>
                    </div>
                    <div className="h-12 w-px bg-gray-700" />
                    <div className="text-center">
                      <div className="text-4xl font-black text-purple-400 mb-1">{games.reduce((sum, g) => sum + (g.playCount || 0), 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-400 font-bold">Total Plays</div>
                    </div>
                    <div className="h-12 w-px bg-gray-700" />
                    <div className="text-center">
                      <div className="text-4xl font-black text-green-400 mb-1 flex items-center gap-2 justify-center">
                        <div className="relative flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                        </div>
                        {getTotalOnlinePlayers()}
                      </div>
                      <div className="text-sm text-gray-400 font-bold">Players Online</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedGame && (
        <GamePlayer
          gameTitle={selectedGame.title}
          romPath={selectedGame.romUrl}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
};

export default GameLibrary;
