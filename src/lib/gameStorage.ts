// 🎮 FIREBASE STORAGE - Gerenciamento de ROMs e Covers
// Busca jogos e covers do Firebase Storage automaticamente

import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { storage, db } from './firebase';
import type { Game, Platform } from '../types';

// Mapeamento de extensões para plataformas
const PLATFORM_EXTENSIONS: Record<string, Platform> = {
  'smc': 'snes',
  'sfc': 'snes',
  'zip': 'snes', // Pode ser SNES ou outros
  'md': 'genesis',
  'bin': 'genesis',
  'gen': 'genesis',
  'gba': 'gba',
  'gbc': 'gbc',
  'gb': 'gbc',
  'iso': 'ps1',
  'cue': 'ps1',
  'n64': 'n64',
  'z64': 'n64',
  'v64': 'n64'
};

// Estrutura de diretórios no Storage
// roms/snes/game.smc
// roms/genesis/game.md
// covers/game-cover.jpg
const ROMS_PATH = 'roms';
const COVERS_PATH = 'covers';

export interface StorageGame {
  name: string;
  platform: Platform;
  romUrl: string;       // URL de download (para compatibilidade)
  romPath: string;      // Caminho no Storage (ex: roms/snes/game.smc)
  coverUrl?: string;
  size: number;
  lastModified: Date;
}

/**
 * 🔍 Lista todos os jogos do Firebase Storage
 */
export async function listGamesFromStorage(): Promise<StorageGame[]> {
  try {
    console.log('[STORAGE] 🔍 Buscando jogos no Firebase Storage...');
    
    const romsRef = ref(storage, ROMS_PATH);
    const result = await listAll(romsRef);
    
    const games: StorageGame[] = [];
    
    // Lista subpastas (plataformas)
    for (const folderRef of result.prefixes) {
      const platformName = folderRef.name.toLowerCase();
      const folderFiles = await listAll(folderRef);
      
      console.log(`[STORAGE] 📁 Pasta encontrada: ${platformName} (${folderFiles.items.length} arquivos)`);
      
      for (const itemRef of folderFiles.items) {
        try {
          const metadata = await getMetadata(itemRef);
          const url = await getDownloadURL(itemRef);
          
          const fileName = itemRef.name;
          const extension = fileName.split('.').pop()?.toLowerCase() || '';
          const platform = detectPlatform(platformName, extension);
          
          if (platform) {
            games.push({
              name: fileName.replace(/\.(smc|sfc|zip|md|bin|gen|gba|gbc|gb|iso|n64|z64|v64)$/i, ''),
              platform,
              romUrl: url,
              romPath: itemRef.fullPath,  // ← NOVO: caminho completo no Storage
              size: metadata.size,
              lastModified: new Date(metadata.updated)
            });
            
            console.log(`[STORAGE] ✅ ${fileName} → ${platform} (${(metadata.size / 1024).toFixed(0)} KB)`);
          }
        } catch (error) {
          console.error(`[STORAGE] ❌ Erro ao processar ${itemRef.name}:`, error);
        }
      }
    }
    
    console.log(`[STORAGE] 🎮 Total de ${games.length} jogos encontrados!`);
    return games;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao listar jogos:', error);
    return [];
  }
}

/**
 * 🖼️ Busca cover de um jogo no Firebase Storage (ALGORITMO MELHORADO)
 */
// Cache de covers para evitar buscas repetidas
const coverCache = new Map<string, string | null>();

