// 🎮 MULTIPLAYER LIVE STREAMS - Mostra live streams de partidas multiplayer
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChevronLeft, ChevronRight, Users, Radio, Eye, Gamepad2 } from 'lucide-react';

interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  gameTitle: string;
  gameCover?: string;
  platform: string;
  viewers: number;
  isMultiplayer: boolean;
  sessionId?: string;
  startedAt: Date;
}

const MultiplayerLiveStreams: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[MULTIPLAYER LIVE] Buscando sessões ativas...');
    
    // Buscar game_sessions ATIVOS (não live_streams para evitar erro de índice)
    const q = query(
      collection(db, 'game_sessions'),
      where('status', '==', 'active'),
      where('isPublic', '==', true),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveStreams: LiveStream[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          liveStreams.push({
            id: doc.id,
            streamerId: data.hostUserId || data.host_id,
            streamerName: data.hostUsername || data.host_name || 'Unknown',
            streamerAvatar: data.hostAvatar,
            gameTitle: data.gameTitle || data.game_title || 'Game',
            gameCover: data.gameCover || data.game_cover,
            platform: data.platform || 'SNES',
            viewers: data.spectators?.length || 0,
            isMultiplayer: true,
            sessionId: doc.id,
            startedAt: data.createdAt?.toDate() || data.created_at?.toDate() || new Date()
          });
        });

        console.log(`[MULTIPLAYER LIVE] ${liveStreams.length} sessões ativas encontradas`);
        setStreams(liveStreams);
        setLoading(false);
      },
      (error) => {
        console.error('[MULTIPLAYER LIVE] Erro ao buscar sessões:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const nextStream = () => {
    setCurrentIndex((prev) => (prev + 1) % streams.length);
  };

  const prevStream = () => {
    setCurrentIndex((prev) => (prev - 1 + streams.length) % streams.length);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading live streams...</p>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
        <div className="text-center">
          <Radio className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Live Multiplayer Streams</h3>
          <p className="text-gray-400">Be the first to start a multiplayer stream!</p>
        </div>
      </div>
    );
  }

  const currentStream = streams[currentIndex];

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-6 h-6 text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Multiplayer Live</h2>
              <p className="text-xs text-gray-400">Real-time gameplay sessions</p>
            </div>
          </div>
          
          {/* Stream Counter */}
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">{streams.length} LIVE</span>
          </div>
        </div>
      </div>

      {/* Stream Display */}
      <div className="relative p-6">
        {/* Game Cover Background */}
        {currentStream.gameCover && (
          <div className="absolute inset-0 opacity-10">
            <img 
              src={currentStream.gameCover} 
              alt="" 
              className="w-full h-full object-cover blur-2xl"
            />
          </div>
        )}

        <div className="relative">
          {/* Stream Info */}
          <div className="flex items-start gap-4 mb-6">
            {/* Game Cover */}
            <div className="flex-shrink-0">
              {currentStream.gameCover ? (
                <img 
                  src={currentStream.gameCover} 
                  alt={currentStream.gameTitle}
                  className="w-32 h-32 rounded-2xl object-cover border-2 border-purple-500/30 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Stream Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase animate-pulse">
                  LIVE
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded border border-purple-500/30">
                  {currentStream.platform}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white mb-2">
                {currentStream.gameTitle}
              </h3>

              {/* Streamer Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {currentStream.streamerAvatar ? (
                    <img 
                      src={currentStream.streamerAvatar} 
                      alt={currentStream.streamerName}
                      className="w-8 h-8 rounded-full border-2 border-cyan-400"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {currentStream.streamerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-cyan-400 font-semibold">{currentStream.streamerName}</span>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentStream.viewers} watching</span>
                </div>
              </div>

              {/* Watch Button */}
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                <Eye className="w-5 h-5" />
                Watch Stream
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {streams.length > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={prevStream}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {/* Stream Indicators */}
              <div className="flex items-center gap-2">
                {streams.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-purple-400 w-8'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStream}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLiveStreams;
