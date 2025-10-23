// 🎮 HOOK - useGames
// Hook React para gerenciar jogos do Firebase Storage + Firestore

import { useState, useEffect } from 'react';
import { 
  getGamesFromFirestore, 
  syncGamesToFirestore, 
  initializeGames,
  uploadCover,
  listAvailablePlatforms,
  listAllCovers,
  assignCoverToGame,
  suggestCoversForGame,
  deleteCover,
  removeCoverFromGame
} from '../lib/gameStorage';
import type { Game, Platform } from '../types';

export function useGames(platform?: Platform) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [platforms, setPlatforms] = useState<{ name: Platform; count: number }[]>([]);
  const [availableCovers, setAvailableCovers] = useState<{ name: string; url: string; fullPath: string }[]>([]);

  // Carrega jogos do Firestore
  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await getGamesFromFirestore(platform);
      setGames(gamesData);
    } catch (err) {
      console.error('[useGames] Erro ao carregar jogos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar jogos');
    } finally {
      setLoading(false);
    }
  };

  // Carrega plataformas disponíveis
  const loadPlatforms = async () => {
    try {
      const platformsData = await listAvailablePlatforms();
      setPlatforms(platformsData);
    } catch (err) {
      console.error('[useGames] Erro ao carregar plataformas:', err);
    }
  };

  // Carrega covers disponíveis
  const loadCovers = async () => {
    try {
      const coversData = await listAllCovers();
      setAvailableCovers(coversData);
    } catch (err) {
      console.error('[useGames] Erro ao carregar covers:', err);
    }
  };

  // Sincroniza Storage → Firestore (com filtro opcional)
  const syncGames = async (platformFilter?: Platform) => {
    try {
      setSyncing(true);
      setError(null);
      const result = await syncGamesToFirestore(platformFilter);
      console.log(`[useGames] Sincronização: ${result.success} sucesso, ${result.errors} erros`);
      
      // Recarrega lista após sincronização
      await loadGames();
      await loadPlatforms();
      
      return result;
    } catch (err) {
      console.error('[useGames] Erro ao sincronizar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar jogos');
      return { success: 0, errors: 1 };
    } finally {
      setSyncing(false);
    }
  };

  // Upload de cover
  const uploadGameCover = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      const url = await uploadCover(file);
      console.log(`[useGames] Cover enviado: ${url}`);
      
      // Recarrega lista de covers
      await loadCovers();
      
      return url;
    } catch (err) {
      console.error('[useGames] Erro ao enviar cover:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar cover');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Associa cover manualmente a um jogo
  const assignCover = async (gameId: string, coverUrl: string) => {
    try {
      setError(null);
      const success = await assignCoverToGame(gameId, coverUrl);
      
      if (success) {
        // Recarrega jogos para mostrar atualização
        await loadGames();
      }
      
      return success;
    } catch (err) {
      console.error('[useGames] Erro ao associar cover:', err);
      setError(err instanceof Error ? err.message : 'Erro ao associar cover');
      return false;
    }
  };

  // Busca sugestões de covers para um jogo
  const getCoverSuggestions = async (gameName: string) => {
    try {
      return await suggestCoversForGame(gameName);
    } catch (err) {
      console.error('[useGames] Erro ao buscar sugestões:', err);
      return [];
    }
  };

  // Deleta cover do Storage
  const deleteCoverFromStorage = async (fullPath: string) => {
    try {
      setError(null);
      const success = await deleteCover(fullPath);
      
      if (success) {
        // Recarrega lista de covers
        await loadCovers();
      }
      
      return success;
    } catch (err) {
      console.error('[useGames] Erro ao deletar cover:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar cover');
      return false;
    }
  };

  // Remove cover de um jogo
  const removeCover = async (gameId: string) => {
    try {
      setError(null);
      const success = await removeCoverFromGame(gameId);
      
      if (success) {
        await loadGames();
      }
      
      return success;
    } catch (err) {
      console.error('[useGames] Erro ao remover cover:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover cover');
      return false;
    }
  };

  // Inicializa jogos quando o componente monta
  useEffect(() => {
    const init = async () => {
      await initializeGames();
      await loadGames();
      await loadPlatforms();
      await loadCovers();
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  return {
    games,
    loading,
    error,
    syncing,
    uploading,
    platforms,
    availableCovers,
    syncGames,
    uploadGameCover,
    assignCover,
    getCoverSuggestions,
    deleteCoverFromStorage,
    removeCover,
    reloadGames: loadGames,
    reloadCovers: loadCovers
  };
}
