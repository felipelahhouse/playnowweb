// 🎮 SYNC GAMES PANEL - Sincronizar jogos do Firebase Storage
import React, { useState } from 'react';
import { RefreshCw, Database, CheckCircle, XCircle, Upload, FolderOpen } from 'lucide-react';
import { syncGamesToFirestore, listGamesFromStorage } from '../../lib/gameStorage';

const SyncGamesPanel: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [storageGames, setStorageGames] = useState<number>(0);
  const [checking, setChecking] = useState(false);

  const handleCheckStorage = async () => {
    setChecking(true);
    try {
      const games = await listGamesFromStorage();
      setStorageGames(games.length);
      console.log(`[SYNC PANEL] 📦 ${games.length} jogos encontrados no Storage`);
    } catch (error) {
      console.error('[SYNC PANEL] Erro ao verificar Storage:', error);
    }
    setChecking(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    
    try {
      console.log('[SYNC PANEL] 🔄 Iniciando sincronização...');
      const syncResult = await syncGamesToFirestore();
      setResult(syncResult);
      console.log('[SYNC PANEL] ✅ Sincronização concluída:', syncResult);
    } catch (error) {
      console.error('[SYNC PANEL] ❌ Erro na sincronização:', error);
      setResult({ success: 0, errors: 1 });
    }
    
    setSyncing(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 bg-gray-900/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-cyan-400" />
        <h3 className="text-lg font-bold text-white">Game Sync Panel</h3>
      </div>

      <div className="space-y-4">
        {/* Check Storage Button */}
        <button
          onClick={handleCheckStorage}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl transition-all font-medium"
        >
          <FolderOpen className={`w-5 h-5 ${checking ? 'animate-pulse' : ''}`} />
          {checking ? 'Checking...' : 'Check Firebase Storage'}
        </button>

        {storageGames > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <p className="text-blue-400 font-bold text-2xl">{storageGames}</p>
            <p className="text-gray-400 text-sm">games found in Storage</p>
          </div>
        )}

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Sync Storage → Firestore
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Success</span>
              </div>
              <span className="text-white font-bold">{result.success}</span>
            </div>

            {result.errors > 0 && (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Errors</span>
                </div>
                <span className="text-white font-bold">{result.errors}</span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
          <p className="font-bold text-white mb-1">📁 Storage Structure:</p>
          <p>• ROMs: <code className="text-cyan-400">roms/snes/game.smc</code></p>
          <p>• Covers: <code className="text-cyan-400">covers/game-cover.jpg</code></p>
        </div>
      </div>
    </div>
  );
};

export default SyncGamesPanel;
