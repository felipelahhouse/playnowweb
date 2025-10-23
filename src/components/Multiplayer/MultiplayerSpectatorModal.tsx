import React, { useEffect, useState } from 'react';
import { X, Eye, User, MessageCircle, Send, Users, Gamepad2, Crown } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface MultiplayerSpectatorModalProps {
  lobbyId: string;
  lobbyData: {
    roomName: string;
    hostUsername: string;
    gameName: string;
    platform: string;
    currentPlayers: number;
    maxPlayers: number;
    spectators: number;
  };
  onClose: () => void;
}

interface Player {
  id: string;
  username: string;
  playerNumber: number;
  isReady: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

const MultiplayerSpectatorModal: React.FC<MultiplayerSpectatorModalProps> = ({ lobbyId, lobbyData, onClose }) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Listener para players em tempo real
  useEffect(() => {
    const playersQuery = query(
      collection(db, 'game_sessions', lobbyId, 'players'),
      orderBy('playerNumber', 'asc')
    );

    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersList: Player[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        playersList.push({
          id: docSnap.id,
          username: data.username || 'Player',
          playerNumber: data.playerNumber || 1,
          isReady: data.isReady || false
        });
      });
      setPlayers(playersList);
    }, (error) => {
      console.log('Players not available:', error);
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Listener para chat de espectadores
  useEffect(() => {
    const chatQuery = query(
      collection(db, 'game_sessions', lobbyId, 'spectator_chat'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          username: data.username || 'Anonymous',
          message: data.message || '',
          timestamp: data.timestamp?.toMillis() || Date.now()
        });
      });
      setChatMessages(messages.reverse());
    });

    return () => unsubscribe();
  }, [lobbyId]);

  // Incrementar contador de espectadores ao entrar
  useEffect(() => {
    if (!user) return;

    const incrementSpectators = async () => {
      try {
        const spectatorRef = doc(db, 'game_sessions', lobbyId, 'spectators', user.id);
        await addDoc(collection(db, 'game_sessions', lobbyId, 'spectators'), {
          userId: user.id,
          username: user.username,
          joinedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error adding spectator:', error);
      }
    };

    incrementSpectators();

    // Cleanup ao sair
    return () => {
      // TODO: Decrementar contador ao sair
    };
  }, [lobbyId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'game_sessions', lobbyId, 'spectator_chat'), {
        username: user.username || 'Anonymous',
        userId: user.id,
        message: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[95vh] md:h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Header */}
        <div className="relative px-3 md:px-6 py-3 md:py-4 bg-black/40 backdrop-blur-sm border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative">
                <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg md:text-2xl font-black text-white truncate max-w-[150px] md:max-w-none">{lobbyData.roomName}</h2>
                  <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold rounded">
                    MP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{lobbyData.gameName}</p>
                  <span className="hidden md:inline text-gray-600">•</span>
                  <div className="hidden md:flex items-center gap-1 text-gray-400 text-sm">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{lobbyData.hostUsername}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-green-500/20 border border-green-500/30 rounded-lg md:rounded-xl">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                <span className="text-white font-bold text-sm md:text-base">{lobbyData.currentPlayers}/{lobbyData.maxPlayers}</span>
                <span className="hidden md:inline text-gray-400 text-sm">jogadores</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                <Eye className="w-5 h-5 text-purple-400" />
                <span className="text-white font-bold">{lobbyData.spectators}</span>
                <span className="text-gray-400 text-sm">espectadores</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-purple-500/20 rounded-lg md:rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 p-2 md:p-4 h-[calc(100%-65px)] md:h-[calc(100%-80px)]">
          {/* Game Screen (Left - 2/3) */}
          <div className="lg:col-span-2 space-y-2 md:space-y-4">
            {/* Game Preview */}
            <div className="bg-black rounded-xl md:rounded-2xl overflow-hidden border-2 border-purple-500/20 relative h-[35vh] lg:h-[calc(100%-140px)]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                <div className="text-center px-4">
                  <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-purple-400 mx-auto mb-3 md:mb-4 animate-pulse" />
                  <p className="text-white text-base md:text-xl font-bold mb-1 md:mb-2">Partida Multiplayer</p>
                  <p className="text-gray-400 text-xs md:text-base">Aguardando conexão com o jogo...</p>
                  <div className="mt-3 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg inline-block">
                    <p className="text-purple-400 text-xs md:text-sm font-semibold">
                      {lobbyData.platform.toUpperCase()} - {lobbyData.gameName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Badge */}
              <div className="absolute top-2 left-2 md:top-4 md:left-4 px-2 py-1 md:px-3 md:py-1.5 bg-cyan-500/90 text-white text-xs md:text-sm font-bold rounded-lg backdrop-blur-sm">
                {lobbyData.platform.toUpperCase()}
              </div>

              {/* Spectator Mode Badge */}
              <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 py-1 md:px-3 md:py-1.5 bg-purple-500 text-white text-xs md:text-sm font-bold rounded-lg flex items-center gap-1 md:gap-2">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">MODO ESPECTADOR</span>
                <span className="md:hidden">ESPECTADOR</span>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-gray-900/50 rounded-xl md:rounded-2xl border-2 border-gray-700 p-3 md:p-4 h-auto lg:h-32">
              <h3 className="text-white font-bold text-xs md:text-sm mb-2 md:mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                Jogadores na Partida
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {players.length > 0 ? (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 px-2 md:px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        player.playerNumber === 1 ? 'bg-gradient-to-br from-cyan-400 to-blue-400' :
                        player.playerNumber === 2 ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
                        player.playerNumber === 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                        'bg-gradient-to-br from-green-400 to-emerald-400'
                      }`}>
                        P{player.playerNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{player.username}</p>
                        {player.isReady && (
                          <span className="text-green-400 text-xs">✓ Pronto</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-2">
                    <p className="text-gray-500 text-xs md:text-sm">Nenhum jogador ainda</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat (Right - 1/3) */}
          <div className="bg-gray-900/50 rounded-xl md:rounded-2xl border-2 border-gray-700 overflow-hidden flex flex-col h-[calc(60vh-80px)] lg:h-auto">
            {/* Chat Header */}
            <div className="px-3 md:px-4 py-2.5 md:py-3 bg-black/40 border-b border-gray-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              <h3 className="text-white font-bold text-base md:text-lg">Chat Espectadores</h3>
              <span className="ml-auto px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                {chatMessages.length}
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <Eye className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-2 md:mb-3 opacity-50" />
                  <p className="text-gray-500 text-xs md:text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-gray-600 text-xs mt-1">Comente a partida!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="animate-slideIn">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                        <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-purple-400 font-bold text-xs md:text-sm truncate">
                            {msg.username}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs md:text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            {user ? (
              <div className="p-2 md:p-3 bg-black/40 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Comente a partida..."
                    className="flex-1 px-3 py-2.5 md:py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm min-h-[44px] md:min-h-0"
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="px-3 md:px-4 py-2.5 md:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[44px] min-h-[44px] md:min-h-0 md:min-w-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 md:p-3 bg-black/40 border-t border-gray-700">
                <p className="text-gray-400 text-xs md:text-sm text-center">
                  Faça login para participar do chat
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerSpectatorModal;
