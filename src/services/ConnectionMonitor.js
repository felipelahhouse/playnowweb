/**
 * Connection Monitor Service
 * Monitora a saúde da conexão e detecta quando o servidor está down
 */

import Logger from './Logger';

class ConnectionMonitor {
  constructor() {
    this.isServerOnline = true;
    this.lastCheckTime = null;
    this.checkInterval = null;
    this.statusCallbacks = [];
    this.failureCount = 0;
    this.maxFailures = 3;
    this.checkIntervalMs = 15000; // Check a cada 15s
  }

  /**
   * Iniciar monitoramento
   */
  start(socketUrl) {
    this.socketUrl = socketUrl;
    Logger.log('ConnectionMonitor', 'Monitor iniciado', { url: socketUrl });

    // Check imediato
    this.checkServerHealth();

    // Check periódico
    this.checkInterval = setInterval(() => {
      this.checkServerHealth();
    }, this.checkIntervalMs);
  }

  /**
   * Parar monitoramento
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      Logger.log('ConnectionMonitor', 'Monitor parado');
    }
  }

  /**
   * Verificar saúde do servidor
   */
  async checkServerHealth() {
    try {
      this.lastCheckTime = Date.now();
      
      const response = await Promise.race([
        fetch(this.socketUrl, { 
          method: 'GET',
          mode: 'cors',
          timeout: 5000 
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      if (response.ok) {
        this.handleServerOnline();
      } else {
        this.handleServerOffline('Invalid response status');
      }
    } catch (error) {
      this.handleServerOffline(error.message);
    }
  }

  /**
   * Processar quando servidor está online
   */
  handleServerOnline() {
    if (!this.isServerOnline) {
      Logger.log('ConnectionMonitor', 'Servidor voltou online! 🟢');
      this.isServerOnline = true;
      this.failureCount = 0;
      this.notifyStatusChange(true);
    }
  }

  /**
   * Processar quando servidor está offline
   */
  handleServerOffline(reason) {
    this.failureCount++;
    Logger.warn('ConnectionMonitor', `Falha ao conectar ao servidor (${this.failureCount}/${this.maxFailures})`, {
      reason
    });

    if (this.failureCount >= this.maxFailures) {
      if (this.isServerOnline) {
        Logger.error('ConnectionMonitor', 'Servidor aparentemente OFFLINE! 🔴', new Error(reason), {
          failureCount: this.failureCount
        });
        this.isServerOnline = false;
        this.notifyStatusChange(false);
      }
    }
  }

  /**
   * Registrar callback para mudanças de status
   */
  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
  }

  /**
   * Remover callback
   */
  offStatusChange(callback) {
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Notificar subscribers sobre mudança de status
   */
  notifyStatusChange(isOnline) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        Logger.error('ConnectionMonitor', 'Erro em callback de status', error);
      }
    });
  }

  /**
   * Obter status atual
   */
  getStatus() {
    return {
      isOnline: this.isServerOnline,
      lastCheckTime: this.lastCheckTime,
      failureCount: this.failureCount,
      uptime: this.lastCheckTime ? Date.now() - this.lastCheckTime : null
    };
  }

  /**
   * Reset manual
   */
  reset() {
    this.failureCount = 0;
    this.isServerOnline = true;
    Logger.log('ConnectionMonitor', 'Status resetado');
  }
}

export default new ConnectionMonitor();