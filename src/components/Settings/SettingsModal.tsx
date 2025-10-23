import React, { useState, useEffect } from 'react';
import { X, Settings, Video, Gamepad2, Bell, Shield, Palette, Monitor, Volume2, Wifi, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppSettings {
  // Stream Settings
  defaultStreamFPS: number;
  defaultStreamQuality: 'high' | 'medium' | 'low';
  autoEnableCamera: boolean;
  autoEnableMic: boolean;
  defaultCameraId?: string;
  defaultMicId?: string;
  
  // Game Settings
  defaultVolume: number;
  enableGameSound: boolean;
  showFPS: boolean;
  enableSaveStates: boolean;
  
  // Notification Settings
  notifyOnFollow: boolean;
  notifyOnStreamStart: boolean;
  notifyOnMessage: boolean;
  soundNotifications: boolean;
  
  // Privacy Settings
  showOnlineStatus: boolean;
  allowSpectators: boolean;
  allowFriendRequests: boolean;
  
  // Appearance
  theme: 'dark' | 'cyberpunk' | 'retro';
  reducedMotion: boolean;
  compactMode: boolean;
}

const defaultSettings: AppSettings = {
  defaultStreamFPS: 10,
  defaultStreamQuality: 'medium',
  autoEnableCamera: false,
  autoEnableMic: false,
  defaultVolume: 70,
  enableGameSound: true,
  showFPS: false,
  enableSaveStates: true,
  notifyOnFollow: true,
  notifyOnStreamStart: true,
  notifyOnMessage: true,
  soundNotifications: true,
  showOnlineStatus: true,
  allowSpectators: true,
  allowFriendRequests: true,
  theme: 'cyberpunk',
  reducedMotion: false,
  compactMode: false
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'stream' | 'game' | 'notifications' | 'privacy' | 'appearance'>('stream');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      setMicrophones(devices.filter(d => d.kind === 'audioinput'));
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setHasChanges(false);
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-24 right-4 z-[100] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-bold';
    successMsg.textContent = '✓ Configurações salvas!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 2000);
  };

  const resetSettings = () => {
    if (confirm('Resetar todas as configurações para o padrão?')) {
      setSettings(defaultSettings);
      localStorage.removeItem('app_settings');
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'stream' as const, icon: Video, label: 'Stream' },
    { id: 'game' as const, icon: Gamepad2, label: 'Jogo' },
    { id: 'notifications' as const, icon: Bell, label: 'Notificações' },
    { id: 'privacy' as const, icon: Shield, label: 'Privacidade' },
    { id: 'appearance' as const, icon: Palette, label: 'Aparência' }
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-5xl w-full bg-gray-900 rounded-2xl sm:rounded-3xl border-2 border-cyan-500/30 overflow-hidden max-h-[90vh] flex flex-col my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-b border-cyan-500/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Configurações</h2>
                <p className="text-gray-400 text-xs sm:text-base hidden sm:block">Personalize sua experiência</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-lg transition-all touch-manipulation active:scale-95"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-64 bg-gray-800/50 border-b sm:border-b-0 sm:border-r border-gray-700 p-2 sm:p-4 overflow-x-auto sm:overflow-y-auto">
            <div className="flex sm:flex-col gap-2 min-w-max sm:min-w-0">
              {tabs.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap touch-manipulation active:scale-95 ${
                    activeTab === id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-bold text-xs sm:text-base">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* STREAM SETTINGS */}
            {activeTab === 'stream' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    Configurações de Stream
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {/* FPS Padrão */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        FPS Padrão da Stream
                      </label>
                      <select
                        value={settings.defaultStreamFPS}
                        onChange={(e) => updateSetting('defaultStreamFPS', Number(e.target.value))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base touch-manipulation"
                      >
                        <option value={5}>5 FPS (Econômico)</option>
                        <option value={10}>10 FPS (Recomendado)</option>
                        <option value={15}>15 FPS (Bom)</option>
                        <option value={20}>20 FPS (Máximo)</option>
                      </select>
                    </div>

                    {/* Qualidade Padrão */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Qualidade Padrão
                      </label>
                      <select
                        value={settings.defaultStreamQuality}
                        onChange={(e) => updateSetting('defaultStreamQuality', e.target.value as any)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base touch-manipulation"
                      >
                        <option value="low">Low (50%)</option>
                        <option value="medium">Medium (75%)</option>
                        <option value="high">High (100%)</option>
                      </select>
                    </div>

                    {/* Auto-habilitar câmera */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm sm:text-base">Auto-habilitar Câmera</p>
                        <p className="text-gray-400 text-xs sm:text-sm">Liga câmera automaticamente ao iniciar stream</p>
                      </div>
                      <button
                        onClick={() => updateSetting('autoEnableCamera', !settings.autoEnableCamera)}
                        className={`relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors touch-manipulation active:scale-95 ${
                          settings.autoEnableCamera ? 'bg-cyan-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoEnableCamera ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Auto-habilitar microfone */}
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm sm:text-base">Auto-habilitar Microfone</p>
                        <p className="text-gray-400 text-xs sm:text-sm">Liga microfone automaticamente ao iniciar stream</p>
                      </div>
                      <button
                        onClick={() => updateSetting('autoEnableMic', !settings.autoEnableMic)}
                        className={`relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors touch-manipulation active:scale-95 ${
                          settings.autoEnableMic ? 'bg-cyan-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoEnableMic ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Câmera Padrão */}
                    {cameras.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Câmera Padrão
                        </label>
                        <select
                          value={settings.defaultCameraId || ''}
                          onChange={(e) => updateSetting('defaultCameraId', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="">Selecionar automaticamente</option>
                          {cameras.map(cam => (
                            <option key={cam.deviceId} value={cam.deviceId}>
                              {cam.label || `Câmera ${cameras.indexOf(cam) + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Microfone Padrão */}
                    {microphones.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Microfone Padrão
                        </label>
                        <select
                          value={settings.defaultMicId || ''}
                          onChange={(e) => updateSetting('defaultMicId', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="">Selecionar automaticamente</option>
                          {microphones.map(mic => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                              {mic.label || `Microfone ${microphones.indexOf(mic) + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GAME SETTINGS */}
            {activeTab === 'game' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                  Configurações de Jogo
                </h3>

                <div className="space-y-4">
                  {/* Volume */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume Padrão: {settings.defaultVolume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.defaultVolume}
                      onChange={(e) => updateSetting('defaultVolume', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Som do jogo */}
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-bold">Habilitar Som do Jogo</p>
                        <p className="text-gray-400 text-sm">Ativa áudio do emulador</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('enableGameSound', !settings.enableGameSound)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableGameSound ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableGameSound ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Mostrar FPS */}
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-bold">Mostrar FPS</p>
                        <p className="text-gray-400 text-sm">Exibe contador de FPS na tela</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('showFPS', !settings.showFPS)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showFPS ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showFPS ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Save States */}
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Habilitar Save States</p>
                      <p className="text-gray-400 text-sm">Permite salvar e carregar estados do jogo</p>
                    </div>
                    <button
                      onClick={() => updateSetting('enableSaveStates', !settings.enableSaveStates)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableSaveStates ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableSaveStates ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-400" />
                  Notificações
                </h3>

                <div className="space-y-4">
                  {[
                    { key: 'notifyOnFollow' as const, label: 'Novo Seguidor', desc: 'Quando alguém te seguir' },
                    { key: 'notifyOnStreamStart' as const, label: 'Stream Iniciada', desc: 'Quando alguém que você segue começar a transmitir' },
                    { key: 'notifyOnMessage' as const, label: 'Novas Mensagens', desc: 'Quando receber mensagens no chat' },
                    { key: 'soundNotifications' as const, label: 'Som das Notificações', desc: 'Reproduz som ao receber notificações' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">{label}</p>
                        <p className="text-gray-400 text-sm">{desc}</p>
                      </div>
                      <button
                        onClick={() => updateSetting(key, !settings[key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[key] ? 'bg-pink-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Privacidade
                </h3>

                <div className="space-y-4">
                  {[
                    { key: 'showOnlineStatus' as const, label: 'Mostrar Status Online', desc: 'Outros usuários podem ver quando você está online' },
                    { key: 'allowSpectators' as const, label: 'Permitir Espectadores', desc: 'Outros podem assistir suas streams' },
                    { key: 'allowFriendRequests' as const, label: 'Pedidos de Amizade', desc: 'Receber solicitações de amizade' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">{label}</p>
                        <p className="text-gray-400 text-sm">{desc}</p>
                      </div>
                      <button
                        onClick={() => updateSetting(key, !settings[key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[key] ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-yellow-400" />
                  Aparência
                </h3>

                <div className="space-y-4">
                  {/* Theme */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Tema
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'dark' as const, label: 'Dark', gradient: 'from-gray-700 to-gray-900' },
                        { value: 'cyberpunk' as const, label: 'Cyberpunk', gradient: 'from-cyan-500 to-purple-500' },
                        { value: 'retro' as const, label: 'Retro', gradient: 'from-pink-500 to-yellow-500' }
                      ].map(({ value, label, gradient }) => (
                        <button
                          key={value}
                          onClick={() => updateSetting('theme', value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.theme === value
                              ? 'border-cyan-400 bg-cyan-500/20'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className={`w-full h-8 bg-gradient-to-r ${gradient} rounded mb-2`} />
                          <p className="text-white font-bold text-sm">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reduced Motion */}
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Movimento Reduzido</p>
                      <p className="text-gray-400 text-sm">Desativa animações para melhor performance</p>
                    </div>
                    <button
                      onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.reducedMotion ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Compact Mode */}
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Modo Compacto</p>
                      <p className="text-gray-400 text-sm">Interface mais densa e compacta</p>
                    </div>
                    <button
                      onClick={() => updateSetting('compactMode', !settings.compactMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.compactMode ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 border-t border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={resetSettings}
            className="px-4 py-2.5 sm:py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-bold touch-manipulation active:scale-95 text-sm sm:text-base"
          >
            Resetar Tudo
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {hasChanges && (
              <span className="text-yellow-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4 animate-pulse" />
                Alterações não salvas
              </span>
            )}
            <button
              onClick={saveSettings}
              disabled={!hasChanges}
              className="px-6 py-2.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-95 text-sm sm:text-base"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

// Export para uso global
export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('app_settings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};
