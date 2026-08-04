const DEBUG = import.meta.env.DEV;

export function logError(msg: string, ...args: unknown[]) {
  if (!DEBUG) {return;}
  // eslint-disable-next-line no-console
  console.error(`[${msg}]`, ...args);
}

export function logInfo(msg: string, ...args: unknown[]) {
  if (!DEBUG) {return;}
  // eslint-disable-next-line no-console
  console.info(`[${msg}]`, ...args);
}
