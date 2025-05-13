import jwt from 'jsonwebtoken';
import { refreshAccessToken } from './oauth';
import { logger } from '../../utils/logger';
import config from '../../config';
import { AuthToken } from '../../types';

/**
 * Token management for authentication and authorization
 */

// JWT secret
const JWT_SECRET = config.security.jwtSecret;

/**
 * Generate a JWT session token
 * 
 * @param {Object} payload - Token payload data
 * @param {string} expiresIn - Token expiration time (default: '24h')
 * @returns {string} Signed JWT token
 */
export const generateSessionToken = (
  payload: Record<string, any>,
  expiresIn: string = '24h'
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT session token
 * 
 * @param {string} token - JWT token to verify
 * @returns {any} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifySessionToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('Error verifying session token:', error);
    throw error;
  }
};

/**
 * Encrypt a token for secure storage
 * 
 * @param {string} token - Token to encrypt
 * @returns {string} Encrypted token
 */
export const encryptToken = (token: string): string => {
  // Simple encryption for demo purposes
  // In production, use a proper encryption library
  return Buffer.from(token).toString('base64');
};

/**
 * Decrypt a token from secure storage
 * 
 * @param {string} encryptedToken - Encrypted token
 * @returns {string} Decrypted token
 */
export const decryptToken = (encryptedToken: string): string => {
  // Simple decryption for demo purposes
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
};

/**
 * Check if token needs refreshing based on expiry time
 * 
 * @param {number} expiresAt - Token expiry timestamp
 * @param {number} thresholdMinutes - Minutes threshold before expiry to trigger refresh
 * @returns {boolean} Whether token needs refreshing
 */
export const needsRefresh = (
  expiresAt: number,
  thresholdMinutes: number = 5
): boolean => {
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return Date.now() > expiresAt - thresholdMs;
};

/**
 * Handle token refresh if needed
 * 
 * @param {AuthToken} token - Current token information
 * @returns {Promise<AuthToken>} Refreshed token information if needed
 */
export const handleTokenRefresh = async (token: AuthToken): Promise<AuthToken> => {
  try {
    if (needsRefresh(token.expiresAt) && token.refreshToken) {
      logger.info('Refreshing access token');
      return await refreshAccessToken(token.refreshToken);
    }
    return token;
  } catch (error) {
    logger.error('Error handling token refresh:', error);
    throw error;
  }
};

/**
 * Extract user ID from token payload
 * 
 * @param {any} payload - Decoded token payload
 * @returns {string} User ID
 */
export const extractUserId = (payload: any): string => {
  if (!payload || !payload.sub) {
    throw new Error('Invalid token payload: missing user ID');
  }
  return payload.sub;
};

/**
 * Create authorization header with token
 * 
 * @param {string} accessToken - Access token
 * @returns {string} Authorization header value
 */
export const createAuthHeader = (accessToken: string): string => {
  return `Bearer ${accessToken}`;
};