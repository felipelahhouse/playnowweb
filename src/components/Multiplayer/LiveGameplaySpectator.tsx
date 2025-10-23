// 👁️ LIVE GAMEPLAY SPECTATOR - Assistir gameplay ao vivo com likes
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, Heart, Users, Radio, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';

interface LiveGameplay {
  id: string;
  sessionId: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  gameTitle: string;
  gameCover?: string;
  platform: string;
  spectators: number;
  likes: string[]; // Array de user IDs que deram like
  players: string[];
  createdAt: Date;
}

const LiveGameplaySpectator: React.FC = () => {
  const { user } = useAuth();
  const [liveGames, setLiveGames] = useState<LiveGameplay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar salas multiplayer ativas (públicas)
    const q = query(
      collection(db, 'game_sessions'),
      where('status', '==', 'active'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games: LiveGameplay[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        games.push({
          id: doc.id,
          sessionId: doc.id,
          hostId: data.hostUserId || data.host_user_id,
          hostName: data.hostUsername || data.host_username || 'Player',
          hostAvatar: data.hostAvatar,
          gameTitle: data.gameTitle || data.game_title || 'Unknown Game',
          gameCover: data.gameCover || data.game_cover,
          platform: data.platform || 'SNES',
          spectators: data.spectators || 0,
          likes: data.likes || [],
          players: data.players || [],
          createdAt: data.createdAt?.toDate() || data.created_at?.toDate() || new Date()
        });
      });

      setLiveGames(games);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (sessionId: string, currentLikes: string[]) => {
    if (!user) return;

    const sessionRef = doc(db, 'game_sessions', sessionId);
    const hasLiked = currentLikes.includes(user.id);

    try {
      if (hasLiked) {
        // Remove like
        await updateDoc(sessionRef, {
          likes: arrayRemove(user.id)
        });
      } else {
        // Adiciona like
        await updateDoc(sessionRef, {
          likes: arrayUnion(user.id)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSpectate = (sessionId: string) => {
    // TODO: Abrir modal para assistir gameplay
    console.log('Spectating session:', sessionId);
    alert(`Opening spectator mode for session: ${sessionId}\n\n(Feature coming soon!)`);
  };

  const nextGame = () => {
    setCurrentIndex((prev) => (prev + 1) % liveGames.length);
  };

  const prevGame = () => {
    setCurrentIndex((prev) => (prev - 1 + liveGames.length) % liveGames.length);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading live gameplay...</p>
        </div>
      </div>
    );
  }

  if (liveGames.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="text-center">
          <Gamepad2 className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-1">No Live Games</h3>
          <p className="text-gray-400 text-sm">Start a multiplayer session to appear here!</p>
        </div>
      </div>
    );
  }

  const currentGame = liveGames[currentIndex];
  const hasLiked = user ? currentGame.likes.includes(user.id) : false;

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-5 h-5 text-purple-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Gameplay</h3>
              <p className="text-xs text-gray-400">{liveGames.length} active sessions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Eye className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-bold text-white">{currentGame.spectators}</span>
          </div>
        </div>
      </div>

      {/* Game Display */}
      <div className="relative p-4">
        {/* Game Cover Background */}
        {currentGame.gameCover && (
          <div className="absolute inset-0 opacity-5">
            <img src={currentGame.gameCover} alt="" className="w-full h-full object-cover blur-xl" />
          </div>
        )}

        <div className="relative space-y-3">
          {/* Game Info */}
          <div className="flex items-center gap-3">
            {/* Cover */}
            {currentGame.gameCover ? (
              <img 
                src={currentGame.gameCover} 
                alt={currentGame.gameTitle}
                className="w-16 h-16 rounded-lg object-cover border border-purple-500/30"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded uppercase animate-pulse">
                  LIVE
                </span>
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded border border-purple-500/30">
                  {currentGame.platform}
                </span>
              </div>
              
              <h4 className="text-sm font-bold text-white truncate mb-1">
                {currentGame.gameTitle}
              </h4>

              {/* Host */}
              <div className="flex items-center gap-1.5">
                {currentGame.hostAvatar ? (
                  <img src={currentGame.hostAvatar} alt={currentGame.hostName} className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {currentGame.hostName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-cyan-400 font-medium">{currentGame.hostName}</span>
                <Users className="w-3 h-3 text-gray-500 ml-auto" />
                <span className="text-xs text-gray-400">{currentGame.players.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpectate(currentGame.sessionId)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              Spectate
            </button>

            <button
              onClick={() => handleLike(currentGame.sessionId, currentGame.likes)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                hasLiked
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              {currentGame.likes.length}
            </button>
          </div>

          {/* Navigation */}
          {liveGames.length > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
              <button
                onClick={prevGame}
                className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>

              <div className="flex items-center gap-1">
                {liveGames.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex ? 'bg-purple-400 w-4' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextGame}
                className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveGameplaySpectator;
