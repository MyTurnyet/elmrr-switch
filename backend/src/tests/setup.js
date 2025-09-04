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
