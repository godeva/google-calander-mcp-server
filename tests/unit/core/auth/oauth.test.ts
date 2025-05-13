import { 
  generateAuthUrl, 
  getTokensFromCode, 
  refreshAccessToken,
  getAuthenticatedClient,
  getUserProfile,
  verifyAccessToken
} from '../../../../src/core/auth/oauth';

// Mock Google OAuth2Client
jest.mock('google-auth-library', () => {
  const mockGetToken = jest.fn().mockImplementation(() => {
    return {
      tokens: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: 'email profile'
      }
    };
  });

  const mockRefreshAccessToken = jest.fn().mockImplementation(() => {
    return {
      credentials: {
        access_token: 'mock-new-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: 'email profile'
      }
    };
  });

  const mockGetTokenInfo = jest.fn().mockImplementation((token) => {
    if (token === 'valid-token') {
      return { expiry_date: Date.now() + 3600 * 1000 };
    }
    throw new Error('Invalid token');
  });

  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock=true'),
        getToken: mockGetToken,
        refreshAccessToken: mockRefreshAccessToken,
        setCredentials: jest.fn(),
        getTokenInfo: mockGetTokenInfo
      };
    })
  };
});

// Mock googleapis
jest.mock('googleapis', () => {
  return {
    google: {
      oauth2: jest.fn().mockImplementation(() => {
        return {
          userinfo: {
            get: jest.fn().mockImplementation(() => {
              return {
                data: {
                  id: 'mock-google-id',
                  email: 'user@example.com',
                  verified_email: true,
                  name: 'Test User',
                  given_name: 'Test',
                  family_name: 'User',
                  picture: 'https://example.com/photo.jpg'
                }
              };
            })
          }
        };
      })
    }
  };
});

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
    google: {
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret',
      redirectUri: 'http://localhost:3000/auth/google/callback',
      scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar']
    }
  }
}));

describe('OAuth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate OAuth URL with default scopes', () => {
      // Arrange & Act
      const url = generateAuthUrl();
      
      // Assert
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?mock=true');
      
      // Verify OAuth2Client constructor was called with correct params
      const { OAuth2Client } = require('google-auth-library');
      expect(OAuth2Client).toHaveBeenCalledWith(
        'mock-client-id',
        'mock-client-secret',
        'http://localhost:3000/auth/google/callback'
      );
      
      // Verify generateAuthUrl was called with correct params
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      expect(oAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
        prompt: 'consent',
        state: ''
      });
    });

    it('should generate OAuth URL with custom scopes and state', () => {
      // Arrange
      const customScopes = ['email', 'profile'];
      const customState = 'custom-state-value';
      
      // Act
      const url = generateAuthUrl(customScopes, customState);
      
      // Assert
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?mock=true');
      
      // Verify generateAuthUrl was called with custom params
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      expect(oAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: customScopes,
        prompt: 'consent',
        state: customState
      });
    });
  });

  describe('getTokensFromCode', () => {
    it('should exchange authorization code for tokens', async () => {
      // Arrange
      const authCode = 'mock-auth-code';
      
      // Act
      const tokens = await getTokensFromCode(authCode);
      
      // Assert
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      expect(oAuth2Client.getToken).toHaveBeenCalledWith(authCode);
      
      expect(tokens).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: expect.any(Number),
        tokenType: 'Bearer',
        scope: ['email', 'profile']
      });
    });

    it('should throw error when no access token is received', async () => {
      // Arrange
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      
      // Mock getToken to return no access_token
      oAuth2Client.getToken.mockImplementationOnce(() => ({
        tokens: { refresh_token: 'mock-refresh-token' } // No access_token
      }));
      
      // Act & Assert
      await expect(getTokensFromCode('code')).rejects.toThrow('No access token received');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      // Arrange
      const refreshToken = 'mock-refresh-token';
      
      // Act
      const tokens = await refreshAccessToken(refreshToken);
      
      // Assert
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      
      expect(oAuth2Client.setCredentials).toHaveBeenCalledWith({
        refresh_token: refreshToken
      });
      expect(oAuth2Client.refreshAccessToken).toHaveBeenCalled();
      
      expect(tokens).toEqual({
        accessToken: 'mock-new-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: expect.any(Number),
        tokenType: 'Bearer',
        scope: ['email', 'profile']
      });
    });
  });

  describe('getAuthenticatedClient', () => {
    it('should create an authenticated OAuth client with access token', () => {
      // Arrange
      const accessToken = 'mock-access-token';
      
      // Act
      const client = getAuthenticatedClient(accessToken);
      
      // Assert
      const { OAuth2Client } = require('google-auth-library');
      expect(OAuth2Client).toHaveBeenCalledWith('mock-client-id', 'mock-client-secret');
      
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      expect(oAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: accessToken
      });
      
      expect(client).toBe(oAuth2Client);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile using access token', async () => {
      // Arrange
      const accessToken = 'mock-access-token';
      
      // Act
      const profile = await getUserProfile(accessToken);
      
      // Assert
      const { google } = require('googleapis');
      expect(google.oauth2).toHaveBeenCalledWith({
        version: 'v2',
        auth: expect.any(Object)
      });
      
      expect(profile).toEqual({
        id: 'mock-google-id',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg'
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should return true for valid token', async () => {
      // Arrange
      const accessToken = 'valid-token';
      
      // Act
      const isValid = await verifyAccessToken(accessToken);
      
      // Assert
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = OAuth2Client.mock.results[0].value;
      expect(oAuth2Client.getTokenInfo).toHaveBeenCalledWith(accessToken);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      // Arrange
      const accessToken = 'invalid-token';
      
      // Act
      const isValid = await verifyAccessToken(accessToken);
      
      // Assert
      expect(isValid).toBe(false);
    });
  });
});