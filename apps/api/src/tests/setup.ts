// Test setup file
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Global test configuration
jest.setTimeout(30000);

// Suppress console.log during tests unless explicitly needed
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
