import { OAuth2Client } from 'google-auth-library';
import { calendar_v3 } from 'googleapis';
import { CalendarEvent } from '../../src/types';

/**
 * Helper functions for testing Google Calendar integration
 */

/**
 * Mock OAuth2Client for testing
 */
export class MockOAuth2Client extends OAuth2Client {
  constructor() {
    super({
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret'
    });
  }

  async getToken(): Promise<any> {
    return {
      tokens: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: 'email profile https://www.googleapis.com/auth/calendar'
      }
    };
  }

  async refreshAccessToken(): Promise<any> {
    return {
      credentials: {
        access_token: 'mock-refreshed-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: 'email profile https://www.googleapis.com/auth/calendar'
      }
    };
  }

  setCredentials(): void {
    // Mock implementation
  }

  async getTokenInfo(): Promise<any> {
    return {
      expiry_date: Date.now() + 3600 * 1000,
      scope: 'email profile https://www.googleapis.com/auth/calendar'
    };
  }
}

/**
 * Create a mock Google Calendar event
 * 
 * @param overrides - Properties to override in the mock event
 * @returns A mock Google Calendar event
 */
export const createMockGoogleEvent = (overrides: Partial<calendar_v3.Schema$Event> = {}): calendar_v3.Schema$Event => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    id: 'mock-event-id',
    summary: 'Mock Event',
    description: 'Mock Description',
    location: 'Mock Location',
    start: {
      dateTime: now.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: tomorrow.toISOString(),
      timeZone: 'UTC'
    },
    attendees: [
      {
        email: 'attendee@example.com',
        displayName: 'Test Attendee',
        responseStatus: 'accepted'
      }
    ],
    created: now.toISOString(),
    updated: now.toISOString(),
    creator: {
      email: 'creator@example.com',
      self: true
    },
    organizer: {
      email: 'organizer@example.com',
      self: true
    },
    status: 'confirmed',
    ...overrides
  };
};

/**
 * Create a mock Calendar Event
 * 
 * @param overrides - Properties to override in the mock event
 * @returns A mock Calendar Event
 */
export const createMockCalendarEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    id: 'mock-event-id',
    title: 'Mock Event',
    description: 'Mock Description',
    location: 'Mock Location',
    startTime: now.toISOString(),
    endTime: tomorrow.toISOString(),
    calendarId: 'primary',
    attendees: [
      {
        email: 'attendee@example.com',
        name: 'Test Attendee',
        responseStatus: 'accepted',
        optional: false
      }
    ],
    recurrence: [],
    reminderSettings: {
      useDefault: true,
      reminders: [
        { method: 'email', minutes: 30 },
        { method: 'popup', minutes: 10 }
      ]
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    creator: {
      email: 'creator@example.com',
      self: true
    },
    organizer: {
      email: 'organizer@example.com',
      self: true
    },
    status: 'confirmed',
    ...overrides
  };
};

/**
 * Create a mock response for the Google Calendar events.list API
 * 
 * @param eventCount - Number of events to include
 * @param overrides - Properties to override in the response
 * @returns A mock Google Calendar events.list response
 */
export const createMockEventsListResponse = (
  eventCount: number = 3,
  overrides: Partial<calendar_v3.Schema$Events> = {}
): { data: calendar_v3.Schema$Events } => {
  const items: calendar_v3.Schema$Event[] = [];
  
  for (let i = 0; i < eventCount; i++) {
    items.push(createMockGoogleEvent({
      id: `mock-event-id-${i}`,
      summary: `Mock Event ${i}`,
      description: `Mock Description ${i}`
    }));
  }
  
  return {
    data: {
      kind: 'calendar#events',
      etag: '"mock-etag"',
      summary: 'Test Calendar',
      items,
      ...overrides
    }
  };
};

/**
 * Create a mock response for the Google Calendar events.get API
 * 
 * @param overrides - Properties to override in the event
 * @returns A mock Google Calendar events.get response
 */
export const createMockEventGetResponse = (
  overrides: Partial<calendar_v3.Schema$Event> = {}
): { data: calendar_v3.Schema$Event } => {
  return {
    data: createMockGoogleEvent(overrides)
  };
};

/**
 * Create a mock response for the Google Calendar events.insert API
 * 
 * @param overrides - Properties to override in the event
 * @returns A mock Google Calendar events.insert response
 */
export const createMockEventInsertResponse = (
  overrides: Partial<calendar_v3.Schema$Event> = {}
): { data: calendar_v3.Schema$Event } => {
  return {
    data: createMockGoogleEvent({
      id: 'new-mock-event-id',
      ...overrides
    })
  };
};

/**
 * Create a mock response for the Google Calendar events.update/patch API
 * 
 * @param overrides - Properties to override in the event
 * @returns A mock Google Calendar events.update/patch response
 */
export const createMockEventUpdateResponse = (
  overrides: Partial<calendar_v3.Schema$Event> = {}
): { data: calendar_v3.Schema$Event } => {
  const now = new Date();
  
  return {
    data: createMockGoogleEvent({
      updated: now.toISOString(),
      ...overrides
    })
  };
};

/**
 * Create a mock response for the Google Calendar events.delete API
 * 
 * @returns A mock Google Calendar events.delete response
 */
export const createMockEventDeleteResponse = (): { status: number, data: {} } => {
  return {
    status: 204,
    data: {}
  };
};