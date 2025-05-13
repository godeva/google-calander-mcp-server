import { 
  authenticate, 
  requireGoogleAuth, 
  requireRole 
} from '../../../../src/core/auth';
import { 
  verifySessionToken, 
  extractUserId, 
  generateSessionToken,
  handleTokenRefresh,
  needsRefresh,
  encryptToken,
  decryptToken
} from '../../../../src/core/auth/token';
import { 
  generateAuthUrl, 
  getTokensFromCode, 
  refreshAccessToken,
  getUserProfile,
  verifyAccessToken 
} from '../../../../src/core/auth/oauth';
import { AuthToken } from '../../../../src/types';
import { Request, Response, NextFunction } from 'express';
import { createMockAuthToken, createExpiredAuthToken } from '../../../utils/auth-helpers';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-123', email: 'user@example.com' })
}));

// Mock the googleapis and google-auth-library
jest.mock('googleapis', () => ({
  google: {
    oauth2: jest.fn().mockReturnValue({
      userinfo: {
        get: jest.fn().mockResolvedValue({
          data: {
            id: 'google-user-123',
            email: 'user@example.com',
            name: 'Test User'
          }
        })
      }
    })
  }
}));

jest.mock('google-auth-library', () => {
  const mockGetToken = jest.fn().mockResolvedValue({
    tokens: {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expiry_date: Date.now() + 3600 * 1000,
      token_type: 'Bearer',
      scope: 'email profile'
    }
  });

  const mockRefreshAccessToken = jest.fn().mockResolvedValue({
    credentials: {
      access_token: 'refreshed-access-token',
      refresh_token: 'refresh-token',
      expiry_date: Date.now() + 3600 * 1000,
      token_type: 'Bearer',
      scope: 'email profile'
    }
  });

  const mockGetTokenInfo = jest.fn().mockResolvedValue({
    expiry_date: Date.now() + 3600 * 1000
  });

  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      generateAuthUrl: jest.fn().mockReturnValue('https://mock-auth-url.com'),
      getToken: mockGetToken,
      refreshAccessToken: mockRefreshAccessToken,
      setCredentials: jest.fn(),
      getTokenInfo: mockGetTokenInfo
    }))
  };
});

describe('Auth Module', () => {
  // Mock Express objects
  const mockRequest = () => {
    const req: Partial<Request> = {
      headers: {
        authorization: 'Bearer test-token',
        'x-google-token': 'google-token'
      },
      user: undefined
    };
    return req as Request;
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    return res as Response;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should generate a session token', () => {
      // Arrange
      const payload = { userId: 'user-123', email: 'user@example.com' };
      
      // Act
      const token = generateSessionToken(payload);
      
      // Assert
      expect(token).toBeDefined();
      expect(token).toBe('mock.jwt.token');
    });
    
    it('should verify and decode a session token', () => {
      // Arrange
      const token = 'valid.session.token';
      
      // Act
      const decoded = verifySessionToken(token);
      
      // Assert
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('user-123');
    });
    
    it('should extract user ID from token payload', () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'user@example.com' };
      
      // Act
      const userId = extractUserId(payload);
      
      // Assert
      expect(userId).toBe('user-123');
    });
    
    it('should encrypt and decrypt tokens securely', () => {
      // Arrange
      const originalToken = 'secret.token.value';
      
      // Act
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);
      
      // Assert
      expect(encrypted).not.toBe(originalToken);
      expect(decrypted).toBe(originalToken);
    });
    
    it('should determine if token needs refresh', () => {
      // Arrange
      const expiresInMs = 3 * 60 * 1000; // 3 minutes from now
      const expiry = Date.now() + expiresInMs;
      
      // Act
      const needsRefreshNow = needsRefresh(expiry, 5); // Threshold is 5 minutes
      const doesNotNeedRefresh = needsRefresh(expiry, 2); // Threshold is 2 minutes
      
      // Assert
      expect(needsRefreshNow).toBe(true);
      expect(doesNotNeedRefresh).toBe(false);
    });
    
    it('should handle token refresh when needed', async () => {
      // Arrange
      const expiredToken = createExpiredAuthToken();
      
      // Act
      const refreshedToken = await handleTokenRefresh(expiredToken);
      
      // Assert
      expect(refreshedToken).toBeDefined();
      expect(refreshedToken.accessToken).toBe('refreshed-access-token');
    });
  });
  
  describe('OAuth Flow', () => {
    it('should generate authentication URL', () => {
      // Arrange
      const scopes = ['profile', 'email'];
      
      // Act
      const authUrl = generateAuthUrl(scopes);
      
      // Assert
      expect(authUrl).toBe('https://mock-auth-url.com');
    });
    
    it('should get tokens from authorization code', async () => {
      // Arrange
      const authCode = 'auth-code-123';
      
      // Act
      const tokens = await getTokensFromCode(authCode);
      
      // Assert
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBe('new-access-token');
      expect(tokens.refreshToken).toBe('new-refresh-token');
    });
    
    it('should refresh access tokens', async () => {
      // Arrange
      const refreshToken = 'old-refresh-token';
      
      // Act
      const refreshedTokens = await refreshAccessToken(refreshToken);
      
      // Assert
      expect(refreshedTokens).toBeDefined();
      expect(refreshedTokens.accessToken).toBe('refreshed-access-token');
    });
    
    it('should get user profile from access token', async () => {
      // Arrange
      const accessToken = 'valid-access-token';
      
      // Act
      const profile = await getUserProfile(accessToken);
      
      // Assert
      expect(profile).toBeDefined();
      expect(profile.id).toBe('google-user-123');
      expect(profile.email).toBe('user@example.com');
    });
    
    it('should verify access token validity', async () => {
      // Arrange
      const validToken = 'valid-access-token';
      
      // Act
      const isValid = await verifyAccessToken(validToken);
      
      // Assert
      expect(isValid).toBe(true);
    });
  });
  
  describe('Middleware', () => {
    it('should authenticate valid requests', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      
      // Act
      await authenticate(req, res, mockNext);
      
      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe('user-123');
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should reject requests without authorization header', async () => {
      // Arrange
      const req = mockRequest();
      req.headers.authorization = undefined;
      const res = mockResponse();
      
      // Act
      await authenticate(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Authentication required')
      }));
    });
    
    it('should verify Google authentication', async () => {
      // Arrange
      const req = mockRequest();
      req.user = { id: 'user-123', email: 'user@example.com' };
      const res = mockResponse();
      
      // Act
      await requireGoogleAuth(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should enforce role-based access control', () => {
      // Arrange
      const req = mockRequest();
      req.user = { 
        id: 'user-123', 
        email: 'user@example.com',
        role: 'admin'
      };
      const res = mockResponse();
      const middleware = requireRole('admin');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject users with insufficient permissions', () => {
      // Arrange
      const req = mockRequest();
      req.user = { 
        id: 'user-123', 
        email: 'user@example.com',
        role: 'user'
      };
      const res = mockResponse();
      const middleware = requireRole('admin');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Required role: admin')
      }));
    });
  });
});