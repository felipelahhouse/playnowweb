import React, { useState, useEffect } from 'react';
import { X, Radio, Video, Mic, CheckCircle2, AlertCircle, Settings, Monitor, Copy, CheckCircle, ChevronDown, ChevronRight, Sliders, Zap, Lock, Globe, Twitch, ExternalLink, RefreshCw, Info, Eye, EyeOff } from 'lucide-react';

interface StreamSetupModalProps {
  gameTitle?: string;
  onStartStream: (config: StreamConfig) => void;
  onCancel: () => void;
}

export interface StreamConfig {
  title: string;
  fps: number;
  quality: 'high' | 'medium' | 'low';
  enableCamera: boolean;
  enableMic: boolean;
  cameraDeviceId?: string;
  micDeviceId?: string;
  streamMode: 'direct' | 'obs' | 'twitch';
  obsStreamKey?: string;
  obsServerUrl?: string;
  twitchStreamKey?: string;
  twitchChannel?: string;
  bitrate: number;
  keyframeInterval: number;
  audioSampleRate: number;
  audioBitrate: number;
  enableLowLatency: boolean;
  enableAdaptiveBitrate: boolean;
  maxViewers: number;
  chatEnabled: boolean;
  chatModeration: boolean;
  allowRecording: boolean;
  ageRestriction: 'none' | '13+' | '18+';
}

