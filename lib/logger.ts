/**
 * Structured Logging Utility
 * Provides consistent, production-ready logging with context and metadata
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogContext {
  userId?: string
  requestId?: string
  url?: string
  method?: string
  statusCode?: number
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production"
  private isServer = typeof window === "undefined"

  /**
   * Format log entry as structured JSON
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    if (context) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(this.isDevelopment && { stack: error.stack }),
      }
    }

    if (metadata) {
      entry.metadata = metadata
    }

    return entry
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    // In production, output structured JSON for log aggregation services
    if (!this.isDevelopment) {
      console.log(JSON.stringify(entry))
      return
    }

    // In development, output human-readable format
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ""

    switch (entry.level) {
      case "error":
        console.error(`${prefix}${contextStr}`, entry.message)
        if (entry.error) {
          console.error("Error details:", entry.error)
        }
        if (entry.metadata) {
          console.error("Metadata:", entry.metadata)
        }
        break
      case "warn":
        console.warn(`${prefix}${contextStr}`, entry.message)
        if (entry.metadata) {
          console.warn("Metadata:", entry.metadata)
        }
        break
      case "info":
        console.info(`${prefix}${contextStr}`, entry.message)
        if (entry.metadata) {
          console.info("Metadata:", entry.metadata)
        }
        break
      case "debug":
        console.debug(`${prefix}${contextStr}`, entry.message)
        if (entry.metadata) {
          console.debug("Metadata:", entry.metadata)
        }
        break
    }
  }

  /**
   * Log an error with full context
   */
  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    if (!this.isServer) return // Only log on server
    const entry = this.formatLogEntry("error", message, context, error, metadata)
    this.output(entry)
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    if (!this.isServer) return
    const entry = this.formatLogEntry("warn", message, context, undefined, metadata)
    this.output(entry)
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    if (!this.isServer) return
    const entry = this.formatLogEntry("info", message, context, undefined, metadata)
    this.output(entry)
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    if (!this.isServer || !this.isDevelopment) return
    const entry = this.formatLogEntry("debug", message, context, undefined, metadata)
    this.output(entry)
  }

  /**
   * Create a child logger with persistent context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    const originalError = this.error.bind(this)
    const originalWarn = this.warn.bind(this)
    const originalInfo = this.info.bind(this)
    const originalDebug = this.debug.bind(this)

    childLogger.error = (message, error, additionalContext, metadata) => {
      originalError(message, error, { ...context, ...additionalContext }, metadata)
    }

    childLogger.warn = (message, additionalContext, metadata) => {
      originalWarn(message, { ...context, ...additionalContext }, metadata)
    }

    childLogger.info = (message, additionalContext, metadata) => {
      originalInfo(message, { ...context, ...additionalContext }, metadata)
    }

    childLogger.debug = (message, additionalContext, metadata) => {
      originalDebug(message, { ...context, ...additionalContext }, metadata)
    }

    return childLogger
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Create a logger for API routes with automatic request context
 */
export function createApiLogger(request: Request, userId?: string): Logger {
  return logger.child({
    url: request.url,
    method: request.method,
    userId,
    requestId: crypto.randomUUID(),
  })
}
