// Test setup and configuration
global.jest = {
  fn: () => ({
    mockResolvedValue: () => {},
    mockRejectedValue: () => {},
    mockImplementation: () => {},
    mockReturnValue: () => {}
  })
};

// Set test environment
process.env.NODE_ENV = 'test';

// Mock the logger module to avoid import.meta.url issues in Jest
jest.mock('../utils/logger.js');
