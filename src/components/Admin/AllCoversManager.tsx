// 🗂️ ALL COVERS - Gerenciamento de Todos os Covers do Storage
import React, { useState } from 'react';
import { Image, Trash2, Search, AlertTriangle } from 'lucide-react';

interface AllCoversManagerProps {
  availableCovers: { name: string; url: string; fullPath: string }[];
  onDeleteCover: (fullPath: string) => Promise<boolean>;
  onReloadCovers: () => Promise<void>;
}

const AllCoversManager: React.FC<AllCoversManagerProps> = ({
  availableCovers,
  onDeleteCover,
  onReloadCovers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Filtra covers por busca
  const filteredCovers = searchTerm
    ? availableCovers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableCovers;

  const handleDeleteCover = async (fullPath: string, name: string) => {
    if (!confirm(`🗑️ Tem certeza que quer DELETAR o cover "${name}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
      return;
    }

    setDeleting(fullPath);
    setFeedback({ type: null, message: '' });

    try {
      const success = await onDeleteCover(fullPath);

      if (success) {
        setFeedback({
          type: 'success',
          message: `Cover "${name}" deletado com sucesso!`
        });

        // Recarrega lista
        await onReloadCovers();

        // Limpa feedback após 3 segundos
        setTimeout(() => {
          setFeedback({ type: null, message: '' });
        }, 3000);
      } else {
        setFeedback({
          type: 'error',
          message: `Erro ao deletar "${name}"`
        });

        setTimeout(() => {
          setFeedback({ type: null, message: '' });
        }, 3000);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: `Erro ao deletar "${name}"`
      });

      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Visual */}
      {feedback.type && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}
        >
          <div className="text-3xl">
            {feedback.type === 'success' ? '✅' : '❌'}
          </div>
          <div className="text-white font-bold">
            {feedback.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <Image className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Todos os Covers</h3>
        <p className="text-gray-400 text-sm">
          Visualize e gerencie todos os covers do Firebase Storage
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-cyan-700/50">
          <div className="text-2xl font-bold text-cyan-400">{availableCovers.length}</div>
          <div className="text-xs text-gray-400">Total de Covers</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-purple-700/50">
          <div className="text-2xl font-bold text-purple-400">{filteredCovers.length}</div>
          <div className="text-xs text-gray-400">Exibindo</div>
        </div>
      </div>

      {/* Busca */}
      {availableCovers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar cover por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      )}

      {/* Aviso */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-bold text-yellow-400 mb-1">⚠️ Atenção!</p>
            <p>Deletar um cover do Storage é <span className="text-red-400 font-bold">PERMANENTE</span> e NÃO pode ser desfeito!</p>
            <p className="mt-1">Se um jogo está usando este cover, ele ficará sem capa.</p>
          </div>
        </div>
      </div>

      {/* Lista de Covers */}
      {availableCovers.length === 0 ? (
        <div className="p-12 bg-gray-800/50 rounded-lg text-center">
          <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhum cover no Storage</p>
          <p className="text-gray-500 text-sm">Faça upload de covers na aba "Jogos"</p>
        </div>
      ) : filteredCovers.length === 0 ? (
        <div className="p-12 bg-gray-800/50 rounded-lg text-center">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum cover encontrado com "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCovers.map((cover) => (
            <div
              key={cover.fullPath}
              className="group relative bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-cyan-500 transition-all"
            >
              {/* Preview do Cover */}
              <div className="aspect-[3/4] bg-gray-900 relative">
                <img
                  src={cover.url}
                  alt={cover.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay ao hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDeleteCover(cover.fullPath, cover.name)}
                    disabled={deleting === cover.fullPath}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting === cover.fullPath ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Deletar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Nome do arquivo */}
              <div className="p-2 bg-gray-900">
                <p className="text-xs text-gray-400 truncate" title={cover.name}>
                  {cover.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCoversManager;
