import pino from 'pino'

// Create logger instance with configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true,
  },
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
})

// Export logger with typed methods
export default logger

// Helper function to create child loggers with context
export function createLogger(context: string) {
  return logger.child({ context })
}

// Log levels:
// - debug: Detailed information for debugging
// - info: General informational messages
// - warn: Warning messages for potentially harmful situations
// - error: Error messages for failures
// - fatal: Critical errors that may cause application failure
