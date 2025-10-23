/**
 * 🧪 Componente de Teste Socket.io
 * Use este componente para debugar conexão com Replit
 * 
 * COMO USAR:
 * 1. Importe em um componente que você vê na tela
 * 2. Execute npm run dev
 * 3. Abra DevTools (F12)
 * 4. Clique nos botões para testar
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Send, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import multiplayerService from '../../services/multiplayerService';

export const SocketioTestComponent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const newLog = `[${timestamp}] ${prefix} ${message}`;
    setLogs((prev) => [newLog, ...prev].slice(0, 20));
    console.log(newLog);
  };

  /**
   * Conectar ao Socket.io
   */
  const handleConnect = () => {
    try {
      addLog('Conectando ao Socket.io...', 'info');
      
      if (multiplayerService.isSocketConnected()) {
        addLog('Já conectado!', 'success');
        return;
      }

      multiplayerService.connect();

      // Aguardar conexão
      setTimeout(() => {
        const connected = multiplayerService.isSocketConnected();
        const id = multiplayerService.getSocketId();
        
        setIsConnected(connected);
        setSocketId(id);

        if (connected) {
          addLog(`Conectado! Socket ID: ${id}`, 'success');
        } else {
          addLog('Falha ao conectar', 'error');
        }
      }, 1000);
    } catch (error) {
      addLog(`Erro: ${error}`, 'error');
    }
  };

  /**
   * Desconectar
   */
  const handleDisconnect = () => {
    try {
      addLog('Desconectando...', 'info');
      multiplayerService.disconnect();
      setIsConnected(false);
      setSocketId(null);
      addLog('Desconectado com sucesso', 'success');
    } catch (error) {
      addLog(`Erro ao desconectar: ${error}`, 'error');
    }
  };

  /**
   * Solicitar lista de salas
   */
  const handleGetSessions = () => {
    try {
      addLog('Solicitando lista de salas...', 'info');

      // Escutar resposta
      multiplayerService.once('lobby-sessions', (data) => {
        setSessions(data.sessions || []);
        addLog(`Recebidas ${data.sessions?.length || 0} salas`, 'success');
      });

      // Solicitar
      multiplayerService.emit('get-lobby-sessions');

      // Timeout se não receber resposta
      setTimeout(() => {
        if (sessions.length === 0) {
          addLog('Timeout ao aguardar salas', 'error');
        }
      }, 5000);
    } catch (error) {
      addLog(`Erro: ${error}`, 'error');
    }
  };

  /**
   * Criar sala de teste
   */
  const handleCreateTestSession = () => {
    try {
      addLog('Criando sala de teste...', 'info');

      multiplayerService.emit('create-session', {
        sessionName: `Test Room ${Date.now()}`,
        gameTitle: 'Test Game',
        gamePlatform: 'snes',
        maxPlayers: 4,
        isPublic: true,
        hostUserId: 'test-user',
        hostName: 'Test Host'
      });

      addLog('Evento create-session enviado', 'success');
    } catch (error) {
      addLog(`Erro: ${error}`, 'error');
    }
  };

  /**
   * Verificar saúde do servidor
   */
  const handleCheckHealth = async () => {
    try {
      addLog('Verificando saúde do servidor...', 'info');
      const health = await multiplayerService.checkServerHealth();
      
      if (health) {
        addLog(`Servidor respondeu: ${JSON.stringify(health)}`, 'success');
      } else {
        addLog('Servidor não respondeu', 'error');
      }
    } catch (error) {
      addLog(`Erro: ${error}`, 'error');
    }
  };

  /**
   * Limpar logs
   */
  const handleClearLogs = () => {
    setLogs([]);
    addLog('Logs limpos', 'info');
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 z-40">
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
        title="Socket.io Test Component"
      >
        {isConnected ? (
          <Wifi className="w-8 h-8" />
        ) : (
          <WifiOff className="w-8 h-8" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-gray-900 border border-cyan-500/50 rounded-lg shadow-xl p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">🧪 Socket.io Test</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Status */}
          <div className="bg-gray-800 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            {socketId && (
              <div className="text-xs text-gray-400 break-all">
                ID: {socketId}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleConnect}
              disabled={isConnected}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Conectar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={!isConnected}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Desconectar
            </button>
            <button
              onClick={handleGetSessions}
              disabled={!isConnected}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Listar Salas
            </button>
            <button
              onClick={handleCreateTestSession}
              disabled={!isConnected}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Criar Sala
            </button>
            <button
              onClick={handleCheckHealth}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded transition"
            >
              Health Check
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
            >
              Limpar Logs
            </button>
          </div>

          {/* Sessions List */}
          {sessions.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">Salas ({sessions.length}):</p>
              <div className="space-y-1">
                {sessions.map((session: any, idx: number) => (
                  <div key={idx} className="text-xs text-gray-300 truncate">
                    • {session.sessionName || 'Sem nome'} ({session.currentPlayers || 0}/{session.maxPlayers || 4})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-black p-3 rounded-lg max-h-40 overflow-y-auto border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Logs:</p>
            <div className="space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">Nenhum log...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-gray-300 break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-500/20 text-xs text-blue-300">
            💡 Clique em "Conectar" primeiro, depois teste outros botões
          </div>
        </div>
      )}
    </div>
  );
};

export default SocketioTestComponent;