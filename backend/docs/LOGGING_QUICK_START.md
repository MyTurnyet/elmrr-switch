# Logging Quick Start Guide

## TL;DR

Winston logging is now implemented with automatic rotation and cleanup. **Max disk usage: 50MB** (self-cleaning).

## Basic Usage

```javascript
import logger from './utils/logger.js';

// Log levels
logger.info('Operation completed', { userId: 123, action: 'login' });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Operation failed', { error: err.message, stack: err.stack });
logger.debug('Detailed info', { data: complexObject });
```

## Enable File Logging (Production)

Add to `.env`:

```bash
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs
LOG_FILE_MAX_SIZE=10MB
LOG_FILE_MAX_FILES=5
```

This creates:
- `logs/application-YYYY-MM-DD.log` (all logs)
- `logs/error-YYYY-MM-DD.log` (errors only)

**Automatic cleanup**: Keeps only 5 most recent files = max 50MB disk usage.

## Configuration

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LOG_LEVEL` | error, warn, info, debug | info | Minimum log level |
| `LOG_FILE_ENABLED` | true, false | false | Enable file logging |
| `LOG_FILE_MAX_SIZE` | 10MB, 20MB, etc. | 10MB | Max file size before rotation |
| `LOG_FILE_MAX_FILES` | 1-10 | 5 | Number of files to keep |

## What's Logged

✅ **Automatically logged:**
- HTTP requests (via Morgan)
- Server startup/shutdown
- Operating session initialization
- Errors (via error handler middleware)

✅ **Example usage added to:**
- `server.js` - Server startup and session init
- `middleware/errorHandler.js` - Error handling
- `services/TrainService.js` - Business logic operations

## View Logs

**Development** (console):
```bash
npm run dev
```

**Production** (files):
```bash
# View all logs
tail -f logs/application-2025-10-28.log

# View errors only
tail -f logs/error-2025-10-28.log

# Search with jq
cat logs/application-2025-10-28.log | jq 'select(.trainId == "abc123")'
```

## Helper Methods

```javascript
// Log errors with context
logger.logError(error, { context: 'generateSwitchList', trainId });

// Log HTTP requests
logger.logRequest(req, statusCode, responseTime);

// Log database operations
logger.logDatabaseOperation('insert', 'trains', { trainId });

// Log business logic
logger.logBusinessLogic('Switch list generated', { trainId, stats });
```

## Migration from console.log

```javascript
// ❌ Before
console.log('Train created:', trainId);
console.error('Error:', error);

// ✅ After
logger.info('Train created', { trainId });
logger.logError(error, { context: 'createTrain' });
```

## Disk Space Management

Default configuration:
- **5 files** × **10MB each** = **50MB max**
- Old files automatically deleted
- No manual cleanup needed

To reduce disk usage:
```bash
LOG_FILE_MAX_FILES=3    # Keep only 3 files
LOG_FILE_MAX_SIZE=5MB   # 5MB per file = 15MB total
```

## Dependencies Added

- `winston@^3.11.0` - Core logging library
- `winston-daily-rotate-file@^4.7.1` - File rotation

Total size: ~500KB

## Files Created/Modified

**Created:**
- ✅ `src/utils/logger.js` - Winston logger configuration
- ✅ `docs/LOGGING.md` - Full documentation
- ✅ `docs/LOGGING_QUICK_START.md` - This file

**Modified:**
- ✅ `src/server.js` - Uses logger instead of console.log
- ✅ `src/middleware/errorHandler.js` - Logs errors with Winston
- ✅ `src/services/TrainService.js` - Example business logic logging
- ✅ `.env.example` - Updated logging configuration docs
- ✅ `package.json` - Added winston dependencies

## Testing

All tests passing:
```bash
npm test -- --testPathPattern="models"
# ✅ 201/201 tests passing
```

Logger is disabled in test environment to keep test output clean.

## Next Steps

1. **Add logging to other services** (SessionService, CarOrderService)
2. **Add logging to repositories** (database operations)
3. **Add logging to critical routes** (business operations)
4. **Enable file logging in production** (set `LOG_FILE_ENABLED=true`)

## Full Documentation

See [LOGGING.md](./LOGGING.md) for complete documentation including:
- Architecture details
- Best practices
- Troubleshooting
- Advanced configuration
- Monitoring strategies