const StreamSetupModal: React.FC<StreamSetupModalProps> = ({ gameTitle, onStartStream, onCancel }) => {
  const [currentTab, setCurrentTab] = useState<'basic' | 'obs' | 'twitch' | 'advanced'>('basic');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['video']));
  const [copied, setCopied] = useState(false);
  const [showObsKey, setShowObsKey] = useState(false);
  const [showTwitchKey, setShowTwitchKey] = useState(false);
  const [generatedStreamKey, setGeneratedStreamKey] = useState<string>('');

  const [config, setConfig] = useState<StreamConfig>({
    title: gameTitle ? `Playing ${gameTitle}` : '',
    fps: 10,
    quality: 'medium',
    enableCamera: false,
    enableMic: false,
    streamMode: 'direct',
    bitrate: 2500,
    keyframeInterval: 2,
    audioSampleRate: 48000,
    audioBitrate: 128,
    enableLowLatency: false,
    enableAdaptiveBitrate: true,
    maxViewers: 100,
    chatEnabled: true,
    chatModeration: false,
    allowRecording: true,
    ageRestriction: 'none'
  });

  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraDevices(devices.filter(d => d.kind === 'videoinput'));
        setMicDevices(devices.filter(d => d.kind === 'audioinput'));
      } catch (error) {
        console.error('Erro ao carregar dispositivos:', error);
      }
    };
    loadDevices();
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateStreamKey = () => {
    const key = `live_${crypto.randomUUID().replace(/-/g, '')}`;
    setGeneratedStreamKey(key);
    setConfig({ ...config, obsStreamKey: key });
    return key;
  };

  useEffect(() => {
    if (!generatedStreamKey && currentTab === 'obs') {
      generateStreamKey();
    }
  }, [currentTab]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-900 rounded-2xl border-2 border-cyan-500/30 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Configurar Live Stream</h2>
                <p className="text-gray-400 text-sm">Configure sua transmissão ao vivo</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setCurrentTab('basic')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                currentTab === 'basic' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Básico
            </button>
            <button
              onClick={() => setCurrentTab('obs')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                currentTab === 'obs' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-2" />
              OBS Studio
            </button>
            <button
              onClick={() => setCurrentTab('twitch')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                currentTab === 'twitch' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Twitch className="w-4 h-4 inline mr-2" />
              Twitch
            </button>
            <button
              onClick={() => setCurrentTab('advanced')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                currentTab === 'advanced' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Sliders className="w-4 h-4 inline mr-2" />
              Avançado
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título da Stream</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Digite um título atrativo..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">FPS da Stream</label>
                  <select
                    value={config.fps}
                    onChange={(e) => setConfig({ ...config, fps: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value={5}>5 FPS (Leve)</option>
                    <option value={10}>10 FPS (Recomendado)</option>
                    <option value={15}>15 FPS (Bom)</option>
                    <option value={20}>20 FPS (Pesado)</option>
                    <option value={30}>30 FPS (Muito Pesado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Qualidade</label>
                  <select
                    value={config.quality}
                    onChange={(e) => setConfig({ ...config, quality: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="low">Baixa (50%)</option>
                    <option value="medium">Média (75%)</option>
                    <option value="high">Alta (100%)</option>
                  </select>
                </div>
              </div>

              {cameraDevices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Câmera</label>
                  <select
                    value={config.cameraDeviceId || ''}
                    onChange={(e) => setConfig({ ...config, cameraDeviceId: e.target.value, enableCamera: !!e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="">Desativado</option>
                    {cameraDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Câmera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {micDevices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Microfone</label>
                  <select
                    value={config.micDeviceId || ''}
                    onChange={(e) => setConfig({ ...config, micDeviceId: e.target.value, enableMic: !!e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="">Desativado</option>
                    {micDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microfone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {currentTab === 'obs' && (
            <div className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Integração com OBS Studio
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Configure o OBS Studio para transmitir seu gameplay diretamente para nossa plataforma
                </p>
                <div className="flex items-start gap-2 text-xs text-purple-300 bg-purple-500/5 p-3 rounded-lg">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Como configurar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Abra o OBS Studio</li>
                      <li>Vá em Configurações → Transmissão</li>
                      <li>Selecione "Personalizado" como serviço</li>
                      <li>Cole a URL do servidor e a chave abaixo</li>
                      <li>Clique em "Iniciar Transmissão" no OBS</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL do Servidor RTMP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.obsServerUrl || 'rtmp://live.playnow.com/live'}
                    onChange={(e) => setConfig({ ...config, obsServerUrl: e.target.value })}
                    placeholder="rtmp://seu-servidor.com/live"
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(config.obsServerUrl || 'rtmp://live.playnow.com/live')}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                    title="Copiar URL"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Stream Key (Chave de Transmissão)</label>
                  <button
                    onClick={generateStreamKey}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Gerar Nova
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showObsKey ? "text" : "password"}
                    value={config.obsStreamKey || generatedStreamKey}
                    onChange={(e) => setConfig({ ...config, obsStreamKey: e.target.value })}
                    placeholder="Sua chave de stream será gerada automaticamente"
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowObsKey(!showObsKey)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                    title={showObsKey ? "Ocultar" : "Mostrar"}
                  >
                    {showObsKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(config.obsStreamKey || generatedStreamKey)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                    title="Copiar chave"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">⚠️ Mantenha esta chave em segredo! Qualquer pessoa com ela pode transmitir em seu nome.</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-bold text-white mb-3">Configurações Recomendadas para OBS</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Encoder:</p>
                    <p className="text-white font-mono">x264 ou NVENC</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Bitrate:</p>
                    <p className="text-white font-mono">2500-6000 kbps</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Keyframe Interval:</p>
                    <p className="text-white font-mono">2 segundos</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Preset:</p>
                    <p className="text-white font-mono">veryfast</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Resolução:</p>
                    <p className="text-white font-mono">1920x1080 ou 1280x720</p>
                  </div>
                  <div>
                    <p className="text-gray-400">FPS:</p>
                    <p className="text-white font-mono">30 ou 60</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <a 
                  href="https://obsproject.com/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Baixar OBS Studio (Gratuito)
                </a>
              </div>
            </div>
          )}

          {currentTab === 'twitch' && (
            <div className="space-y-6">
              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Twitch className="w-5 h-5" />
                  Integração com Twitch
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Transmita diretamente para sua conta Twitch e alcance milhões de espectadores
                </p>
                <div className="flex items-start gap-2 text-xs text-purple-300 bg-purple-600/5 p-3 rounded-lg">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Como obter sua Stream Key da Twitch:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Acesse <a href="https://dashboard.twitch.tv/settings/stream" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">dashboard.twitch.tv</a></li>
                      <li>Faça login na sua conta</li>
                      <li>Vá em "Configurações" → "Stream"</li>
                      <li>Copie sua "Primary Stream Key"</li>
                      <li>Cole a chave no campo abaixo</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Canal da Twitch</label>
                <div className="flex gap-2">
                  <span className="px-4 py-3 bg-gray-800 text-gray-400 rounded-lg border border-gray-700 font-mono text-sm">
                    twitch.tv/
                  </span>
                  <input
                    type="text"
                    value={config.twitchChannel || ''}
                    onChange={(e) => setConfig({ ...config, twitchChannel: e.target.value })}
                    placeholder="seu_canal"
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Digite o nome do seu canal Twitch (sem o @)</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Stream Key da Twitch</label>
                  <a 
                    href="https://dashboard.twitch.tv/settings/stream" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Obter Chave
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showTwitchKey ? "text" : "password"}
                    value={config.twitchStreamKey || ''}
                    onChange={(e) => setConfig({ ...config, twitchStreamKey: e.target.value })}
                    placeholder="live_123456789_abcdefghijklmnopqrstuvwxyz"
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowTwitchKey(!showTwitchKey)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                    title={showTwitchKey ? "Ocultar" : "Mostrar"}
                  >
                    {showTwitchKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => config.twitchStreamKey && copyToClipboard(config.twitchStreamKey)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                    title="Copiar chave"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">⚠️ NUNCA compartilhe sua Stream Key! Ela dá acesso total à sua transmissão.</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-bold text-white mb-3">Configurações de Transmissão Twitch</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Servidor Twitch</label>
                    <select
                      className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                      defaultValue="auto"
                    >
                      <option value="auto">Automático (Recomendado)</option>
                      <option value="sao">São Paulo, Brasil</option>
                      <option value="rio">Rio de Janeiro, Brasil</option>
                      <option value="gru">Guarulhos, Brasil</option>
                      <option value="mia">Miami, EUA</option>
                      <option value="dfw">Dallas, EUA</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Qualidade de Vídeo</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                        defaultValue="1080p60"
                      >
                        <option value="1080p60">1080p 60fps</option>
                        <option value="1080p30">1080p 30fps</option>
                        <option value="720p60">720p 60fps</option>
                        <option value="720p30">720p 30fps</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Bitrate</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                        defaultValue="6000"
                      >
                        <option value="3000">3000 kbps</option>
                        <option value="4500">4500 kbps</option>
                        <option value="6000">6000 kbps (Recomendado)</option>
                        <option value="8000">8000 kbps</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-400 font-semibold mb-1">Requisitos da Twitch</p>
                    <ul className="text-gray-400 text-xs space-y-1">
                      <li>• Você precisa ter uma conta Twitch ativa</li>
                      <li>• Sua conta deve estar em boa situação (sem banimentos)</li>
                      <li>• Recomendamos conexão de internet de pelo menos 10 Mbps upload</li>
                      <li>• A transmissão seguirá as diretrizes da comunidade Twitch</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                <ExternalLink className="w-4 h-4 text-purple-400" />
                <a 
                  href="https://www.twitch.tv/signup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Criar conta na Twitch (Gratuito)
                </a>
              </div>
            </div>
          )}

          {currentTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Configurações Avançadas
                </h3>
                <p className="text-gray-400 text-sm">
                  Ajuste fino para otimizar sua transmissão ao vivo
                </p>
              </div>

              <div>
                <button
                  onClick={() => toggleSection('video')}
                  className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <span className="font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Configurações de Vídeo
                  </span>
                  {expandedSections.has('video') ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.has('video') && (
                  <div className="mt-4 space-y-4 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bitrate de Vídeo (kbps)
                        <span className="text-xs text-gray-500 ml-2">Recomendado: 2500-6000</span>
                      </label>
                      <input
                        type="number"
                        min="500"
                        max="10000"
                        step="100"
                        value={config.bitrate}
                        onChange={(e) => setConfig({ ...config, bitrate: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Baixa qualidade</span>
                        <span>Alta qualidade</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Intervalo de Keyframe (segundos)
                        <span className="text-xs text-gray-500 ml-2">Recomendado: 2</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.keyframeInterval}
                        onChange={(e) => setConfig({ ...config, keyframeInterval: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-300 block">Bitrate Adaptativo</span>
                        <span className="text-xs text-gray-500">Ajusta automaticamente baseado na conexão</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enableAdaptiveBitrate}
                        onChange={(e) => setConfig({ ...config, enableAdaptiveBitrate: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-300 block">Modo Baixa Latência</span>
                        <span className="text-xs text-gray-500">Reduz delay para interação em tempo real</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enableLowLatency}
                        onChange={(e) => setConfig({ ...config, enableLowLatency: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => toggleSection('audio')}
                  className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <span className="font-bold text-white flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Configurações de Áudio
                  </span>
                  {expandedSections.has('audio') ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.has('audio') && (
                  <div className="mt-4 space-y-4 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Taxa de Amostragem
                        <span className="text-xs text-gray-500 ml-2">Qualidade do áudio</span>
                      </label>
                      <select
                        value={config.audioSampleRate}
                        onChange={(e) => setConfig({ ...config, audioSampleRate: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value={44100}>44.1 kHz (CD Quality)</option>
                        <option value={48000}>48 kHz (Professional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bitrate de Áudio (kbps)
                        <span className="text-xs text-gray-500 ml-2">Recomendado: 128-320</span>
                      </label>
                      <input
                        type="number"
                        min="64"
                        max="320"
                        step="32"
                        value={config.audioBitrate}
                        onChange={(e) => setConfig({ ...config, audioBitrate: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>64 kbps</span>
                        <span>128 kbps</span>
                        <span>320 kbps</span>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                          Áudio de alta qualidade aumenta o bitrate total da stream. Para conexões lentas, use 128 kbps.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => toggleSection('privacy')}
                  className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <span className="font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Privacidade e Moderação
                  </span>
                  {expandedSections.has('privacy') ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.has('privacy') && (
                  <div className="mt-4 space-y-4 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Máximo de Espectadores
                        <span className="text-xs text-gray-500 ml-2">Limite de viewers simultâneos</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={config.maxViewers}
                        onChange={(e) => setConfig({ ...config, maxViewers: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Restrição de Idade
                        <span className="text-xs text-gray-500 ml-2">Classificação do conteúdo</span>
                      </label>
                      <select
                        value={config.ageRestriction}
                        onChange={(e) => setConfig({ ...config, ageRestriction: e.target.value as 'none' | '13+' | '18+' })}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="none">🌍 Livre para todos</option>
                        <option value="13+">🔞 13+ (Adolescentes)</option>
                        <option value="18+">🔞 18+ (Adultos)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-300 block">Chat Habilitado</span>
                        <span className="text-xs text-gray-500">Permite espectadores enviarem mensagens</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.chatEnabled}
                        onChange={(e) => setConfig({ ...config, chatEnabled: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-300 block">Moderação Automática</span>
                        <span className="text-xs text-gray-500">Filtra palavras ofensivas e spam</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.chatModeration}
                        onChange={(e) => setConfig({ ...config, chatModeration: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-300 block">Permitir Gravação</span>
                        <span className="text-xs text-gray-500">Espectadores podem gravar a stream</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.allowRecording}
                        onChange={(e) => setConfig({ ...config, allowRecording: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                          A moderação automática ajuda a manter um ambiente saudável, mas não substitui moderadores humanos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => toggleSection('performance')}
                  className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <span className="font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Performance e Otimização
                  </span>
                  {expandedSections.has('performance') ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.has('performance') && (
                  <div className="mt-4 space-y-4 pl-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-white mb-3">Presets de Qualidade</h5>
                      <div className="space-y-2">
                        <button
                          onClick={() => setConfig({
                            ...config,
                            bitrate: 1500,
                            fps: 10,
                            quality: 'low',
                            audioBitrate: 96,
                            enableAdaptiveBitrate: true
                          })}
                          className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">🟢 Economia de Dados</p>
                              <p className="text-xs text-gray-400">Ideal para conexões lentas (1.5 Mbps)</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            bitrate: 2500,
                            fps: 15,
                            quality: 'medium',
                            audioBitrate: 128,
                            enableAdaptiveBitrate: true
                          })}
                          className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">🟡 Balanceado</p>
                              <p className="text-xs text-gray-400">Boa qualidade e performance (2.5 Mbps)</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            bitrate: 6000,
                            fps: 30,
                            quality: 'high',
                            audioBitrate: 192,
                            enableAdaptiveBitrate: false
                          })}
                          className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">🔴 Alta Qualidade</p>
                              <p className="text-xs text-gray-400">Máxima qualidade (6 Mbps - requer boa conexão)</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-gray-400">
                          <p className="font-semibold text-blue-400 mb-1">Dica de Performance:</p>
                          <p>Para streams estáveis, sua velocidade de upload deve ser pelo menos 1.5x o bitrate configurado.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onStartStream(config)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
          >
            <Radio className="w-5 h-5" />
            Iniciar Stream
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamSetupModal;
