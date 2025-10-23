/**
 * Custom Hook para gerenciar conexão multiplayer com retry e monitoring
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import multiplayerService from '../services/multiplayerService';
import ConnectionMonitor from '../services/ConnectionMonitor';
import Logger from '../services/Logger';
import RetryManager from '../services/RetryManager';

interface ConnectionStatus {
  isConnected: boolean;
  isServerOnline: boolean;
  lastCheckTime: number | null;
  retryCount: number;
  error: string | null;
}

export const useMultiplayerConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isServerOnline: true,
    lastCheckTime: null,
    retryCount: 0,
    error: null
  });

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  /**
   * Conectar ao servidor com retry
   */
  const connect = useCallback(async () => {
    if (status.isConnected) {
      Logger.debug('useMultiplayerConnection', 'Already connected');
      return true;
    }

    try {
      setStatus(prev => ({ ...prev, error: null, retryCount: 0 }));
      retryCountRef.current = 0;

      await RetryManager.executeWithRetry(
        async (attempt) => {
          if (!isMountedRef.current) throw new Error('Component unmounted');

          Logger.log('useMultiplayerConnection', `Connection attempt ${attempt}`);
          
          const socket = multiplayerService.connect();
          if (!socket) {
            throw new Error('Failed to initialize socket');
          }

          // Aguardar conexão estar estabelecida
          const isConnected = await multiplayerService.waitForConnection(10000);
          if (!isConnected) {
            throw new Error('Connection timeout');
          }

          return true;
        },
        {
          maxRetries: 5,
          initialDelayMs: 2000,
          maxDelayMs: 10000,
          backoffMultiplier: 1.5,
          name: 'MultiplayerConnection',
          onRetry: (attempt, maxRetries, delayMs) => {
            if (isMountedRef.current) {
              retryCountRef.current = attempt;
              setStatus(prev => ({
                ...prev,
                retryCount: attempt,
                error: `Attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(delayMs / 1000)}s...`
              }));
              Logger.warn('useMultiplayerConnection', `Retry attempt ${attempt}/${maxRetries}`, {
                delayMs
              });
            }
          }
        }
      );

      if (isMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          retryCount: 0
        }));
        Logger.log('useMultiplayerConnection', 'Connected successfully');
      }

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('useMultiplayerConnection', 'Connection failed', error as Error);

      if (isMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          error: errorMsg,
          retryCount: retryCountRef.current
        }));
      }

      return false;
    }
  }, [status.isConnected]);

  /**
   * Desconectar
   */
  const disconnect = useCallback(() => {
    Logger.log('useMultiplayerConnection', 'Disconnecting');
    multiplayerService.disconnect();
    ConnectionMonitor.stop();

    if (isMountedRef.current) {
      setStatus(prev => ({
        ...prev,
        isConnected: false
      }));
    }
  }, []);

  /**
   * Verificar saúde do servidor
   */
  const checkServerHealth = useCallback(async () => {
    try {
      const health = await multiplayerService.checkServerHealth();
      return health !== null;
    } catch (error) {
      Logger.error('useMultiplayerConnection', 'Server health check failed', error as Error);
      return false;
    }
  }, []);

  /**
   * Efeito: Monitorar status do servidor
   */
  useEffect(() => {
    const handleServerStatusChange = (isOnline: boolean) => {
      if (isMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isServerOnline: isOnline
        }));

        if (!isOnline) {
          Logger.warn('useMultiplayerConnection', 'Server appears to be offline');
        }
      }
    };

    ConnectionMonitor.onStatusChange(handleServerStatusChange);

    return () => {
      ConnectionMonitor.offStatusChange(handleServerStatusChange);
    };
  }, []);

  /**
   * Efeito: Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...status,
    connect,
    disconnect,
    checkServerHealth,
    shouldRetry: !status.isConnected && status.isServerOnline
  };
};