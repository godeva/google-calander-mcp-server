import jwt from 'jsonwebtoken';
import { 
  generateSessionToken, 
  verifySessionToken, 
  encryptToken, 
  decryptToken,
  needsRefresh,
  handleTokenRefresh,
  extractUserId,
  createAuthHeader
} from '../../../../src/core/auth/token';
import { AuthToken } from '../../../../src/types';

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, secret, options) => {
    return `mocked-jwt-token.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token.startsWith('mocked-jwt-token.')) {
      const base64Payload = token.split('.')[1];
      return JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    }
    throw new Error('Invalid token');
  })
}));

// Mock the OAuth module
jest.mock('../../../../src/core/auth/oauth', () => ({
  refreshAccessToken: jest.fn().mockImplementation(async (refreshToken) => {
    return {
      accessToken: 'new-access-token',
      refreshToken: refreshToken, // Return the same refresh token
      expiresAt: Date.now() + 3600 * 1000,
      tokenType: 'Bearer',
      scope: ['email', 'profile']
    };
  })
}));

// Mock the logger
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock config
jest.mock('../../../../src/config', () => ({
  default: {
    security: {
      jwtSecret: 'test-jwt-secret'
    }
  }
}));

describe('Token Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('should generate a JWT token with the provided payload', () => {
      // Arrange
      const payload = { sub: 'user-123', name: 'Test User' };
      
      // Act
      const token = generateSessionToken(payload);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-jwt-secret', { expiresIn: '24h' });
      expect(token).toContain('mocked-jwt-token');
    });

    it('should use custom expiry time when provided', () => {
      // Arrange
      const payload = { sub: 'user-123' };
      const expiresIn = '1h';
      
      // Act
      generateSessionToken(payload, expiresIn);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-jwt-secret', { expiresIn });
    });
  });

  describe('verifySessionToken', () => {
    it('should verify and return decoded token payload', () => {
      // Arrange
      const payload = { sub: 'user-123', name: 'Test User' };
      const token = generateSessionToken(payload);
      
      // Act
      const decoded = verifySessionToken(token);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret');
      expect(decoded).toEqual(payload);
    });

    it('should throw an error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid-token';
      
      // Act & Assert
      expect(() => verifySessionToken(invalidToken)).toThrow();
    });
  });

  describe('encryptToken and decryptToken', () => {
    it('should encrypt and decrypt token', () => {
      // Arrange
      const originalToken = 'original-token-value';
      
      // Act
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);
      
      // Assert
      expect(encrypted).not.toEqual(originalToken); // Should be different
      expect(decrypted).toEqual(originalToken); // Should decrypt back to original
    });

    it('should handle empty token', () => {
      // Arrange
      const emptyToken = '';
      
      // Act
      const encrypted = encryptToken(emptyToken);
      const decrypted = decryptToken(encrypted);
      
      // Assert
      expect(decrypted).toEqual(emptyToken);
    });
  });

  describe('needsRefresh', () => {
    it('should return true when token is about to expire', () => {
      // Arrange
      const expiresAt = Date.now() + 4 * 60 * 1000; // 4 minutes from now
      const thresholdMinutes = 5; // 5 minute threshold
      
      // Act
      const result = needsRefresh(expiresAt, thresholdMinutes);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token is not about to expire', () => {
      // Arrange
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      const thresholdMinutes = 5; // 5 minute threshold
      
      // Act
      const result = needsRefresh(expiresAt, thresholdMinutes);
      
      // Assert
      expect(result).toBe(false);
    });

    it('should use default threshold when not specified', () => {
      // Arrange
      const expiresAt = Date.now() + 4 * 60 * 1000; // 4 minutes from now
      // Default threshold is 5 minutes
      
      // Act
      const result = needsRefresh(expiresAt);
      
      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleTokenRefresh', () => {
    it('should refresh token when it needs refreshing', async () => {
      // Arrange
      const refreshAccessToken = require('../../../../src/core/auth/oauth').refreshAccessToken;
      const token: AuthToken = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 4 * 60 * 1000, // About to expire
        tokenType: 'Bearer',
        scope: ['email', 'profile']
      };
      
      // Act
      const refreshedToken = await handleTokenRefresh(token);
      
      // Assert
      expect(refreshAccessToken).toHaveBeenCalledWith(token.refreshToken);
      expect(refreshedToken.accessToken).toBe('new-access-token');
    });

    it('should return original token when it does not need refreshing', async () => {
      // Arrange
      const refreshAccessToken = require('../../../../src/core/auth/oauth').refreshAccessToken;
      const token: AuthToken = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 10 * 60 * 1000, // Not about to expire
        tokenType: 'Bearer',
        scope: ['email', 'profile']
      };
      
      // Act
      const refreshedToken = await handleTokenRefresh(token);
      
      // Assert
      expect(refreshAccessToken).not.toHaveBeenCalled();
      expect(refreshedToken).toBe(token);
    });

    it('should not attempt refresh if no refresh token is available', async () => {
      // Arrange
      const refreshAccessToken = require('../../../../src/core/auth/oauth').refreshAccessToken;
      const token: AuthToken = {
        accessToken: 'access-token',
        refreshToken: '', // No refresh token
        expiresAt: Date.now() + 4 * 60 * 1000, // About to expire
        tokenType: 'Bearer',
        scope: ['email', 'profile']
      };
      
      // Act
      const refreshedToken = await handleTokenRefresh(token);
      
      // Assert
      expect(refreshAccessToken).not.toHaveBeenCalled();
      expect(refreshedToken).toBe(token);
    });
  });

  describe('extractUserId', () => {
    it('should extract user ID from token payload', () => {
      // Arrange
      const payload = { sub: 'user-123', name: 'Test User' };
      
      // Act
      const userId = extractUserId(payload);
      
      // Assert
      expect(userId).toBe('user-123');
    });

    it('should throw error for missing user ID in payload', () => {
      // Arrange
      const payload = { name: 'Test User' }; // No sub field
      
      // Act & Assert
      expect(() => extractUserId(payload)).toThrow('missing user ID');
    });

    it('should throw error for null payload', () => {
      // Arrange
      const payload = null;
      
      // Act & Assert
      expect(() => extractUserId(payload)).toThrow('missing user ID');
    });
  });

  describe('createAuthHeader', () => {
    it('should create authorization header with token', () => {
      // Arrange
      const accessToken = 'test-access-token';
      
      // Act
      const header = createAuthHeader(accessToken);
      
      // Assert
      expect(header).toBe('Bearer test-access-token');
    });
  });
});