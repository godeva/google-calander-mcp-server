import { Router, Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * Webhooks Router
 * 
 * This module handles incoming webhooks from various services.
 */

// Create router
const router = Router();

/**
 * Verify webhook signature middleware
 * Ensures that webhook requests are authentic
 */
const verifyWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get signature from headers
    const signature = req.headers['x-webhook-signature'] as string;
    
    if (!signature) {
      logger.warn('Webhook request missing signature header');
      return res.status(401).json({
        error: 'Missing webhook signature'
      });
    }
    
    // Create signature using webhook secret
    const hmac = createHmac('sha256', config.security.webhookSecret);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures using timing-safe comparison
    // Use Buffer to convert to same format for comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * Handle Google Calendar webhooks
 * 
 * This endpoint receives notifications when calendar events change.
 */
router.post('/google/calendar', verifyWebhookSignature, async (req, res) => {
  try {
    logger.info('Received Google Calendar webhook:', req.body);
    
    // Extract notification data
    const { 
      channelId, 
      resourceId, 
      resourceUri, 
      messageNumber, 
      changed 
    } = req.body;
    
    // In a real implementation, this would process the notification
    // For example, fetch updated events and update the database
    
    // Acknowledge the webhook
    res.status(200).json({
      received: true,
      channelId
    });
    
    // Process the notification asynchronously
    setImmediate(() => {
      logger.info(`Processing calendar notification for ${resourceId}`);
      // In a real implementation, this would update cached data,
      // notify users of changes, etc.
    });
    
  } catch (error) {
    logger.error('Error handling Google Calendar webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
});

/**
 * Handle Google Drive/Docs webhooks
 * 
 * This endpoint receives notifications when documents change.
 */
router.post('/google/drive', verifyWebhookSignature, async (req, res) => {
  try {
    logger.info('Received Google Drive webhook:', req.body);
    
    // Extract notification data
    const { 
      channelId, 
      resourceId,
      resourceUri,
      changed
    } = req.body;
    
    // Acknowledge the webhook
    res.status(200).json({
      received: true,
      channelId
    });
    
    // Process the notification asynchronously
    setImmediate(() => {
      logger.info(`Processing drive notification for ${resourceId}`);
      // In a real implementation, this would update document metadata,
      // notify users of changes, etc.
    });
    
  } catch (error) {
    logger.error('Error handling Google Drive webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
});

/**
 * OAuth callback handler
 * 
 * This endpoint handles OAuth callbacks from Google.
 */
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      logger.warn('OAuth callback missing code parameter');
      return res.status(400).json({
        error: 'Missing code parameter'
      });
    }
    
    logger.info('Received OAuth callback');
    
    // In a real implementation, this would exchange the code for tokens
    // and store them in the database
    
    // For demonstration, redirect to a success page
    res.redirect('/auth-success?state=' + state);
    
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).json({
      error: 'Failed to process OAuth callback'
    });
  }
});

/**
 * Error notification webhook
 * 
 * This endpoint receives error notifications from various services.
 */
router.post('/errors', async (req, res) => {
  try {
    logger.error('Received error notification:', req.body);
    
    // In a real implementation, this would log errors,
    // potentially notify developers, etc.
    
    res.status(200).json({
      received: true
    });
    
  } catch (error) {
    logger.error('Error handling error notification:', error);
    res.status(500).json({
      error: 'Failed to process error notification'
    });
  }
});

/**
 * Health check route for webhooks
 * 
 * This endpoint allows external services to verify the webhook endpoint is up.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Export the router
export { router };