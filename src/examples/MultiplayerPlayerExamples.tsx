// 🎮 EXEMPLO DE USO DO MULTIPLAYER PLAYER
// Este arquivo demonstra como usar o componente MultiplayerPlayer.tsx

import React, { useState } from 'react';
import MultiplayerPlayer from '../components/Multiplayer/MultiplayerPlayer';
import { useAuth } from '../contexts/AuthContext';

/**
 * ✅ EXEMPLO 1: Uso Básico (Recomendado)
 * 
 * Props diretas são recomendadas para maior controle
 */
export const ExemploBasico = () => {
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Session ID do host (normalmente vem da URL ou estado)
  const sessionId = 'session_1760818086015_dim98yln0';
  
  return (
    <div>
      <button onClick={() => setShowPlayer(true)}>
        🎮 Entrar como Player
      </button>

      {showPlayer && (
        <MultiplayerPlayer
          sessionId={sessionId}
          userId="user_12345"
          username="PlayerTeste"
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

/**
 * ✅ EXEMPLO 2: Com Autenticação do Firebase
 * 
 * Usa o contexto de autenticação automaticamente
 */
export const ExemploComAuth = () => {
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  
  if (!user) {
    return <div>Por favor, faça login primeiro</div>;
  }

  return (
    <div>
      <button onClick={() => setShowPlayer(true)}>
        🎮 Entrar como Player ({user.username})
      </button>

      {showPlayer && (
        <MultiplayerPlayer
          sessionId="session_1760818086015_dim98yln0"
          // userId e username vêm automaticamente do contexto
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

/**
 * ✅ EXEMPLO 3: Com Room Code da URL
 * 
 * Ideal para links compartilháveis
 */
export const ExemploComURL = () => {
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Pegar sessionId da URL
  // Ex: /player?session=session_1760818086015_dim98yln0
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');

  if (!sessionId) {
    return (
      <div>
        <h1>❌ Session ID não encontrado</h1>
        <p>Use um link válido com ?session=SESSION_ID</p>
      </div>
    );
  }

  if (!user) {
    return <div>Por favor, faça login primeiro</div>;
  }

  return (
    <div>
      <button onClick={() => setShowPlayer(true)}>
        🎮 Entrar na sessão: {sessionId}
      </button>

      {showPlayer && (
        <MultiplayerPlayer
          sessionId={sessionId}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

/**
 * ✅ EXEMPLO 4: Página Completa de Player
 * 
 * Componente pronto para usar como página
 */
export const PlayerPage = () => {
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');

  // Validações
  if (!sessionId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>❌ Sessão não encontrada</h1>
        <p>Use um link válido: /player?session=SESSION_ID</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🏠 Voltar para Home
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>🔒 Login necessário</h1>
        <p>Faça login para entrar na sessão</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🏠 Ir para Home
        </button>
      </div>
    );
  }

  // Tudo ok, mostrar player
  return (
    <MultiplayerPlayer
      sessionId={sessionId}
      onClose={() => {
        // Voltar para home ao fechar
        window.location.href = '/';
      }}
    />
  );
};

/**
 * ✅ EXEMPLO 5: Integração com Sistema de Salas
 * 
 * Para usar com um sistema de lobby/salas
 */
interface Room {
  id: string;
  sessionId: string;
  hostName: string;
  gameName: string;
  players: number;
  maxPlayers: number;
}

export const RoomBrowser = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  // Exemplo de salas disponíveis (normalmente viria do Firestore)
  const availableRooms: Room[] = [
    {
      id: '1',
      sessionId: 'session_1760818086015_dim98yln0',
      hostName: 'Player1',
      gameName: 'Super Mario World',
      players: 1,
      maxPlayers: 4
    },
    {
      id: '2',
      sessionId: 'session_1760818086015_abc123',
      hostName: 'Player2',
      gameName: 'Street Fighter II',
      players: 2,
      maxPlayers: 2
    }
  ];

  if (!user) {
    return <div>Por favor, faça login</div>;
  }

  // Se tem sessão selecionada, mostrar player
  if (selectedSession) {
    return (
      <MultiplayerPlayer
        sessionId={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    );
  }

  // Mostrar lista de salas
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#111',
      minHeight: '100vh',
      color: '#fff'
    }}>
      <h1>🎮 Salas Disponíveis</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {availableRooms.map(room => (
          <div
            key={room.id}
            style={{
              backgroundColor: '#222',
              padding: '20px',
              borderRadius: '10px',
              border: '2px solid #333'
            }}
          >
            <h3>{room.gameName}</h3>
            <p>Host: {room.hostName}</p>
            <p>Jogadores: {room.players}/{room.maxPlayers}</p>
            
            <button
              onClick={() => setSelectedSession(room.sessionId)}
              disabled={room.players >= room.maxPlayers}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: room.players >= room.maxPlayers ? 'not-allowed' : 'pointer',
                opacity: room.players >= room.maxPlayers ? 0.5 : 1
              }}
            >
              {room.players >= room.maxPlayers ? '🔒 Sala Cheia' : '▶️ Entrar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ EXPORTAR TODOS OS EXEMPLOS
export default {
  ExemploBasico,
  ExemploComAuth,
  ExemploComURL,
  PlayerPage,
  RoomBrowser
};
