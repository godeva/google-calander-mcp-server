import { Request, Response } from 'express';
import { CommandContext, CommandResult } from '../../src/types';

/**
 * Test helpers for unit and integration tests
 */

/**
 * Create a mock Express request
 * 
 * @param customProps - Custom properties to add to the request
 * @returns A mocked Express request object
 */
export const createMockRequest = (customProps: Partial<Request> = {}): Partial<Request> => {
  return {
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json'
    },
    body: {},
    query: {},
    params: {},
    ...customProps
  };
};

/**
 * Create a mock Express response with Jest mock functions
 * 
 * @returns A mocked Express response object with Jest functions
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
};

/**
 * Create a mock command context for testing command handlers
 * 
 * @param customProps - Custom properties to add to the context
 * @returns A mocked command context
 */
export const createMockCommandContext = (customProps: Partial<CommandContext> = {}): CommandContext => {
  return {
    userId: 'test-user-id',
    userEmail: 'test@example.com',
    requestId: 'test-request-id',
    timestamp: new Date().toISOString(),
    sessionData: {},
    ...customProps
  };
};

/**
 * Create a successful command result
 * 
 * @param data - Result data
 * @returns Success command result
 */
export const createSuccessResult = (data: any = {}): CommandResult => {
  return {
    success: true,
    data
  };
};

/**
 * Create an error command result
 * 
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns Error command result
 */
export const createErrorResult = (
  code: string = 'UNKNOWN_ERROR',
  message: string = 'An unknown error occurred',
  details?: any
): CommandResult => {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
};

/**
 * Mock async function that resolves with the given value after a delay
 * 
 * @param value - Value to resolve with
 * @param delayMs - Delay in milliseconds
 * @returns Promise that resolves with the value after delay
 */
export const mockResolveAfterDelay = <T>(value: T, delayMs = 10): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delayMs);
  });
};

/**
 * Mock Google OAuth token response
 * 
 * @returns Mock Google OAuth token
 */
export const mockGoogleToken = () => {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    scope: 'https://www.googleapis.com/auth/calendar',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600 * 1000
  };
};

/**
 * Mock Google user profile
 * 
 * @returns Mock Google user profile
 */
export const mockGoogleProfile = () => {
  return {
    id: 'mock-google-id',
    email: 'test@example.com',
    verified_email: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/profile.jpg',
    locale: 'en'
  };
};