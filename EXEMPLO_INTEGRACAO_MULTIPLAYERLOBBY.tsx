/**
 * 📌 EXEMPLO: Como Usar o Novo MultiplayerLobby
 * 
 * Este arquivo mostra como integrar o novo MultiplayerLobby
 * refatorado para Socket.io em seu aplicativo.
 */

import React, { useState } from 'react';
import MultiplayerLobby from '@/components/Multiplayer/MultiplayerLobby';

/**
 * EXEMPLO 1: Componente Simples
 * Abre lobby em um modal
 */
export function ExemploSimples() {
  const [showLobby, setShowLobby] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowLobby(true)}
        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
      >
        🎮 Abrir Multiplayer Lobby
      </button>

      {showLobby && (
        <MultiplayerLobby
          onClose={() => setShowLobby(false)}
          onJoinSession={(sessionId) => {
            console.log('Entrou na sessão:', sessionId);
            // Aqui você pode fazer algo com o sessionId
            // Ex: carregar o emulador, etc
            setShowLobby(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * EXEMPLO 2: Com Callbacks Completos
 * Trata criação e entrada em sala
 */
export function ExemploCompleto() {
  const [showLobby, setShowLobby] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const handleJoinSession = (sessionId: string) => {
    console.log('✅ Jogador entrou na sessão:', sessionId);
    setCurrentSession(sessionId);
    setShowLobby(false);
    
    // Você pode navegar para o emulador aqui
    // navigation.push(`/play/${sessionId}`);
  };

  const handleCreateSession = (sessionId: string, gameId: string, gameTitle: string) => {
    console.log('🎬 Nova sessão criada:', {
      sessionId,
      gameId,
      gameTitle
    });
    setCurrentSession(sessionId);
    setShowLobby(false);
  };

  return (
    <div>
      {!currentSession ? (
        <div className="space-y-4">
          <h2>Multiplayer</h2>
          
          <button
            onClick={() => setShowLobby(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700"
          >
            Entrar no Lobby
          </button>

          {showLobby && (
            <MultiplayerLobby
              onClose={() => setShowLobby(false)}
              onJoinSession={handleJoinSession}
              onCreateSession={handleCreateSession}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2>Sessão Ativa</h2>
          <p>ID da Sessão: {currentSession}</p>
          
          <button
            onClick={() => setCurrentSession(null)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sair da Sessão
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * EXEMPLO 3: Lobby Embutido (Não-Modal)
 * Mostra lobby diretamente na página
 */
export function ExemploEmbarcado() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <MultiplayerLobby
        embedded={true}
        onClose={() => {
          // Em modo embedded, onClose pode redirecionar para homepage
          window.location.href = '/';
        }}
        onJoinSession={(sessionId) => {
          console.log('Entrou em:', sessionId);
          // Redirecionar para a sessão
          window.location.href = `/play/${sessionId}`;
        }}
      />
    </div>
  );
}

/**
 * EXEMPLO 4: Com Loading e Error States
 * Tratamento robusto de erros
 */
export function ExemploRobusto() {
  const [showLobby, setShowLobby] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinSession = (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simular carregamento
      setTimeout(() => {
        console.log('✅ Conectado à sessão:', sessionId);
        setIsLoading(false);
        setShowLobby(false);
        
        // Navegar para o emulador
        // router.push(`/emulator/${sessionId}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded text-red-400">
          ❌ {error}
        </div>
      )}

      {isLoading && (
        <div className="p-4 bg-blue-900/20 border border-blue-500 rounded text-blue-400">
          ⏳ Conectando...
        </div>
      )}

      <button
        onClick={() => setShowLobby(true)}
        disabled={isLoading}
        className="px-4 py-2 bg-cyan-600 text-white rounded disabled:opacity-50"
      >
        🎮 Multiplayer
      </button>

      {showLobby && (
        <MultiplayerLobby
          onClose={() => setShowLobby(false)}
          onJoinSession={handleJoinSession}
        />
      )}
    </div>
  );
}

/**
 * EXEMPLO 5: Integração em Componente Principal
 * Usar em seu App.tsx ou componente de rota
 */
export function IntegracaoAppPrincipal() {
  const [gameScreen, setGameScreen] = useState<
    'home' | 'lobby' | 'playing'
  >('home');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleOpenLobby = () => {
    setGameScreen('lobby');
  };

  const handleJoinSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setGameScreen('playing');
  };

  const handleCloseLobby = () => {
    setGameScreen('home');
  };

  return (
    <div className="w-full h-screen bg-black">
      {gameScreen === 'home' && (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={handleOpenLobby}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xl font-bold rounded-lg hover:from-cyan-600 hover:to-cyan-700"
          >
            🎮 Iniciar Multiplayer
          </button>
        </div>
      )}

      {gameScreen === 'lobby' && (
        <MultiplayerLobby
          onClose={handleCloseLobby}
          onJoinSession={handleJoinSession}
        />
      )}

      {gameScreen === 'playing' && currentSessionId && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <h2>🎮 Sessão: {currentSessionId}</h2>
            <p className="mt-4">Emulador deveria carregar aqui...</p>
            <button
              onClick={() => setGameScreen('home')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * EXEMPLO 6: Com TypeScript Completo
 * Tipagem total para segurança
 */
interface GameSession {
  id: string;
  name: string;
  host: string;
  players: number;
}

interface MultiplayerManagerProps {
  onGameStarted: (sessionId: string) => void;
}

export function MultiplayerManager({
  onGameStarted
}: MultiplayerManagerProps) {
  const [showLobby, setShowLobby] = useState<boolean>(false);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);

  const handleJoinSession = (sessionId: string): void => {
    console.log('Entrada validada:', sessionId);
    
    // Validar sessionId
    if (!sessionId || sessionId.trim() === '') {
      console.error('ID de sessão inválido');
      return;
    }

    setShowLobby(false);
    onGameStarted(sessionId);
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-white mb-4">
        🎮 Gerenciador Multiplayer
      </h1>

      <button
        onClick={() => setShowLobby(true)}
        className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
      >
        Abrir Lobby
      </button>

      {showLobby && (
        <MultiplayerLobby
          onClose={() => setShowLobby(false)}
          onJoinSession={handleJoinSession}
        />
      )}

      {activeSessions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg text-white mb-2">Sessões Ativas:</h2>
          <ul>
            {activeSessions.map((session) => (
              <li key={session.id} className="text-gray-300">
                {session.name} ({session.players} players)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ExemploSimples;