import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoorOpen, Keyboard, Loader2, RotateCcw, X } from 'lucide-react';
import JSZip from 'jszip';

interface GamePlayerProps {
  gameTitle: string;
  romPath: string;
  onClose: () => void;
}

type RomSource = {
  url: string;
  size: number;
  fileName: string;
  format: string;
};

// Platform detection from ROM path/filename
const detectPlatform = (path: string): string => {
  const lowerPath = path.toLowerCase();
  
  // Check folder path first
  if (lowerPath.includes('/snes/') || lowerPath.includes('\\snes\\')) return 'snes';
  if (lowerPath.includes('/nes/') || lowerPath.includes('\\nes\\')) return 'nes';
  if (lowerPath.includes('/gba/') || lowerPath.includes('\\gba\\')) return 'gba';
  if (lowerPath.includes('/gbc/') || lowerPath.includes('\\gbc\\')) return 'gbc';
  if (lowerPath.includes('/gb/') || lowerPath.includes('\\gb\\')) return 'gb';
  if (lowerPath.includes('/genesis/') || lowerPath.includes('\\genesis\\')) return 'genesis';
  if (lowerPath.includes('/megadrive/') || lowerPath.includes('\\megadrive\\')) return 'genesis';
  if (lowerPath.includes('/ps1/') || lowerPath.includes('\\ps1\\')) return 'ps1';
  if (lowerPath.includes('/psx/') || lowerPath.includes('\\psx\\')) return 'ps1';
  if (lowerPath.includes('/n64/') || lowerPath.includes('\\n64\\')) return 'n64';
  if (lowerPath.includes('/sms/') || lowerPath.includes('\\sms\\')) return 'sms';
  if (lowerPath.includes('/mastersystem/') || lowerPath.includes('\\mastersystem\\')) return 'sms';
  if (lowerPath.includes('/gg/') || lowerPath.includes('\\gg\\')) return 'gg';
  if (lowerPath.includes('/gamegear/') || lowerPath.includes('\\gamegear\\')) return 'gg';
  if (lowerPath.includes('/arcade/') || lowerPath.includes('\\arcade\\')) return 'arcade';
  if (lowerPath.includes('/atari/') || lowerPath.includes('\\atari\\')) return 'atari';
  
  // Check file extension
  if (lowerPath.endsWith('.smc') || lowerPath.endsWith('.sfc') || lowerPath.endsWith('.fig')) return 'snes';
  if (lowerPath.endsWith('.nes') || lowerPath.endsWith('.unf')) return 'nes';
  if (lowerPath.endsWith('.gba')) return 'gba';
  if (lowerPath.endsWith('.gbc')) return 'gbc';
  if (lowerPath.endsWith('.gb')) return 'gb';
  if (lowerPath.endsWith('.md') || lowerPath.endsWith('.gen') || lowerPath.endsWith('.smd')) return 'genesis';
  if (lowerPath.endsWith('.bin') || lowerPath.endsWith('.cue') || lowerPath.endsWith('.iso')) return 'ps1';
  if (lowerPath.endsWith('.n64') || lowerPath.endsWith('.z64') || lowerPath.endsWith('.v64')) return 'n64';
  if (lowerPath.endsWith('.sms')) return 'sms';
  if (lowerPath.endsWith('.gg')) return 'gg';
  if (lowerPath.endsWith('.zip')) return 'arcade';
  if (lowerPath.endsWith('.a26')) return 'atari';
  
  // Default to SNES if can't detect
  return 'snes';
};

