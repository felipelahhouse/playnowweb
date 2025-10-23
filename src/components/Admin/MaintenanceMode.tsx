// 🚧 MAINTENANCE MODE COMPONENT
// Sistema de modo manutenção para o website
import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Power, Clock, AlertTriangle, X } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const DEFAULT_MESSAGE = 'Estamos realizando melhorias no sistema. Voltaremos em breve!';
const DEFAULT_ESTIMATED = '30 minutos';

interface MaintenanceModeProps {
  onClose?: () => void;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ onClose }) => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [estimatedTime, setEstimatedTime] = useState(DEFAULT_ESTIMATED);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMaintenanceStatus = useCallback(async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'system', 'maintenance');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEnabled(data.enabled || false);
        setMessage(data.message || DEFAULT_MESSAGE);
        setEstimatedTime(data.estimatedTime || DEFAULT_ESTIMATED);
      }
      setLoading(false);
    } catch (error) {
      console.error('[MAINTENANCE] Erro ao carregar status:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenanceStatus();
  }, [loadMaintenanceStatus]);

  const toggleMaintenance = async () => {
    if (enabled) {
      if (!confirm('⚠️ Desativar modo manutenção?\n\nO site voltará a funcionar normalmente para todos os usuários.')) {
        return;
      }
    } else {
      if (!confirm('🚧 Ativar modo manutenção?\n\nTodos os usuários (exceto admins) verão a tela de manutenção.')) {
        return;
      }
    }

    try {
      setSaving(true);
      const newStatus = !enabled;
      
      const docRef = doc(db, 'system', 'maintenance');
      await setDoc(docRef, {
        enabled: newStatus,
        message: message,
        estimatedTime: estimatedTime,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }, { merge: true });

      setEnabled(newStatus);
      setSaving(false);
      alert(newStatus ? '✅ Modo manutenção ATIVADO!' : '✅ Modo manutenção DESATIVADO!');
    } catch (error) {
      console.error('[MAINTENANCE] Erro ao salvar:', error);
      alert(`❌ Erro ao salvar configurações: ${error}`);
      setSaving(false);
    }
  };

  const updateSettings = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'system', 'maintenance');
      await setDoc(docRef, {
        enabled: enabled,
        message: message,
        estimatedTime: estimatedTime,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }, { merge: true });

      setSaving(false);
      alert('✅ Configurações atualizadas!');
    } catch (error) {
      console.error('[MAINTENANCE] Erro ao atualizar:', error);
      alert('❌ Erro ao atualizar configurações');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white"
          aria-label="Fechar modo manutenção"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {/* Status Card */}
      <div className={`p-6 border-2 rounded-2xl ${
        enabled 
          ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50'
          : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              enabled ? 'bg-orange-500' : 'bg-green-500'
            }`}>
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Modo Manutenção</h3>
              <p className="text-sm text-gray-300">
                Status: <span className={`font-bold ${enabled ? 'text-orange-400' : 'text-green-400'}`}>
                  {enabled ? '🚧 ATIVADO' : '✅ DESATIVADO'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={toggleMaintenance}
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
              enabled
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Power className="w-5 h-5" />
              {saving ? 'Salvando...' : enabled ? 'DESATIVAR' : 'ATIVAR'}
            </div>
          </button>
        </div>

        {enabled && (
          <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-100">
                <p className="font-bold mb-1">⚠️ Modo Manutenção Ativo!</p>
                <p>Todos os usuários (exceto admins) estão vendo a tela de manutenção.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
        <h4 className="text-lg font-bold text-white mb-4">⚙️ Configurações da Manutenção</h4>
        
        <div className="space-y-4">
          {/* Mensagem */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Mensagem para usuários
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:border-cyan-500 focus:outline-none"
              placeholder="Digite a mensagem que será exibida..."
            />
          </div>

          {/* Tempo Estimado */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tempo estimado
            </label>
            <input
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:border-cyan-500 focus:outline-none"
              placeholder="Ex: 30 minutos, 2 horas, etc"
            />
          </div>

          <button
            onClick={updateSettings}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
        <h4 className="text-lg font-bold text-white mb-4">👁️ Preview - Como usuários verão</h4>
        
        <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-xl overflow-hidden border-2 border-gray-700">
          {/* Preview do modal de manutenção */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div className="mb-6 relative">
                <Wrench className="w-20 h-20 text-orange-400 mx-auto animate-bounce" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-orange-500/20 rounded-full animate-ping" />
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4">
                🚧 Site em Manutenção
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                {message}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Tempo estimado: {estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
