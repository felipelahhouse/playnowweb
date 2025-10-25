import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Users, Play, Plus, Gamepad2 } from 'lucide-react';

interface Session {
  id: string;
  gameTitle: string;
  platform: string;
  hostUserId: string;
  status: string;
  maxPlayers: number;
  currentPlayers: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function LobbyPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'multiplayer_sessions'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(rooms);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl text-white mb-8 flex items-center gap-3">
        <Gamepad2 className="w-10 h-10" />
        Multiplayer Lobby
      </h1>

      <button
        onClick={() => navigate('/host')}
        className="bg-green-600 text-white px-6 py-3 rounded-lg mb-8 hover:bg-green-700 transition-colors"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        Criar Nova Sala
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white text-xl mb-2">{session.gameTitle}</h3>
            <p className="text-gray-400 mb-4">
              <Users className="w-4 h-4 inline mr-1" />
              {session.currentPlayers}/{session.maxPlayers} jogadores
            </p>
            <button
              onClick={() => navigate(`/play/${session.id}`)}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
            >
              <Play className="w-4 h-4 inline mr-2" />
              ENTRAR
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <p className="text-gray-400 col-span-3 text-center py-12">
            Nenhuma sala ativa. Crie a primeira!
          </p>
        )}
      </div>
    </div>
  );
}
