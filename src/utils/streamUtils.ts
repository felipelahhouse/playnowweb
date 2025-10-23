/**
 * 🎥 Utilitários para Sistema de Live Streams
 * Funções auxiliares para otimização e gerenciamento de streams
 */

import { doc, updateDoc, serverTimestamp, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Calcula o tamanho estimado de um frame baseado na qualidade
 */
export function estimateFrameSize(quality: 'high' | 'medium' | 'low'): number {
  const sizes = {
    high: 40000,   // ~40 KB
    medium: 20000, // ~20 KB
    low: 10000     // ~10 KB
  };
  return sizes[quality];
}

/**
 * Calcula o uso de banda estimado por segundo
 */
export function estimateBandwidth(fps: number, quality: 'high' | 'medium' | 'low'): number {
  const frameSize = estimateFrameSize(quality);
  return frameSize * fps; // bytes por segundo
}

/**
 * Formata o uso de banda para exibição
 */
export function formatBandwidth(bytesPerSecond: number): string {
  const kbps = (bytesPerSecond * 8) / 1000;
  const mbps = kbps / 1000;
  
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} Mbps`;
  }
  return `${kbps.toFixed(0)} Kbps`;
}

/**
 * Calcula a duração de uma stream
 */
export function getStreamDuration(startedAt: string | Date): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = now - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Valida configurações de stream
 */
export function validateStreamConfig(config: {
  title: string;
  fps: number;
  quality: string;
}): { valid: boolean; error?: string } {
  if (!config.title || config.title.trim().length === 0) {
    return { valid: false, error: 'Título é obrigatório' };
  }

  if (config.title.length > 100) {
    return { valid: false, error: 'Título muito longo (máximo 100 caracteres)' };
  }

  if (config.fps < 1 || config.fps > 30) {
    return { valid: false, error: 'FPS deve estar entre 1 e 30' };
  }

  if (!['high', 'medium', 'low'].includes(config.quality)) {
    return { valid: false, error: 'Qualidade inválida' };
  }

  return { valid: true };
}

/**
 * Limpa streams inativas (mais de 5 minutos sem atualização)
 */
export async function cleanupInactiveStreams(): Promise<number> {
  try {
    const streamsRef = collection(db, 'live_streams');
    const snapshot = await getDocs(streamsRef);
    
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    let cleanedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const updatedAt = data.updatedAt?.toMillis() || 0;
      
      if (data.isLive && updatedAt < fiveMinutesAgo) {
        // Marcar como offline
        await updateDoc(doc(db, 'live_streams', docSnap.id), {
          isLive: false,
          endedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Remover frame
        try {
          await deleteDoc(doc(db, 'live_stream_frames', docSnap.id));
        } catch (error) {
          console.warn('Failed to delete frame:', error);
        }
        
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up inactive streams:', error);
    return 0;
  }
}

/**
 * Otimiza a qualidade da imagem baseada na conexão
 */
export function getOptimalQuality(connectionSpeed: 'fast' | 'medium' | 'slow'): {
  fps: number;
  quality: 'high' | 'medium' | 'low';
} {
  const configs = {
    fast: { fps: 15, quality: 'high' as const },
    medium: { fps: 10, quality: 'medium' as const },
    slow: { fps: 5, quality: 'low' as const }
  };
  
  return configs[connectionSpeed];
}

/**
 * Detecta a velocidade da conexão (simplificado)
 */
export async function detectConnectionSpeed(): Promise<'fast' | 'medium' | 'slow'> {
  // @ts-ignore - Navigator.connection não está em todos os tipos
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return 'medium'; // Padrão se não conseguir detectar
  }
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '4g') {
    return 'fast';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'slow';
  }
}

/**
 * Comprime uma imagem canvas para base64
 */
export function compressCanvasImage(
  canvas: HTMLCanvasElement,
  quality: 'high' | 'medium' | 'low'
): string | null {
  try {
    const scale = quality === 'high' ? 0.6 : quality === 'medium' ? 0.45 : 0.3;
    const width = Math.max(160, Math.floor(canvas.width * scale));
    const height = Math.max(120, Math.floor(canvas.height * scale));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    const ctx = tempCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    });

    if (!ctx) {
      tempCanvas.remove();
      return null;
    }

    ctx.drawImage(canvas, 0, 0, width, height);

    const jpegQuality = quality === 'high' ? 0.7 : quality === 'medium' ? 0.5 : 0.35;
    const imageData = tempCanvas.toDataURL('image/jpeg', jpegQuality);

    tempCanvas.remove();
    return imageData;
  } catch (error) {
    console.error('Error compressing image:', error);
    return null;
  }
}

/**
 * Formata número de viewers
 */
export function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Gera URL de compartilhamento
 */
export function generateShareUrl(streamId: string): string {
  return `${window.location.origin}/streams/${streamId}`;
}

/**
 * Copia texto para área de transferência
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Compartilha stream usando Web Share API
 */
export async function shareStream(
  streamId: string,
  title: string,
  streamerName: string,
  gameTitle: string
): Promise<boolean> {
  const shareData = {
    title: title,
    text: `Assista ${streamerName} jogando ${gameTitle} ao vivo!`,
    url: generateShareUrl(streamId)
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback: copiar link
      return await copyToClipboard(shareData.url);
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.warn('Share failed:', error);
    }
    return false;
  }
}

/**
 * Verifica se o navegador suporta recursos necessários
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!navigator.mediaDevices) {
    missing.push('MediaDevices API');
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    missing.push('getUserMedia');
  }

  if (!window.requestAnimationFrame) {
    missing.push('requestAnimationFrame');
  }

  if (!HTMLCanvasElement.prototype.toDataURL) {
    missing.push('Canvas toDataURL');
  }

  return {
    supported: missing.length === 0,
    missing
  };
}

/**
 * Calcula estatísticas de performance
 */
export class StreamPerformanceMonitor {
  private frameCount = 0;
  private startTime = Date.now();
  private lastFrameTime = Date.now();
  private frameTimes: number[] = [];

  recordFrame() {
    const now = Date.now();
    const frameTime = now - this.lastFrameTime;
    
    this.frameCount++;
    this.frameTimes.push(frameTime);
    this.lastFrameTime = now;

    // Manter apenas últimos 60 frames
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
  }

  getStats() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgFps = this.frameCount / elapsed;
    
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    return {
      totalFrames: this.frameCount,
      averageFps: avgFps.toFixed(1),
      averageFrameTime: avgFrameTime.toFixed(0),
      uptime: Math.floor(elapsed)
    };
  }

  reset() {
    this.frameCount = 0;
    this.startTime = Date.now();
    this.lastFrameTime = Date.now();
    this.frameTimes = [];
  }
}

/**
 * Throttle function para limitar chamadas
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function para atrasar chamadas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}