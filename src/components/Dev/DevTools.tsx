import React, { useState } from 'react';
import { populateAll, populateStreams, populateLobbies } from '../../utils/populateMockData';

const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePopulateAll = async () => {
    setLoading(true);
    try {
      await populateAll();
      alert('✅ Dados mockados criados com sucesso!');
    } catch (error) {
      alert('❌ Erro ao criar dados: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateStreams = async () => {
    setLoading(true);
    try {
      await populateStreams();
      alert('✅ Streams criadas com sucesso!');
    } catch (error) {
      alert('❌ Erro ao criar streams: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateLobbies = async () => {
    setLoading(true);
    try {
      await populateLobbies();
      alert('✅ Lobbies criados com sucesso!');
    } catch (error) {
      alert('❌ Erro ao criar lobbies: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full shadow-2xl shadow-yellow-500/50 flex items-center justify-center text-white font-bold text-xl hover:scale-110 transition-transform duration-300"
        title="Dev Tools"
      >
        🛠️
      </button>

      {/* Dev Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/30 shadow-2xl shadow-yellow-500/20 p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-yellow-500/30">
            <h3 className="text-white font-bold text-lg">🛠️ Dev Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePopulateAll}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Criando...' : '🎉 Criar Todos'}
            </button>

            <button
              onClick={handlePopulateStreams}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Criando...' : '🔴 Criar Streams'}
            </button>

            <button
              onClick={handlePopulateLobbies}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Criando...' : '🎮 Criar Lobbies'}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-yellow-500/30">
            <p className="text-gray-400 text-xs text-center">
              Cria dados mockados no Firestore para testar as janelas laterais
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DevTools;
