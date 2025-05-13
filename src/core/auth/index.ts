import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, extractUserId } from './token';
import { verifyAccessToken } from './oauth';
import { logger } from '../../utils/logger';
import { createApiError } from '../../utils/error-handler';

/**
 * Authentication and authorization module
 */

// Re-export all auth utilities
export * from './oauth';
export * from './token';

/**
 * Authentication middleware to protect routes
 * Verifies session token from Authorization header
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createApiError(401, 'Authentication required');
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifySessionToken(token);
    
    // Add user info to request object
    req.user = {
      id: extractUserId(decoded),
      email: decoded.email,
      name: decoded.name
    };
    
    // Generate request ID for tracking
    req.id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(createApiError(401, 'Invalid or expired authentication token'));
  }
};

/**
 * Google API token verification middleware
 * Verifies that the user has a valid Google access token
 */
export const requireGoogleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError(401, 'Authentication required');
    }
    
    // In a real implementation, fetch the user's Google token from a database
    // For demo purposes, we'll just look for it in the request headers
    const googleToken = req.headers['x-google-token'] as string;
    
    if (!googleToken) {
      throw createApiError(401, 'Google authentication required');
    }
    
    const isValid = await verifyAccessToken(googleToken);
    
    if (!isValid) {
      throw createApiError(401, 'Invalid or expired Google token');
    }
    
    next();
  } catch (error) {
    logger.error('Google authentication error:', error);
    next(error);
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createApiError(401, 'Authentication required');
      }
      
      // In a real implementation, check roles from user data in the database
      // For demo purposes, we're just checking a hardcoded role
      const userRole = req.user.role || 'user';
      
      if (userRole !== requiredRole && userRole !== 'admin') {
        throw createApiError(403, `Required role: ${requiredRole}`);
      }
      
      next();
    } catch (error) {
      logger.error('RBAC error:', error);
      next(error);
    }
  };
};