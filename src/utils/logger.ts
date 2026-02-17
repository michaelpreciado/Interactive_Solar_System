export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const parseLogLevel = (): LogLevel => {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }
  const value = typeof meta.env?.VITE_LOG_LEVEL === 'string' ? meta.env.VITE_LOG_LEVEL.toLowerCase() : undefined;
  if (
    value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error'
  ) {
    return value;
  }

  return meta.env?.DEV === true ? 'debug' : 'info';
};

const activeLogLevel = parseLogLevel();

const shouldLog = (level: LogLevel): boolean =>
  LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[activeLogLevel];

const formatPayload = (
  level: LogLevel,
  message: string,
  context?: LogContext
) => ({
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
});

const write = (
  level: LogLevel,
  message: string,
  context?: LogContext
): void => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = formatPayload(level, message, context);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
  }
};

export const logger = {
  debug: (message: string, context?: LogContext): void =>
    write('debug', message, context),
  info: (message: string, context?: LogContext): void =>
    write('info', message, context),
  warn: (message: string, context?: LogContext): void =>
    write('warn', message, context),
  error: (message: string, context?: LogContext): void =>
    write('error', message, context),
};
