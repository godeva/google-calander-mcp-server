import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
// import { redis } from '../src/utils/redis'; // Commented out as the module doesn't exist yet

// Extend Jest timeout for all tests
jest.setTimeout(30000);

// Mock setTimeout and setInterval
jest.useFakeTimers();

// Load environment variables for testing
dotenv.config({ path: '.env.test' });
if (!process.env.NODE_ENV) {
  // Fallback to .env file if .env.test doesn't exist
  dotenv.config();
}

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// MongoDB in-memory server
let mongoServer: MongoMemoryServer;

// Setup before running any tests
beforeAll(async () => {
  // Create MongoDB in-memory server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set database connection for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Connect to in-memory database if mongoose is being used
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to in-memory MongoDB');
    } catch (error) {
      console.warn('MongoDB connection not used, skipping connection');
    }
  }
  
  // Redis is not implemented yet, so we're commenting this out
  // try {
  //   await redis.flushall();
  //   console.log('Redis cache cleared');
  // } catch (error) {
  //   console.warn('Redis connection not available, skipping cache clear');
  // }
});

// Clean up after each test
afterEach(async () => {
  // Reset mocks between tests
  jest.clearAllMocks();
  
  // Redis is not implemented yet
  // try {
  //   await redis.flushall();
  // } catch (error) {
  //   // Redis connection not available, skip
  // }
  
  // Clear MongoDB collections if needed
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Global teardown after all tests
afterAll(async () => {
  // Close mongoose connection if open
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from in-memory MongoDB');
  }
  
  // Stop MongoDB in-memory server
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB in-memory server stopped');
  }
  
  // Redis is not implemented yet
  // try {
  //   await redis.quit();
  //   console.log('Redis connection closed');
  // } catch (error) {
  //   // Redis connection not available, skip
  // }
  
  // Clean up any timers
  jest.useRealTimers();
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep error for debugging but make other methods silent
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // error: jest.fn(), // Uncomment to silence errors completely
};