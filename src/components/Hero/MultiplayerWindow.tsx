import React, { useEffect, useState } from 'react';
import { Eye, Users, Gamepad2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MultiplayerSpectatorModal from '../Multiplayer/MultiplayerSpectatorModal';

interface MultiplayerLobby {
  id: string;
  roomName: string;
  hostUsername: string;
  gameName: string;
  platform: string;
  currentPlayers: number;
  maxPlayers: number;
  spectators: number;
  isPublic: boolean;
  thumbnail?: string;
}

const MultiplayerWindow: React.FC = () => {
  const [lobbies, setLobbies] = useState<MultiplayerLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Carregar estado do localStorage
    const saved = localStorage.getItem('multiplayerWindow-minimized');
    return saved === 'true';
  });
  const [selectedLobby, setSelectedLobby] = useState<{ id: string; data: MultiplayerLobby } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('multiplayerWindow-minimized', String(isMinimized));
  }, [isMinimized]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    console.log('[MultiplayerWindow] 🔍 Iniciando monitoramento de salas...');
    
    // Query para buscar salas multiplayer ativas (game_sessions)
    const q = query(
      collection(db, 'game_sessions'),
      where('isPublic', '==', true),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        console.log('[MultiplayerWindow] 📊 Salas encontradas:', snapshot.size);
        
        const lobbyData: MultiplayerLobby[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          console.log('[MultiplayerWindow] 📦 Sala:', docSnap.id, data);
          
          // Buscar username do host
          let hostUsername = 'Host';
          try {
            const hostId = data.hostUserId || data.host_user_id;
            if (hostId) {
              const hostDoc = await getDoc(doc(db, 'users', hostId));
              if (hostDoc.exists()) {
                hostUsername = hostDoc.data().username || 'Host';
              }
            }
          } catch (error) {
            console.warn('[MultiplayerWindow] ⚠️ Erro ao buscar host:', error);
          }
          
          // Buscar informações do jogo
          let gameName = 'Jogo';
          let platform = 'snes';
          let thumbnail = '';
          
          try {
            // Tentar buscar do games-database.json
            const gameId = data.gameId || data.game_id;
            if (gameId) {
              const response = await fetch(`/games-database.json?v=${Date.now()}`);
              if (response.ok) {
                const dbData = await response.json();
                const game = dbData.games.find((g: { id: string; title?: string; platform?: string; coverUrl?: string; cover?: string }) => g.id === gameId);
                if (game) {
                  gameName = game.title || 'Jogo';
                  platform = game.platform || 'snes';
                  thumbnail = game.coverUrl || game.cover || '';
                }
              }
            }
          } catch (error) {
            console.warn('[MultiplayerWindow] ⚠️ Erro ao buscar info do jogo:', error);
          }
          
          lobbyData.push({
            id: docSnap.id,
            roomName: data.sessionName || 'Sala sem nome',
            hostUsername,
            gameName,
            platform,
            currentPlayers: data.currentPlayers || 0,
            maxPlayers: data.maxPlayers || 4,
            spectators: 0,
            isPublic: data.isPublic !== false,
            thumbnail
          });
        }
        
        console.log('[MultiplayerWindow] ✅ Lobbies processados:', lobbyData.length);
        setLobbies(lobbyData);
        setIsLoading(false);
      }, 
      (error) => {
        console.log('[MultiplayerWindow] ❌ Erro ao monitorar salas:', error);
        setLobbies([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSpectate = (lobbyId: string) => {
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (lobby) {
      setSelectedLobby({ id: lobbyId, data: lobby });
    }
  };

  // Ocultar no mobile quando minimizado
  if (isMobile && isMinimized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`fixed right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-4 z-40 transition-all duration-500 ${
        isMinimized ? 'translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 right-2' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized View
          <button
            onClick={toggleMinimize}
            className="flex items-center justify-center w-full h-full text-purple-400 hover:text-purple-300 transition-colors"
            title="Expandir Multiplayer"
          >
            <ChevronLeft className="w-6 h-6 animate-pulse" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-500/30">
              <Users className="w-5 h-5 text-purple-400 animate-pulse" />
              <h3 className="text-white font-bold text-lg">🎮 MULTIPLAYER</h3>
              <button
                onClick={toggleMinimize}
                className="ml-auto p-1 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Minimizar"
              >
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-32 bg-gray-700/50 rounded-lg mb-2" />
                  <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (lobbies.length === 0) {
    return (
      <div className={`fixed right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-4 z-40 transition-all duration-500 ${
        isMinimized ? 'translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 right-2' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized View
          <button
            onClick={toggleMinimize}
            className="flex items-center justify-center w-full h-full text-purple-400 hover:text-purple-300 transition-colors"
            title="Expandir Multiplayer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-500/30">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-bold text-lg">🎮 MULTIPLAYER</h3>
              <button
                onClick={toggleMinimize}
                className="ml-auto p-1 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Minimizar"
              >
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>
            </div>
            <div className="text-center py-8">
              <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 text-sm">Nenhum lobby ativo</p>
              <p className="text-gray-500 text-xs mt-1">Crie uma sala e jogue!</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-4 z-40 animate-float transition-all duration-500 ${
      isMinimized ? 'translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 right-2' : 'w-72'
    }`}>
      {isMinimized ? (
        // Minimized View - Vertical Tab
        <button
          onClick={toggleMinimize}
          className="flex flex-col items-center justify-center gap-2 w-full h-32 text-purple-400 hover:text-purple-300 transition-colors group"
          title="Expandir Multiplayer"
        >
          <ChevronLeft className="w-6 h-6 group-hover:animate-pulse" />
          <div className="transform -rotate-0 writing-mode-vertical text-xs font-bold">
            MULTI
          </div>
          <span className="px-1.5 py-1 bg-purple-500/30 text-purple-300 text-xs font-bold rounded-full">
            {lobbies.length}
          </span>
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-500/30">
            <Users className="w-5 h-5 text-purple-400 animate-pulse" />
            <h3 className="text-white font-bold text-lg">🎮 MULTIPLAYER</h3>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
              {lobbies.length}
            </span>
            <button
              onClick={toggleMinimize}
              className="ml-auto p-1 hover:bg-purple-500/20 rounded-lg transition-colors"
              title="Minimizar"
            >
              <ChevronRight className="w-5 h-5 text-purple-400" />
            </button>
          </div>

          {/* Lobbies List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {lobbies.map((lobby, index) => (
              <div
                key={lobby.id}
                className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Preview */}
                <div className="relative w-full h-32 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg overflow-hidden border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300">
                  {/* Placeholder for game preview */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                  
                  {/* Players Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {lobby.currentPlayers}/{lobby.maxPlayers}
                  </div>

                  {/* Spectators Count */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {lobby.spectators}
                  </div>

                  {/* Platform Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-cyan-500/90 text-white text-xs font-bold rounded">
                    {lobby.platform}
                  </div>

                  {/* Spectate Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleSpectate(lobby.id)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center gap-2 transform transition-all duration-300 hover:scale-110 shadow-lg shadow-purple-500/50"
                    >
                      <Eye className="w-4 h-4" />
                      ASSISTIR
                    </button>
                  </div>
                </div>

                {/* Lobby Info */}
                <div className="mt-2 px-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-white font-bold text-sm truncate flex-1">{lobby.hostUsername}</p>
                  </div>
                  <p className="text-gray-400 text-xs truncate font-semibold">{lobby.roomName}</p>
                  <p className="text-gray-500 text-xs truncate">{lobby.gameName}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                      <Gamepad2 className="w-3 h-3" />
                      <span>{lobby.currentPlayers}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                      <Eye className="w-3 h-3" />
                      <span>{lobby.spectators}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none rounded-2xl" />
        </>
      )}

      {/* Multiplayer Spectator Modal */}
      {selectedLobby && (
        <MultiplayerSpectatorModal
          lobbyId={selectedLobby.id}
          lobbyData={{
            roomName: selectedLobby.data.roomName,
            hostUsername: selectedLobby.data.hostUsername,
            gameName: selectedLobby.data.gameName,
            platform: selectedLobby.data.platform,
            currentPlayers: selectedLobby.data.currentPlayers,
            maxPlayers: selectedLobby.data.maxPlayers,
            spectators: selectedLobby.data.spectators
          }}
          onClose={() => setSelectedLobby(null)}
        />
      )}
    </div>
  );
};

export default MultiplayerWindow;
