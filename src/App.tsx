import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { useSessionCleanup } from './hooks/useSessionCleanup';
import { useMultiplayerJoin } from './hooks/useMultiplayerJoin';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { isAdmin as checkIsAdmin } from './lib/auth';
import Header from './components/Layout/Header';
import ModernHeroSection from './components/Hero/ModernHeroSection';
import LocalGameLibrary from './components/Games/LocalGameLibrary';
import CyberpunkAuthV2 from './components/Auth/CyberpunkAuthV2';
import MaintenanceNotificationDisplay from './components/Maintenance/MaintenanceNotificationDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import DevTools from './components/Dev/DevTools';
import OptimizedLoader from './components/Common/OptimizedLoader';
import type { Game } from './types';
import type { StreamConfig } from './components/Streaming/StreamSetupModal';

const LiveStreamGrid = lazy(() => import('./components/Streaming/LiveStreamGrid'));
const MultiplayerLobby = lazy(() => import('./components/Multiplayer/MultiplayerLobby'));
const MultiplayerPlayerComponent = lazy(() => import('./components/Multiplayer/MultiplayerPlayer_old'));
const MultiplayerHostView = lazy(() => import('./components/Multiplayer/MultiplayerHostView'));
const StreamerView = lazy(() => import('./components/Streaming/StreamerView'));
const StreamSetupModal = lazy(() => import('./components/Streaming/StreamSetupModal'));
const HalloweenEffects = lazy(() => import('./components/Theme/HalloweenEffects'));
const Tournaments = lazy(() => import('./components/Tournaments/Tournaments'));
const OnlineUsersWidget = lazy(() => import('./components/User/OnlineUsersWidget'));
const MaintenanceModal = lazy(() => import('./components/Maintenance/MaintenanceModal'));

interface StreamingData extends StreamConfig {
  gameId: string;
  romPath: string;
  gameTitle?: string;
  gameCover?: string | null;
}

interface StreamSetupData {
  game: Game;
}

interface MultiplayerSessionData {
  sessionId: string;
  gameId: string;
  romPath: string;
  gameTitle: string;
  platform: string;
}

