// Logger general per al backend
// Escriu directament a la consola amb format estructurat

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  module: string;
  operation: string;
  details?: Record<string, unknown>;
  error?: string;
}

export function log(message: LogEntry) {
  const prefix = `[${message.module.toUpperCase()} ${message.level.toUpperCase()}]`;

  const logData = {
    ...message,
  };

  console.log(`${prefix} ${message.operation}`, logData);
}

// Funcions helpers per a diferents nivells
export function logInfo(module: string, operation: string, details?: Record<string, unknown>) {
  log({ timestamp: new Date().toISOString(), level: "info", module, operation, details });
}

export function logWarn(module: string, operation: string, details?: Record<string, unknown>) {
  log({ timestamp: new Date().toISOString(), level: "warn", module, operation, details });
}

export function logError(
  module: string,
  operation: string,
  error?: string,
  details?: Record<string, unknown>,
) {
  log({ timestamp: new Date().toISOString(), level: "error", module, operation, error, details });
}

export function logSuccess(module: string, operation: string, details?: Record<string, unknown>) {
  log({ timestamp: new Date().toISOString(), level: "success", module, operation, details });
}
