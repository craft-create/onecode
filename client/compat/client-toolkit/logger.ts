export interface ToolkitLogger {
  debug: (...messages: unknown[]) => void;
  info: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
}

export const logger: ToolkitLogger = {
  debug: (...messages: unknown[]) => {
    console.debug(...messages);
  },
  info: (...messages: unknown[]) => {
    console.info(...messages);
  },
  warn: (...messages: unknown[]) => {
    console.warn(...messages);
  },
  error: (...messages: unknown[]) => {
    console.error(...messages);
  },
};
