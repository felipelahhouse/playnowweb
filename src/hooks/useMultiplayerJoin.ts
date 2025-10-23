/**
 * Hook para detectar e processar URLs de join multiplayer
 * Formato: /multiplayer/join/{sessionId} ou ?join={sessionId}
 */

import { useEffect, useState } from 'react';

export interface JoinInfo {
  sessionId: string;
  isJoinUrl: boolean;
}

export const useMultiplayerJoin = (): JoinInfo | null => {
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);

  useEffect(() => {
    console.log('🔎 [useMultiplayerJoin] Analisando URL...');
    
    // Verifica URL atual
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    console.log('🔎 [useMultiplayerJoin] Path:', path);
    console.log('🔎 [useMultiplayerJoin] Search params:', window.location.search);

    // Formato 1: /multiplayer/join/{sessionId}
    const joinMatch = path.match(/\/multiplayer\/join\/([a-zA-Z0-9_-]+)/);
    if (joinMatch) {
      console.log('✅ [useMultiplayerJoin] Match encontrado! Session ID:', joinMatch[1]);
      setJoinInfo({
        sessionId: joinMatch[1],
        isJoinUrl: true
      });
      return;
    }

    // Formato 2: ?join={sessionId}
    const joinParam = params.get('join');
    if (joinParam) {
      console.log('✅ [useMultiplayerJoin] Query param encontrado! Session ID:', joinParam);
      setJoinInfo({
        sessionId: joinParam,
        isJoinUrl: true
      });
      return;
    }

    console.log('ℹ️ [useMultiplayerJoin] Nenhum sessionId encontrado na URL');
    setJoinInfo(null);
  }, []);

  return joinInfo;
};