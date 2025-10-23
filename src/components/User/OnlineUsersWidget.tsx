// 👥 ONLINE USERS WIDGET - Exibe usuários online no canto inferior esquerdo com perfis clicáveis
import React, { useState } from 'react';
import { Users, ChevronUp, ChevronDown, MessageCircle, Eye } from 'lucide-react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import UserAvatar from './UserAvatar';
import UserProfileModal from './UserProfileModal';
import DirectMessages from '../Social/DirectMessages';
import FriendsList from '../Social/FriendsList';

const OnlineUsersWidget: React.FC = () => {
  const { onlineUsers } = useOnlineUsers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);

  // ✅ DEBUG: Log para verificar se o widget está recebendo dados
  React.useEffect(() => {
    console.log('🔔 [OnlineUsersWidget] Usuários online:', onlineUsers.length, onlineUsers);
  }, [onlineUsers]);

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleCloseProfile = () => {
    setSelectedUserId(null);
  };

  const handleSendMessage = (userId: string) => {
    setSelectedUserId(null);
    setMessageUserId(userId);
  };

  const handleAddFriend = (userId: string) => {
    setSelectedUserId(null);
    setShowFriendsList(true);
    console.log('Add friend:', userId); // TODO: Implement friend request
  };

  // ✅ SEMPRE RENDERIZAR - mesmo sem usuários online
  // O widget agora mostra "0 online" ao invés de desaparecer
  
  return (
    <>
      {/* 🎮 WIDGET DE JOGADORES ONLINE - POSIÇÃO FIXA NO CANTO INFERIOR ESQUERDO */}
      <div 
        className="fixed bottom-6 left-6 z-[9999]" 
        style={{ 
          pointerEvents: 'auto',
          isolation: 'isolate' // Cria novo contexto de empilhamento
        }}
      >
        <div className={`bg-black/95 backdrop-blur-xl border-2 ${
          onlineUsers.length > 0 ? 'border-green-500/50' : 'border-gray-500/30'
        } rounded-2xl shadow-2xl ${
          onlineUsers.length > 0 ? 'shadow-green-500/30' : 'shadow-gray-500/10'
        } transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-green-500/10 transition-all duration-200 rounded-t-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Users className={`w-5 h-5 ${onlineUsers.length > 0 ? 'text-green-400' : 'text-gray-400'}`} />
              {onlineUsers.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">Online Players</div>
              <div className={`text-xs ${onlineUsers.length > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {onlineUsers.length} online
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Expanded User List */}
        {isExpanded && (
          <div className="border-t border-gray-800">
            {onlineUsers.length > 0 ? (
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-2">
                  {onlineUsers.map((onlineUser) => {
                    // Converte last_seen para string para compatibilidade com UserAvatar
                    const userForAvatar = {
                      ...onlineUser,
                      last_seen: typeof onlineUser.last_seen === 'string' 
                        ? onlineUser.last_seen 
                        : undefined
                    };
                    
                    return (
                    <div
                      key={onlineUser.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
                    >
                      <UserAvatar user={userForAvatar} size="sm" showBadge={true} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {onlineUser.username}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Online
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewProfile(onlineUser.id)}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-200"
                          title="Ver Perfil"
                        >
                          <Eye className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => handleSendMessage(onlineUser.id)}
                          className="p-2 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                          title="Enviar mensagem"
                        >
                          <MessageCircle className="w-4 h-4 text-purple-400" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No players online</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pulse effect when collapsed */}
      {!isExpanded && onlineUsers.length > 0 && (
        <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl animate-pulse pointer-events-none" />
      )}
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal 
          userId={selectedUserId} 
          onClose={handleCloseProfile}
          onSendMessage={handleSendMessage}
          onAddFriend={handleAddFriend}
        />
      )}

      {/* Direct Messages Modal */}
      {messageUserId && (
        <DirectMessages
          recipientId={messageUserId}
          onClose={() => setMessageUserId(null)}
        />
      )}

      {/* Friends List Modal */}
      {showFriendsList && (
        <FriendsList
          onClose={() => {
            setShowFriendsList(false);
          }}
          onSendMessage={handleSendMessage}
        />
      )}
    </>
  );
};

export default OnlineUsersWidget;
