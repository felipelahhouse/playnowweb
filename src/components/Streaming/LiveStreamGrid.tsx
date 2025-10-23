import React, { useEffect, useState } from 'react';
import { Radio, Eye, Heart, Play, Share2, Search, Filter, Video, Plus, Zap, Users, TrendingUp } from 'lucide-react';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  limit,
  query,
  where,
  DocumentData
} from 'firebase/firestore';
import SpectatorView from './SpectatorView';
import StreamStats from './StreamStats';
import StreamSetupModal from './StreamSetupModal';
import { db } from '../../lib/firebase';
import { shareStream, getStreamDuration as utilGetStreamDuration } from '../../utils/streamUtils';
import { useAuth } from '../../contexts/AuthContext';
import type { StreamConfig } from './StreamSetupModal';

// ✅ Interfaces TypeScript Corretas
interface StreamData extends DocumentData {
  streamerId: string;
  gameId?: string;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  startedAt?: Timestamp | string;
  streamerUsername?: string;
  gameTitle?: string;
  gameCover?: string;
  thumbnailUrl?: string;
}

interface UserData extends DocumentData {
  username?: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface GameData extends DocumentData {
  title?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  image_url?: string;
}

interface Stream {
  id: string;
  streamerId: string;
  gameId?: string;
  title: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: string;
  streamerUsername: string;
  gameTitle: string;
  gameCover?: string | null;
}

interface LiveStreamGridProps {
  compact?: boolean;
}

const LiveStreamGrid: React.FC<LiveStreamGridProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showStreamSetup, setShowStreamSetup] = useState(false);

  useEffect(() => {
    let isMounted = true;

    console.log('[LIVE STREAMS] Buscando streams ao vivo...');

    // Query simplificada - apenas where isLive sem orderBy para evitar erro de índice
    const streamsQuery = query(
      collection(db, 'live_streams'),
      where('isLive', '==', true),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      streamsQuery,
      async (snapshot) => {
        if (!isMounted) {
          return;
        }

        console.log(`[LIVE STREAMS] ${snapshot.docs.length} streams encontradas`);

        const rawStreams = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as StreamData;
          const startedAtValue = data.startedAt;

          const normalizeDate = (value: Timestamp | string | Date | undefined): string => {
            if (!value) return new Date().toISOString();
            if (value instanceof Timestamp) {
              return value.toDate().toISOString();
            }
            if (value instanceof Date) {
              return value.toISOString();
            }
            if (typeof value === 'string') {
              return value;
            }
            // Fallback para objetos tipo Timestamp
            if (typeof (value as Timestamp)?.toDate === 'function') {
              try {
                return (value as Timestamp).toDate().toISOString();
              } catch (error) {
                console.warn('Failed to convert date value', value, error);
              }
            }
            return new Date().toISOString();
          };

          return {
            id: docSnap.id,
            streamerId: data.streamerId,
            gameId: data.gameId,
            title: data.title ?? 'Untitled Stream',
            isLive: data.isLive !== false,
            viewerCount: data.viewerCount ?? 0,
            startedAt: normalizeDate(startedAtValue),
            streamerUsername: data.streamerUsername ?? 'Unknown',
            gameTitle: data.gameTitle ?? 'Unknown Game',
            gameCover: data.gameCover ?? data.thumbnailUrl ?? null
          } satisfies Stream;
        });

        // Ordenar no cliente por data
        rawStreams.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

        if (rawStreams.length === 0) {
          setStreams([]);
          setLoading(false);
          return;
        }

        const userIds = Array.from(new Set(rawStreams.map((stream) => stream.streamerId).filter(Boolean)));
        const gameIds = Array.from(new Set(rawStreams.map((stream) => stream.gameId).filter(Boolean))) as string[];

        const userMap = new Map<string, string>();
        const gameMap = new Map<string, { title: string; cover?: string | null }>();

        await Promise.all([
          Promise.all(
            userIds.map(async (userId) => {
              if (!userId || userMap.has(userId)) return;
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data() as UserData;
                  userMap.set(userId, userData.username ?? 'Unknown');
                }
              } catch (error) {
                console.warn('Failed to load user', userId, error);
              }
            })
          ),
          Promise.all(
            gameIds.map(async (gameId) => {
              if (!gameId || gameMap.has(gameId)) return;
              try {
                const gameDoc = await getDoc(doc(db, 'games', gameId));
                if (gameDoc.exists()) {
                  const gameData = gameDoc.data() as GameData;
                  gameMap.set(gameId, {
                    title: gameData.title ?? 'Unknown Game',
                    cover: gameData.thumbnailUrl ?? gameData.imageUrl ?? gameData.image_url ?? null
                  });
                }
              } catch (error) {
                console.warn('Failed to load game', gameId, error);
              }
            })
          )
        ]);

        const enrichedStreams = rawStreams.map((stream) => ({
          ...stream,
          streamerUsername: userMap.get(stream.streamerId) ?? stream.streamerUsername,
          gameTitle: gameMap.get(stream.gameId ?? '')?.title ?? stream.gameTitle,
          gameCover: gameMap.get(stream.gameId ?? '')?.cover ?? stream.gameCover ?? null
        }));

        if (isMounted) {
          setStreams(enrichedStreams);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error loading live streams:', error);
        if (isMounted) {
          setStreams([]);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const getStreamDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diff = now - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleShare = async (stream: Stream, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o stream ao clicar em share
    
    const success = await shareStream(
      stream.id,
      stream.title,
      stream.streamerUsername,
      stream.gameTitle
    );

    if (success && !navigator.share) {
      // Se copiou para clipboard (fallback)
      alert('Link copiado para área de transferência!');
    }
  };

  const handleStartStream = (config: StreamConfig) => {
    // Aqui você pode adicionar lógica para iniciar a stream
    // Por enquanto, apenas fecha o modal
    console.log('Iniciando stream com config:', config);
    setShowStreamSetup(false);
    // TODO: Integrar com o sistema de streaming do App.tsx
    alert('Funcionalidade de streaming será integrada em breve! Configure seu jogo na biblioteca para iniciar uma stream.');
  };

  // Filtrar streams por busca
  const filteredStreams = searchTerm.trim()
    ? streams.filter(stream =>
        stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.streamerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.gameTitle.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : streams;

  // Estatísticas
  const stats = {
    total: streams.length,
    live: streams.filter(s => s.isLive).length,
    totalViewers: streams.reduce((sum, s) => sum + s.viewerCount, 0),
    averageViewers: streams.length > 0
      ? Math.round(streams.reduce((sum, s) => sum + s.viewerCount, 0) / streams.length)
      : 0
  };

  if (selectedStream) {
    return (
      <SpectatorView
        streamId={selectedStream.id}
        streamTitle={selectedStream.title}
        streamerName={selectedStream.streamerUsername}
        gameTitle={selectedStream.gameTitle}
        gameCover={selectedStream.gameCover ?? null}
        onClose={() => setSelectedStream(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Radio className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400 text-base sm:text-lg">Carregando streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header - Mobile Optimized */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent truncate">
                    Live Streams
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {filteredStreams.length} {filteredStreams.length === 1 ? 'stream' : 'streams'} {searchTerm ? 'encontrada(s)' : 'ao vivo'}
                  </p>
                </div>
              </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar streams, jogos ou streamers..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stats */}
          {showStats && streams.length > 0 && (
            <StreamStats
              totalStreams={stats.total}
              liveStreams={stats.live}
              totalViewers={stats.totalViewers}
              averageViewers={stats.averageViewers}
              className="mb-6"
            />
          )}
        </div>

        {/* Streams Grid - Fully Responsive */}
        {filteredStreams.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <Radio className="w-16 h-16 sm:w-20 sm:h-20 text-gray-700 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {searchTerm ? 'Nenhuma Stream Encontrada' : 'Nenhuma Stream Ao Vivo'}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
              {searchTerm 
                ? 'Tente buscar por outro termo ou limpe o filtro.'
                : 'Ninguém está transmitindo agora. Seja o primeiro!'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all font-bold"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-1 md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-3 sm:gap-4 md:gap-6`}>
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                className="group bg-gray-900/50 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer touch-manipulation active:scale-[0.98]"
                onClick={() => setSelectedStream(stream)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                    {stream.gameCover ? (
                    <img
                      src={stream.gameCover}
                      alt={stream.gameTitle}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all"
                    />
                  ) : (
                    <Radio className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700" />
                  )}

                  {/* Live Badge - Responsivo */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full">
                    <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white animate-pulse" />
                    <span className="text-white font-bold text-[10px] sm:text-xs">AO VIVO</span>
                  </div>

                  {/* Viewer Count - Responsivo */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full">
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-white font-bold text-[10px] sm:text-xs">
                      {stream.viewerCount.toLocaleString()}
                    </span>
                  </div>

                  {/* Duration - Responsivo */}
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-black/70 backdrop-blur-sm rounded text-white text-[10px] sm:text-xs font-bold">
                    {getStreamDuration(stream.startedAt)}
                  </div>

                  {/* Share Button - Mobile Friendly */}
                  <button
                    onClick={(e) => handleShare(stream, e)}
                    className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 p-1.5 sm:p-2 bg-black/70 backdrop-blur-sm rounded-full hover:bg-cyan-500/80 transition-all opacity-0 group-hover:opacity-100 touch-manipulation active:scale-95"
                    aria-label="Compartilhar stream"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>

                  {/* Play Overlay - Responsivo */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" />
                    </div>
                  </div>
                </div>

                {/* Stream Info - Mobile Optimized */}
                <div className="p-3 sm:p-4">
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                    {stream.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0">
                      {stream.streamerUsername[0]?.toUpperCase?.() ?? 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs sm:text-sm truncate">
                        {stream.streamerUsername}
                      </p>
                      <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                        {stream.gameTitle}
                      </p>
                    </div>
                  </div>

                  {/* Stats - Mobile Friendly */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      <span className="text-purple-400 text-xs sm:text-sm font-bold">
                        {stream.viewerCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                      <span className="text-pink-400 text-xs sm:text-sm font-bold">0</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>

          {/* Sidebar - Painel de Ações */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Botão Iniciar Stream */}
              {user && (
                <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Ir ao Vivo</h3>
                      <p className="text-gray-400 text-xs">Transmita seu gameplay</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStreamSetup(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-red-500/50"
                  >
                    <Plus className="w-5 h-5" />
                    Iniciar Stream
                  </button>
                  <p className="text-gray-400 text-xs mt-3 text-center">
                    Configure sua transmissão e compartilhe com o mundo
                  </p>
                </div>
              )}

              {/* Estatísticas Rápidas */}
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border-2 border-gray-800 p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Estatísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-400" />
                      <span className="text-gray-400 text-sm">Streams Ativas</span>
                    </div>
                    <span className="text-white font-bold">{stats.live}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">Espectadores</span>
                    </div>
                    <span className="text-white font-bold">{stats.totalViewers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400 text-sm">Média/Stream</span>
                    </div>
                    <span className="text-white font-bold">{stats.averageViewers}</span>
                  </div>
                </div>
              </div>

              {/* Dicas para Streamers */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 p-6">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Dicas Pro
                </h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Use um título atrativo para sua stream</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Interaja com seus espectadores no chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Mantenha uma qualidade consistente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Compartilhe sua stream nas redes sociais</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Flutuante Mobile */}
      {user && (
        <button
          onClick={() => setShowStreamSetup(true)}
          className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center z-40 transition-all transform hover:scale-110 active:scale-95"
          aria-label="Iniciar Stream"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Stream Setup Modal */}
      {showStreamSetup && (
        <StreamSetupModal
          gameTitle="Selecione um jogo na biblioteca"
          onStartStream={handleStartStream}
          onCancel={() => setShowStreamSetup(false)}
        />
      )}
    </div>
  );
};

export default LiveStreamGrid;
