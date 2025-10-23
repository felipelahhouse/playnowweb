/**
 * Logger Service - Logging centralizado e formatado
 * Ajuda a debugar problemas de multiplicidade
 */

class Logger {
  constructor() {
    this.logs = [];
    this.MAX_LOGS = 100;
    this.DEBUG_MODE = import.meta.env.DEV || localStorage.getItem('LOGGER_DEBUG') === 'true';
    this.correlationId = this.generateCorrelationId();
  }

  generateCorrelationId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatMessage(level, module, message, data) {
    const timestamp = new Date().toISOString();
    const formatted = {
      timestamp,
      correlationId: this.correlationId,
      level,
      module,
      message,
      data,
      userAgent: navigator.userAgent.substring(0, 50)
    };
    return formatted;
  }

  addLog(formatted) {
    this.logs.push(formatted);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  log(module, message, data) {
    const formatted = this.formatMessage('INFO', module, message, data);
    this.addLog(formatted);
    if (this.DEBUG_MODE) {
      console.log(`[${module}] ${message}`, data);
    }
  }

  warn(module, message, data) {
    const formatted = this.formatMessage('WARN', module, message, data);
    this.addLog(formatted);
    console.warn(`⚠️ [${module}] ${message}`, data);
  }

  error(module, message, error, data) {
    const errorData = {
      ...data,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorType: error?.name
    };
    const formatted = this.formatMessage('ERROR', module, message, errorData);
    this.addLog(formatted);
    console.error(`❌ [${module}] ${message}`, error, data);
  }

  debug(module, message, data) {
    if (this.DEBUG_MODE) {
      const formatted = this.formatMessage('DEBUG', module, message, data);
      this.addLog(formatted);
      console.debug(`🔍 [${module}] ${message}`, data);
    }
  }

  /**
   * Obter logs formatados para export
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Exportar logs como JSON
   */
  exportLogs() {
    const data = {
      correlationId: this.correlationId,
      exportTime: new Date().toISOString(),
      logs: this.logs
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${this.correlationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Limpar logs
   */
  clear() {
    this.logs = [];
    console.log('📋 Logs cleared');
  }

  /**
   * Filtrar logs
   */
  filterLogs(module = null, level = null) {
    return this.logs.filter(log => {
      const moduleMatch = !module || log.module === module;
      const levelMatch = !level || log.level === level;
      return moduleMatch && levelMatch;
    });
  }

  /**
   * Habilitar debug mode
   */
  enableDebugMode() {
    this.DEBUG_MODE = true;
    localStorage.setItem('LOGGER_DEBUG', 'true');
    console.log('🔍 Debug mode ENABLED');
  }

  /**
   * Desabilitar debug mode
   */
  disableDebugMode() {
    this.DEBUG_MODE = false;
    localStorage.removeItem('LOGGER_DEBUG');
    console.log('🔍 Debug mode DISABLED');
  }
}

export default new Logger();