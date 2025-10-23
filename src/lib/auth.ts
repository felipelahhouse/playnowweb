import { User } from '../types';

// 👑 ADMIN - Controle total da plataforma
export const ADMIN_EMAILS = [
  'felipelars2009@gmail.com',
  'felipelars45@gmail.com',
  'peternoia@gmail.com'
];

// 🛡️ MODERATORS - Podem moderar chat e banir usuários
export const MODERATOR_EMAILS = [
  'moderator@playnowemulator.com'
];

// 📺 STREAMERS - Destacados na plataforma
export const STREAMER_EMAILS = [
  'streamer@playnowemulator.com'
];

// 🧪 BETA TESTERS - Testam features novas
export const BETA_TESTER_EMAILS = [
  'beta@playnowemulator.com'
];

// Verifica se um usuário é admin
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// Verifica se um usuário é moderador
export function isModerator(user: User | null): boolean {
  if (!user || !user.email) return false;
  return MODERATOR_EMAILS.includes(user.email.toLowerCase());
}

// Verifica se um usuário é streamer
export function isStreamer(user: User | null): boolean {
  if (!user || !user.email) return false;
  return STREAMER_EMAILS.includes(user.email.toLowerCase());
}

// Verifica se um usuário é beta tester
export function isBetaTester(user: User | null): boolean {
  if (!user || !user.email) return false;
  return BETA_TESTER_EMAILS.includes(user.email.toLowerCase());
}

// Verifica se um usuário é VIP/Premium
export function isVip(user: User | null): boolean {
  if (!user) return false;
  return isAdmin(user) || user.isVip === true;
}

// Obtém o badge PRINCIPAL do usuário (hierarquia)
export function getUserBadge(user: User | null): string | null {
  if (!user) return null;
  
  if (isAdmin(user)) return 'Admin';
  if (isModerator(user)) return 'Moderator';
  if (isStreamer(user)) return 'Streamer';
  if (isVip(user)) return 'VIP';
  if (isBetaTester(user)) return 'Beta Tester';
  if (user.level && user.level >= 10) return 'PRO';
  
  return null;
}

// Obtém TODOS os badges do usuário (pode ter múltiplos)
export function getAllUserBadges(user: User | null): string[] {
  if (!user) return [];
  
  const badges: string[] = [];
  if (isAdmin(user)) badges.push('Admin');
  if (isModerator(user)) badges.push('Moderator');
  if (isStreamer(user)) badges.push('Streamer');
  if (isVip(user)) badges.push('VIP');
  if (isBetaTester(user)) badges.push('Beta Tester');
  if (user.level && user.level >= 10) badges.push('PRO');
  
  return badges;
}

// Obtém a cor do badge
export function getBadgeColor(badge: string | null): string {
  switch (badge) {
    case 'Admin': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'Moderator': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'Streamer': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'VIP': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'Beta Tester': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'PRO': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
}

// Obtém ícone do badge
export function getBadgeIcon(badge: string | null): string {
  switch (badge) {
    case 'Admin': return '👑';
    case 'Moderator': return '🛡️';
    case 'Streamer': return '📺';
    case 'VIP': return '⭐';
    case 'Beta Tester': return '🧪';
    case 'PRO': return '💎';
    default: return '';
  }
}

// Verifica permissões do usuário
export function getUserPermissions(user: User | null) {
  return {
    canModerate: isAdmin(user) || isModerator(user),
    canStream: isAdmin(user) || isStreamer(user),
    canAccessBeta: isAdmin(user) || isBetaTester(user),
    canManageGames: isAdmin(user),
    canCreateTournaments: isAdmin(user) || isModerator(user),
    hasVipFeatures: isAdmin(user) || isVip(user)
  };
}

// Verifica permissões administrativas
export function hasAdminPermission(user: User | null): boolean {
  if (!isAdmin(user)) return false;
  
  // Por enquanto, admins têm todas as permissões
  return true;
}

export const ADMIN_PERMISSIONS = {
  MANAGE_GAMES: 'manage_games',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROOMS: 'manage_rooms',
  VIEW_ANALYTICS: 'view_analytics',
  MODERATE_CONTENT: 'moderate_content',
  CREATE_TOURNAMENTS: 'create_tournaments',
  MANAGE_TOURNAMENTS: 'manage_tournaments'
} as const;