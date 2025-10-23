import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Lock, Globe, Play, Crown, Clock } from 'lucide-react';
import type { GameSession } from '../../types';

const GameLobby: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // Mock data - in real app this would come from Supabase realtime
  useEffect(() => {
    const mockSessions: GameSession[] = [
      {
        id: '1',
        game_id: '1',
  host_user_id: 'user1',
        players: ['user1', 'user2'],
        max_players: 4,
        is_private: false,
        created_at: new Date().toISOString(),
        status: 'waiting'
      },
      {
        id: '2',
        game_id: '3',
  host_user_id: 'user3',
        players: ['user3'],
        max_players: 2,
        is_private: false,
        created_at: new Date().toISOString(),
        status: 'waiting'
      },
      {
        id: '3',
        game_id: '2',
  host_user_id: 'user4',
        players: ['user4', 'user5', 'user6'],
        max_players: 4,
        is_private: true,
        created_at: new Date().toISOString(),
        status: 'playing'
      }
    ];
    setSessions(mockSessions);
  }, []);

  const gameNames = {
    '1': 'Super Mario Bros',
    '2': 'Pac-Man',
    '3': 'Street Fighter II'
  };

  return (
    <section id="multiplayer" className="py-16 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Multiplayer <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Lobby</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Join other players in epic multiplayer battles or create your own gaming room
          </p>
        </div>

        {/* Create Room Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Create Room</span>
          </button>
        </div>

        {/* Active Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-400/20 transition-all duration-300"
            >
              {/* Session Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${session.status === 'waiting' ? 'bg-green-400 animate-pulse' : session.status === 'playing' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{gameNames[session.game_id as keyof typeof gameNames]}</h3>
                    <p className="text-gray-400 text-sm capitalize">{session.status}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {session.is_private ? (
                    <Lock className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-gray-400 text-sm">
                    {session.is_private ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>

              {/* Players */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 text-sm">
                    Players ({session.players.length}/{session.max_players})
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {Array.from({ length: session.max_players }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${
                        index < session.players.length 
                          ? 'bg-gradient-to-br from-cyan-400 to-purple-500 border-cyan-400/50 text-white' 
                          : 'bg-gray-800/50 border-gray-600/50 text-gray-500'
                      }`}
                    >
                      {index < session.players.length ? (
                        <>
                          {index === 0 && <Crown className="w-4 h-4" />}
                          {index > 0 && <Users className="w-4 h-4" />}
                        </>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Time */}
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">
                  Created {new Date(session.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Action Button */}
              <div className="flex gap-3">
                {session.status === 'waiting' && session.players.length < session.max_players && (
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Join Room</span>
                  </button>
                )}
                
                {session.status === 'waiting' && session.players.includes(user?.id || '') && (
                  <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Start Game</span>
                  </button>
                )}

                {session.status === 'playing' && (
                  <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Spectate</span>
                  </button>
                )}

                {session.status === 'waiting' && session.players.length === session.max_players && (
                  <button 
                    disabled
                    className="flex-1 bg-gray-600 text-gray-400 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    Room Full
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Match */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center space-y-4 p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white">Quick Match</h3>
            <p className="text-gray-400 text-center max-w-md">
              Can't find the perfect room? Let us match you with other players instantly!
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
              Find Match
            </button>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
    </section>
  );
};

const CreateRoomModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [roomName, setRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState('1');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);

  const games = [
    { id: '1', name: 'Super Mario Bros' },
    { id: '2', name: 'Pac-Man' },
    { id: '3', name: 'Street Fighter II' },
    { id: '4', name: 'Tetris' }
  ];

  const handleCreateRoom = () => {
    // Handle room creation logic here
    console.log('Creating room:', { roomName, selectedGame, maxPlayers, isPrivate });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Create Room</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Game</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-purple-400/50 transition-colors duration-300"
              >
                {games.map(game => (
                  <option key={game.id} value={game.id} className="bg-gray-800">
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Max Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-purple-400/50 transition-colors duration-300"
              >
                <option value={2} className="bg-gray-800">2 Players</option>
                <option value={3} className="bg-gray-800">3 Players</option>
                <option value={4} className="bg-gray-800">4 Players</option>
                <option value={6} className="bg-gray-800">6 Players</option>
                <option value={8} className="bg-gray-800">8 Players</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="private" className="text-gray-300 text-sm">
                Private Room (invite only)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRoom}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;