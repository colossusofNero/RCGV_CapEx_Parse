# Logging System

This project uses [Pino](https://getpino.io/) for structured logging.

## Usage

### Basic Logging

```typescript
import logger from '@/lib/logger'

logger.info('Processing PDF file')
logger.warn('OCR page limit exceeded', { pages: 15, limit: 10 })
logger.error('Failed to parse PDF', { error: err.message })
```

### Context-Specific Logging

Create a child logger with context for better traceability:

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('pdf-parser')
log.debug('Starting text extraction')
log.info('Extraction complete', { pages: 5, amount: '$1,234.56' })
```

## Log Levels

- **debug**: Detailed information for debugging
- **info**: General informational messages
- **warn**: Warning messages for potentially harmful situations
- **error**: Error messages for failures
- **fatal**: Critical errors that may cause application failure

## Configuration

Set the log level via environment variable:

```bash
LOG_LEVEL=debug npm run dev
```

Available levels: `debug`, `info`, `warn`, `error`, `fatal`

## Replacing Console Statements

Replace existing console statements with appropriate log levels:

```typescript
// Before
console.log('Processing file:', filename)
console.error('Error:', error)

// After
logger.info({ filename }, 'Processing file')
logger.error({ error }, 'Error processing file')
```

## Benefits

- **Structured**: Logs are JSON objects, easy to parse and analyze
- **Performant**: Pino is one of the fastest Node.js loggers
- **Contextual**: Attach metadata to every log entry
- **Configurable**: Control verbosity via LOG_LEVEL
- **Pretty printing**: In development, logs are colorized and formatted
