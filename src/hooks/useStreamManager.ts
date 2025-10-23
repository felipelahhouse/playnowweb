/**
 * 🎥 Hook para Gerenciamento de Streams
 * Gerencia estado e operações de live streams
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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

interface UseStreamManagerOptions {
  autoRefresh?: boolean;
  maxStreams?: number;
  onlyLive?: boolean;
}

export function useStreamManager(options: UseStreamManagerOptions = {}) {
  const {
    autoRefresh = true,
    maxStreams = 20,
    onlyLive = true
  } = options;

  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Normaliza data para ISO string
  const normalizeDate = useCallback((value: Timestamp | string | Date | undefined): string => {
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
  }, []);

  // Carrega dados do usuário
  const loadUserData = useCallback(async (userId: string): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.username ?? 'Unknown';
      }
    } catch (error) {
      console.warn('Failed to load user', userId, error);
    }
    return 'Unknown';
  }, []);

  // Carrega dados do jogo
  const loadGameData = useCallback(async (gameId: string): Promise<{ title: string; cover?: string | null }> => {
    try {
      const gameDoc = await getDoc(doc(db, 'games', gameId));
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        return {
          title: gameData.title ?? 'Unknown Game',
          cover: gameData.thumbnailUrl ?? gameData.imageUrl ?? gameData.image_url ?? null
        };
      }
    } catch (error) {
      console.warn('Failed to load game', gameId, error);
    }
    return { title: 'Unknown Game', cover: null };
  }, []);

  // Enriquece streams com dados de usuários e jogos
  const enrichStreams = useCallback(async (rawStreams: Stream[]): Promise<Stream[]> => {
    if (rawStreams.length === 0) return [];

    const userIds = Array.from(new Set(rawStreams.map(s => s.streamerId).filter(Boolean)));
    const gameIds = Array.from(new Set(rawStreams.map(s => s.gameId).filter(Boolean))) as string[];

    const userMap = new Map<string, string>();
    const gameMap = new Map<string, { title: string; cover?: string | null }>();

    // Carregar dados em paralelo
    await Promise.all([
      Promise.all(
        userIds.map(async (userId) => {
          if (!userMap.has(userId)) {
            const username = await loadUserData(userId);
            userMap.set(userId, username);
          }
        })
      ),
      Promise.all(
        gameIds.map(async (gameId) => {
          if (!gameMap.has(gameId)) {
            const gameData = await loadGameData(gameId);
            gameMap.set(gameId, gameData);
          }
        })
      )
    ]);

    // Enriquecer streams
    return rawStreams.map((stream) => ({
      ...stream,
      streamerUsername: userMap.get(stream.streamerId) ?? stream.streamerUsername,
      gameTitle: gameMap.get(stream.gameId ?? '')?.title ?? stream.gameTitle,
      gameCover: gameMap.get(stream.gameId ?? '')?.cover ?? stream.gameCover ?? null
    }));
  }, [loadUserData, loadGameData]);

  // Carrega streams
  useEffect(() => {
    if (!autoRefresh) return;

    isMountedRef.current = true;
    setLoading(true);
    setError(null);

    console.log('[STREAM MANAGER] Iniciando monitoramento de streams...');

    // Query para streams
    const streamsQuery = onlyLive
      ? query(
          collection(db, 'live_streams'),
          where('isLive', '==', true),
          limit(maxStreams)
        )
      : query(
          collection(db, 'live_streams'),
          limit(maxStreams)
        );

    const unsubscribe = onSnapshot(
      streamsQuery,
      async (snapshot) => {
        if (!isMountedRef.current) return;

        console.log(`[STREAM MANAGER] ${snapshot.docs.length} streams encontradas`);

        const rawStreams = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as StreamData;
          return {
            id: docSnap.id,
            streamerId: data.streamerId,
            gameId: data.gameId,
            title: data.title ?? 'Untitled Stream',
            isLive: data.isLive !== false,
            viewerCount: data.viewerCount ?? 0,
            startedAt: normalizeDate(data.startedAt),
            streamerUsername: data.streamerUsername ?? 'Unknown',
            gameTitle: data.gameTitle ?? 'Unknown Game',
            gameCover: data.gameCover ?? data.thumbnailUrl ?? null
          } satisfies Stream;
        });

        // Ordenar por data (mais recentes primeiro)
        rawStreams.sort((a, b) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );

        // Enriquecer com dados adicionais
        const enrichedStreams = await enrichStreams(rawStreams);

        if (isMountedRef.current) {
          setStreams(enrichedStreams);
          setLoading(false);
          setError(null);
        }
      },
      (err) => {
        console.error('[STREAM MANAGER] Erro ao carregar streams:', err);
        if (isMountedRef.current) {
          setError('Erro ao carregar streams. Tente novamente.');
          setStreams([]);
          setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [autoRefresh, maxStreams, onlyLive, normalizeDate, enrichStreams]);

  // Recarrega streams manualmente
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    // O useEffect vai recarregar automaticamente
  }, []);

  // Filtra streams por termo de busca
  const searchStreams = useCallback((searchTerm: string): Stream[] => {
    if (!searchTerm.trim()) return streams;

    const term = searchTerm.toLowerCase();
    return streams.filter(stream =>
      stream.title.toLowerCase().includes(term) ||
      stream.streamerUsername.toLowerCase().includes(term) ||
      stream.gameTitle.toLowerCase().includes(term)
    );
  }, [streams]);

  // Filtra streams por jogo
  const filterByGame = useCallback((gameId: string): Stream[] => {
    return streams.filter(stream => stream.gameId === gameId);
  }, [streams]);

  // Filtra streams por streamer
  const filterByStreamer = useCallback((streamerId: string): Stream[] => {
    return streams.filter(stream => stream.streamerId === streamerId);
  }, [streams]);

  // Obtém stream por ID
  const getStreamById = useCallback((streamId: string): Stream | undefined => {
    return streams.find(stream => stream.id === streamId);
  }, [streams]);

  // Estatísticas
  const stats = {
    total: streams.length,
    live: streams.filter(s => s.isLive).length,
    totalViewers: streams.reduce((sum, s) => sum + s.viewerCount, 0),
    averageViewers: streams.length > 0
      ? Math.round(streams.reduce((sum, s) => sum + s.viewerCount, 0) / streams.length)
      : 0
  };

  return {
    streams,
    loading,
    error,
    refresh,
    searchStreams,
    filterByGame,
    filterByStreamer,
    getStreamById,
    stats
  };
}

/**
 * Hook para monitorar uma stream específica
 */
export function useStream(streamId: string) {
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setStream(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const streamRef = doc(db, 'live_streams', streamId);
    const unsubscribe = onSnapshot(
      streamRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as StreamData;
          setStream({
            id: snapshot.id,
            streamerId: data.streamerId,
            gameId: data.gameId,
            title: data.title ?? 'Untitled Stream',
            isLive: data.isLive !== false,
            viewerCount: data.viewerCount ?? 0,
            startedAt: data.startedAt instanceof Timestamp
              ? data.startedAt.toDate().toISOString()
              : new Date().toISOString(),
            streamerUsername: data.streamerUsername ?? 'Unknown',
            gameTitle: data.gameTitle ?? 'Unknown Game',
            gameCover: data.gameCover ?? null
          });
          setLoading(false);
        } else {
          setError('Stream não encontrada');
          setStream(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Erro ao monitorar stream:', err);
        setError('Erro ao carregar stream');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [streamId]);

  return { stream, loading, error };
}