import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { MultiplayerPlayer } from '../components/Multiplayer/MultiplayerPlayer';

export default function PlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    signInAnonymously(auth).then((result) => {
      setUserId(result.user.uid);
    });
  }, []);

  if (!userId || !sessionId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Conectando...</div>
      </div>
    );
  }

  return (
    <MultiplayerPlayer
      sessionId={sessionId}
      userId={userId}
      onClose={() => navigate('/lobby')}
    />
  );
}
