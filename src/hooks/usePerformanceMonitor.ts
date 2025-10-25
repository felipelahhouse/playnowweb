import { useEffect, useRef, useState, useCallback } from 'react';

export interface PerformanceData {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: number;
  networkLatency: number;
  timestamp: number;
}

interface PerformanceAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [performance, setPerformance] = useState<PerformanceData>({
    fps: 60,
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: 0,
    networkLatency: 0,
    timestamp: Date.now()
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const monitorsRef = useRef<Map<string, () => void>>(new Map());

  // 📊 Monitorar FPS
  const monitorFPS = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      
      setPerformance(prev => ({
        ...prev,
        fps,
        timestamp: now
      }));

      // Alerta se FPS muito baixo
      if (fps < 30 && fps > 0) {
        addAlert('warning', `⚠️ FPS baixo: ${fps} (esperado: 60)`);
      }

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    frameCountRef.current++;

    if (enabled) {
      rafRef.current = requestAnimationFrame(monitorFPS);
    }
  }, [enabled]);

  // 💾 Monitorar Memória
  const monitorMemory = useCallback(() => {
    if (!performance.memory || !('memory' in performance)) return;

    try {
      const memory = (performance as any).memory;
      if (memory && memory.jsHeapSizeLimit) {
        const used = memory.usedJSHeapSize;
        const total = memory.jsHeapSizeLimit;
        const percentage = (used / total) * 100;

        setPerformance(prev => ({
          ...prev,
          memory: { used, total, percentage }
        }));

        // Alerta se memória alta
        if (percentage > 85) {
          addAlert('warning', `⚠️ Memória alta: ${percentage.toFixed(1)}%`);
        }

        if (percentage > 95) {
          addAlert('critical', `❌ Memória crítica: ${percentage.toFixed(1)}%`);
        }
      }
    } catch (e) {
      // Performance API não disponível
    }
  }, []);

  // 🌐 Monitorar Network
  const monitorNetwork = useCallback((latency: number) => {
    setPerformance(prev => ({
      ...prev,
      networkLatency: latency
    }));

    if (latency > 200) {
      addAlert('warning', `⚠️ Latência alta: ${latency}ms`);
    }

    if (latency > 500) {
      addAlert('critical', `❌ Latência crítica: ${latency}ms`);
    }
  }, []);

  // ⚠️ Adicionar alerta
  const addAlert = useCallback((level: 'info' | 'warning' | 'critical', message: string) => {
    setAlerts(prev => [
      ...prev.slice(-9), // Manter apenas os últimos 10
      { level, message, timestamp: Date.now() }
    ]);

    // Auto-remover após 5 segundos se for info
    if (level === 'info') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.message !== message));
      }, 5000);
    }
  }, []);

  // Inicializar monitoramento
  useEffect(() => {
    if (!enabled) return;

    // FPS Monitor
    rafRef.current = requestAnimationFrame(monitorFPS);

    // Memory Monitor (a cada 5 segundos)
    const memoryInterval = setInterval(monitorMemory, 5000);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      clearInterval(memoryInterval);
    };
  }, [enabled, monitorFPS, monitorMemory]);

  return {
    performance,
    alerts,
    monitorNetwork,
    addAlert,
    clearAlerts: () => setAlerts([])
  };
};

/**
 * Hook customizado para medir latência específica
 */
export const useLatencyMeasure = (enabled: boolean = true) => {
  const [latency, setLatency] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const measureLatency = useCallback(async (url: string) => {
    try {
      const start = performance.now();
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      const end = performance.now();
      const lat = end - start;

      setLatency(lat);
      setHistory(prev => [...prev.slice(-19), lat]);

      return lat;
    } catch (error) {
      console.error('Erro ao medir latência:', error);
      return null;
    }
  }, []);

  const getAverageLatency = useCallback(() => {
    if (history.length === 0) return 0;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }, [history]);

  return {
    latency,
    history,
    measureLatency,
    getAverageLatency
  };
};

/**
 * Hook para analytics de performance
 */
export const usePerformanceAnalytics = () => {
  const sessionStartRef = useRef(Date.now());
  const eventsRef = useRef<Array<{ type: string; duration: number; timestamp: number }>>([]);

  const recordEvent = useCallback((eventType: string, duration: number) => {
    eventsRef.current.push({
      type: eventType,
      duration,
      timestamp: Date.now()
    });
  }, []);

  const getSessionAnalytics = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartRef.current;
    const eventsByType = new Map<string, number[]>();

    eventsRef.current.forEach(event => {
      if (!eventsByType.has(event.type)) {
        eventsByType.set(event.type, []);
      }
      eventsByType.get(event.type)!.push(event.duration);
    });

    const summary: Record<string, { count: number; avgDuration: number; minDuration: number; maxDuration: number }> = {};

    eventsByType.forEach((durations, type) => {
      summary[type] = {
        count: durations.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations)
      };
    });

    return {
      sessionDuration,
      totalEvents: eventsRef.current.length,
      summary
    };
  }, []);

  return {
    recordEvent,
    getSessionAnalytics,
    clearAnalytics: () => {
      eventsRef.current = [];
      sessionStartRef.current = Date.now();
    }
  };
};