export interface LogEntry {
  timestamp: string;
  correlationId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
  data?: any;
  userAgent: string;
}

declare class Logger {
  log(module: string, message: string, data?: any): void;
  warn(module: string, message: string, data?: any): void;
  error(module: string, message: string, error: Error, data?: any): void;
  debug(module: string, message: string, data?: any): void;
  getLogs(): LogEntry[];
  exportLogs(): void;
  clear(): void;
  filterLogs(module?: string | null, level?: string | null): LogEntry[];
  enableDebugMode(): void;
  disableDebugMode(): void;
}

declare const logger: Logger;
export default logger;