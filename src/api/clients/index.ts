import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import config from '../../config';
import { authenticate } from '../../core/auth';

/**
 * Client Interfaces Router
 * 
 * This module provides client-specific interfaces for the MCP server,
 * including web clients, mobile apps, and third-party integrations.
 */

// Create router
const router = Router();

/**
 * Get client configuration
 * This endpoint returns configuration information for client applications
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    // Return client-safe configuration
    res.status(200).json({
      apiVersion: 'v1',
      features: {
        nlpEnabled: true,
        schedulingEnabled: true,
        documentCreationEnabled: true
      },
      endpoints: {
        mcp: `${config.app.apiBaseUrl}/v1/mcp/process`,
        auth: `${config.app.apiBaseUrl}/v1/auth/google/login`,
        nlp: `${config.app.apiBaseUrl}/v1/nlp/process`
      },
      ui: {
        theme: 'light',
        logo: '/assets/logo.png',
        supportEmail: 'support@example.com'
      }
    });
  } catch (error) {
    logger.error('Error getting client configuration:', error);
    res.status(500).json({
      error: 'Failed to get client configuration'
    });
  }
});

/**
 * Get user profile data for the client
 * This endpoint returns the user's profile with client-specific data
 */
router.get('/profile', authenticate, (req: Request, res: Response) => {
  try {
    // Return user profile (would typically be fetched from a database)
    res.status(200).json({
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}`,
      preferences: {
        defaultCalendarId: 'primary',
        defaultMeetingDuration: 30,
        timezone: 'America/New_York'
      },
      permissions: [
        'calendar.read',
        'calendar.write',
        'docs.read',
        'docs.write'
      ]
    });
  } catch (error) {
    logger.error('Error getting user profile for client:', error);
    res.status(500).json({
      error: 'Failed to get user profile'
    });
  }
});

/**
 * Web client interface
 * This endpoint serves the web client
 */
router.get('/web', (req: Request, res: Response) => {
  try {
    // In a real implementation, this would serve the web client
    // or redirect to it. For demo purposes, we'll just return info.
    res.status(200).json({
      message: 'Web client would be served here',
      url: '/clients/web/index.html'
    });
  } catch (error) {
    logger.error('Error serving web client:', error);
    res.status(500).json({
      error: 'Failed to serve web client'
    });
  }
});

/**
 * Mobile client API
 * This endpoint provides mobile-specific functionality
 */
router.get('/mobile/config', (req: Request, res: Response) => {
  try {
    // Return mobile-specific configuration
    res.status(200).json({
      minimumVersion: '1.0.0',
      requiresUpdate: false,
      features: {
        pushNotifications: true,
        offline: true,
        widgets: true
      }
    });
  } catch (error) {
    logger.error('Error getting mobile configuration:', error);
    res.status(500).json({
      error: 'Failed to get mobile configuration'
    });
  }
});

/**
 * Third-party integration API key management
 */
router.get('/integrations/keys', authenticate, (req: Request, res: Response) => {
  try {
    // Return API keys (would typically be fetched from a secure store)
    res.status(200).json({
      message: 'API keys would be managed here'
    });
  } catch (error) {
    logger.error('Error managing API keys:', error);
    res.status(500).json({
      error: 'Failed to manage API keys'
    });
  }
});

// Export the router
export { router };