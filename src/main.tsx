import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initVersionCheck } from './lib/version';
import { initializeGames } from './lib/gameStorage';

// 🎮 Páginas do Multiplayer
import LobbyPage from './pages/LobbyPage';
import HostPage from './pages/HostPage';
import PlayerPage from './pages/PlayerPage';

// 🎮 Sincronização automática de jogos do Firebase Storage
initializeGames().catch(console.error);

// Verificar se é rota de multiplayer
const isMultiplayerRoute = 
  window.location.pathname.startsWith('/lobby') ||
  window.location.pathname.startsWith('/host') ||
  window.location.pathname.startsWith('/play/');

createRoot(document.getElementById('root')!).render(
  isMultiplayerRoute ? (
    // 🎮 Rotas do Multiplayer (SEM StrictMode - evita renderização dupla)
    <BrowserRouter>
      <Routes>
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/play/:sessionId" element={<PlayerPage />} />
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  ) : (
    // 🏠 App principal (com StrictMode para debug)
    <StrictMode>
      <App />
    </StrictMode>
  )
);

// 🔄 Inicializa verificação de versão (SEM auto-refresh)
initVersionCheck();

// Service Worker DESABILITADO - Limpeza completa e silenciosa
if ('serviceWorker' in navigator) {
  // Previne registro de novos service workers ANTES de qualquer outra coisa
  const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
  navigator.serviceWorker.register = () => {
    console.log('[SW] 🚫 Tentativa de registro bloqueada');
    return Promise.reject(new Error('Service Worker desabilitado'));
  };

  // Remove todos os service workers registrados (silenciosamente)
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      if (registrations.length > 0) {
        console.log(`[SW] Removendo ${registrations.length} service workers...`);
        const promises = registrations.map((registration) => {
          return registration.unregister()
            .then(() => console.log('[SW] ✅ Service Worker removido'))
            .catch(() => {}); // Ignora erros silenciosamente
        });
        return Promise.all(promises);
      }
    })
    .catch(() => {}); // Ignora erros silenciosamente
  
  // Limpa todos os caches (silenciosamente)
  if ('caches' in window) {
    caches.keys()
      .then((names) => {
        if (names.length > 0) {
          console.log(`[CACHE] Removendo ${names.length} caches...`);
          const promises = names.map((name) => {
            return caches.delete(name)
              .then(() => console.log(`[CACHE] ✅ ${name} removido`))
              .catch(() => {}); // Ignora erros silenciosamente
          });
          return Promise.all(promises);
        }
      })
      .catch(() => {}); // Ignora erros silenciosamente
  }

  // Suprime erros de ServiceWorker no console
  const originalError = console.error;
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    // Ignora erros relacionados a ServiceWorker
    if (
      message.includes('ServiceWorker') ||
      message.includes('service worker') ||
      message.includes('service-worker') ||
      message.includes('sw.js') ||
      message.includes('InvalidStateError')
    ) {
      return; // Não exibe o erro
    }
    originalError.apply(console, args);
  };
}
