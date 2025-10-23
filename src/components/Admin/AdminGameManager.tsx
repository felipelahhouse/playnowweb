// 🔧 ADMIN - Painel de Gerenciamento de Jogos
// Visualiza e sincroniza jogos do Firebase Storage

import React, { useState } from 'react';
import { RefreshCw, Database, HardDrive, Image, CheckCircle, XCircle } from 'lucide-react';
import { listGamesFromStorage, syncGamesToFirestore, getGamesFromFirestore } from '../../lib/gameStorage';
import type { StorageGame } from '../../lib/gameStorage';
import type { Game } from '../../types';

const AdminGameManager: React.FC = () => {
  const [storageGames, setStorageGames] = useState<StorageGame[]>([]);
  const [firestoreGames, setFirestoreGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'storage' | 'firestore'>('storage');

  const loadStorageGames = async () => {
    try {
      setLoading(true);
      const games = await listGamesFromStorage();
      setStorageGames(games);
      console.log(`[ADMIN] ${games.length} jogos encontrados no Storage`);
    } catch (error) {
      console.error('[ADMIN] Erro ao listar Storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFirestoreGames = async () => {
    try {
      setLoading(true);
      const games = await getGamesFromFirestore();
      setFirestoreGames(games);
      console.log(`[ADMIN] ${games.length} jogos no Firestore`);
    } catch (error) {
      console.error('[ADMIN] Erro ao listar Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await syncGamesToFirestore();
      alert(`✅ Sincronização concluída!\n\nSucesso: ${result.success}\nErros: ${result.errors}`);
      
      // Recarrega listas
      await loadStorageGames();
      await loadFirestoreGames();
    } catch (error) {
      console.error('[ADMIN] Erro ao sincronizar:', error);
      alert('❌ Erro ao sincronizar jogos');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            🔧 Painel Admin - Gerenciamento de Jogos
          </h1>
          <p className="text-gray-400">Firebase Storage & Firestore</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={syncing ? 'animate-spin' : ''} size={20} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Storage → Firestore'}
          </button>

          <button
            onClick={() => {
              loadStorageGames();
              loadFirestoreGames();
            }}
            disabled={loading}
            className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl font-bold hover:border-cyan-500 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Database size={20} />
            Atualizar Listas
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('storage');
              if (storageGames.length === 0) loadStorageGames();
            }}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <HardDrive size={20} />
            Firebase Storage ({storageGames.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('firestore');
              if (firestoreGames.length === 0) loadFirestoreGames();
            }}
            className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'firestore'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Database size={20} />
            Firestore ({firestoreGames.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-900/50 border-b border-gray-700">
                  <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                    <HardDrive size={20} />
                    Jogos no Firebase Storage
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Arquivos encontrados na pasta /roms/*
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Plataforma</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Tamanho</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Modificado</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageGames.map((game, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-700 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">{game.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm font-bold">
                              {game.platform.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {(game.size / 1024).toFixed(0)} KB
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {game.lastModified.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={game.romUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                            >
                              Ver arquivo
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {storageGames.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      Nenhum jogo encontrado no Storage. Faça upload de ROMs na pasta /roms/
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Firestore Tab */}
            {activeTab === 'firestore' && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-900/50 border-b border-gray-700">
                  <h3 className="font-bold text-purple-400 flex items-center gap-2">
                    <Database size={20} />
                    Jogos no Firestore
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Documentos na coleção 'games'
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Título</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Plataforma</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Plays</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">Cover</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">ROM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firestoreGames.map((game) => (
                        <tr
                          key={game.id}
                          className="border-t border-gray-700 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{game.title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm font-bold">
                              {game.platform.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{game.playCount || 0}</td>
                          <td className="px-4 py-3">
                            {game.coverUrl ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <XCircle size={16} className="text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {game.romUrl ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <XCircle size={16} className="text-red-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {firestoreGames.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      Nenhum jogo no Firestore. Execute a sincronização para importar do Storage.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="text-cyan-400" size={24} />
              <h4 className="font-bold text-cyan-400">Storage</h4>
            </div>
            <p className="text-3xl font-black text-white mb-1">{storageGames.length}</p>
            <p className="text-sm text-gray-400">Arquivos ROM</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="text-purple-400" size={24} />
              <h4 className="font-bold text-purple-400">Firestore</h4>
            </div>
            <p className="text-3xl font-black text-white mb-1">{firestoreGames.length}</p>
            <p className="text-sm text-gray-400">Jogos cadastrados</p>
          </div>

          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Image className="text-pink-400" size={24} />
              <h4 className="font-bold text-pink-400">Covers</h4>
            </div>
            <p className="text-3xl font-black text-white mb-1">
              {firestoreGames.filter(g => g.coverUrl).length}
            </p>
            <p className="text-sm text-gray-400">Com capa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGameManager;
