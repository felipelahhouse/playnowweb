// 📦 BATCH COVER UPLOADER V2 - Upload de covers em lote com detecção inteligente
import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Loader, AlertCircle, Zap, Image as ImageIcon } from 'lucide-react';

interface BatchCoverUploaderProps {
  onUpload: (file: File, platform: string) => Promise<void>;
  uploading: boolean;
}

// Padrões melhorados para detecção de console
const CONSOLE_PATTERNS = {
  'SNES': {
    patterns: ['snes', 'super-nintendo', 'super_nintendo', 'supernintendo', 'super-famicom', 'sfc'],
    aliases: ['Super Nintendo', 'Super NES', 'SFC'],
    color: 'from-purple-500 to-pink-500',
    icon: '🎮'
  },
  'NES': {
    patterns: ['nes', 'nintendo', 'famicom', 'fc'],
    aliases: ['Nintendo', 'Famicom', 'FC'],
    color: 'from-red-500 to-orange-500',
    icon: '🕹️'
  },
  'GBA': {
    patterns: ['gba', 'gameboy-advance', 'gameboy_advance', 'game-boy-advance', 'advance'],
    aliases: ['Game Boy Advance', 'GBA'],
    color: 'from-indigo-500 to-purple-500',
    icon: '🎯'
  },
  'GBC': {
    patterns: ['gbc', 'gameboy-color', 'gameboy_color', 'game-boy-color', 'color'],
    aliases: ['Game Boy Color', 'GBC'],
    color: 'from-yellow-500 to-orange-500',
    icon: '🌈'
  },
  'GB': {
    patterns: ['gb', 'gameboy', 'game-boy', 'dmg'],
    aliases: ['Game Boy', 'GB', 'DMG'],
    color: 'from-gray-500 to-green-500',
    icon: '📱'
  },
  'N64': {
    patterns: ['n64', 'nintendo-64', 'nintendo_64', 'nintendo64'],
    aliases: ['Nintendo 64', 'N64'],
    color: 'from-blue-500 to-red-500',
    icon: '🎮'
  },
  'GENESIS': {
    patterns: ['genesis', 'megadrive', 'mega-drive', 'sega-genesis', 'md', 'seg'],
    aliases: ['Sega Genesis', 'Mega Drive', 'MD'],
    color: 'from-blue-500 to-cyan-500',
    icon: '💎'
  },
  'SMS': {
    patterns: ['sms', 'master-system', 'master_system', 'mastersystem'],
    aliases: ['Master System', 'SMS'],
    color: 'from-red-500 to-blue-500',
    icon: '🎪'
  },
  'GG': {
    patterns: ['gg', 'game-gear', 'game_gear', 'gamegear'],
    aliases: ['Game Gear', 'GG'],
    color: 'from-blue-500 to-black',
    icon: '⚡'
  },
  'ARCADE': {
    patterns: ['arcade', 'mame', 'fba', 'arc', 'coin-op'],
    aliases: ['Arcade', 'MAME', 'FBA'],
    color: 'from-yellow-500 to-red-500',
    icon: '🕹️'
  },
  'PS1': {
    patterns: ['ps1', 'psx', 'playstation', 'playstation-1', 'psone'],
    aliases: ['PlayStation', 'PS1', 'PSX'],
    color: 'from-gray-500 to-blue-500',
    icon: '🎮'
  },
  'ATARI': {
    patterns: ['atari', 'atari-2600', 'atari2600', 'a2600'],
    aliases: ['Atari 2600', 'Atari'],
    color: 'from-orange-500 to-brown-500',
    icon: '🎲'
  }
} as const;

type Platform = keyof typeof CONSOLE_PATTERNS;

interface FileItem {
  file: File;
  platform: Platform;
  status: 'pending' | 'uploading' | 'success' | 'error';
  preview: string;
  confidence: 'high' | 'medium' | 'low';
  suggestions: Platform[];
}

