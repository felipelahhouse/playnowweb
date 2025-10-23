import React, { useEffect, useState } from 'react';
import { Play, Eye, Radio, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import StreamSpectatorModal from '../Streaming/StreamSpectatorModal';

interface StreamData {
  id: string;
  username: string;
  gameName: string;
  viewers: number;
  thumbnail?: string;
  platform: string;
  isLive: boolean;
}

const LiveStreamWindow: React.FC = () => {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Carregar estado do localStorage
    const saved = localStorage.getItem('liveStreamWindow-minimized');
    return saved === 'true';
  });
  const [selectedStream, setSelectedStream] = useState<{ id: string; data: StreamData } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('liveStreamWindow-minimized', String(isMinimized));
  }, [isMinimized]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    // Query para buscar streams ao vivo
    const q = query(
      collection(db, 'streams'),
      where('isLive', '==', true),
      orderBy('viewers', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const streamData: StreamData[] = [];
      snapshot.forEach((doc) => {
        streamData.push({ id: doc.id, ...doc.data() } as StreamData);
      });
      setStreams(streamData);
      setIsLoading(false);
    }, (error) => {
      console.log('Streams not available:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleWatch = (streamId: string) => {
    const stream = streams.find(s => s.id === streamId);
    if (stream) {
      setSelectedStream({ id: streamId, data: stream });
    }
  };

  // Ocultar em mobile se minimizado
  if (isMobile && isMinimized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`fixed left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 p-4 z-40 transition-all duration-500 ${
        isMinimized ? '-translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 left-2' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized View
          <button
            onClick={toggleMinimize}
            className="flex items-center justify-center w-full h-full text-red-400 hover:text-red-300 transition-colors"
            title="Expandir Live Streams"
          >
            <ChevronRight className="w-6 h-6 animate-pulse" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/30">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              <h3 className="text-white font-bold text-lg">🔴 LIVE STREAMS</h3>
              <button
                onClick={toggleMinimize}
                className="ml-auto p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Minimizar"
              >
                <ChevronLeft className="w-5 h-5 text-red-400" />
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

  if (streams.length === 0) {
    return (
      <div className={`fixed left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 p-4 z-40 transition-all duration-500 ${
        isMinimized ? '-translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 left-2' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized View
          <button
            onClick={toggleMinimize}
            className="flex items-center justify-center w-full h-full text-red-400 hover:text-red-300 transition-colors"
            title="Expandir Live Streams"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/30">
              <Radio className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-bold text-lg">🔴 LIVE STREAMS</h3>
              <button
                onClick={toggleMinimize}
                className="ml-auto p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Minimizar"
              >
                <ChevronLeft className="w-5 h-5 text-red-400" />
              </button>
            </div>
            <div className="text-center py-8">
              <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 text-sm">Nenhuma live agora</p>
              <p className="text-gray-500 text-xs mt-1">Seja o primeiro a transmitir!</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 p-4 z-40 animate-float transition-all duration-500 ${
      isMinimized ? '-translate-x-[calc(100%-3rem)] w-12' : isMobile ? 'w-64 left-2' : 'w-72'
    }`}>
      {isMinimized ? (
        // Minimized View - Vertical Tab
        <button
          onClick={toggleMinimize}
          className="flex flex-col items-center justify-center gap-2 w-full h-32 text-red-400 hover:text-red-300 transition-colors group"
          title="Expandir Live Streams"
        >
          <ChevronRight className="w-6 h-6 group-hover:animate-pulse" />
          <div className="transform -rotate-0 writing-mode-vertical text-xs font-bold">
            LIVE
          </div>
          <span className="px-1.5 py-1 bg-red-500/30 text-red-300 text-xs font-bold rounded-full">
            {streams.length}
          </span>
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/30">
            <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            <h3 className="text-white font-bold text-lg">🔴 LIVE STREAMS</h3>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
              {streams.length}
            </span>
            <button
              onClick={toggleMinimize}
              className="ml-auto p-1 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Minimizar"
            >
              <ChevronLeft className="w-5 h-5 text-red-400" />
            </button>
          </div>

          {/* Streams List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {streams.map((stream, index) => (
              <div
                key={stream.id}
                className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Thumbnail/Preview */}
                <div className="relative w-full h-32 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg overflow-hidden border-2 border-red-500/20 group-hover:border-red-500/50 transition-all duration-300">
                  {/* Placeholder for video preview */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10" />
                  
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    LIVE
                  </div>

                  {/* Viewers Count */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {stream.viewers}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleWatch(stream.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center gap-2 transform transition-all duration-300 hover:scale-110 shadow-lg shadow-red-500/50"
                    >
                      <Play className="w-4 h-4" />
                      ASSISTIR
                    </button>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="mt-2 px-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-white font-bold text-sm truncate flex-1">{stream.username}</p>
                  </div>
                  <p className="text-gray-400 text-xs truncate">{stream.gameName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded">
                      {stream.platform}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none rounded-2xl" />
        </>
      )}

      {/* Stream Spectator Modal */}
      {selectedStream && (
        <StreamSpectatorModal
          streamId={selectedStream.id}
          streamData={{
            username: selectedStream.data.username,
            gameName: selectedStream.data.gameName,
            platform: selectedStream.data.platform,
            viewers: selectedStream.data.viewers,
            thumbnail: selectedStream.data.thumbnail
          }}
          onClose={() => setSelectedStream(null)}
        />
      )}
    </div>
  );
};

export default LiveStreamWindow;
