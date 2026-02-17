export type LogContext = Record<string, unknown>

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

const emitLog = (level: LogLevel, message: string, context?: LogContext): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  }

  switch (level) {
    case 'debug':
      if (isDevelopment) {
        console.debug(payload)
      }
      break
    case 'info':
      console.info(payload)
      break
    case 'warn':
      console.warn(payload)
      break
    case 'error':
      console.error(payload)
      break
  }
}

export const logger = {
  debug: (message: string, context?: LogContext): void => emitLog('debug', message, context),
  info: (message: string, context?: LogContext): void => emitLog('info', message, context),
  warn: (message: string, context?: LogContext): void => emitLog('warn', message, context),
  error: (message: string, context?: LogContext): void => emitLog('error', message, context),
}
