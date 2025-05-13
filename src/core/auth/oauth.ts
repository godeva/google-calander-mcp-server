import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { logger } from '../../utils/logger';
import config from '../../config';
import { AuthToken } from '../../types';

/**
 * OAuth2 implementation for Google authentication
 */

// Create OAuth2 client
const oAuth2Client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

/**
 * Generate authentication URL for Google OAuth
 * 
 * @param {string[]} scopes - OAuth scopes to request
 * @param {string} state - State parameter for OAuth flow
 * @returns {string} Authentication URL
 */
export const generateAuthUrl = (
  scopes: string[] = config.google.scopes,
  state: string = ''
): string => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state
  });
};

/**
 * Get tokens from authorization code
 * 
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<AuthToken>} Token information
 */
export const getTokensFromCode = async (code: string): Promise<AuthToken> => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
      tokenType: tokens.token_type || 'Bearer',
      scope: (tokens.scope || '').split(' ')
    };
  } catch (error) {
    logger.error('Error getting tokens from code:', error);
    throw error;
  }
};

/**
 * Refresh access token using a refresh token
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<AuthToken>} Updated token information
 */
export const refreshAccessToken = async (refreshToken: string): Promise<AuthToken> => {
  try {
    oAuth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oAuth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token || '',
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
      tokenType: credentials.token_type || 'Bearer',
      scope: (credentials.scope || '').split(' ')
    };
  } catch (error) {
    logger.error('Error refreshing access token:', error);
    throw error;
  }
};

/**
 * Get Google API client with authenticated credentials
 * 
 * @param {string} accessToken - Access token
 * @returns {OAuth2Client} Authenticated Google OAuth2 client
 */
export const getAuthenticatedClient = (accessToken: string): OAuth2Client => {
  const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret
  );
  
  client.setCredentials({
    access_token: accessToken
  });
  
  return client;
};

/**
 * Get user profile from access token
 * 
 * @param {string} accessToken - Access token
 * @returns {Promise<any>} User profile information
 */
export const getUserProfile = async (accessToken: string): Promise<any> => {
  try {
    const client = getAuthenticatedClient(accessToken);
    const oauth2 = google.oauth2({
      version: 'v2',
      auth: client
    });
    
    const { data } = await oauth2.userinfo.get();
    return data;
  } catch (error) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Verify access token validity
 * 
 * @param {string} accessToken - Access token to verify
 * @returns {Promise<boolean>} Whether the token is valid
 */
export const verifyAccessToken = async (accessToken: string): Promise<boolean> => {
  try {
    const client = getAuthenticatedClient(accessToken);
    const tokenInfo = await client.getTokenInfo(accessToken);
    
    // Check if token has not expired
    return !!tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now();
  } catch (error) {
    logger.error('Error verifying access token:', error);
    return false;
  }
};