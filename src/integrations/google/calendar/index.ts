import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../../../utils/logger';
import config from '../../../config';
import { CalendarEvent } from '../../../types';

/**
 * Google Calendar Integration
 * 
 * Provides functionality to interact with Google Calendar API
 */

// Initialize Google Calendar API
const getCalendarApi = (auth: OAuth2Client): calendar_v3.Calendar => {
  return google.calendar({ version: 'v3', auth });
};

/**
 * Create a new calendar event
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {Partial<CalendarEvent>} eventData - Event data to create
 * @returns {Promise<CalendarEvent>} Created event
 */
export const createEvent = async (
  auth: OAuth2Client,
  eventData: Partial<CalendarEvent>
): Promise<CalendarEvent> => {
  try {
    const calendar = getCalendarApi(auth);
    const calendarId = eventData.calendarId || 'primary';
    
    // Format attendees if provided
    const attendees = eventData.attendees?.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name,
      optional: attendee.optional || false,
      responseStatus: attendee.responseStatus || 'needsAction'
    }));
    
    // Format reminders if provided
    const reminders = eventData.reminderSettings ? {
      useDefault: eventData.reminderSettings.useDefault,
      overrides: eventData.reminderSettings.reminders?.map(reminder => ({
        method: reminder.method,
        minutes: reminder.minutes
      }))
    } : undefined;
    
    // Create the event resource
    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'UTC'
      },
      location: eventData.location,
      attendees,
      reminders,
      recurrence: eventData.recurrence
    };
    
    // Create the event
    logger.info(`Creating calendar event: ${eventData.title}`);
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    });
    
    if (!response.data) {
      throw new Error('Failed to create calendar event');
    }
    
    // Map the response to our CalendarEvent type
    return mapGoogleEventToCalendarEvent(response.data, calendarId);
    
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Get a calendar event by ID
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} eventId - Event ID
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<CalendarEvent>} Calendar event
 */