const BatchCoverUploader: React.FC<BatchCoverUploaderProps> = ({ onUpload, uploading }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading2, setUploading2] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detecção inteligente com score de confiança
  const detectPlatform = (filename: string): { platform: Platform; confidence: 'high' | 'medium' | 'low'; suggestions: Platform[] } => {
    const lowerName = filename.toLowerCase();
    const scores: Map<Platform, number> = new Map();
    
    // Calcular score para cada console
    for (const [platform, config] of Object.entries(CONSOLE_PATTERNS) as [Platform, typeof CONSOLE_PATTERNS[Platform]][]) {
      let score = 0;
      
      for (const pattern of config.patterns) {
        if (lowerName.startsWith(pattern)) {
          score += 100;
        } else if (lowerName.includes(`-${pattern}-`) || lowerName.includes(`_${pattern}_`)) {
          score += 50;
        } else if (lowerName.includes(pattern)) {
          score += 25;
        }
      }
      
      if (score > 0) {
        scores.set(platform, score);
      }
    }
    
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      return {
        platform: 'SNES',
        confidence: 'low',
        suggestions: ['NES', 'GBA', 'N64']
      };
    }
    
    const bestMatch = sorted[0];
    const suggestions = sorted.slice(1, 4).map(([platform]) => platform);
    
    let confidence: 'high' | 'medium' | 'low';
    if (bestMatch[1] >= 100) confidence = 'high';
    else if (bestMatch[1] >= 50) confidence = 'medium';
    else confidence = 'low';
    
    return {
      platform: bestMatch[0],
      confidence,
      suggestions
    };
  };

  const processFiles = (selectedFiles: File[]) => {
    const processedFiles: FileItem[] = selectedFiles.map(file => {
      const detection = detectPlatform(file.name);
      const preview = URL.createObjectURL(file);
      
      return {
        file,
        platform: detection.platform,
        status: 'pending' as const,
        preview,
        confidence: detection.confidence,
        suggestions: detection.suggestions
      };
    });
    
    setFiles(prev => [...prev, ...processedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const changePlatform = (index: number, newPlatform: Platform) => {
    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, platform: newPlatform, confidence: 'high' as const } : item
    ));
  };

  const changeAllPlatforms = (newPlatform: Platform) => {
    setFiles(prev => prev.map(item => 
      item.status === 'pending' ? { ...item, platform: newPlatform, confidence: 'high' as const } : item
    ));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(files[index].preview);
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSuccess = () => {
    files.forEach(item => {
      if (item.status === 'success') {
        URL.revokeObjectURL(item.preview);
      }
    });
    setFiles(prev => prev.filter(item => item.status !== 'success'));
  };

  const uploadAll = async () => {
    setUploading2(true);
    
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      
      if (item.status !== 'pending') continue;
      
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));
      
      try {
        const newFileName = `${item.platform.toLowerCase()}-${item.file.name}`;
        const newFile = new File([item.file], newFileName, { type: item.file.type });
        
        await onUpload(newFile, item.platform);
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' as const } : f
        ));
      } catch (error) {
        console.error('Erro ao enviar:', error);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const } : f
        ));
      }
    }
    
    setUploading2(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const lowConfidenceCount = files.filter(f => f.status === 'pending' && f.confidence === 'low').length;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Upload className="w-8 h-8 text-blue-400" />
          <h4 className="text-2xl font-black text-white">
            Upload em Lote Inteligente
          </h4>
        </div>
        <p className="text-gray-300 text-sm mb-2">
          Arraste e solte ou selecione múltiplos covers - detecção automática de console!
        </p>
        <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400">
            ✓ Detecção Inteligente
          </span>
          <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400">
            ⚡ Upload em Massa
          </span>
          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400">
            🎯 Sugestões Automáticas
          </span>
        </div>
      </div>

      {/* Zona de Upload */}
      {files.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-500/20 scale-105'
              : 'border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/5'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center ${dragActive ? 'animate-bounce' : ''}`}>
              <Upload className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-white font-black text-xl mb-2">
              {dragActive ? 'Solte os arquivos aqui!' : 'Clique ou arraste covers'}
            </p>
            <p className="text-gray-400 text-sm mb-3">
              Suporta múltiplos arquivos JPG, PNG, WEBP
            </p>
            <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400">
                💡 Nome com console: snes-mario.jpg
              </span>
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400">
                🎯 Detecção automática
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-black text-yellow-400">{pendingCount}</div>
              <div className="text-xs text-gray-300 font-bold">Pendentes</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-black text-green-400">{successCount}</div>
              <div className="text-xs text-gray-300 font-bold">Enviados</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-lg">
              <div className="text-2xl font-black text-red-400">{errorCount}</div>
              <div className="text-xs text-gray-300 font-bold">Erros</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg">
              <div className="text-2xl font-black text-orange-400">{lowConfidenceCount}</div>
              <div className="text-xs text-gray-300 font-bold">Revisar</div>
            </div>
          </div>

          {/* Alerta de Baixa Confiança */}
          {lowConfidenceCount > 0 && (
            <div className="p-4 bg-orange-500/10 border-2 border-orange-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-bold mb-1">
                  ⚠️ {lowConfidenceCount} cover(s) com detecção incerta
                </div>
                <div className="text-gray-300 text-sm">
                  Revise os covers marcados com ⚠️ e confirme o console correto antes de enviar.
                </div>
              </div>
            </div>
          )}

          {/* Seleção em Massa */}
          {pendingCount > 1 && (
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-4 flex-wrap">
                <Zap className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-[200px]">
                  <div className="text-white font-black text-sm mb-1">
                    ⚡ Aplicar Console para TODOS
                  </div>
                  <div className="text-gray-300 text-xs">
                    Altere {pendingCount} covers de uma vez só
                  </div>
                </div>
                <select
                  onChange={(e) => e.target.value && changeAllPlatforms(e.target.value as Platform)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer min-w-[150px]"
                  value=""
                >
                  <option value="" disabled>Selecionar...</option>
                  {(Object.keys(CONSOLE_PATTERNS) as Platform[]).map(platform => (
                    <option key={platform} value={platform}>
                      {CONSOLE_PATTERNS[platform].icon} {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Lista de Arquivos */}
          <div 
            className="max-h-[500px] overflow-y-auto space-y-3 mb-4 pr-2"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {files.map((item, index) => {
              const platformConfig = CONSOLE_PATTERNS[item.platform];
              
              return (
                <div 
                  key={index} 
                  className={`group relative p-4 rounded-xl border-2 transition-all ${
                    item.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20'
                      : item.status === 'error'
                      ? 'bg-red-500/10 border-red-500/50'
                      : item.status === 'uploading'
                      ? 'bg-blue-500/10 border-blue-500/50 animate-pulse'
                      : item.confidence === 'low'
                      ? 'bg-orange-500/10 border-orange-500/50'
                      : item.confidence === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Preview */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border-2 border-gray-700">
                        <img 
                          src={item.preview} 
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {item.status === 'pending' && (
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.confidence === 'high' 
                            ? 'bg-green-500 text-white'
                            : item.confidence === 'medium'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-orange-500 text-white'
                        }`}>
                          {item.confidence === 'high' ? '✓' : item.confidence === 'medium' ? '?' : '⚠'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-bold text-sm truncate">
                          {item.file.name}
                        </span>
                        {item.status === 'pending' && item.confidence === 'low' && (
                          <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-xs text-orange-400 font-bold flex-shrink-0">
                            Revisar
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mb-2">
                        {(item.file.size / 1024).toFixed(1)} KB • {item.file.type.split('/')[1].toUpperCase()}
                      </div>
                      
                      {/* Sugestões */}
                      {item.status === 'pending' && item.suggestions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-gray-500 text-xs">Sugestões:</span>
                          {item.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => changePlatform(index, suggestion)}
                              className="px-2 py-0.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
                            >
                              {CONSOLE_PATTERNS[suggestion].icon} {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Seletor de Console */}
                    {item.status === 'pending' && (
                      <select
                        value={item.platform}
                        onChange={(e) => changePlatform(index, e.target.value as Platform)}
                        className={`px-4 py-2 bg-gradient-to-r ${platformConfig.color} text-white rounded-lg text-sm font-black border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-lg min-w-[120px]`}
                      >
                        {(Object.keys(CONSOLE_PATTERNS) as Platform[]).map(platform => (
                          <option key={platform} value={platform} className="bg-gray-800">
                            {CONSOLE_PATTERNS[platform].icon} {platform}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {item.status === 'uploading' && (
                        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                      )}
                      {item.status === 'success' && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      {item.status === 'error' && (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <XCircle className="w-5 h-5 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={uploadAll}
              disabled={uploading2 || uploading || pendingCount === 0}
              className="flex-1 min-w-[200px] px-6 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl font-black text-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
            >
              <Upload className={uploading2 ? 'animate-bounce' : ''} size={24} />
              <span>
                {uploading2 
                  ? `ENVIANDO... ${successCount}/${files.length}` 
                  : `🚀 ENVIAR ${pendingCount} COVER${pendingCount !== 1 ? 'S' : ''}`
                }
              </span>
            </button>

            {!uploading2 && successCount > 0 && (
              <button
                onClick={clearSuccess}
                className="px-6 py-4 bg-green-500/20 border-2 border-green-500/30 rounded-xl font-bold hover:bg-green-500/30 transition-all flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Limpar {successCount}
              </button>
            )}

            {!uploading2 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-4 bg-blue-500/20 border-2 border-blue-500/30 rounded-xl font-bold hover:bg-blue-500/30 transition-all flex items-center gap-2"
              >
                <ImageIcon size={20} />
                Adicionar
              </button>
            )}

            {!uploading2 && (
              <button
                onClick={() => {
                  files.forEach(item => URL.revokeObjectURL(item.preview));
                  setFiles([]);
                }}
                className="px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl font-bold hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Legenda */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <div className="text-white font-black text-sm">
            🎯 Sistema de Detecção Inteligente
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {(Object.entries(CONSOLE_PATTERNS) as [Platform, typeof CONSOLE_PATTERNS[Platform]][]).slice(0, 9).map(([platform, config]) => (
            <div key={platform} className="flex items-center gap-2 text-xs">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm">{config.icon}</span>
              </div>
              <div className="min-w-0">
                <span className="text-white font-bold">{platform}:</span>
                <span className="text-gray-400 ml-1 truncate">{config.patterns.slice(0, 2).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
            <span className="text-gray-300"><span className="text-green-400 font-bold">Alta:</span> Confiável</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold flex-shrink-0">?</div>
            <span className="text-gray-300"><span className="text-yellow-400 font-bold">Média:</span> Verificar</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">⚠</div>
            <span className="text-gray-300"><span className="text-orange-400 font-bold">Baixa:</span> Confirmar</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400">
          <span className="text-yellow-400 font-bold">💡 Dica:</span> Nomeie com o console no início (ex: "<span className="text-blue-400">snes</span>-mario.jpg") para detecção perfeita!
        </div>
      </div>
    </div>
  );
};

export default BatchCoverUploader;
