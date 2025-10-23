/**
 * Gerar ID único para sessão multiplayer
 */
export function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem letras confusas (I, O, 0, 1)
  let id = '';
  
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Validar formato de ID de sessão
 */
export function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return false;
  
  // 6 caracteres, apenas letras maiúsculas e números
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(sessionId);
}

/**
 * Formatar ID de sessão (adicionar hífens)
 */
export function formatSessionId(sessionId) {
  if (!sessionId) return '';
  
  // Formatar como XXX-XXX
  const clean = sessionId.replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) return clean;
  
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
}

/**
 * Limpar ID de sessão (remover hífens)
 */
export function cleanSessionId(sessionId) {
  if (!sessionId) return '';
  return sessionId.replace(/[^A-Z0-9]/g, '');
}

/**
 * Gerar nome de jogador aleatório
 */
export function generatePlayerName() {
  const adjectives = [
    'Super', 'Mega', 'Ultra', 'Hyper', 'Turbo',
    'Master', 'Epic', 'Legendary', 'Pro', 'Elite'
  ];
  
  const nouns = [
    'Gamer', 'Player', 'Hero', 'Champion', 'Warrior',
    'Ninja', 'Dragon', 'Phoenix', 'Tiger', 'Eagle'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  
  return `${adj}${noun}${num}`;
}

/**
 * Obter latência estimada
 */
export async function measureLatency(socket) {
  if (!socket || !socket.connected) return null;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    socket.emit('ping');
    
    socket.once('pong', () => {
      const latency = Date.now() - startTime;
      resolve(latency);
    });
    
    // Timeout após 5 segundos
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Formatar tempo decorrido
 */
export function formatElapsedTime(timestamp) {
  const now = Date.now();
  const elapsed = now - timestamp;
  
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Obter cor do console
 */
export function getConsoleColor(core) {
  const colors = {
    'snes': '#8B6EA8',
    'nes': '#E64646',
    'n64': '#2A6FDB',
    'gba': '#4A69BD',
    'gbc': '#FAD02C',
    'genesis': '#000000',
    'segaMD': '#000000',
    'ps1': '#003791',
    'psx': '#003791'
  };
  
  return colors[core?.toLowerCase()] || '#666666';
}

/**
 * Abreviar nome de ROM
 */
export function abbreviateRomName(romName, maxLength = 30) {
  if (!romName) return '';
  
  // Remover extensão
  const name = romName.replace(/\.(sfc|smc|nes|n64|gba|gbc|md|bin|iso)$/i, '');
  
  if (name.length <= maxLength) return name;
  
  return name.substring(0, maxLength - 3) + '...';
}

/**
 * Detectar se é mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Gerar hash simples para verificação
 */
export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