export const getEvent = async (
  auth: OAuth2Client,
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  try {
    const calendar = getCalendarApi(auth);
    
    logger.info(`Getting calendar event ${eventId} from calendar ${calendarId}`);
    const response = await calendar.events.get({
      calendarId,
      eventId
    });
    
    if (!response.data) {
      throw new Error(`Event ${eventId} not found`);
    }
    
    return mapGoogleEventToCalendarEvent(response.data, calendarId);
    
  } catch (error) {
    logger.error(`Error getting calendar event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Update a calendar event
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} eventId - Event ID
 * @param {Partial<CalendarEvent>} eventData - Event data to update
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<CalendarEvent>} Updated event
 */
export const updateEvent = async (
  auth: OAuth2Client,
  eventId: string,
  eventData: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  try {
    const calendar = getCalendarApi(auth);
    
    // Format attendees if provided
    const attendees = eventData.attendees?.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name,
      optional: attendee.optional || false,
      responseStatus: attendee.responseStatus || 'needsAction'
    }));
    
    // Format reminders if provided
    const reminders = eventData.reminderSettings ? {
      useDefault: eventData.reminderSettings.useDefault,
      overrides: eventData.reminderSettings.reminders?.map(reminder => ({
        method: reminder.method,
        minutes: reminder.minutes
      }))
    } : undefined;
    
    // Create the event resource with only the fields to update
    const event: any = {};
    
    if (eventData.title) event.summary = eventData.title;
    if (eventData.description) event.description = eventData.description;
    if (eventData.location) event.location = eventData.location;
    if (eventData.startTime) event.start = { dateTime: eventData.startTime, timeZone: 'UTC' };
    if (eventData.endTime) event.end = { dateTime: eventData.endTime, timeZone: 'UTC' };
    if (attendees) event.attendees = attendees;
    if (reminders) event.reminders = reminders;
    if (eventData.recurrence) event.recurrence = eventData.recurrence;
    
    // Update the event
    logger.info(`Updating calendar event ${eventId}`);
    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: event
    });
    
    if (!response.data) {
      throw new Error(`Failed to update event ${eventId}`);
    }
    
    return mapGoogleEventToCalendarEvent(response.data, calendarId);
    
  } catch (error) {
    logger.error(`Error updating calendar event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Delete a calendar event
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} eventId - Event ID
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async (
  auth: OAuth2Client,
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> => {
  try {
    const calendar = getCalendarApi(auth);
    
    logger.info(`Deleting calendar event ${eventId}`);
    const response = await calendar.events.delete({
      calendarId,
      eventId
    });
    
    return response.status === 204;
    
  } catch (error) {
    logger.error(`Error deleting calendar event ${eventId}:`, error);
    throw error;
  }
};

/**
 * List calendar events
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {Object} options - List options
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<CalendarEvent[]>} Calendar events
 */
export const listEvents = async (
  auth: OAuth2Client,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
  } = {},
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> => {
  try {
    const calendar = getCalendarApi(auth);
    
    logger.info(`Listing calendar events from calendar ${calendarId}`);
    const response = await calendar.events.list({
      calendarId,
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      maxResults: options.maxResults || 100,
      singleEvents: true,
      orderBy: 'startTime',
      q: options.q
    });
    
    if (!response.data.items) {
      return [];
    }
    
    return response.data.items.map(event => mapGoogleEventToCalendarEvent(event, calendarId));
    
  } catch (error) {
    logger.error(`Error listing calendar events:`, error);
    throw error;
  }
};

/**
 * Map Google Calendar event to CalendarEvent type
 * 
 * @param {calendar_v3.Schema$Event} googleEvent - Google Calendar event
 * @param {string} calendarId - Calendar ID
 * @returns {CalendarEvent} Mapped calendar event
 */
const mapGoogleEventToCalendarEvent = (
  googleEvent: calendar_v3.Schema$Event,
  calendarId: string
): CalendarEvent => {
  // Map attendees
  const attendees = googleEvent.attendees?.map(attendee => ({
    email: attendee.email || '',
    name: attendee.displayName,
    optional: attendee.optional || false,
    responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted'
  })) || [];
  
  // Map reminders
  const reminderSettings = {
    useDefault: googleEvent.reminders?.useDefault || true,
    reminders: googleEvent.reminders?.overrides?.map(override => ({
      method: override.method as 'email' | 'popup',
      minutes: override.minutes || 0
    }))
  };
  
  return {
    id: googleEvent.id || '',
    title: googleEvent.summary || '',
    description: googleEvent.description || '',
    startTime: googleEvent.start?.dateTime || googleEvent.start?.date || '',
    endTime: googleEvent.end?.dateTime || googleEvent.end?.date || '',
    location: googleEvent.location || '',
    attendees,
    recurrence: googleEvent.recurrence || [],
    reminderSettings,
    calendarId,
    createdAt: googleEvent.created || '',
    updatedAt: googleEvent.updated || '',
    creator: {
      email: googleEvent.creator?.email || '',
      self: googleEvent.creator?.self || false
    },
    organizer: googleEvent.organizer ? {
      email: googleEvent.organizer.email || '',
      self: googleEvent.organizer.self || false
    } : undefined,
    status: (googleEvent.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed'
  };
};

/**
 * Watch for calendar changes
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} channelId - Notification channel ID
 * @param {string} webhookUrl - Webhook URL to receive notifications
 * @param {string} calendarId - Calendar ID (default: 'primary')
 * @returns {Promise<any>} Watch response
 */
export const watchCalendar = async (
  auth: OAuth2Client,
  channelId: string,
  webhookUrl: string,
  calendarId: string = 'primary'
): Promise<any> => {
  try {
    const calendar = getCalendarApi(auth);
    
    logger.info(`Setting up watch for calendar ${calendarId}`);
    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl
      }
    });
    
    return response.data;
    
  } catch (error) {
    logger.error(`Error setting up watch for calendar:`, error);
    throw error;
  }
};

/**
 * Stop watching calendar changes
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} channelId - Notification channel ID
 * @param {string} resourceId - Resource ID from watch response
 * @returns {Promise<boolean>} Success status
 */
export const stopWatchCalendar = async (
  auth: OAuth2Client,
  channelId: string,
  resourceId: string
): Promise<boolean> => {
  try {
    const calendar = getCalendarApi(auth);
    
    logger.info(`Stopping watch for channel ${channelId}`);
    const response = await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId
      }
    });
    
    return response.status === 204;
    
  } catch (error) {
    logger.error(`Error stopping watch for channel ${channelId}:`, error);
    throw error;
  }
};