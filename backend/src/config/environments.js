/**
 * Environment-specific Configuration Presets
 * Provides predefined configurations for different environments
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Development environment configuration
export const developmentConfig = {
  server: {
    port: 3001,
    host: 'localhost',
    env: 'development',
    cors: {
      origin: '*',
      credentials: true
    }
  },
  database: {
    path: path.join(__dirname, '../../../data'),
    autoload: true,
    timestampData: true,
    corruptAlertThreshold: 0.1
  },
  api: {
    bodyLimit: '10mb',
    timeout: 30000,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for development
      standardHeaders: true,
      legacyHeaders: false
    }
  },
  logging: {
    level: 'debug',
    format: 'simple',
    file: {
      enabled: false
    }
  },
  security: {
    helmet: {
      enabled: false, // Disabled for easier development
      contentSecurityPolicy: false
    },
    trustProxy: false
  },
  features: {
    enableMetrics: true,
    enableHealthCheck: true,
    enableSwagger: true,
    enableDebugRoutes: true
  }
};

// Test environment configuration
export const testConfig = {
  server: {
    port: 0, // Random port for testing
    host: 'localhost',
    env: 'test',
    cors: {
      origin: '*',
      credentials: true
    }
  },
  database: {
    path: path.join(__dirname, '../../../test-data'),
    autoload: true,
    timestampData: false, // Faster tests
    corruptAlertThreshold: 0.1
  },
  api: {
    bodyLimit: '1mb', // Smaller for tests
    timeout: 5000, // Shorter timeout for tests
    rateLimit: {
      windowMs: 1000,
      max: 1000,
      standardHeaders: false,
      legacyHeaders: false
    }
  },
  logging: {
    level: 'error', // Minimal logging during tests
    format: 'simple',
    file: {
      enabled: false
    }
  },
  security: {
    helmet: {
      enabled: false,
      contentSecurityPolicy: false
    },
    trustProxy: false
  },
  features: {
    enableMetrics: false,
    enableHealthCheck: true,
    enableSwagger: false,
    enableDebugRoutes: false
  }
};

// Production environment configuration
export const productionConfig = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: '0.0.0.0', // Listen on all interfaces
    env: 'production',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || false, // Strict CORS in production
      credentials: true
    }
  },
  database: {
    path: process.env.DB_PATH || '/app/data',
    autoload: true,
    timestampData: true,
    corruptAlertThreshold: 0.05 // Lower threshold for production
  },
  api: {
    bodyLimit: '5mb', // Smaller limit for production
    timeout: 30000,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100, // Stricter rate limiting
      standardHeaders: true,
      legacyHeaders: false
    }
  },
  logging: {
    level: 'info',
    format: 'json', // Structured logging for production
    file: {
      enabled: true,
      path: '/app/logs',
      maxSize: '50MB',
      maxFiles: 10
    }
  },
  security: {
    helmet: {
      enabled: true,
      contentSecurityPolicy: false // API doesn't need CSP
    },
    trustProxy: true // Behind reverse proxy in production
  },
  features: {
    enableMetrics: true,
    enableHealthCheck: true,
    enableSwagger: false, // Disabled in production
    enableDebugRoutes: false
  }
};

// Get environment-specific configuration
export function getEnvironmentConfig(env = process.env.NODE_ENV) {
  switch (env) {
    case 'test':
      return testConfig;
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Merge environment config with custom overrides
export function mergeConfig(baseConfig, overrides = {}) {
  function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  return deepMerge(baseConfig, overrides);
}
