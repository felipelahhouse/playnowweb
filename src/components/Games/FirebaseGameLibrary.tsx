import React, { useState } from 'react';
import { Search, Star, Users, Gamepad2, RefreshCw } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Game } from '../../types';
import GamePlayer from './GamePlayer';
import { useGames } from '../../hooks/useGames';
import { useAuth } from '../../contexts/AuthContext';
// import { isAdmin } from '../../lib/auth'; // Temporariamente removido

interface GameLibraryProps {
  onStartStream?: (game: Game) => void;
  onCreateMultiplayer?: (game: Game) => void;
}

const FirebaseGameLibrary: React.FC<GameLibraryProps> = ({ 
  onStartStream,
  onCreateMultiplayer 
}) => {
  // 🎮 Hook customizado que busca jogos do Storage + Firestore
  const { games: allGames, loading, syncing, syncGames } = useGames();
  const { user } = useAuth();
  // TEMPORÁRIO: Mostra botão para qualquer usuário logado
  const userIsAdmin = user ? true : false; // Removido verificação isAdmin temporariamente
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const genres = ['all', 'Platform', 'Action', 'Fighting', 'Racing', 'Sports', 'Beat \'em Up'];

  const filteredGames = allGames
    .filter(game => {
      const titleMatch = searchTerm.length === 0 || 
        game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const genreMatch = selectedGenre === 'all' || game.genre === selectedGenre;
      return titleMatch && genreMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.playCount || 0) - (a.playCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return (b.year || 0) - (a.year || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handlePlayGame = async (game: Game) => {
    try {
      const gameRef = doc(db, 'games', game.id);
      await updateDoc(gameRef, {
        playCount: increment(1)
      });

      setSelectedGame(game);
    } catch (error) {
      console.error('Error updating play count:', error);
      setSelectedGame(game);
    }
  };
  
  // Função para sincronizar jogos manualmente
  const handleSyncGames = async () => {
    console.log('[SYNC] Iniciando sincronização manual...');
    await syncGames();
  };

  return (
    <>
      <section id="games" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 pointer-events-none" />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              BIBLIOTECA DE JOGOS
            </h2>
            <p className="text-gray-400 text-lg">
              {allGames.length} jogos retro disponíveis
            </p>
            
            {/* Botão Admin: Sincronizar Jogos - VERSÃO DISCRETA NO CANTO */}
            {userIsAdmin && (
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={handleSyncGames}
                  disabled={syncing}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2"
                  title="Sincronizar jogos do Firebase Storage"
                >
                  <RefreshCw className={syncing ? 'animate-spin' : ''} size={20} />
                  {syncing ? 'Sync...' : 'Sync Storage'}
                </button>
              </div>
            )}
          </div>

          {/* Filtros e Busca */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Buscar jogos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'Todos os Gêneros' : genre}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              >
                <option value="popular">Mais Jogados</option>
                <option value="rating">Melhor Avaliados</option>
                <option value="newest">Mais Recentes</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>

          {/* Grid de Jogos */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent"></div>
              <p className="mt-4 text-gray-400">Carregando jogos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-500 transition-all duration-300 hover:transform hover:scale-105"
                >
                  {/* Capa do Jogo */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-900">
                    <img
                      src={game.coverUrl || '/covers/placeholder.png'}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/covers/placeholder.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Info do Jogo */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {game.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {game.genre}
                      </span>
                      {game.year && (
                        <span className="text-gray-500 text-xs">{game.year}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400" size={14} fill="currentColor" />
                        <span className="text-white font-semibold text-xs">{game.rating?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users size={14} />
                        <span className="text-xs">{game.players}P</span>
                      </div>
                    </div>

                    {/* Botões */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handlePlayGame(game)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-bold text-xs hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Gamepad2 size={16} />
                        Jogar
                      </button>

                      {onStartStream && (
                        <button
                          onClick={() => onStartStream(game)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold text-xs hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                        >
                          📺 Stream
                        </button>
                      )}

                      {game.multiplayerSupport && onCreateMultiplayer && (
                        <button
                          onClick={() => onCreateMultiplayer(game)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-xs hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300"
                        >
                          🎮 Multi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredGames.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">Nenhum jogo encontrado</p>
            </div>
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

export default FirebaseGameLibrary;
