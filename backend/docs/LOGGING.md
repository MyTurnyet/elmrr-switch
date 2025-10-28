# Logging System Documentation

## Overview

The ELMRR Switch Backend uses **Winston** for structured logging with automatic file rotation and cleanup. The logging system is designed to be simple, self-cleaning, and production-ready with minimal disk footprint.

## Features

- ✅ **Console logging** in development (colorized, human-readable)
- ✅ **File logging** in production (JSON format, machine-parsable)
- ✅ **Automatic rotation** (daily rotation + size-based rotation)
- ✅ **Self-cleaning** (keeps only N most recent files)
- ✅ **Structured logging** (JSON metadata for easy parsing)
- ✅ **Multiple log levels** (error, warn, info, debug)
- ✅ **Separate error logs** (errors logged to dedicated file)
- ✅ **HTTP request logging** (integrated with Morgan)

## Configuration

### Environment Variables

Configure logging via `.env` file (see `.env.example`):

```bash
# Log level: error, warn, info, debug (default: info)
LOG_LEVEL=info

# Log format: json, simple, combined (default: simple)
LOG_FORMAT=simple

# Enable file logging with automatic rotation (default: false)
LOG_FILE_ENABLED=false

# Directory for log files (default: ./logs)
LOG_FILE_PATH=./logs

# Max size per log file before rotation (default: 10MB)
LOG_FILE_MAX_SIZE=10MB

# Number of log files to keep (default: 5)
# Total disk usage = MAX_SIZE * MAX_FILES (e.g., 10MB * 5 = 50MB max)
LOG_FILE_MAX_FILES=5
```

### Disk Usage

With default settings:
- **Max disk usage**: 50MB (5 files × 10MB each)
- **Typical usage**: 5-10MB for weeks of logs
- **Auto-cleanup**: Old files deleted automatically when limit reached

### Production Configuration

For production, enable file logging:

```bash
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/elmrr-switch
LOG_FILE_MAX_SIZE=10MB
LOG_FILE_MAX_FILES=5
```

## Usage

### Basic Logging

```javascript
import logger from './utils/logger.js';

// Info level (general application flow)
logger.info('Server started', { port: 3001, environment: 'production' });

// Warning level (recoverable issues)
logger.warn('Deprecated API called', { endpoint: '/old-api', userId: 123 });

// Error level (errors that need attention)
logger.error('Database connection failed', { 
  error: err.message, 
  stack: err.stack 
});

// Debug level (detailed debugging info)
logger.debug('Processing request', { 
  method: 'POST', 
  path: '/api/trains',
  body: req.body 
});
```

### Helper Methods

The logger includes helper methods for common patterns:

```javascript
// Log errors with context
logger.logError(error, { 
  context: 'generateSwitchList',
  trainId: 'abc123' 
});

// Log HTTP requests
logger.logRequest(req, statusCode, responseTime);

// Log database operations
logger.logDatabaseOperation('insert', 'trains', { 
  trainId: 'abc123',
  name: 'Vancouver Local' 
});

// Log business logic
logger.logBusinessLogic('Switch list generated', {
  trainId: 'abc123',
  stationsServed: 5,
  carsAssigned: 12
});
```

### Service Layer Example

```javascript
import logger from '../utils/logger.js';

export class TrainService {
  async generateSwitchList(trainId) {
    logger.info('Generating switch list', { trainId });
    
    try {
      // Business logic here
      const result = await this._generateSwitchListAlgorithm(train, route);
      
      logger.info('Switch list generated successfully', {
        trainId,
        trainName: train.name,
        stationsServed: result.stations.length,
        carsAssigned: result.assignedCarIds.length
      });
      
      return result;
    } catch (error) {
      logger.logError(error, { 
        context: 'generateSwitchList',
        trainId 
      });
      throw error;
    }
  }
}
```

## Log Files

When file logging is enabled, logs are written to:

### Application Logs
- **Filename**: `application-YYYY-MM-DD.log`
- **Content**: All log levels (debug, info, warn, error)
- **Format**: JSON (one log entry per line)
- **Rotation**: Daily + size-based (10MB default)

### Error Logs
- **Filename**: `error-YYYY-MM-DD.log`
- **Content**: Error level only
- **Format**: JSON (one log entry per line)
- **Rotation**: Daily + size-based (10MB default)

