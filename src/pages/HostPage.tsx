import { useState, useRef, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MultiplayerHost } from '../components/Multiplayer/MultiplayerHost';
import { signInAnonymously } from 'firebase/auth';

export default function HostPage() {
  const [sessionId] = useState(`session-${Date.now()}`);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [platform, setPlatform] = useState('snes');
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    signInAnonymously(auth).then((result) => {
      setUserId(result.user.uid);
    });
  }, []);

  const createSession = async () => {
    if (!gameTitle || !userId) return;

    await setDoc(doc(db, 'multiplayer_sessions', sessionId), {
      gameTitle,
      platform,
      hostUserId: userId,
      status: 'waiting',
      maxPlayers: 4,
      currentPlayers: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    setIsPlaying(true);

    // Procurar canvas do emulador
    const interval = setInterval(() => {
      const canvas = document.querySelector('#game canvas') as HTMLCanvasElement;
      if (canvas?.width > 0) {
        canvasRef.current = canvas;
        clearInterval(interval);
      }
    }, 500);
  };

  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg w-96">
          <h1 className="text-white text-2xl mb-6">Criar Sala HOST</h1>
          
          <input
            type="text"
            placeholder="Nome do jogo"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
          />
          
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
          >
            <option value="snes">SNES</option>
            <option value="nes">NES</option>
            <option value="gba">GBA</option>
            <option value="n64">Nintendo 64</option>
          </select>
          
          <button
            onClick={createSession}
            disabled={!userId || !gameTitle}
            className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            CRIAR SALA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div id="game" className="w-full h-screen"></div>
      
      {userId && (
        <MultiplayerHost
          sessionId={sessionId}
          userId={userId}
          canvasElement={canvasRef.current}
          onInputReceived={(input) => {
            // Mapear inputs para eventos de teclado
            const keyMap: Record<string, number> = {
              'ArrowUp': 38,
              'ArrowDown': 40,
              'ArrowLeft': 37,
              'ArrowRight': 39,
              'KeyZ': 90,
              'KeyX': 88,
            };
            
            const keyCode = keyMap[input.code];
            if (keyCode) {
              const event = new KeyboardEvent(input.type, {
                keyCode,
                bubbles: true
              });
              document.dispatchEvent(event);
            }
          }}
        />
      )}
    </div>
  );
}