const GamePlayer: React.FC<GamePlayerProps> = ({ gameTitle, romPath, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const romUrlRef = useRef<string | null>(null);

  const [romSource, setRomSource] = useState<RomSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Preparando emulador...');
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (romUrlRef.current) {
      URL.revokeObjectURL(romUrlRef.current);
      romUrlRef.current = null;
    }
    setRomSource(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
      if (romUrlRef.current) {
        URL.revokeObjectURL(romUrlRef.current);
        romUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const escHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', escHandler);
    return () => {
      window.removeEventListener('keydown', escHandler);
    };
  }, [handleClose]);

  const loadRom = useCallback(async () => {
    try {
      setError(null);
      setStatus('Preparando jogo...');
      setLoading(true);

      // Detecta se é mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log(`[GAME PLAYER] Dispositivo: ${isMobile ? 'MOBILE' : 'DESKTOP'}`);

      if (romUrlRef.current) {
        URL.revokeObjectURL(romUrlRef.current);
        romUrlRef.current = null;
      }

      // 🔥 NOVO: Busca URL de download do Firebase Storage
      setStatus('Conectando ao Firebase Storage...');
      let finalRomPath = romPath;
      
      // Se romPath é um caminho do Storage (ex: roms/snes/game.smc), busca a URL
      if (romPath.startsWith('roms/') || romPath.startsWith('gs://')) {
        console.log('[GAME PLAYER] Buscando URL de download do Storage:', romPath);
        
        const { ref: storageRef, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../../lib/firebase');
        
        // Remove prefixo gs:// se existir
        const cleanPath = romPath.replace(/^gs:\/\/[^/]+\//, '');
        const romRef = storageRef(storage, cleanPath);
        finalRomPath = await getDownloadURL(romRef);
        
        console.log('[GAME PLAYER] ✅ URL de download obtida');
      }

      // ✅ MOBILE: Tenta usar versão descompactada primeiro
      if (isMobile && finalRomPath.toLowerCase().includes('.zip')) {
        // Tenta usar versão .smc/.sfc em vez de .zip
        const unzippedPath = finalRomPath.replace(/\.zip/i, '.smc');
        console.log(`[MOBILE] Tentando ROM descompactada: ${unzippedPath}`);
        
        try {
          const testResponse = await fetch(unzippedPath, { method: 'HEAD' });
          if (testResponse.ok) {
            console.log('[MOBILE] ✅ ROM descompactada encontrada! Usando versão otimizada.');
            finalRomPath = unzippedPath;
          } else {
            console.log('[MOBILE] ⚠️ ROM descompactada não encontrada. Usando ZIP (pode ser lento).');
          }
        } catch {
          console.log('[MOBILE] ⚠️ Erro ao verificar ROM descompactada. Usando ZIP.');
        }
      }

      setStatus('Baixando ROM do jogo...');
      const response = await fetch(finalRomPath);
      if (!response.ok) {
        throw new Error(`Falha ao carregar ROM (${response.status})`);
      }

      const buffer = await response.arrayBuffer();

      let romBytes = new Uint8Array(buffer);
      let romName = finalRomPath.split('/').pop() ?? 'game.smc';

      // Só descompacta se realmente for ZIP
      if (finalRomPath.toLowerCase().endsWith('.zip')) {
        setStatus('Extraindo ROM do arquivo ZIP...');
        console.log('[ZIP] Descompactando arquivo...');
        
        const zip = await JSZip.loadAsync(buffer);
        
        // ✅ SUPORTE MULTI-PLATAFORMA: SNES, GBA, PS1, Genesis, etc.
        const romExtensions = [
          '.smc', '.sfc', '.fig',  // SNES
          '.gba',                    // Game Boy Advance
          '.gb', '.gbc',             // Game Boy / Game Boy Color
          '.bin', '.iso', '.cue',    // PS1
          '.md', '.gen', '.smd',     // Sega Genesis/Mega Drive
          '.n64', '.z64', '.v64'     // Nintendo 64
        ];
        
        const romEntry = Object.values(zip.files).find(
          (file) => !file.dir && romExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        );

        if (!romEntry) {
          throw new Error(`Nenhum arquivo ROM válido encontrado no ZIP. Formatos aceitos: ${romExtensions.join(', ')}`);
        }

        romName = romEntry.name.split('/').pop() ?? romEntry.name;
        const romBuffer = await romEntry.async('arraybuffer');
        romBytes = new Uint8Array(romBuffer);
        console.log(`[ZIP] ✅ ROM extraída com sucesso: ${romName}`);
      } else {
        console.log('[ROM] Usando arquivo direto (sem descompactação)');
      }

      if (romBytes.length < 1024) {
        throw new Error('Arquivo ROM inválido ou corrompido');
      }

      const blob = new Blob([romBytes], { type: 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);
      romUrlRef.current = objectUrl;

      setRomSource({
        url: objectUrl,
        size: romBytes.length,
        fileName: romName,
        format: romName.split('.').pop()?.toUpperCase() ?? 'SMC'
      });

      setStatus('Preparando emulador...');
      console.log(`[GAME PLAYER] ROM carregada: ${romName} (${(romBytes.length / 1024).toFixed(2)} KB)`);
    } catch (err) {
      console.error('[GAME PLAYER] ❌ Erro ao carregar ROM:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o jogo');
      setLoading(false);
    }
  }, [romPath]);

  useEffect(() => {
    loadRom();
  }, [loadRom]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'emulator-ready') {
        setStatus('Rodando');
        setLoading(false);
      }

      if (event.data?.type === 'emulator-error') {
        setError(event.data.message || 'Erro ao iniciar o emulador');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const iframeSrc = useMemo(() => {
    if (!romSource) {
      return undefined;
    }

    const platform = detectPlatform(romPath);
    
    const params = new URLSearchParams({
      rom: romSource.url,
      title: gameTitle,
      platform: platform
    });

    return `/universal-player.html?${params.toString()}`;
  }, [romSource, gameTitle, romPath]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      handleClose();
    }
  };

  const handleRetry = () => {
    setError(null);
    loadRom();
  };

  const handleRestart = () => {
    loadRom();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-7xl bg-gray-950 sm:border border-cyan-500/30 sm:rounded-3xl shadow-2xl overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-30 sm:opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at top, rgba(34,211,238,0.12), transparent 55%), radial-gradient(circle at bottom, rgba(147,51,234,0.12), transparent 55%)'
          }}
        />

        <div className="relative h-full flex flex-col p-2 sm:p-6 md:p-10">
          <div className="flex flex-col gap-2 sm:gap-6 h-full">
            {/* Header - Mobile otimizado */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-cyan-400/70 font-semibold mb-0.5 sm:mb-1">RETRO ARCADE</p>
                <h2 className="text-lg sm:text-3xl md:text-4xl font-black text-white leading-tight truncate">{gameTitle}</h2>
                {romSource && (
                  <p className="text-[10px] sm:text-sm text-gray-400 mt-1 sm:mt-2 font-medium truncate">
                    {romSource.fileName} · {romSource.format} · {formatSize(romSource.size)}
                  </p>
                )}
              </div>

              {/* Botões - Mobile otimizado */}
              <div className="flex flex-row sm:flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={handleRestart}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 hover:border-cyan-400 active:scale-95"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Reiniciar</span>
                  <span className="sm:hidden">Reset</span>
                </button>

                <button
                  onClick={handleClose}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-rose-500/40 bg-rose-500/15 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 hover:border-rose-400 active:scale-95"
                >
                  <DoorOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sair do jogo</span>
                  <span className="sm:hidden">Sair</span>
                </button>
              </div>
            </div>

            {/* Emulator Container - Fullscreen mobile */}
            <div className="relative flex-1 rounded-lg sm:rounded-2xl border border-gray-800 bg-black overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-cyan-100">{status}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/95">
                  <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-4">
                    <X className="h-8 w-8 text-rose-400" />
                  </div>
                  <p className="max-w-md text-center text-sm text-gray-300">{error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 hover:border-cyan-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Tentar novamente
                    </button>
                    <button
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700/90"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {iframeSrc && (
                <iframe
                  ref={iframeRef}
                  title={`${gameTitle} SNES Player`}
                  src={iframeSrc}
                  className="relative z-10 h-[75vh] sm:h-[65vh] md:h-[60vh] w-full min-h-[400px] sm:min-h-[420px] bg-black rounded-lg sm:rounded-xl overflow-hidden"
                  allow="fullscreen"
                  onLoad={() => setLoading(false)}
                />
              )}
            </div>

            {/* Controles - Escondidos no mobile, visíveis no desktop */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex items-center gap-2 text-cyan-200 font-semibold text-sm uppercase tracking-wide mb-2">
                  <Keyboard className="h-4 w-4" />
                  Controles padrão
                </div>
                <ul className="space-y-2 text-xs text-cyan-50/80 font-medium">
                  <li><span className="text-cyan-100 font-semibold">Setas</span> · Direção</li>
                  <li><span className="text-cyan-100 font-semibold">A / S</span> · Start / Select</li>
                  <li><span className="text-cyan-100 font-semibold">Z / X / C / D</span> · Botões A · B · Y · X</li>
                  <li><span className="text-cyan-100 font-semibold">Q / W</span> · L / R</li>
                  <li><span className="text-cyan-100 font-semibold">Enter</span> · Menu do emulador</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-emerald-200 font-semibold text-sm uppercase tracking-wide mb-2">
                  Status
                </div>
                <dl className="space-y-2 text-xs text-emerald-50/80 font-medium">
                  <div className="flex justify-between">
                    <dt>Emulador</dt>
                    <dd className={`font-semibold ${error ? 'text-rose-200' : loading ? 'text-amber-200' : 'text-emerald-100'}`}>
                      {error ? 'Erro' : loading ? 'Inicializando...' : 'Rodando'}
                    </dd>
                  </div>
                  {romSource && (
                    <>
                      <div className="flex justify-between">
                        <dt>Tamanho da ROM</dt>
                        <dd className="font-semibold text-emerald-100">{formatSize(romSource.size)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Formato</dt>
                        <dd className="font-semibold text-emerald-100">{romSource.format}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <dt>Saída</dt>
                    <dd className="font-semibold text-emerald-100">Esc ou “Sair do jogo”</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
      </div>
    </div>
  );
};

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, power);
  const shouldRound = size >= 10 || Math.abs(size - Math.round(size)) < 1e-6;
  return `${shouldRound ? Math.round(size) : size.toFixed(1)} ${units[power]}`;
}

export default GamePlayer;
