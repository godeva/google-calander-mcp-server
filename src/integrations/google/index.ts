/**
 * Google Integrations
 * 
 * This module exports all Google integration services
 */

// Re-export Google Calendar integration
export * as Calendar from './calendar';

// Re-export Google Docs integration
export * as Docs from './docs';

// Export a combined client factory
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, docs_v1, drive_v3, people_v1 } from 'googleapis';
import { logger } from '../../utils/logger';

/**
 * Google API clients for different services
 */
export interface GoogleClients {
  calendar: calendar_v3.Calendar;
  docs: docs_v1.Docs;
  drive: drive_v3.Drive;
  people: people_v1.People;
}

/**
 * Create Google API clients with authenticated credentials
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @returns {GoogleClients} Object containing Google API clients
 */
export const createGoogleClients = (auth: OAuth2Client): GoogleClients => {
  logger.debug('Creating Google API clients');
  
  // Initialize various Google API clients
  const { google } = require('googleapis');
  
  return {
    calendar: google.calendar({ version: 'v3', auth }),
    docs: google.docs({ version: 'v1', auth }),
    drive: google.drive({ version: 'v3', auth }),
    people: google.people({ version: 'v1', auth })
  };
};