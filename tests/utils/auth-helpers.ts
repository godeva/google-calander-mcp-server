import { AuthToken, UserProfile } from '../../src/types';

/**
 * Creates a mock AuthToken for testing
 * 
 * @returns {AuthToken} A mock auth token object
 */
export const createMockAuthToken = (): AuthToken => {
  return {
    accessToken: 'mock-access-token-123',
    refreshToken: 'mock-refresh-token-456',
    expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
    tokenType: 'Bearer',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
  };
};

/**
 * Creates a mock expired AuthToken for testing
 * 
 * @returns {AuthToken} A mock expired auth token object
 */
export const createExpiredAuthToken = (): AuthToken => {
  return {
    accessToken: 'expired-access-token-123',
    refreshToken: 'mock-refresh-token-456',
    expiresAt: Date.now() - 1000, // Already expired
    tokenType: 'Bearer',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
  };
};

/**
 * Creates a mock UserProfile for testing
 * 
 * @returns {UserProfile} A mock user profile object
 */
export const createMockUserProfile = (): UserProfile => {
  return {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    givenName: 'Test',
    familyName: 'User',
    picture: 'https://example.com/profile.jpg',
    locale: 'en-US',
    timezone: 'America/New_York',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-10'),
    lastLoginAt: new Date()
  };
};

/**
 * Mocks a Google OAuth token response
 * 
 * @returns {Object} A mock Google token response
 */
export const mockGoogleTokenResponse = () => {
  return {
    access_token: 'google-access-token-123',
    refresh_token: 'google-refresh-token-456',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'profile email https://www.googleapis.com/auth/calendar',
    id_token: 'mock-id-token'
  };
};

/**
 * Creates a mock Express request object for testing authentication middleware
 * 
 * @param {Object} options - Customization options
 * @returns {Object} A mock Express request object
 */
export const createMockRequest = (options: {
  authenticated?: boolean;
  headers?: Record<string, string>;
  user?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
} = {}) => {
  return {
    headers: {
      authorization: options.authenticated ? 'Bearer mock-token' : undefined,
      ...options.headers
    },
    user: options.user,
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    id: 'req-123'
  };
};

/**
 * Creates a mock Express response object for testing middleware
 * 
 * @returns {Object} A mock Express response object with spies
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};