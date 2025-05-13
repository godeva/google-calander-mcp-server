import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Global teardown after all tests
afterAll(async () => {
  // Add any cleanup operations here
  // For example, close any connections that might remain open
});