import { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Users, Play, Loader2, Plus, Search as SearchIcon, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  
  // ✅ Colyseus Hook (DESABILITADO - USANDO PEERJS)
  /*
  const {
    listRooms,
    createRoom: colyseusCreateRoom,
    joinRoom: colyseusJoinRoom,
    availableRooms,
    error: colyseusError
  } = useColyseusConnection({
    autoConnect: true,
  });
  */

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
   * Carregar salas do Firestore + LIMPAR SALAS ÓRFÃS
   * Com retry inteligente para erros do Firestore
   * ✅ NOVO: Tratamento específico para INTERNAL ASSERTION FAILED (ID: ca9)
   */
  const loadSessions = useCallback(async (retryCount = 0, maxRetries = 7) => {
    try {
      setLoading(true);
      console.log(`🎮 [MultiplayerLobby] Carregando salas do Firestore... (tentativa ${retryCount + 1}/${maxRetries + 1})`);
      
      // 🛡️ NOVA PROTEÇÃO: Se houver muitos retries, resetar Firestore
      if (retryCount >= 3) {
        console.warn('⚠️ [MultiplayerLobby] Muitas tentativas falhadas, limpando state do Firestore...');
        // Força uma pausa maior para permitir que Firestore se recupere
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Buscar salas do Firestore
      const sessionsRef = collection(db, 'multiplayer_sessions');
      const q = query(sessionsRef, where('status', '==', 'waiting'));
      
      let snapshot;
      try {
        // 🔒 Adicionar timeout de 10 segundos para a query
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout após 10s')), 10000)
        );
        
        snapshot = await Promise.race([getDocs(q), timeoutPromise]) as any;
      } catch (firestoreError: any) {
        // ❌ Detectar erro específico do Firestore: "ve":-1 (estado corrupto)
        const errorMsg = firestoreError?.message || '';
        const errorCode = firestoreError?.code || '';
        
        // ✅ NOVA DETECÇÃO: Erros de estado corrupto específicos
        const isInternalAssertionError = errorMsg.includes('INTERNAL ASSERTION FAILED') || 
                                        errorMsg.includes('ca9') ||
                                        errorMsg.includes('b815') ||
                                        errorMsg.includes('ve":-1');
        
        const isFirestoreNetworkError = errorMsg.includes('400') ||
                                       isInternalAssertionError ||
                                       errorMsg.includes('ve') ||
                                       errorMsg.includes('Unexpected state') ||
                                       errorMsg.includes('Query timeout') ||
                                       errorCode === 'failed-precondition' ||
                                       errorCode === 'unavailable' ||
                                       errorCode === 'internal';

        if (isFirestoreNetworkError && retryCount < maxRetries) {
          console.warn(`⚠️ [MultiplayerLobby] Erro Firestore detectado: ${errorCode}`);
          console.warn(`   Tipo: ${isInternalAssertionError ? 'INTERNAL ASSERTION (state corrupto)' : 'Network/Timeout'}`);
          console.warn(`   Mensagem: ${errorMsg.substring(0, 150)}`);
          console.warn(`   Tentativa: ${retryCount + 1}/${maxRetries + 1}`);
          
          // ⏳ Aguardar com backoff exponencial AGRESSIVO para estado corrupto
          // Erros de assertion recebem delay maior para permitir recuperação
          const baseDelay = isInternalAssertionError ? 2500 : 1500;
          const delayMs = Math.min(baseDelay * Math.pow(1.8, retryCount), 30000);
          console.log(`⏳ [MultiplayerLobby] Aguardando ${Math.round(delayMs)}ms (backoff ${Math.round(Math.pow(1.8, retryCount) * 100) / 100}x) antes de retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // 🔄 Tentar novamente recursivamente
          return loadSessions(retryCount + 1, maxRetries);
        } else if (isFirestoreNetworkError) {
          console.error(`❌ [MultiplayerLobby] Firestore ainda indisponível após ${maxRetries} tentativas`);
          console.error(`   Tipo de erro: ${isInternalAssertionError ? 'INTERNAL ASSERTION (Estado corrompido)' : 'Network'}`);
          
          // ✅ FALLBACK: Se for erro de assertion, tenta mostrar lista vazia em vez de erro
          if (isInternalAssertionError) {
            console.log('📋 [MultiplayerLobby] Mostrando lista vazia enquanto Firestore se recupera...');
            setSessions([]);
            setConnectionError('Carregando salas... (Reconectando com servidor)');
            setLoading(false);
            
            // 🔄 Tentar novamente em background após 5 segundos
            setTimeout(() => {
              console.log('🔄 [MultiplayerLobby] Tentando reconectar em background...');
              loadSessions(0, maxRetries); // Reset counter
            }, 5000);
            
            return; // Retorna aqui para não lançar erro
          }
          
          throw new Error('Servidor Firestore indisponível. Por favor, recarregue a página. (Erro: ' + errorCode + ')');
        }
        throw firestoreError;
      }
      
      const mappedSessions: GameSession[] = [];
      const orphanedSessions: string[] = [];
      const now = Date.now();
      const ORPHAN_TIMEOUT = 30 * 60 * 1000; // 30 minutos

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Verificar se a sala está órfã (sem players E muito antiga)
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        const ageMs = now - createdAt.getTime();
        const hasPlayers = data.players && data.players.length > 0;
        
        // Se não tem players E tem mais de 30min, marcar para deletar
        if (!hasPlayers && ageMs > ORPHAN_TIMEOUT) {
          console.warn(`🗑️ [MultiplayerLobby] Sala órfã detectada: ${docSnap.id} (${Math.round(ageMs / 60000)}min)`);
          orphanedSessions.push(docSnap.id);
          continue; // Não adicionar na lista
        }

        mappedSessions.push({
          id: docSnap.id,
          hostUserId: data.hostUserId || '',
          hostName: data.hostName || 'Host',
          gameId: data.gameId || '',
          gameTitle: data.gameTitle || 'Jogo Desconhecido',
          gamePlatform: data.gamePlatform || 'snes',
          sessionName: data.sessionName || 'Sala sem nome',
          isPublic: data.isPublic ?? true,
          maxPlayers: data.maxPlayers || 4,
          currentPlayers: data.players?.length || 0,
          players: data.players || [],
          status: data.status || 'waiting',
          createdAt: data.createdAt || new Date().toISOString(),
          gameCover: data.gameCover
        });
      }

      // Deletar salas órfãs em background
      if (orphanedSessions.length > 0) {
        console.log(`🧹 [MultiplayerLobby] Limpando ${orphanedSessions.length} sala(s) órfã(s)...`);
        Promise.all(
          orphanedSessions.map(id => 
            deleteDoc(doc(db, 'multiplayer_sessions', id))
              .then(() => console.log(`✅ Sala ${id} deletada`))
              .catch(err => console.warn(`⚠️ Erro ao deletar ${id}:`, err))
          )
        );
      }

      console.log(`✅ [MultiplayerLobby] ${mappedSessions.length} salas ativas (${orphanedSessions.length} órfãs removidas)`);
      setSessions(mappedSessions);
      setConnectionError(null);
    } catch (error: any) {
      console.error('❌ [MultiplayerLobby] Erro ao carregar salas:', error);
      setConnectionError(error?.message || 'Erro ao buscar salas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar lista de salas periodicamente
   * ✅ NOVO: Polling inteligente que aumenta o intervalo quando há erros
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let currentInterval = 5000; // 5 segundos inicialmente
    const maxInterval = 30000; // Máximo 30 segundos entre tentativas
    
    // Carregar imediatamente
    loadSessions();
    
    // Configurar intervalo com backoff adaptativo
    const startPolling = () => {
      interval = setInterval(() => {
        loadSessions().catch(() => {
          // Em caso de erro, aumentar intervalo (backoff)
          currentInterval = Math.min(currentInterval * 1.5, maxInterval);
          console.log(`⏱️ [MultiplayerLobby] Aumentando intervalo para ${Math.round(currentInterval / 1000)}s`);
          
          // Reconfigurando intervalo com novo tempo
          if (interval) clearInterval(interval);
          startPolling();
        });
      }, currentInterval);
    };
    
    startPolling();
    
    return () => {
      if (interval) clearInterval(interval);
    };
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
   * Criar nova sessão - USANDO FIRESTORE
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

      console.log('🏠 [MultiplayerLobby] Criando sessão no Firestore...', createForm);

      // Buscar romUrl do jogo selecionado
      const selectedGame = games.find(g => g.id === createForm.gameId);
      const romPath = selectedGame?.romUrl || '';
      
      console.log('🎮 [MultiplayerLobby] ROM path:', romPath);

      // Criar sala no Firestore
      const sessionsRef = collection(db, 'multiplayer_sessions');
      const newSessionDoc = await addDoc(sessionsRef, {
        sessionName: createForm.sessionName,
        gameId: createForm.gameId,
        gameTitle: createForm.gameTitle,
        gamePlatform: createForm.gamePlatform,
        hostUserId: user.id,
        hostName: user.username,
        maxPlayers: createForm.maxPlayers,
        isPublic: createForm.isPublic,
        gameCover: selectedGame?.cover || selectedGame?.coverUrl || createForm.gamePlatform,
        romPath: romPath, // Adiciona romPath ao Firestore
        players: [user.id],
        status: 'waiting',
        createdAt: new Date().toISOString(),
        hostPeerId: null, // Será atualizado quando HOST conectar
        peerServerReady: false
      });

      const sessionId = newSessionDoc.id;
      console.log('✅ [MultiplayerLobby] Sessão criada:', sessionId);

      // Callback - passa o romPath correto
      if (onCreateSession) {
        onCreateSession(
          sessionId,
          createForm.gameId,
          romPath, // ✅ CORRIGIDO: passa o romPath real
          createForm.gameTitle,
          createForm.gamePlatform
        );
      }

      // Fechar modal e limpar form
      setShowCreateModal(false);
      setCreateForm({
        sessionName: '',
        gameTitle: '',
        gameId: '',
        gamePlatform: 'snes',
        maxPlayers: 4,
        isPublic: true
      });
      
      // Recarregar lista
      await loadSessions();
    } catch (error) {
      console.error('❌ [MultiplayerLobby] Erro ao criar sessão:', error);
      setConnectionError('Erro ao criar sala. Tente novamente.');
    } finally {
      setCreatingSession(false);
    }
  }, [user, createForm, onCreateSession, loadSessions, games]);

  /**
   * Entrar em uma sessão - USANDO FIRESTORE
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

      // Atualizar Firestore para adicionar o player à sessão
      const sessionRef = doc(db, 'multiplayer_sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        const currentPlayers = sessionData.players || [];
        
        // Adicionar player se não estiver na lista
        if (!currentPlayers.includes(user.id)) {
          await updateDoc(sessionRef, {
            players: [...currentPlayers, user.id],
            status: 'playing' // Mudar status para "playing"
          });
          console.log('✅ [MultiplayerLobby] Player adicionado à sessão');
        }
      }

      // Callback - abre o MultiplayerPlayer
      onJoinSession(sessionId);
      
      console.log('✅ [MultiplayerLobby] Redirecionando para sessão');
    } catch (error) {
      console.error('❌ [MultiplayerLobby] Erro ao entrar:', error);
      setConnectionError('Erro ao entrar na sala. Tente novamente.');
    } finally {
      setConnecting(false);
    }
  }, [user, onJoinSession]);

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
                <div className="flex flex-col justify-center items-center py-12">
                  <Loader2 className="animate-spin text-purple-500" size={48} />
                  <p className="text-gray-400 mt-4">Carregando salas...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700 border-dashed">
                  <Gamepad2 className="mx-auto text-gray-600 mb-4" size={64} />
                  <p className="text-gray-300 text-lg font-semibold">Nenhuma sala disponível</p>
                  <p className="text-sm mt-2 text-gray-500">Seja o primeiro a criar uma sala!</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
                  >
                    <Plus className="inline mr-2" size={18} />
                    Criar Primeira Sala
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 hover:border-purple-500 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-purple-900/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white">{session.sessionName}</h3>
                            {session.isPublic ? (
                              <span className="text-xs bg-green-600 px-2 py-0.5 rounded">PÚBLICA</span>
                            ) : (
                              <span className="text-xs bg-orange-600 px-2 py-0.5 rounded">PRIVADA</span>
                            )}
                          </div>
                          <p className="text-sm text-purple-400 font-semibold">{session.gameTitle}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Users size={14} className="text-purple-500" />
                              Host: <span className="text-white font-medium">{session.hostName}</span>
                            </p>
                            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                              {session.gamePlatform.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-2">
                            <p className="text-sm font-bold text-purple-300 flex items-center gap-2 justify-center">
                              <Users size={18} />
                              {session.currentPlayers}/{session.maxPlayers}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">jogadores</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        disabled={connecting}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Entrando na sala...
                          </>
                        ) : (
                          <>
                            <Play size={20} />
                            Entrar na Sala
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Criar Sala - VERSÃO MELHORADA */}
          {showCreateModal && (
            <div className="space-y-6">
              {/* Preview Card */}
              {createForm.gameId && (
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
                      <Gamepad2 className="text-purple-400" size={32} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{createForm.sessionName || 'Nova Sala'}</h4>
                      <p className="text-sm text-gray-300">{createForm.gameTitle}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">
                          {createForm.gamePlatform.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users size={12} />
                          Máx {createForm.maxPlayers} jogadores
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* STEP 1: Nome da Sala */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <label className="text-sm font-bold text-purple-400">NOME DA SALA</label>
                  </div>
                  <input
                    type="text"
                    value={createForm.sessionName}
                    onChange={(e) => setCreateForm({ ...createForm, sessionName: e.target.value })}
                    placeholder="Ex: Super Mario Bros - Speedrun"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {createForm.sessionName.length}/50 caracteres
                  </p>
                </div>

                {/* STEP 2: Selecionar Jogo */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <label className="text-sm font-bold text-purple-400">ESCOLHER JOGO</label>
                  </div>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3.5 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={gameSearchTerm}
                      onChange={(e) => {
                        setGameSearchTerm(e.target.value);
                        setShowGameList(true);
                      }}
                      placeholder="🎮 Procurar por nome do jogo..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                      onFocus={() => setShowGameList(true)}
                    />
                    
                    {createForm.gameId && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-sm">
                        <span className="text-green-500">✓</span>
                        <span className="font-semibold">{createForm.gameTitle}</span>
                        <span className="text-gray-400">({createForm.gamePlatform.toUpperCase()})</span>
                      </div>
                    )}

                    {showGameList && filteredGames.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg mt-2 max-h-64 overflow-auto z-20 shadow-2xl">
                        <div className="p-2 border-b border-gray-800 bg-gray-800 text-xs text-gray-400 sticky top-0">
                          {filteredGames.length} jogos encontrados
                        </div>
                        {filteredGames.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => handleSelectGame(game)}
                            className="w-full text-left px-4 py-3 hover:bg-purple-600/20 text-white text-sm border-b border-gray-800 last:border-0 transition flex items-center justify-between group"
                          >
                            <div>
                              <div className="font-semibold group-hover:text-purple-400">{game.title}</div>
                              <div className="text-xs text-gray-500">{game.platform.toUpperCase()}</div>
                            </div>
                            <Gamepad2 className="text-gray-600 group-hover:text-purple-400" size={20} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 3: Configurações */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <label className="text-sm font-bold text-purple-400">CONFIGURAÇÕES</label>
                  </div>

                  {/* Grid de opções */}
                  <div className="space-y-4">
                    {/* Máximo de jogadores */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Número Máximo de Jogadores</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            onClick={() => setCreateForm({ ...createForm, maxPlayers: num })}
                            className={`py-2 rounded-lg font-bold transition ${
                              createForm.maxPlayers === num
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            <Users size={16} className="inline mr-1" />
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sala pública/privada */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Privacidade da Sala</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCreateForm({ ...createForm, isPublic: true })}
                          className={`py-3 rounded-lg font-semibold transition ${
                            createForm.isPublic
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          🌐 Pública
                        </button>
                        <button
                          onClick={() => setCreateForm({ ...createForm, isPublic: false })}
                          className={`py-3 rounded-lg font-semibold transition ${
                            !createForm.isPublic
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          🔒 Privada
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {createForm.isPublic 
                          ? '✓ Qualquer jogador pode ver e entrar na sua sala'
                          : '✓ Apenas jogadores com o link podem entrar'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão Criar */}
                <button
                  onClick={handleCreateSession}
                  disabled={creatingSession || !createForm.gameId || !createForm.sessionName.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {creatingSession ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Criando Sala...
                    </>
                  ) : (
                    <>
                      <Plus size={24} />
                      Criar Sala e Começar
                    </>
                  )}
                </button>

                {!createForm.gameId && (
                  <p className="text-center text-sm text-yellow-500">
                    ⚠️ Selecione um jogo para continuar
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
