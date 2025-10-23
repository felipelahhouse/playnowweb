// 🖼️ COVER MANAGER - Gerenciamento de Covers de Jogos
import React, { useState } from 'react';
import { Image, Link2, Check, X, Search } from 'lucide-react';
import type { Game } from '../../types';

interface CoverManagerProps {
  games: Game[];
  availableCovers: { name: string; url: string; fullPath: string }[];
  onAssignCover: (gameId: string, coverUrl: string) => Promise<boolean>;
  onGetSuggestions: (gameName: string) => Promise<{
    coverName: string;
    coverUrl: string;
    score: number;
    method: string;
  }[]>;
}

const CoverManager: React.FC<CoverManagerProps> = ({
  games,
  availableCovers,
  onAssignCover,
  onGetSuggestions
}) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [suggestions, setSuggestions] = useState<{
    coverName: string;
    coverUrl: string;
    score: number;
    method: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Jogos sem cover
  const gamesWithoutCover = games.filter(g => !g.cover && !g.coverUrl);
  
  // Jogos com cover
  const gamesWithCover = games.filter(g => g.cover || g.coverUrl);

  // Filtra jogos por busca
  const filteredGames = searchTerm
    ? gamesWithoutCover.filter(g => 
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : gamesWithoutCover;

  const handleSelectGame = async (game: Game) => {
    setSelectedGame(game);
    setLoading(true);
    
    try {
      const gameSuggestions = await onGetSuggestions(game.title);
      setSuggestions(gameSuggestions);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCover = async (coverUrl: string) => {
    if (!selectedGame) return;
    
    setLoading(true);
    setFeedback({ type: null, message: '' });
    
    try {
      const success = await onAssignCover(selectedGame.id, coverUrl);
      
      if (success) {
        setFeedback({
          type: 'success',
          message: `Cover associado a "${selectedGame.title}"`
        });
        
        // Limpa seleção após 1.5 segundos
        setTimeout(() => {
          setSelectedGame(null);
          setSuggestions([]);
          setFeedback({ type: null, message: '' });
        }, 1500);
      } else {
        setFeedback({
          type: 'error',
          message: 'Erro ao associar cover'
        });
        
        // Limpa feedback após 3 segundos
        setTimeout(() => {
          setFeedback({ type: null, message: '' });
        }, 3000);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao associar cover'
      });
      
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Alta';
    if (score >= 70) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="space-y-6">
      {/* Feedback Visual */}
      {feedback.type && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}
        >
          <div className="text-3xl">
            {feedback.type === 'success' ? '✅' : '❌'}
          </div>
          <div className="text-white font-bold">
            {feedback.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <Image className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Gerenciar Covers</h3>
        <p className="text-gray-400 text-sm">
          Associe covers manualmente aos jogos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{games.length}</div>
          <div className="text-xs text-gray-400">Total de Jogos</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-green-700/50">
          <div className="text-2xl font-bold text-green-400">{gamesWithCover.length}</div>
          <div className="text-xs text-gray-400">Com Cover</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-red-700/50">
          <div className="text-2xl font-bold text-red-400">{gamesWithoutCover.length}</div>
          <div className="text-xs text-gray-400">Sem Cover</div>
        </div>
      </div>

      {/* Busca */}
      {gamesWithoutCover.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar jogo sem cover..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de Jogos sem Cover */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <X className="w-4 h-4 text-red-400" />
            Jogos sem Cover ({gamesWithoutCover.length})
          </h4>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredGames.length === 0 ? (
              <div className="p-6 bg-gray-800/50 rounded-lg text-center text-gray-400">
                {searchTerm ? 'Nenhum jogo encontrado' : '🎉 Todos os jogos têm cover!'}
              </div>
            ) : (
              filteredGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedGame?.id === game.id
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-gray-800 border border-gray-700 hover:border-purple-500/50'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-white text-sm">{game.title}</div>
                  <div className="text-xs text-gray-400 uppercase">{game.platform}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sugestões de Covers */}
        <div>
          {selectedGame ? (
            <>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Sugestões para "{selectedGame.title}"
              </h4>

              {loading ? (
                <div className="p-8 bg-gray-800 rounded-lg text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
                  <p className="text-gray-400 text-sm">Buscando sugestões...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="p-8 bg-gray-800 rounded-lg text-center">
                  <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-white font-medium mb-2">Nenhuma sugestão encontrada</p>
                  <p className="text-gray-400 text-sm">
                    Faça upload de um cover com nome similar ao jogo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Preview do Cover */}
                        <img
                          src={suggestion.coverUrl}
                          alt={suggestion.coverName}
                          className="w-16 h-20 object-cover rounded border border-gray-600"
                        />
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate mb-1">
                            {suggestion.coverName}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold ${getConfidenceColor(suggestion.score)}`}>
                              {suggestion.score.toFixed(0)}% - {getConfidenceLabel(suggestion.score)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({suggestion.method})
                            </span>
                          </div>

                          <button
                            onClick={() => handleAssignCover(suggestion.coverUrl)}
                            disabled={loading}
                            className="w-full px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <Check size={14} />
                            Usar este Cover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Opção Manual */}
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">
                      Ou escolha manualmente de todos os covers disponíveis:
                    </p>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignCover(e.target.value);
                        }
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Selecionar cover...</option>
                      {availableCovers.map((cover, idx) => (
                        <option key={idx} value={cover.url}>
                          {cover.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 bg-gray-800/50 rounded-lg text-center">
              <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Selecione um jogo da lista ao lado para ver sugestões de covers
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverManager;