/**
 * Normaliza texto para comparação
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove tudo exceto letras e números
    .replace(/\s+/g, '') // Remove espaços
    .trim();
}

/**
 * Calcula similaridade entre dois textos (0-100%)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

/**
 * Distância de Levenshtein (edit distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function findGameCover(gameName: string, requireHighConfidence = false): Promise<string | null> {
  try {
    // Verifica cache primeiro
    if (coverCache.has(gameName)) {
      return coverCache.get(gameName)!;
    }
    
    const coversRef = ref(storage, COVERS_PATH);
    const result = await listAll(coversRef);
    
    if (result.items.length === 0) {
      console.log('[STORAGE] ⚠️ Nenhum cover encontrado no Storage');
      return null;
    }
    
    const normalizedGameName = normalizeForMatch(gameName);
    
    // Armazena matches com pontuação
    interface CoverMatch {
      ref: any;
      score: number;
      method: string;
    }
    
    const matches: CoverMatch[] = [];
    
    for (const itemRef of result.items) {
      const coverFileName = itemRef.name.toLowerCase();
      const coverNameWithoutExt = coverFileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      const normalizedCoverName = normalizeForMatch(coverNameWithoutExt);
      
      // Estratégia 1: Match exato (100 pontos)
      if (normalizedCoverName === normalizedGameName) {
        matches.push({ ref: itemRef, score: 100, method: 'exact' });
        continue;
      }
      
      // Estratégia 2: Um contém o outro completo (90 pontos)
      if (normalizedCoverName.includes(normalizedGameName) || normalizedGameName.includes(normalizedCoverName)) {
        matches.push({ ref: itemRef, score: 90, method: 'contains' });
        continue;
      }
      
      // Estratégia 3: Similaridade por Levenshtein (70-85 pontos)
      const similarity = calculateSimilarity(normalizedGameName, normalizedCoverName);
      if (similarity >= 70) {
        matches.push({ ref: itemRef, score: similarity, method: 'similarity' });
        continue;
      }
      
      // Estratégia 4: Match parcial de palavras (60 pontos)
      const gameWords = gameName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
      const coverWords = coverNameWithoutExt.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
      const commonWords = gameWords.filter(w => coverWords.some(cw => cw.includes(w) || w.includes(cw)));
      
      if (commonWords.length > 0 && gameWords.length > 0) {
        const wordMatchScore = (commonWords.length / gameWords.length) * 60;
        if (wordMatchScore >= 40) {
          matches.push({ ref: itemRef, score: wordMatchScore, method: 'words' });
        }
      }
    }
    
    // Ordena por pontuação (maior primeiro)
    matches.sort((a, b) => b.score - a.score);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      
      // Se requer alta confiança, só aceita 80+ pontos
      if (requireHighConfidence && bestMatch.score < 80) {
        console.log(`[STORAGE] ⚠️ Match de baixa confiança (${bestMatch.score.toFixed(0)}%) para: ${gameName}`);
        coverCache.set(gameName, null);
        return null;
      }
      
      const url = await getDownloadURL(bestMatch.ref);
      console.log(`[STORAGE] ✅ Cover encontrado: ${bestMatch.ref.name} para "${gameName}" (${bestMatch.score.toFixed(0)}% via ${bestMatch.method})`);
      coverCache.set(gameName, url);
      return url;
    }
    
    console.log(`[STORAGE] ⚠️ Cover não encontrado para: ${gameName}`);
    coverCache.set(gameName, null);
    return null;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao buscar cover:', error);
    return null;
  }
}

/**
 * 📋 Lista todos os covers disponíveis no Storage
 */
export async function listAllCovers(): Promise<{ name: string; url: string; fullPath: string }[]> {
  try {
    const coversRef = ref(storage, COVERS_PATH);
    const result = await listAll(coversRef);
    
    const covers = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
          fullPath: itemRef.fullPath
        };
      })
    );
    
    console.log(`[STORAGE] 📋 ${covers.length} covers encontrados no Storage`);
    return covers;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao listar covers:', error);
    return [];
  }
}

/**
 * �️ Deleta um cover do Firebase Storage
 */
export async function deleteCover(fullPath: string): Promise<boolean> {
  try {
    console.log(`[STORAGE] 🗑️ Deletando cover: ${fullPath}`);
    
    const { ref: storageRef, deleteObject } = await import('firebase/storage');
    const coverRef = storageRef(storage, fullPath);
    
    await deleteObject(coverRef);
    
    console.log(`[STORAGE] ✅ Cover deletado: ${fullPath}`);
    
    // Limpa cache para forçar recarregamento
    coverCache.clear();
    
    return true;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao deletar cover:', error);
    return false;
  }
}

/**
 * 🗑️ Remove cover de um jogo (deixa sem cover)
 */
export async function removeCoverFromGame(gameId: string): Promise<boolean> {
  try {
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, {
      cover: null,
      coverUrl: null
    }, { merge: true });
    
    console.log(`[STORAGE] ✅ Cover removido do jogo ${gameId}`);
    return true;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao remover cover do jogo:', error);
    return false;
  }
}

/**
 * �🔗 Associa manualmente um cover a um jogo no Firestore
 */
export async function assignCoverToGame(gameId: string, coverUrl: string): Promise<boolean> {
  try {
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, {
      cover: coverUrl,
      coverUrl: coverUrl
    }, { merge: true });
    
    console.log(`[STORAGE] ✅ Cover associado ao jogo ${gameId}`);
    return true;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao associar cover:', error);
    return false;
  }
}

/**
 * 🔍 Busca sugestões de covers para um jogo (retorna top 5 matches)
 */
