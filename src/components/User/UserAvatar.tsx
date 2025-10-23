import React from 'react';
import { Crown, Star, Shield } from 'lucide-react';
import { User } from '../../types';
import { getUserBadge, getBadgeColor, isAdmin, isVip } from '../../lib/auth';

interface UserAvatarProps {
  user: Partial<User> & { 
    id?: string; 
    username?: string;
    avatar_url?: string;
    is_online?: boolean;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  showOnline?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showBadge = true, 
  showOnline = true,
  className = '' 
}) => {
  const badge = getUserBadge(user as User);
  const badgeColor = getBadgeColor(badge);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl'
  };

  const badgeSizes = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-xs',
    lg: 'w-5 h-5 text-sm',
    xl: 'w-6 h-6 text-sm'
  };

  const getBadgeIcon = () => {
    if (isAdmin(user as User)) return <Crown className="w-3 h-3" />;
    if (isVip(user as User)) return <Star className="w-3 h-3" />;
    return <Shield className="w-3 h-3" />;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-800`}>
        {user.avatar_url ? (
          <img 
            src={user.avatar_url} 
            alt={user.username || 'User'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.warn('❌ Erro ao carregar avatar do usuário:', user.username, user.avatar_url);
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const initial = (user.username || 'U').charAt(0).toUpperCase();
                parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold">${initial}</div>`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {(user.username || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Badge de Admin/VIP - COROA MELHORADA */}
      {showBadge && badge && (
        <div className={`absolute -top-1 -right-1 ${badgeSizes[size]} bg-gradient-to-br ${badgeColor} rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg z-10`}>
          <div className="relative animate-pulse-slow">
            {getBadgeIcon()}
          </div>
          {/* Glow effect animado */}
          <div className={`absolute inset-0 bg-gradient-to-br ${badgeColor} rounded-full blur-md opacity-60 animate-glow`} />
          {/* Ring effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${badgeColor} rounded-full animate-ping opacity-20`} />
        </div>
      )}

      {/* Indicador Online */}
      {showOnline && user.is_online && (
        <div className={`absolute -bottom-1 -right-1 ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} bg-green-400 rounded-full border-2 border-gray-900 animate-pulse`} />
      )}
    </div>
  );
};

export default UserAvatar;