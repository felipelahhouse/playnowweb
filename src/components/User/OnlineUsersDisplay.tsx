import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import UserAvatar from './UserAvatar';
import { User } from '../../types';

interface OnlineUsersDisplayProps {
  showInHeader?: boolean;
  maxVisible?: number;
}

const OnlineUsersDisplay: React.FC<OnlineUsersDisplayProps> = ({ 
  showInHeader = false, 
  maxVisible = 8 
}) => {
  const { onlineCount, onlineUsers } = useOnlineUsers();
  const [showModal, setShowModal] = useState(false);

  if (showInHeader) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-400/50 rounded-xl transition-all duration-300 hover:scale-105"
          title="Ver usuários online"
        >
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-green-300 font-bold text-sm">{onlineCount}</span>
          <span className="hidden sm:inline text-green-400 text-xs">ONLINE</span>
        </button>

        {showModal && (
          <OnlineUsersModal 
            users={onlineUsers as User[]} 
            onClose={() => setShowModal(false)} 
          />
        )}
      </>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum usuário online no momento</p>
      </div>
    );
  }

  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = onlineUsers.length - maxVisible;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Usuários Online ({onlineCount})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visibleUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-200">
            <UserAvatar user={user as User} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-sm">{(user as any).username}</p>
              <p className="text-green-400 text-xs">Online</p>
            </div>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl transition-all duration-200 text-cyan-300 hover:text-cyan-200"
        >
          Ver mais {remainingCount} usuários online
        </button>
      )}

      {showModal && (
        <OnlineUsersModal 
          users={onlineUsers as User[]} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

const OnlineUsersModal: React.FC<{ users: User[]; onClose: () => void }> = ({ users, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-2xl">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              Usuários Online ({users.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-200">
                <UserAvatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.username}</p>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                  <p className="text-green-400 text-xs">Online agora</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersDisplay;