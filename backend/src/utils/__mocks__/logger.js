/**
 * Mock Logger for Jest Tests
 * 
 * Provides a simple mock implementation of the logger to avoid
 * import.meta.url issues in Jest's CommonJS environment.
 */

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logRequest: jest.fn(),
  logError: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logBusinessLogic: jest.fn(),
  stream: {
    write: jest.fn()
  }
};

export default mockLogger;
