import { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Users, Play, Loader2, Plus, Search as SearchIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useColyseusConnection } from '../../hooks/useColyseusConnection';

interface GameSession {
  id: string;
  hostUserId: string;
  hostName: string;
  gameId: string;
  gameTitle: string;
  gamePlatform: string;
  sessionName: string;
  isPublic: boolean;
  maxPlayers: number;
  currentPlayers: number;
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
  gameCover?: string;
}

interface Game {
  id: string;
  title: string;
  cover?: string;
  coverUrl?: string;
  romUrl?: string;
  platform: string;
  multiplayerSupport?: boolean;
}

interface MultiplayerLobbyProps {
  onClose: () => void;
  onJoinSession: (sessionId: string) => void;
  onCreateSession?: (sessionId: string, gameId: string, romPath: string, gameTitle: string, platform: string) => void;
  embedded?: boolean;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onClose,
  onJoinSession,
  onCreateSession,
  embedded = false
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gameSearchTerm, setGameSearchTerm] = useState('');
  
  // ✅ Colyseus Hook
  const {
    listRooms,
    createRoom: colyseusCreateRoom,
    joinRoom: colyseusJoinRoom,
    availableRooms,
    error: colyseusError
  } = useColyseusConnection({
    autoConnect: true,
  });

  // ✅ OTIMIZAÇÃO: Debounce para busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedGameSearchTerm = useDebounce(gameSearchTerm, 300);
  const [showGameList, setShowGameList] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);

  const [createForm, setCreateForm] = useState({
    sessionName: '',
    gameTitle: '',
    gameId: '',
    gamePlatform: 'snes',
    maxPlayers: 4,
    isPublic: true
  });

  const outerWrapperClass = embedded
    ? 'relative w-full z-10 flex items-center justify-center p-4'
    : 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';

  /**
   * Carregar jogos do JSON local
   */
  const loadGamesFromJson = useCallback(async () => {
    try {
      console.log('📁 [MultiplayerLobby] Carregando jogos do catálogo local...');
      const response = await fetch('/games-database.json', { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Falha ao carregar games-database.json (status ${response.status})`);
      }

      const json = await response.json();
      const rawGames: Array<Record<string, unknown>> = Array.isArray(json)
        ? json
        : Array.isArray(json?.games)
          ? json.games as Array<Record<string, unknown>>
          : [];

      if (!rawGames.length) {
        throw new Error('Catálogo local não possui jogos.');
      }

      const mappedGames: Game[] = rawGames.map((game, index) => ({
        id: String(game.id ?? `local-${index}`),
        title: String(game.title ?? 'Sem título'),
        cover: (game.cover as string) ?? null,
        coverUrl: (game.coverUrl as string) ?? (game.cover as string) ?? null,
        platform: String(game.platform ?? 'snes'),
        multiplayerSupport: Boolean(game.multiplayerSupport ?? true),
        romUrl: String(game.romUrl ?? game.rom ?? '')
      }));

      const uniqueGames = mappedGames.reduce((acc, game) => {
        const normalizedTitle = game.title.toLowerCase().trim();
        if (!acc.some((g) => g.title.toLowerCase().trim() === normalizedTitle)) {
          acc.push(game);
        }
        return acc;
      }, [] as Game[]);

      console.log('📁 [MultiplayerLobby] Jogos encontrados:', uniqueGames.length);
      setGames(uniqueGames.sort((a, b) => a.title.localeCompare(b.title)));
      setGameSearchTerm('');
      return true;
    } catch (error) {
      console.error('❌ [MultiplayerLobby] Falha ao carregar catálogo local:', error);
      setConnectionError('Não foi possível carregar a lista de jogos. Verifique sua conexão.');
      setGames([]);
      return false;
    }
  }, []);

  /**
   * Carregar salas do Colyseus
   */
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🎮 [MultiplayerLobby] Carregando salas do Colyseus...');
      
      const rooms = await listRooms();
      
      // Mapear salas do Colyseus para o formato GameSession
      const mappedSessions: GameSession[] = rooms.map((room: any) => ({
        id: room.roomId,
        hostUserId: room.metadata?.hostUserId || '',
        hostName: room.metadata?.hostName || 'Host',
        gameId: room.metadata?.gameId || '',
        gameTitle: room.metadata?.gameTitle || 'Jogo Desconhecido',
        gamePlatform: room.metadata?.gamePlatform || 'snes',
        sessionName: room.metadata?.sessionName || 'Sala sem nome',
        isPublic: room.metadata?.isPublic ?? true,
        maxPlayers: room.metadata?.maxPlayers || 4,
        currentPlayers: room.numClients,
        players: room.metadata?.players || [],
        status: 'waiting' as const,
        createdAt: new Date().toISOString(),
        gameCover: room.metadata?.gameCover
      }));

      console.log(`✅ [MultiplayerLobby] ${mappedSessions.length} salas encontradas`);
      setSessions(mappedSessions);
      setConnectionError(null);
    } catch (error: any) {
      console.error('❌ [MultiplayerLobby] Erro ao carregar salas:', error);
      setConnectionError('Erro ao buscar salas. Verifique sua conexão com Colyseus.');
    } finally {
      setLoading(false);
    }
  }, [listRooms]);

  /**
   * Atualizar lista de salas periodicamente
   */
  useEffect(() => {
    loadSessions();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadSessions, 5000);
    
    return () => clearInterval(interval);
  }, [loadSessions]);

  /**
   * Carregar jogos quando modal abrir
   */
  useEffect(() => {
    if (showCreateModal && games.length === 0) {
      loadGamesFromJson();
    }
  }, [showCreateModal, loadGamesFromJson, games.length]);

  /**
   * Filtrar jogos por busca
   */
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (!game || !game.title) return false;
      const search = debouncedGameSearchTerm.toLowerCase();
      
      const matchesTitle = game.title.toLowerCase().includes(search);
      const matchesPlatform = game.platform.toLowerCase().includes(search);
      
      return matchesTitle || matchesPlatform;
    });
  }, [games, debouncedGameSearchTerm]);

  /**
   * Filtrar salas por busca e plataforma
   */
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch = session.sessionName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           session.gameTitle.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesPlatform = filterPlatform === 'all' || session.gamePlatform === filterPlatform;
      const hasAvailableSlot = session.currentPlayers < session.maxPlayers;
      
      return matchesSearch && matchesPlatform && hasAvailableSlot;
    });
  }, [sessions, debouncedSearchTerm, filterPlatform]);

  /**
   * Selecionar jogo
   */
  const handleSelectGame = (game: Game) => {
    setCreateForm((prev) => ({
      ...prev,
      gameTitle: game.title,
      gameId: game.id,
      gamePlatform: game.platform
    }));
    setShowGameList(false);
    setGameSearchTerm('');
  };

  /**
   * Criar nova sessão
   */
  const handleCreateSession = useCallback(async () => {
    if (!user?.id || !user?.username) {
      alert('Você precisa estar logado');
      return;
    }

    if (!createForm.sessionName.trim()) {
      alert('Preencha o nome da sala');
      return;
    }

    if (!createForm.gameId) {
      alert('Selecione um jogo');
      return;
    }

    try {
      setCreatingSession(true);
      setConnectionError(null);

      console.log('🏠 [MultiplayerLobby] Criando sessão...', createForm);

      // Criar sala no Colyseus
      const room = await colyseusCreateRoom({
        sessionName: createForm.sessionName,
        gameId: createForm.gameId,
        gameTitle: createForm.gameTitle,
        gamePlatform: createForm.gamePlatform,
        hostUserId: user.id,
        hostName: user.username,
        maxPlayers: createForm.maxPlayers,
        isPublic: createForm.isPublic,
        gameCover: createForm.gamePlatform // Simplificado por agora
      });

      console.log('✅ [MultiplayerLobby] Sessão criada:', room.roomId);

      // Callback
      if (onCreateSession) {
        onCreateSession(
          room.roomId,
          createForm.gameId,
          '', // romPath - será obtido do jogo
          createForm.gameTitle,
          createForm.gamePlatform
        );
      }

      // Fechar modal
      setShowCreateModal(false);
      setCreateForm({
        sessionName: '',
        gameTitle: '',
        gameId: '',
        gamePlatform: 'snes',
        maxPlayers: 4,
        isPublic: true
      });
    } catch (error: any) {
      console.error('❌ [MultiplayerLobby] Erro ao criar sessão:', error);
      setConnectionError('Erro ao criar sala. Tente novamente.');
    } finally {
      setCreatingSession(false);
    }
  }, [user, createForm, colyseusCreateRoom, onCreateSession]);

  /**
   * Entrar em uma sessão
   */
  const handleJoinSession = useCallback(async (sessionId: string) => {
    if (!user?.id || !user?.username) {
      alert('Você precisa estar logado');
      return;
    }

    try {
      setConnecting(true);
      setConnectionError(null);

      console.log('🎮 [MultiplayerLobby] Entrando na sessão:', sessionId);

      // Entrar na sala no Colyseus
      await colyseusJoinRoom(sessionId, {
        userId: user.id,
        username: user.username
      });

      console.log('✅ [MultiplayerLobby] Entrou na sessão');

      // Callback
      onJoinSession(sessionId);
    } catch (error: any) {
      console.error('❌ [MultiplayerLobby] Erro ao entrar:', error);
      setConnectionError('Erro ao entrar na sala. Tente novamente.');
    } finally {
      setConnecting(false);
    }
  }, [user, colyseusJoinRoom, onJoinSession]);

  return (
    <div className={outerWrapperClass}>
      <div className="w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={24} />
            Multiplayer Lobby
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {connectionError && !dismissedError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 flex justify-between items-center">
            <span>{connectionError}</span>
            <button onClick={() => setDismissedError(true)} className="text-red-200 hover:text-red-100">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 text-white">
          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className={`px-4 py-2 rounded font-semibold ${!showCreateModal ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              Salas Disponíveis
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`px-4 py-2 rounded font-semibold flex items-center gap-2 ${showCreateModal ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              <Plus size={18} />
              Criar Sala
            </button>
          </div>

          {/* Salas Disponíveis */}
          {!showCreateModal && (
            <div>
              {/* Barra de busca e filtro */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar sala..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
                  />
                </div>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="px-4 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="all">Todas plataformas</option>
                  <option value="snes">SNES</option>
                  <option value="gba">GBA</option>
                  <option value="gbc">GBC</option>
                  <option value="ps1">PS1</option>
                  <option value="n64">N64</option>
                </select>
              </div>

              {/* Loading */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhuma sala disponível</p>
                  <p className="text-sm mt-2">Crie uma sala para começar!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-800 p-4 rounded hover:bg-gray-700 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{session.sessionName}</h3>
                          <p className="text-sm text-gray-400">{session.gameTitle}</p>
                          <p className="text-xs text-gray-500">Host: {session.hostName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm flex items-center gap-2">
                            <Users size={16} />
                            {session.currentPlayers}/{session.maxPlayers}
                          </p>
                          <p className="text-xs text-gray-400">{session.gamePlatform.toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        disabled={connecting}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Entrando...
                          </>
                        ) : (
                          <>
                            <Play size={18} />
                            Entrar
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Criar Sala */}
          {showCreateModal && (
            <div>
              <div className="space-y-4">
                {/* Nome da sala */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Nome da Sala</label>
                  <input
                    type="text"
                    value={createForm.sessionName}
                    onChange={(e) => setCreateForm({ ...createForm, sessionName: e.target.value })}
                    placeholder="Ex: Jogo com amigos"
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
                  />
                </div>

                {/* Selecionar jogo */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Selecionar Jogo</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gameSearchTerm}
                      onChange={(e) => {
                        setGameSearchTerm(e.target.value);
                        setShowGameList(true);
                      }}
                      placeholder="Buscar jogo..."
                      className="w-full px-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
                      onFocus={() => setShowGameList(true)}
                    />
                    {createForm.gameId && (
                      <p className="text-sm text-gray-400 mt-1">✓ {createForm.gameTitle}</p>
                    )}

                    {showGameList && filteredGames.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 max-h-48 overflow-auto z-10">
                        {filteredGames.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => handleSelectGame(game)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm"
                          >
                            {game.title} <span className="text-gray-400">({game.platform})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Max players */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Máximo de Jogadores</label>
                  <select
                    value={createForm.maxPlayers}
                    onChange={(e) => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    <option value={2}>2 Jogadores</option>
                    <option value={3}>3 Jogadores</option>
                    <option value={4}>4 Jogadores</option>
                    <option value={6}>6 Jogadores</option>
                  </select>
                </div>

                {/* Pública */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={createForm.isPublic}
                    onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Sala pública
                  </label>
                </div>

                {/* Botão criar */}
                <button
                  onClick={handleCreateSession}
                  disabled={creatingSession || !createForm.gameId}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
                >
                  {creatingSession ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Criar Sala
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
