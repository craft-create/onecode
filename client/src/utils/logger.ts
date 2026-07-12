type LogPayload = (...args: unknown[]) => void;

type Logger = {
  info: LogPayload;
  error: LogPayload;
  warn: LogPayload;
  debug: LogPayload;
};

const formatMessage = (payload: unknown[]): string => {
  if (typeof payload[0] === 'string') return payload[0];
  return 'operation failed';
};

const noopLogger: Logger = {
  info: (..._args: unknown[]): void => {},
  error: (..._args: unknown[]): void => {},
  warn: (..._args: unknown[]): void => {},
  debug: (..._args: unknown[]): void => {},
};

const safeConsole = {
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  debug: (...args: unknown[]) => console.debug(...args),
};

export const logger: Logger = {
  info: (...args: unknown[]) => {
    try {
      safeConsole.info(...args);
    } catch (_err) {
      noopLogger.info(...args);
    }
  },
  error: (...args: unknown[]) => {
    try {
      safeConsole.error(...args);
    } catch (_err) {
      noopLogger.error(...args);
      const message = formatMessage(args);
      if (typeof args[0] === 'string' || args[0] instanceof Error) {
        console.error(message);
      }
    }
  },
  warn: (...args: unknown[]) => {
    try {
      safeConsole.warn(...args);
    } catch (_err) {
      noopLogger.warn(...args);
    }
  },
  debug: (...args: unknown[]) => {
    try {
      safeConsole.debug(...args);
    } catch (_err) {
      noopLogger.debug(...args);
    }
  },
};

export default logger;
