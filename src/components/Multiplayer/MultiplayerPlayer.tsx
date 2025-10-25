/**
 * 🎮 Multiplayer PLAYER Component - PeerJS WebRTC
 * Componente para assistir e controlar sessão multiplayer
 */

import React, { useEffect, useRef, useState } from 'react';
import { usePeerJSPlayer } from '../../hooks/usePeerJSPlayer';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Wifi, X, Gamepad2, AlertCircle } from 'lucide-react';

interface MultiplayerPlayerProps {
  sessionId: string;
  userId: string;
  onClose?: () => void;
}

export const MultiplayerPlayer: React.FC<MultiplayerPlayerProps> = ({
  sessionId,
  userId,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hostPeerId, setHostPeerId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState<string>('');
  const [sessionNotFound, setSessionNotFound] = useState(false);

  // 📡 Buscar HOST PeerID do Firestore
  useEffect(() => {
    console.log('[PLAYER] 📡 Buscando sessão:', sessionId);
    
    const sessionRef = doc(db, 'multiplayer_sessions', sessionId);
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('[PLAYER] 📦 Dados da sessão:', data);
          
          setHostPeerId(data.hostPeerId || null);
          setGameTitle(data.gameTitle || 'Jogo');
          setSessionNotFound(false);
          
          if (data.hostPeerId) {
            console.log('[PLAYER] ✅ HOST PeerID:', data.hostPeerId);
          }
        } else {
          console.error('[PLAYER] ❌ Sessão não encontrada');
          setSessionNotFound(true);
        }
      },
      (error) => {
        console.error('[PLAYER] ❌ Erro Firestore:', error);
        setSessionNotFound(true);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  // 🎮 PeerJS Hook - PLAYER
  const { 
    peerId,
    isConnected, 
    stream,
    connectionError,
    sendInput
  } = usePeerJSPlayer({
    sessionId,
    hostPeerId: hostPeerId || '',
    userId,
    onStreamReceived: (remoteStream) => {
      console.log('📹 [PLAYER] Stream recebido');
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.play().catch(error => {
          console.error('[PLAYER] ❌ Erro ao reproduzir:', error);
        });
      }
    },
    onDisconnected: () => {
      console.log('❌ [PLAYER] Desconectado');
    }
  });

  // 🎮 Capturar inputs do teclado
  useEffect(() => {
    if (!isConnected || !stream) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      sendInput({
        type: 'keydown',
        code: e.code,
        key: e.key,
        timestamp: Date.now()
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      sendInput({
        type: 'keyup',
        code: e.code,
        key: e.key,
        timestamp: Date.now()
      });
    };

    console.log('🎮 [PLAYER] Ativando captura de inputs');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      console.log('🎮 [PLAYER] Desativando captura de inputs');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, stream, sendInput]);

  // 📹 Atualizar video quando stream mudar
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => {
        console.error('[PLAYER] ❌ Erro ao reproduzir:', error);
      });
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <div>
            <h1 className="text-white font-semibold">{gameTitle}</h1>
            <p className="text-sm text-gray-400">Sessão Multiplayer</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {/* Sessão não encontrada */}
        {sessionNotFound && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
            <div className="text-center max-w-md p-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">
                Sessão não encontrada
              </h2>
              <p className="text-gray-400 mb-4">
                Verifique se o código da sessão está correto
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Aguardando HOST */}
        {!hostPeerId && !sessionNotFound && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-white">Aguardando HOST iniciar...</p>
              <p className="text-gray-400 text-sm mt-2">Conectando ao PeerJS...</p>
            </div>
          </div>
        )}

        {/* Conectando ao HOST */}
        {hostPeerId && !isConnected && !connectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-white">Conectando ao HOST...</p>
              <p className="text-gray-400 text-sm mt-2 font-mono">{hostPeerId}</p>
            </div>
          </div>
        )}

        {/* Erro de conexão */}
        {connectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center max-w-md p-6">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h2 className="text-white text-lg mb-2">Erro de conexão</h2>
              <p className="text-gray-400 text-sm mb-4">{connectionError}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Aguardando stream */}
        {isConnected && !stream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-white">✅ Conectado ao HOST</p>
              <p className="text-gray-400 text-sm mt-2">Aguardando stream...</p>
            </div>
          </div>
        )}

        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Status Indicator */}
        {isConnected && stream && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">🟢 Ao vivo</span>
          </div>
        )}

        {/* Controls Hint */}
        {isConnected && stream && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3">
            <p className="text-white text-sm text-center">
              <Gamepad2 className="w-4 h-4 inline mr-2" />
              Use as <strong>setas do teclado</strong> para controlar
            </p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-400 font-mono">
          <div className="flex gap-4">
            <span>Player ID: {peerId || 'N/A'}</span>
            <span>Host ID: {hostPeerId || 'N/A'}</span>
            <span>Connected: {isConnected ? '✅' : '❌'}</span>
            <span>Stream: {stream ? '✅' : '❌'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerPlayer;