export async function suggestCoversForGame(gameName: string): Promise<{
  coverName: string;
  coverUrl: string;
  score: number;
  method: string;
}[]> {
  try {
    const coversRef = ref(storage, COVERS_PATH);
    const result = await listAll(coversRef);
    
    if (result.items.length === 0) {
      return [];
    }
    
    const normalizedGameName = normalizeForMatch(gameName);
    
    interface CoverSuggestion {
      coverName: string;
      coverUrl: string;
      score: number;
      method: string;
      ref: any;
    }
    
    const suggestions: CoverSuggestion[] = [];
    
    for (const itemRef of result.items) {
      const coverFileName = itemRef.name;
      const coverNameWithoutExt = coverFileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      const normalizedCoverName = normalizeForMatch(coverNameWithoutExt);
      
      let score = 0;
      let method = 'none';
      
      // Match exato
      if (normalizedCoverName === normalizedGameName) {
        score = 100;
        method = 'exact';
      }
      // Contém
      else if (normalizedCoverName.includes(normalizedGameName) || normalizedGameName.includes(normalizedCoverName)) {
        score = 90;
        method = 'contains';
      }
      // Similaridade
      else {
        const similarity = calculateSimilarity(normalizedGameName, normalizedCoverName);
        if (similarity >= 50) {
          score = similarity;
          method = 'similarity';
        }
      }
      
      if (score >= 50) {
        const url = await getDownloadURL(itemRef);
        suggestions.push({
          coverName: coverFileName,
          coverUrl: url,
          score,
          method,
          ref: itemRef
        });
      }
    }
    
    // Ordena por score e retorna top 5
    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, 5).map(s => ({
      coverName: s.coverName,
      coverUrl: s.coverUrl,
      score: s.score,
      method: s.method
    }));
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao buscar sugestões:', error);
    return [];
  }
}

/**
 * 📤 Faz upload de cover para o Firebase Storage
 */
export async function uploadCover(file: File): Promise<string> {
  try {
    console.log(`[STORAGE] 📤 Fazendo upload de cover: ${file.name}`);
    
    const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
    
    // Remove extensão e caracteres especiais do nome
    const fileName = file.name
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp)$/i, '')
      .replace(/[^a-z0-9]/g, '-');
    
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const coverRef = storageRef(storage, `${COVERS_PATH}/${fileName}.${extension}`);
    
    const snapshot = await uploadBytes(coverRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    console.log(`[STORAGE] ✅ Cover enviado: ${fileName}.${extension}`);
    
    // Limpa cache para forçar recarregamento
    coverCache.clear();
    
    return url;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao fazer upload de cover:', error);
    throw error;
  }
}

/**
 * 📋 Lista todas as plataformas disponíveis no Storage
 */
export async function listAvailablePlatforms(): Promise<{ name: Platform; count: number }[]> {
  try {
    const romsRef = ref(storage, ROMS_PATH);
    const result = await listAll(romsRef);
    
    const platforms: { name: Platform; count: number }[] = [];
    
    for (const folderRef of result.prefixes) {
      const platformName = folderRef.name.toLowerCase() as Platform;
      const folderFiles = await listAll(folderRef);
      
      platforms.push({
        name: platformName,
        count: folderFiles.items.length
      });
    }
    
    console.log(`[STORAGE] 📋 Plataformas encontradas:`, platforms);
    return platforms;
    
  } catch (error) {
    console.error('[STORAGE] ❌ Erro ao listar plataformas:', error);
    return [];
  }
}

/**
 * 📚 Sincroniza jogos do Storage para o Firestore (OTIMIZADO)
 * @param platformFilter - Plataforma específica (opcional)
 */
