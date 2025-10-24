/**
 * Configuration Management System
 * Centralized configuration with environment-based settings and validation
 */

import path from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration schema for validation
const configSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().integer().min(1).max(65535).default(3001),
    host: Joi.string().default('localhost'),
    env: Joi.string().valid('development', 'test', 'production').default('development'),
    cors: Joi.object({
      origin: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
        Joi.boolean()
      ).default('*'),
      credentials: Joi.boolean().default(true)
    }).default()
  }).default(),

  database: Joi.object({
    path: Joi.string().default(path.join(__dirname, '../../../data')),
    autoload: Joi.boolean().default(true),
    timestampData: Joi.boolean().default(true),
    corruptAlertThreshold: Joi.number().default(0.1)
  }).default(),

  api: Joi.object({
    bodyLimit: Joi.string().default('10mb'),
    timeout: Joi.number().integer().min(1000).default(30000),
    rateLimit: Joi.object({
      windowMs: Joi.number().integer().default(15 * 60 * 1000), // 15 minutes
      max: Joi.number().integer().default(100), // limit each IP to 100 requests per windowMs
      standardHeaders: Joi.boolean().default(true),
      legacyHeaders: Joi.boolean().default(false)
    }).default()
  }).default(),

  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    format: Joi.string().valid('json', 'simple', 'combined').default('simple'),
    file: Joi.object({
      enabled: Joi.boolean().default(false),
      path: Joi.string().default(path.join(__dirname, '../../../logs')),
      maxSize: Joi.string().default('10MB'),
      maxFiles: Joi.number().integer().default(5)
    }).default()
  }).default(),

  security: Joi.object({
    helmet: Joi.object({
      enabled: Joi.boolean().default(true),
      contentSecurityPolicy: Joi.boolean().default(false) // Disable for API
    }).default(),
    trustProxy: Joi.boolean().default(false)
  }).default(),

  features: Joi.object({
    enableMetrics: Joi.boolean().default(false),
    enableHealthCheck: Joi.boolean().default(true),
    enableSwagger: Joi.boolean().default(process.env.NODE_ENV !== 'production'),
    enableDebugRoutes: Joi.boolean().default(process.env.NODE_ENV === 'development')
  }).default()
});

// Raw configuration from environment variables
const rawConfig = {
  server: {
    port: parseInt(process.env.PORT) || undefined,
    host: process.env.HOST,
    env: process.env.NODE_ENV,
    cors: {
      origin: process.env.CORS_ORIGIN ? 
        (process.env.CORS_ORIGIN.includes(',') ? 
          process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : 
          process.env.CORS_ORIGIN) : 
        undefined,
      credentials: process.env.CORS_CREDENTIALS ? process.env.CORS_CREDENTIALS === 'true' : undefined
    }
  },
  database: {
    path: process.env.DB_PATH,
    autoload: process.env.DB_AUTOLOAD ? process.env.DB_AUTOLOAD === 'true' : undefined,
    timestampData: process.env.DB_TIMESTAMP ? process.env.DB_TIMESTAMP === 'true' : undefined,
    corruptAlertThreshold: parseFloat(process.env.DB_CORRUPT_THRESHOLD) || undefined
  },
  api: {
    bodyLimit: process.env.BODY_LIMIT,
    timeout: parseInt(process.env.API_TIMEOUT) || undefined,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || undefined,
      max: parseInt(process.env.RATE_LIMIT_MAX) || undefined,
      standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS ? 
        process.env.RATE_LIMIT_STANDARD_HEADERS === 'true' : undefined,
      legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS ? 
        process.env.RATE_LIMIT_LEGACY_HEADERS === 'true' : undefined
    }
  },
  logging: {
    level: process.env.LOG_LEVEL,
    format: process.env.LOG_FORMAT,
    file: {
      enabled: process.env.LOG_FILE_ENABLED ? process.env.LOG_FILE_ENABLED === 'true' : undefined,
      path: process.env.LOG_FILE_PATH,
      maxSize: process.env.LOG_FILE_MAX_SIZE,
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || undefined
    }
  },
  security: {
    helmet: {
      enabled: process.env.HELMET_ENABLED ? process.env.HELMET_ENABLED === 'true' : undefined,
      contentSecurityPolicy: process.env.HELMET_CSP ? process.env.HELMET_CSP === 'true' : undefined
    },
    trustProxy: process.env.TRUST_PROXY ? process.env.TRUST_PROXY === 'true' : undefined
  },
  features: {
    enableMetrics: process.env.ENABLE_METRICS ? process.env.ENABLE_METRICS === 'true' : undefined,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK ? process.env.ENABLE_HEALTH_CHECK === 'true' : undefined,
    enableSwagger: process.env.ENABLE_SWAGGER ? process.env.ENABLE_SWAGGER === 'true' : undefined,
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES ? process.env.ENABLE_DEBUG_ROUTES === 'true' : undefined
  }
};

// Remove undefined values to let Joi apply defaults
function removeUndefined(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleanedNested = removeUndefined(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

const cleanedConfig = removeUndefined(rawConfig);

// Validate and apply defaults
const { error, value: config } = configSchema.validate(cleanedConfig, {
  allowUnknown: false,
  stripUnknown: true
});

if (error) {
  console.error('Configuration validation failed:');
  console.error(error.details.map(detail => `  - ${detail.message}`).join('\n'));
  process.exit(1);
}

// Helper functions
export const isDevelopment = () => config.server.env === 'development';
export const isProduction = () => config.server.env === 'production';
export const isTest = () => config.server.env === 'test';

// Configuration getters with type safety
export const getServerConfig = () => config.server;
export const getDatabaseConfig = () => config.database;
export const getApiConfig = () => config.api;
export const getLoggingConfig = () => config.logging;
export const getSecurityConfig = () => config.security;
export const getFeaturesConfig = () => config.features;

// Main configuration export
export { config };
export default config;
