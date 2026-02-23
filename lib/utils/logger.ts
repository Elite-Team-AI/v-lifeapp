/**
 * Lightweight logging utility with environment awareness
 * In production, only warnings and errors are logged
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// In production, only show warnings and errors
const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatMessage(prefix: string, message: string): string {
  return `[${prefix}] ${message}`
}

export const logger = {
  debug(prefix: string, message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      console.log(formatMessage(prefix, message), ...args)
    }
  },

  info(prefix: string, message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      console.info(formatMessage(prefix, message), ...args)
    }
  },

  warn(prefix: string, message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(formatMessage(prefix, message), ...args)
    }
  },

  error(prefix: string, message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(formatMessage(prefix, message), ...args)
    }
  },
}

// Create namespaced loggers for different parts of the app
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(namespace, message, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(namespace, message, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(namespace, message, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(namespace, message, ...args),
  }
}

// Pre-configured loggers for common areas
export const dashboardLog = createLogger('Dashboard')
export const authLog = createLogger('Auth')
export const habitsLog = createLogger('Habits')
export const profileLog = createLogger('Profile')
export const communityLog = createLogger('Community')
export const apiLog = createLogger('API')

/**
 * Create an API-specific logger that includes request context
 * Usage: const log = createApiLogger(request)
 */
export function createApiLogger(request: { method?: string; url?: string } | Request) {
  const method = 'method' in request ? request.method : 'UNKNOWN'
  const url = 'url' in request ? request.url : 'UNKNOWN'
  const namespace = `API:${method}:${url}`

  return {
    debug: (message: string, _?: unknown, context?: Record<string, unknown>) => {
      if (shouldLog('debug')) {
        console.log(formatMessage(namespace, message), context || {})
      }
    },
    info: (message: string, _?: unknown, context?: Record<string, unknown>) => {
      if (shouldLog('info')) {
        console.info(formatMessage(namespace, message), context || {})
      }
    },
    warn: (message: string, _?: unknown, context?: Record<string, unknown>) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage(namespace, message), context || {})
      }
    },
    error: (message: string, error?: Error, _?: unknown, context?: Record<string, unknown>) => {
      if (shouldLog('error')) {
        console.error(formatMessage(namespace, message), error, context || {})
      }
    },
  }
}