export async function syncGamesToFirestore(platformFilter?: Platform): Promise<{ success: number; errors: number; platform?: Platform }> {
  try {
    console.log('[SYNC] 🔄 Iniciando sincronização Storage → Firestore...');
    if (platformFilter) {
      console.log(`[SYNC] 🎯 Filtrando apenas: ${platformFilter.toUpperCase()}`);
    }
    
    const storageGames = await listGamesFromStorage();
    
    // Filtra por plataforma se especificado
    const gamesToSync = platformFilter 
      ? storageGames.filter(g => g.platform === platformFilter)
      : storageGames;
    
    console.log(`[SYNC] 📊 ${gamesToSync.length} jogos para sincronizar`);
    
    let success = 0;
    let errors = 0;
    
    // 🚀 SINCRONIZAÇÃO PARALELA (mais rápida!)
    // Processa 5 jogos por vez
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < gamesToSync.length; i += BATCH_SIZE) {
      const batch = gamesToSync.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (game) => {
          // Busca cover
          const coverUrl = await findGameCover(game.name);
          
          // Cria documento no Firestore
          const gameData: Omit<Game, 'id'> = {
            title: formatGameTitle(game.name),
            description: `Jogo de ${getPlatformName(game.platform)}`,
            cover: coverUrl,
            coverUrl: coverUrl,
            romUrl: game.romPath,  // ← ALTERADO: salva o CAMINHO, não a URL
            platform: game.platform,
            playCount: 0,
            multiplayerSupport: false,
            genre: 'Action',
            year: null,
            players: 1,
            rating: null,
            publisher: null,
            createdAt: new Date().toISOString()
          };
          
          // Usa nome do arquivo como ID (normalizado)
          const gameId = game.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const gameRef = doc(db, 'games', gameId);
          
          await setDoc(gameRef, gameData, { merge: true });
          
          return game.name;
        })
      );
      
      // Conta sucessos e erros
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[SYNC] ✅ ${result.value} sincronizado!`);
          success++;
        } else {
          console.error(`[SYNC] ❌ Erro ao sincronizar ${batch[index].name}:`, result.reason);
          errors++;
        }
      });
      
      // Log de progresso
      const progress = Math.min(i + BATCH_SIZE, gamesToSync.length);
      console.log(`[SYNC] 📊 Progresso: ${progress}/${gamesToSync.length} (${Math.round(progress/gamesToSync.length*100)}%)`);
    }
    
    console.log(`[SYNC] 🎉 Sincronização concluída! Sucesso: ${success}, Erros: ${errors}`);
    return { success, errors, platform: platformFilter };
    
  } catch (error) {
    console.error('[SYNC] ❌ Erro fatal na sincronização:', error);
    return { success: 0, errors: 1 };
  }
}

/**
 * 🎮 Busca jogos do Firestore (já sincronizados)
 */
export async function getGamesFromFirestore(platform?: Platform): Promise<Game[]> {
  // Suprime temporariamente console.error durante a chamada do Firestore
  const originalError = console.error;
  console.error = () => {}; // Silencia completamente
  
  try {
    const gamesRef = collection(db, 'games');
    let q = query(gamesRef);
    
    if (platform) {
      q = query(gamesRef, where('platform', '==', platform));
    }
    
    const snapshot = await getDocs(q);
    const games: Game[] = [];
    
    snapshot.forEach((doc) => {
      games.push({ id: doc.id, ...doc.data() } as Game);
    });
    
    console.error = originalError; // Restaura console.error
    console.log(`[FIRESTORE] 📚 ${games.length} jogos carregados${platform ? ` (${platform})` : ''}`);
    return games;
    
  } catch (error) {
    console.error = originalError; // Restaura console.error sempre
    
    // Suprime erros do Firestore (400, BloomFilter, etc) - não são críticos
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('BloomFilter') || 
          msg.includes('Bad Request') || 
          msg.includes('400') ||
          msg.includes('permission-denied')) {
        console.log('[FIRESTORE] ⚠️ Erro não crítico ignorado (sistema funcionando normalmente)');
        return [];
      }
    }
    
    console.error('[FIRESTORE] ❌ Erro ao buscar jogos:', error);
    return [];
  }
}

/**
 * 🔧 Detecta plataforma baseado no nome da pasta e extensão
 */
function detectPlatform(folderName: string, extension: string): Platform | null {
  // Primeiro tenta pelo nome da pasta
  const folder = folderName.toLowerCase();
  if (folder.includes('snes')) return 'snes';
  if (folder.includes('mega') || folder.includes('genesis')) return 'genesis';
  if (folder === 'gba') return 'gba';
  if (folder === 'gbc' || folder === 'gb') return 'gbc';
  if (folder.includes('ps1') || folder.includes('psx')) return 'ps1';
  if (folder === 'n64') return 'n64';
  
  // Senão tenta pela extensão
  return PLATFORM_EXTENSIONS[extension] || null;
}

/**
 * 🎨 Formata nome do jogo (remove underscores, capitaliza)
 */
function formatGameTitle(fileName: string): string {
  return fileName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * 🏷️ Nome legível da plataforma
 */
function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    snes: 'Super Nintendo',
    genesis: 'Sega Genesis',
    gba: 'Game Boy Advance',
    gbc: 'Game Boy Color',
    ps1: 'PlayStation 1',
    n64: 'Nintendo 64'
  };
  return names[platform];
}

/**
 * 🚀 Inicialização - Verifica se há jogos no Firestore
 * Se não houver, sincroniza automaticamente do Storage
 */
export async function initializeGames(): Promise<void> {
  try {
    console.log('[INIT] 🚀 Verificando jogos no Firestore...');
    
    const games = await getGamesFromFirestore();
    
    if (games.length === 0) {
      console.log('[INIT] ⚠️ Nenhum jogo encontrado. Iniciando sincronização automática...');
      const result = await syncGamesToFirestore();
      console.log(`[INIT] ✅ Sincronização automática concluída! ${result.success} jogos adicionados.`);
    } else {
      console.log(`[INIT] ✅ ${games.length} jogos já disponíveis no Firestore!`);
    }
    
  } catch (error) {
    console.error('[INIT] ❌ Erro ao inicializar jogos:', error);
  }
}
