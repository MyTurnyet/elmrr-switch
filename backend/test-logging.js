/**
 * Logging System Test Script
 * 
 * Run this to see the logging system in action:
 *   node test-logging.js
 * 
 * This demonstrates all logging levels and helper methods.
 */

import logger from './src/utils/logger.js';

console.log('\n🧪 Testing ELMRR Switch Logging System\n');
console.log('=' .repeat(60));

// Test basic log levels
console.log('\n📝 Testing Log Levels:\n');

logger.debug('This is a DEBUG message', { 
  detail: 'Only visible when LOG_LEVEL=debug',
  timestamp: new Date().toISOString()
});

logger.info('This is an INFO message', { 
  operation: 'test',
  status: 'success',
  count: 42
});

logger.warn('This is a WARNING message', { 
  issue: 'Deprecated API usage',
  endpoint: '/api/old-endpoint',
  suggestion: 'Use /api/v1/new-endpoint instead'
});

logger.error('This is an ERROR message', { 
  error: {
    name: 'TestError',
    message: 'Something went wrong',
    code: 'TEST_ERROR'
  },
  context: 'test-logging'
});

// Test helper methods
console.log('\n🛠️  Testing Helper Methods:\n');

// Mock request object
const mockReq = {
  method: 'POST',
  path: '/api/v1/trains',
  ip: '127.0.0.1',
  get: (header) => header === 'user-agent' ? 'Test-Agent/1.0' : null
};

logger.logRequest(mockReq, 201, 45);
logger.logRequest(mockReq, 404, 12);
logger.logRequest(mockReq, 500, 150);

// Mock error object
const mockError = new Error('Test error for demonstration');
mockError.code = 'DEMO_ERROR';

logger.logError(mockError, { 
  context: 'test-logging',
  trainId: 'abc123',
  operation: 'generateSwitchList'
});

logger.logDatabaseOperation('insert', 'trains', {
  trainId: 'abc123',
  name: 'Vancouver Local',
  status: 'Planned'
});

logger.logBusinessLogic('Switch list generated', {
  trainId: 'abc123',
  trainName: 'Vancouver Local',
  stationsServed: 5,
  carsAssigned: 12,
  totalPickups: 8,
  totalSetouts: 4
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n✅ Logging System Test Complete!\n');
console.log('Configuration:');
console.log('  - Console logging: ✅ Enabled (you see output above)');
console.log('  - File logging: ❌ Disabled by default');
console.log('  - Log level: info (debug messages hidden)');
console.log('\nTo enable file logging:');
console.log('  1. Create .env file: cp .env.example .env');
console.log('  2. Set: LOG_FILE_ENABLED=true');
console.log('  3. Logs will be written to: ./logs/');
console.log('\nSee docs/LOGGING_QUICK_START.md for more info.\n');
