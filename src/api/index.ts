import { Router } from 'express';
import { authenticate } from '../core/auth';
import { router as mcpRouter } from '../core/router';
import { router as clientsRouter } from './clients';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * API Router
 * 
 * This module sets up the main API routes for the application.
 */

// Create API router
const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: config.app.version,
    timestamp: new Date().toISOString()
  });
});

// API version prefix
const apiVersionPrefix = '/v1';

// MCP router - for handling Google Calendar MCP commands
router.use(`${apiVersionPrefix}/mcp`, authenticate, mcpRouter);

// Client interfaces
router.use(`${apiVersionPrefix}/clients`, clientsRouter);

// Auth routes
router.get(`${apiVersionPrefix}/auth/google/login`, (req, res) => {
  // In a real implementation, this would redirect to Google OAuth
  // For demonstration, we'll just send a response
  res.status(200).json({
    message: 'This would redirect to Google OAuth',
    authUrl: `https://accounts.google.com/o/oauth2/auth?...`
  });
});

router.get(`${apiVersionPrefix}/auth/google/callback`, (req, res) => {
  // In a real implementation, this would handle the OAuth callback
  // For demonstration, we'll just send a response
  res.status(200).json({
    message: 'OAuth callback handled',
    code: req.query.code
  });
});

// User profile route
router.get(`${apiVersionPrefix}/user/profile`, authenticate, (req, res) => {
  res.status(200).json({
    id: req.user?.id,
    email: req.user?.email,
    name: req.user?.name || 'User'
  });
});

// User preferences route
router.get(`${apiVersionPrefix}/user/preferences`, authenticate, (req, res) => {
  res.status(200).json({
    userId: req.user?.id,
    defaultCalendarId: 'primary',
    defaultMeetingDuration: 30,
    workingHours: {
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    },
    timezone: 'America/New_York'
  });
});

router.put(`${apiVersionPrefix}/user/preferences`, authenticate, (req, res) => {
  // In a real implementation, this would update user preferences
  res.status(200).json({
    message: 'Preferences updated',
    preferences: req.body
  });
});

// Natural language processing route
router.post(`${apiVersionPrefix}/nlp/process`, authenticate, (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({
        error: 'Missing input parameter'
      });
    }
    
    // In a real implementation, this would call the NLP module
    res.status(200).json({
      message: 'NLP request received',
      input,
      intent: 'CREATE_EVENT',
      confidence: 0.85,
      entities: [
        { type: 'DATE_TIME', value: 'tomorrow at 2pm' },
        { type: 'DURATION', value: '1 hour' },
        { type: 'TITLE', value: 'Team meeting' }
      ]
    });
  } catch (error) {
    logger.error('Error processing NLP request:', error);
    res.status(500).json({
      error: 'Failed to process natural language input'
    });
  }
});

// Calendar routes
router.get(`${apiVersionPrefix}/calendar/events`, authenticate, (req, res) => {
  // In a real implementation, this would call the Calendar integration
  res.status(200).json({
    events: [
      {
        id: 'event1',
        title: 'Team Meeting',
        startTime: '2023-05-14T14:00:00Z',
        endTime: '2023-05-14T15:00:00Z'
      },
      {
        id: 'event2',
        title: 'Product Review',
        startTime: '2023-05-15T10:00:00Z',
        endTime: '2023-05-15T11:30:00Z'
      }
    ]
  });
});

router.post(`${apiVersionPrefix}/calendar/events`, authenticate, (req, res) => {
  // In a real implementation, this would call the Calendar integration
  res.status(201).json({
    message: 'Event created',
    event: {
      id: 'new-event-id',
      ...req.body
    }
  });
});

// Docs routes
router.get(`${apiVersionPrefix}/docs`, authenticate, (req, res) => {
  // In a real implementation, this would call the Docs integration
  res.status(200).json({
    documents: [
      {
        id: 'doc1',
        title: 'Meeting Notes',
        url: 'https://docs.google.com/document/d/doc1'
      },
      {
        id: 'doc2',
        title: 'Project Plan',
        url: 'https://docs.google.com/document/d/doc2'
      }
    ]
  });
});

router.post(`${apiVersionPrefix}/docs`, authenticate, (req, res) => {
  // In a real implementation, this would call the Docs integration
  res.status(201).json({
    message: 'Document created',
    document: {
      id: 'new-doc-id',
      ...req.body
    }
  });
});

// Export the router
export { router };