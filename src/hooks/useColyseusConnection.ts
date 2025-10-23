import { useEffect, useState, useCallback, useRef } from 'react';
import colyseusService from '../services/colyseusService';

export interface UseColyseusConnectionOptions {
  autoConnect?: boolean;
  onRoomCreated?: (room: any) => void;
  onRoomJoined?: (room: any) => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export const useColyseusConnection = (options: UseColyseusConnectionOptions = {}) => {
  const {
    autoConnect = false,
    onRoomCreated,
    onRoomJoined,
    onDisconnected,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const eventListenersRef = useRef<{ [key: string]: Function[] }>({});

  // Setupar listeners do serviço
  useEffect(() => {
    const handleStateChange = (state: any) => {
      console.log('🔄 [Hook] Estado atualizado:', state);
      setCurrentRoom(state);
    };

    const handlePlayerJoined = (data: any) => {
      console.log('👤 [Hook] Jogador entrou:', data);
      setPlayers((prev) => [...prev, data]);
    };

    const handlePlayerLeft = (data: any) => {
      console.log('👤 [Hook] Jogador saiu:', data);
      setPlayers((prev) => prev.filter((p) => p.playerId !== data.playerId));
    };

    const handleDisconnected = (code: any) => {
      console.log('❌ [Hook] Desconectado, código:', code);
      setIsConnected(false);
      setCurrentRoom(null);
      if (onDisconnected) onDisconnected();
    };

    const handleError = (errorData: any) => {
      console.error('⚠️ [Hook] Erro:', errorData);
      setError(errorData.message || 'Erro desconhecido');
      if (onError) onError(errorData);
    };

    colyseusService.on('state-change', handleStateChange);
    colyseusService.on('player-joined', handlePlayerJoined);
    colyseusService.on('player-left', handlePlayerLeft);
    colyseusService.on('disconnected', handleDisconnected);
    colyseusService.on('error', handleError);

    return () => {
      // Remover listeners (se o serviço suportar)
      // colyseusService.off('state-change', handleStateChange);
    };
  }, [onDisconnected, onError]);

  // Conectar automaticamente se habilitado
  useEffect(() => {
    if (autoConnect && !isConnected) {
      connect();
    }
  }, [autoConnect]);

  /**
   * Conectar ao servidor Colyseus
   */
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔗 [Hook] Conectando...');
      await colyseusService.connect();
      setIsConnected(true);
      console.log('✅ [Hook] Conectado com sucesso');
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao conectar';
      console.error('❌ [Hook] Erro:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar nova sala
   */
  const createRoom = useCallback(async (roomData: any) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏠 [Hook] Criando sala...', roomData);
      
      if (!isConnected) {
        await connect();
      }

      const room = await colyseusService.createRoom(roomData);
      setCurrentRoom(room);
      setIsHost(true);
      
      if (onRoomCreated) onRoomCreated(room);
      
      console.log('✅ [Hook] Sala criada:', room.roomId);
      return room;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao criar sala';
      console.error('❌ [Hook] Erro:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, connect, onRoomCreated]);

  /**
   * Listar salas disponíveis
   */
  const listRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 [Hook] Buscando salas...');
      
      if (!isConnected) {
        await connect();
      }

      const rooms = await colyseusService.listRooms();
      setAvailableRooms(rooms);
      console.log('✅ [Hook] Salas encontradas:', rooms.length);
      return rooms;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao listar salas';
      console.error('❌ [Hook] Erro:', errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isConnected, connect]);

  /**
   * Entrar em uma sala
   */
  const joinRoom = useCallback(async (roomId: string, playerData: any) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎮 [Hook] Entrando na sala:', roomId);
      
      if (!isConnected) {
        await connect();
      }

      const room = await colyseusService.joinRoom(roomId, playerData);
      setCurrentRoom(room);
      setIsHost(false);
      
      if (onRoomJoined) onRoomJoined(room);
      
      console.log('✅ [Hook] Entrou na sala:', roomId);
      return room;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao entrar na sala';
      console.error('❌ [Hook] Erro:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, connect, onRoomJoined]);

  /**
   * Enviar comando de input
   */
  const sendInput = useCallback((input: any) => {
    try {
      colyseusService.sendInputCommand(input);
    } catch (err: any) {
      console.error('❌ [Hook] Erro ao enviar input:', err);
    }
  }, []);

  /**
   * Enviar frame de jogo
   */
  const sendFrame = useCallback((frameData: any) => {
    try {
      colyseusService.sendGameFrame(frameData);
    } catch (err: any) {
      console.error('❌ [Hook] Erro ao enviar frame:', err);
    }
  }, []);

  /**
   * Enviar mensagem de chat
   */
  const sendMessage = useCallback((message: string) => {
    try {
      colyseusService.sendChatMessage(message);
    } catch (err: any) {
      console.error('❌ [Hook] Erro ao enviar mensagem:', err);
    }
  }, []);

  /**
   * Sair da sala
   */
  const leaveRoom = useCallback(async () => {
    try {
      console.log('👋 [Hook] Saindo da sala...');
      await colyseusService.leaveRoom();
      setCurrentRoom(null);
      setIsHost(false);
      setPlayers([]);
      console.log('✅ [Hook] Saiu da sala');
    } catch (err: any) {
      console.error('❌ [Hook] Erro ao sair:', err);
    }
  }, []);

  /**
   * Desconectar completamente
   */
  const disconnect = useCallback(() => {
    console.log('🔌 [Hook] Desconectando...');
    colyseusService.disconnect();
    setIsConnected(false);
    setCurrentRoom(null);
    setIsHost(false);
    setPlayers([]);
  }, []);

  /**
   * Registrar listener de evento customizado
   */
  const addEventListener = useCallback((event: string, callback: Function) => {
    if (!eventListenersRef.current[event]) {
      eventListenersRef.current[event] = [];
    }
    eventListenersRef.current[event].push(callback);
    colyseusService.on(event, callback);
  }, []);

  /**
   * Obter número de jogadores
   */
  const getPlayerCount = useCallback(() => {
    return colyseusService.getPlayerCount();
  }, []);

  /**
   * Obter ID da sala
   */
  const getRoomId = useCallback(() => {
    return colyseusService.getRoomId();
  }, []);

  return {
    // Estado
    isConnected,
    currentRoom,
    isHost,
    players,
    loading,
    error,
    availableRooms,

    // Métodos
    connect,
    createRoom,
    listRooms,
    joinRoom,
    leaveRoom,
    disconnect,
    sendInput,
    sendFrame,
    sendMessage,
    addEventListener,
    getPlayerCount,
    getRoomId
  };
};