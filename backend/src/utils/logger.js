/**
 * Winston Logger Configuration
 * 
 * Provides structured logging with automatic file rotation and cleanup.
 * 
 * Features:
 * - Console logging in development (colorized, simple format)
 * - File logging in production (JSON format, rotating files)
 * - Automatic cleanup (keeps last N files based on config)
 * - Size-based rotation (prevents disk bloat)
 * - Structured error logging with stack traces
 * 
 * Configuration:
 * - Uses existing config system from config/index.js
 * - Max files: 5 (default) = max 50MB disk usage
 * - Max size per file: 10MB (default)
 * - Log level: info (default), configurable via LOG_LEVEL env var
 * 
 * Usage:
 *   import logger from './utils/logger.js';
 *   
 *   logger.info('Server started', { port: 3001 });
 *   logger.error('Database error', { error: err.message, stack: err.stack });
 *   logger.debug('Request received', { method, path, query });
 *   logger.warn('Deprecated API called', { endpoint: '/old-api' });
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLoggingConfig, isDevelopment, isTest } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loggingConfig = getLoggingConfig();

// Custom format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Filter out empty objects and symbols
      const cleanMeta = Object.entries(meta)
        .filter(([key, value]) => {
          return key !== 'timestamp' && 
                 key !== 'level' && 
                 key !== 'message' &&
                 typeof key !== 'symbol';
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      
      if (Object.keys(cleanMeta).length > 0) {
        metaStr = '\n' + JSON.stringify(cleanMeta, null, 2);
      }
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// JSON format for file output (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [];

// Console transport (always enabled in development, disabled in test)
if (!isTest()) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: isDevelopment() ? 'debug' : loggingConfig.level
    })
  );
}

// File transport (enabled based on config)
if (loggingConfig.file.enabled) {
  const logDir = loggingConfig.file.path;
  
  // Rotating file transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: loggingConfig.file.maxSize,
      maxFiles: loggingConfig.file.maxFiles,
      format: fileFormat,
      level: loggingConfig.level
    })
  );

  // Separate rotating file for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: loggingConfig.file.maxSize,
      maxFiles: loggingConfig.file.maxFiles,
      format: fileFormat,
      level: 'error'
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: loggingConfig.level,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Add stream for Morgan HTTP logging middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods for common logging patterns
logger.logRequest = (req, statusCode, responseTime) => {
  const logData = {
    method: req.method,
    path: req.path,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  if (statusCode >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    ...context
  });
};

logger.logDatabaseOperation = (operation, collection, details = {}) => {
  logger.debug(`Database ${operation}`, {
    collection,
    ...details
  });
};

logger.logBusinessLogic = (action, details = {}) => {
  logger.info(`Business Logic: ${action}`, details);
};

// Log startup information
if (!isTest()) {
  logger.info('Logger initialized', {
    level: loggingConfig.level,
    fileLogging: loggingConfig.file.enabled,
    environment: process.env.NODE_ENV || 'development'
  });
}

export default logger;