### Example Log Entry

```json
{
  "timestamp": "2025-10-28T16:15:30.123Z",
  "level": "info",
  "message": "Switch list generated successfully",
  "trainId": "abc123",
  "trainName": "Vancouver Local",
  "stationsServed": 5,
  "carsAssigned": 12
}
```

## Log Levels

### error
- Application errors
- Database failures
- API errors
- Unhandled exceptions

### warn
- Deprecated API usage
- Invalid requests (400 errors)
- Resource not found (404 errors)
- Business rule violations

### info (default)
- Application startup/shutdown
- HTTP requests
- Business operations (train created, session advanced)
- Successful operations

### debug
- Detailed request/response data
- Database queries
- Algorithm steps
- Development debugging

## HTTP Request Logging

HTTP requests are automatically logged via Morgan integration:

```
2025-10-28 16:15:30 [info]: ::1 - - [28/Oct/2025:23:15:30 +0000] "POST /api/v1/trains HTTP/1.1" 201 1234 "-" "Mozilla/5.0..."
```

Requests are logged at different levels based on status code:
- **500+**: error level
- **400-499**: warn level
- **200-399**: info level

## Best Practices

### DO:
- ✅ Log important business operations
- ✅ Include context (IDs, names, counts)
- ✅ Use structured data (objects, not strings)
- ✅ Log errors with stack traces
- ✅ Use appropriate log levels

### DON'T:
- ❌ Log sensitive data (passwords, tokens, PII)
- ❌ Log in tight loops (performance impact)
- ❌ Use console.log() directly (use logger instead)
- ❌ Log entire request/response bodies (too verbose)
- ❌ Forget to include context for debugging

## Monitoring

### View Logs in Development

Logs are printed to console with colors:

```bash
npm run dev
```

### View Logs in Production

When file logging is enabled:

```bash
# View application logs
tail -f logs/application-2025-10-28.log

# View error logs only
tail -f logs/error-2025-10-28.log

# Search logs with jq
cat logs/application-2025-10-28.log | jq 'select(.level == "error")'

# Count errors
cat logs/error-2025-10-28.log | wc -l
```

## Troubleshooting

### Logs not appearing
- Check `LOG_FILE_ENABLED=true` in `.env`
- Verify log directory exists and is writable
- Check `LOG_LEVEL` is not too restrictive

### Disk space issues
- Reduce `LOG_FILE_MAX_FILES` (default: 5)
- Reduce `LOG_FILE_MAX_SIZE` (default: 10MB)
- Enable log rotation more aggressively

### Too verbose
- Increase `LOG_LEVEL` to `warn` or `error`
- Disable debug logging in production

### Performance impact
- File logging has minimal overhead (~1-2ms per log)
- Console logging is slower in production
- Consider disabling console in production if needed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Application Code                     │
│  (routes, services, middleware, repositories)            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  logger.js     │
              │  (Winston)     │
              └────────┬───────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  ┌───────────────┐         ┌──────────────┐
  │   Console     │         │  File Logs   │
  │  (Dev only)   │         │ (Production) │
  └───────────────┘         └──────────────┘
                                    │
                            ┌───────┴────────┐
                            ▼                ▼
                    ┌──────────────┐  ┌──────────┐
                    │ application- │  │  error-  │
                    │ YYYY-MM-DD   │  │YYYY-MM-DD│
                    │    .log      │  │   .log   │
                    └──────────────┘  └──────────┘
                         (auto-rotates & cleans up)
```

## Dependencies

- **winston**: ^3.11.0 - Core logging library
- **winston-daily-rotate-file**: ^4.7.1 - File rotation transport

Total package size: ~500KB

## Migration from console.log

Replace console.log statements with logger:

```javascript
// Before
console.log('Server started on port', port);
console.error('Error:', error.message);

// After
logger.info('Server started', { port });
logger.error('Error occurred', { error: error.message, stack: error.stack });
```

## Future Enhancements

Potential improvements (not currently implemented):

- Log aggregation (e.g., ELK stack, Datadog)
- Real-time log streaming
- Log analysis and alerting
- Performance metrics logging
- Request ID tracking across services
- Log sampling for high-volume endpoints