function AppContent() {
  const { user, loading } = useAuth();
  
  useSessionCleanup();
  const joinInfo = useMultiplayerJoin();

  const [currentView, setCurrentView] = useState<'streams' | 'games' | 'multiplayer' | 'tournaments'>('games');
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [streamingData, setStreamingData] = useState<StreamingData | null>(null);
  const [streamSetupData, setStreamSetupData] = useState<StreamSetupData | null>(null);
  const [multiplayerSession, setMultiplayerSession] = useState<MultiplayerSessionData | null>(null);
  const [showMultiplayerPlayer, setShowMultiplayerPlayer] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<{
    enabled: boolean;
    message: string;
    estimatedTime: string;
  } | null>(null);

  const userIsAdmin = checkIsAdmin(user);

  // Detecta URL de join e abre player automaticamente
  useEffect(() => {
    console.log('🔍 [APP] Verificando URL de join...', {
      isJoinUrl: joinInfo?.isJoinUrl,
      sessionId: joinInfo?.sessionId,
      hasUser: !!user,
      userLoggedIn: !!user
    });
    
    if (joinInfo?.isJoinUrl && joinInfo.sessionId && user) {
      console.log('✅ [APP] 🎮 URL de join detectada! Carregando player...', joinInfo.sessionId);
      setJoinSessionId(joinInfo.sessionId);
      setShowMultiplayerPlayer(true);
    } else if (joinInfo?.isJoinUrl && joinInfo.sessionId && !user) {
      console.warn('⚠️ [APP] URL de join detectada mas usuário NÃO está logado!');
    }
  }, [joinInfo, user]);

  useEffect(() => {
    const maintenanceRef = doc(db, 'system', 'maintenance');
    const unsubscribe = onSnapshot(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<{
          enabled: boolean;
          message: string;
          estimatedTime: string;
        }>;
        setMaintenanceMode({
          enabled: Boolean(data.enabled),
          message: data.message ?? '',
          estimatedTime: data.estimatedTime ?? ''
        });
      } else {
        setMaintenanceMode(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartStream = (game: Game) => {
    setStreamSetupData({ game });
  };

  const handleConfirmStreamSetup = (config: StreamConfig) => {
    if (!streamSetupData?.game) {
      return;
    }

    const { game } = streamSetupData;
    setStreamingData({
      ...config,
      gameId: game.id,
      romPath: game.romUrl,
      gameTitle: game.title,
      gameCover: game.cover ?? game.coverUrl ?? null
    });
    setStreamSetupData(null);
  };

  const handleCreateMultiplayerSession = (
    sessionId: string,
    gameId: string,
    romPath: string,
    gameTitle: string,
    platform: string
  ) => {
    console.log('🎮🎮🎮 [App] CRIANDO SESSÃO MULTIPLAYER 🎮🎮🎮');
    console.log('[App] Session ID:', sessionId);
    console.log('[App] Game ID:', gameId);
    console.log('[App] ROM Path:', romPath);
    console.log('[App] Game Title:', gameTitle);
    console.log('[App] Platform:', platform);
    
    try {
      const sessionData = {
        sessionId,
        gameId,
        romPath,
        gameTitle,
        platform
      };
      
      console.log('[App] 💾 Salvando session data no state:', sessionData);
      setMultiplayerSession(sessionData);
      
      console.log('[App] 🚪 Fechando lobby...');
      setShowMultiplayerLobby(false);
      
      console.log('[App] ✅ Sessão configurada! MultiplayerHostView deve renderizar agora.');
    } catch (error) {
      console.error('[App] ❌ ERRO ao configurar sessão:', error);
      alert('Erro ao criar sala multiplayer: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleJoinMultiplayerSession = (sessionId: string) => {
    console.log('[App] 🚪 Entrando na sessão multiplayer:', sessionId);
    
    // Fechar o lobby e abrir o player
    setShowMultiplayerLobby(false);
    setJoinSessionId(sessionId);
    setShowMultiplayerPlayer(true);
  };

  const handleCloseMultiplayerLobby = () => {
    setShowMultiplayerLobby(false);
    setMultiplayerSession(null);
  };

  if (loading) {
    return <OptimizedLoader fullScreen size="lg" />;
  }

  if (!user) {
    return <CyberpunkAuthV2 />;
  }

  if (maintenanceMode?.enabled && !userIsAdmin) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<OptimizedLoader fullScreen size="md" />}>
          <MaintenanceModal
            message={maintenanceMode.message}
            estimatedTime={maintenanceMode.estimatedTime}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ErrorBoundary>
        <Suspense fallback={<div className="h-1 bg-cyan-500 animate-pulse gpu-accelerated"></div>}>
          <HalloweenEffects />
        </Suspense>
      </ErrorBoundary>

      <Header currentView={currentView} onViewChange={setCurrentView} />

      {/* 🎮 Widget de Jogadores Online - SEMPRE VISÍVEL */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <OnlineUsersWidget />
        </Suspense>
      </ErrorBoundary>

      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Hero Section - Mostra apenas na view principal de jogos */}
        {currentView === 'games' && !streamingData && (
          <ModernHeroSection />
        )}

        {currentView === 'games' && !streamingData && (
          <LocalGameLibrary onStartStream={handleStartStream} />
        )}

        {currentView === 'streams' && (
          <ErrorBoundary>
            <Suspense fallback={<div className="flex justify-center p-12"><OptimizedLoader size="lg" /></div>}>
              <LiveStreamGrid />
            </Suspense>
          </ErrorBoundary>
        )}

        {currentView === 'multiplayer' && (
          <ErrorBoundary>
            <Suspense fallback={<div className="flex justify-center p-12"><OptimizedLoader size="lg" /></div>}>
              <MultiplayerLobby 
                onClose={handleCloseMultiplayerLobby}
                onJoinSession={handleJoinMultiplayerSession}
                onCreateSession={handleCreateMultiplayerSession}
                embedded={true}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {currentView === 'tournaments' && (
          <ErrorBoundary>
            <Suspense fallback={<div className="flex justify-center p-12"><OptimizedLoader size="lg" /></div>}>
              <Tournaments />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {streamingData && (
        <ErrorBoundary>
          <Suspense fallback={<OptimizedLoader fullScreen size="md" />}>
            <StreamerView
              gameId={streamingData.gameId}
              romPath={streamingData.romPath}
              gameTitle={streamingData.gameTitle}
              gameCover={streamingData.gameCover}
              streamConfig={streamingData}
              onEndStream={() => setStreamingData(null)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {streamSetupData && (
        <ErrorBoundary>
          <Suspense fallback={<OptimizedLoader fullScreen size="md" />}>
            <StreamSetupModal
              gameTitle={streamSetupData.game.title}
              onStartStream={handleConfirmStreamSetup}
              onCancel={() => setStreamSetupData(null)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {showMultiplayerLobby && (
        <ErrorBoundary>
          <Suspense fallback={<OptimizedLoader fullScreen size="md" />}>
            <MultiplayerLobby 
              onClose={handleCloseMultiplayerLobby}
              onJoinSession={handleJoinMultiplayerSession}
              onCreateSession={handleCreateMultiplayerSession}
              embedded={false}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {showMultiplayerPlayer && joinSessionId && (
        <>
          {console.log('🔵 [APP] Renderizando MultiplayerPlayer com sessionId:', joinSessionId)}
          {console.log('🔵 [APP] showMultiplayerPlayer:', showMultiplayerPlayer)}
          {console.log('🔵 [APP] joinSessionId:', joinSessionId)}
          <ErrorBoundary>
            <Suspense fallback={<OptimizedLoader fullScreen size="md" />}>
              <MultiplayerPlayerComponent
                sessionId={joinSessionId}
                onClose={() => {
                  console.log('🔵 [APP] Player fechado, limpando estado');
                  setShowMultiplayerPlayer(false);
                  setJoinSessionId(null);
                  // Limpa URL
                  window.history.pushState({}, '', '/');
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {multiplayerSession && (
        <>
          {console.log('🟢🟢🟢 [APP] RENDERIZANDO MULTIPLAYER HOST VIEW 🟢🟢🟢')}
          {console.log('[APP] multiplayerSession:', multiplayerSession)}
          <ErrorBoundary>
            <Suspense fallback={
              <>
                {console.log('[APP] ⏳ Carregando MultiplayerHostView...')}
                <OptimizedLoader fullScreen size="md" />
              </>
            }>
              <MultiplayerHostView
                sessionId={multiplayerSession.sessionId}
                gameId={multiplayerSession.gameId}
                romPath={multiplayerSession.romPath}
                gameTitle={multiplayerSession.gameTitle}
                platform={multiplayerSession.platform}
                onClose={() => {
                  console.log('[APP] 🚪 Fechando MultiplayerHostView');
                  setMultiplayerSession(null);
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      <MaintenanceNotificationDisplay />
      <DevTools />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TranslationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}

export default App;
