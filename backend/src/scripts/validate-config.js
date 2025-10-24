#!/usr/bin/env node
/**
 * Configuration Validation Script
 * Validates the current configuration and reports any issues
 */

import { config, isDevelopment, isProduction, isTest } from '../config/index.js';

console.log('🔧 Configuration Validation Report');
console.log('==================================');

// Environment information
console.log(`\n📊 Environment: ${config.server.env}`);
console.log(`🏠 Host: ${config.server.host}`);
console.log(`🚪 Port: ${config.server.port}`);

// Database configuration
console.log(`\n💾 Database Configuration:`);
console.log(`  📁 Path: ${config.database.path}`);
console.log(`  🔄 Autoload: ${config.database.autoload}`);
console.log(`  ⏰ Timestamp Data: ${config.database.timestampData}`);

// API configuration
console.log(`\n🌐 API Configuration:`);
console.log(`  📦 Body Limit: ${config.api.bodyLimit}`);
console.log(`  ⏱️  Timeout: ${config.api.timeout}ms`);
console.log(`  🚦 Rate Limit: ${config.api.rateLimit.max} requests per ${config.api.rateLimit.windowMs / 1000}s`);

// CORS configuration
console.log(`\n🔒 CORS Configuration:`);
console.log(`  🌍 Origin: ${JSON.stringify(config.server.cors.origin)}`);
console.log(`  🍪 Credentials: ${config.server.cors.credentials}`);

// Logging configuration
console.log(`\n📝 Logging Configuration:`);
console.log(`  📊 Level: ${config.logging.level}`);
console.log(`  📋 Format: ${config.logging.format}`);
console.log(`  📄 File Logging: ${config.logging.file.enabled ? 'Enabled' : 'Disabled'}`);

// Security configuration
console.log(`\n🛡️  Security Configuration:`);
console.log(`  ⛑️  Helmet: ${config.security.helmet.enabled ? 'Enabled' : 'Disabled'}`);
console.log(`  🔗 Trust Proxy: ${config.security.trustProxy}`);

// Feature flags
console.log(`\n🚀 Feature Flags:`);
console.log(`  📈 Metrics: ${config.features.enableMetrics ? 'Enabled' : 'Disabled'}`);
console.log(`  ❤️  Health Check: ${config.features.enableHealthCheck ? 'Enabled' : 'Disabled'}`);
console.log(`  📚 Swagger: ${config.features.enableSwagger ? 'Enabled' : 'Disabled'}`);
console.log(`  🐛 Debug Routes: ${config.features.enableDebugRoutes ? 'Enabled' : 'Disabled'}`);

// Environment-specific warnings
console.log(`\n⚠️  Environment Warnings:`);

if (isProduction()) {
  const warnings = [];
  
  if (config.server.cors.origin === '*') {
    warnings.push('CORS is set to allow all origins in production');
  }
  
  if (config.features.enableSwagger) {
    warnings.push('Swagger documentation is enabled in production');
  }
  
  if (config.features.enableDebugRoutes) {
    warnings.push('Debug routes are enabled in production');
  }
  
  if (config.logging.level === 'debug') {
    warnings.push('Debug logging is enabled in production');
  }
  
  if (warnings.length > 0) {
    warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  } else {
    console.log('  ✅ No production warnings');
  }
}

if (isDevelopment()) {
  console.log('  ℹ️  Development mode - all features enabled for easier debugging');
}

if (isTest()) {
  console.log('  🧪 Test mode - optimized for fast test execution');
}

console.log(`\n✅ Configuration validation complete!`);
console.log(`🔧 Environment: ${config.server.env}`);
console.log(`🚀 Ready to start server on ${config.server.host}:${config.server.port}`);
