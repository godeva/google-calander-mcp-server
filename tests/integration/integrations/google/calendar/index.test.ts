import * as googleCalendar from '../../../../../src/integrations/google/calendar';
import { OAuth2Client } from 'google-auth-library';
import { CalendarEvent } from '../../../../../src/types';

// Mock OAuth2Client
class MockOAuth2Client implements Partial<OAuth2Client> {
  constructor() {
    // Initialize with required properties/methods
  }
}

// Mock the Google API client
jest.mock('googleapis', () => {
  const mockListEvents = jest.fn().mockImplementation(() => {
    return {
      data: {
        items: [
          {
            id: 'event-1',
            summary: 'Test Event 1',
            description: 'Test Description 1',
            start: { dateTime: '2025-05-15T10:00:00Z' },
            end: { dateTime: '2025-05-15T11:00:00Z' },
            location: 'Test Location',
            attendees: [
              { email: 'attendee1@example.com', responseStatus: 'accepted' }
            ],
            created: '2025-05-01T12:00:00Z',
            updated: '2025-05-01T12:00:00Z',
            creator: { email: 'creator@example.com', self: true },
            organizer: { email: 'organizer@example.com', self: true },
            status: 'confirmed'
          }
        ],
        nextPageToken: null
      }
    };
  });

  const mockInsertEvent = jest.fn().mockImplementation(() => {
    return {
      data: {
        id: 'new-event-id',
        summary: 'Created Event',
        description: 'Created Description',
        start: { dateTime: '2025-05-20T14:00:00Z' },
        end: { dateTime: '2025-05-20T15:00:00Z' },
        created: '2025-05-10T12:00:00Z',
        updated: '2025-05-10T12:00:00Z',
        creator: { email: 'creator@example.com', self: true },
        organizer: { email: 'organizer@example.com', self: true },
        status: 'confirmed'
      }
    };
  });

  const mockGetEvent = jest.fn().mockImplementation((params) => {
    if (params.eventId === 'existing-event-id') {
      return {
        data: {
          id: 'existing-event-id',
          summary: 'Existing Event',
          description: 'Existing Description',
          start: { dateTime: '2025-05-18T14:00:00Z' },
          end: { dateTime: '2025-05-18T15:00:00Z' },
          created: '2025-05-05T12:00:00Z',
          updated: '2025-05-05T12:00:00Z',
          creator: { email: 'creator@example.com', self: true },
          organizer: { email: 'organizer@example.com', self: true },
          status: 'confirmed'
        }
      };
    } else {
      throw new Error('Event not found');
    }
  });

  const mockUpdateEvent = jest.fn().mockImplementation((params) => {
    return {
      data: {
        id: params.eventId,
        summary: 'Updated Event',
        description: 'Updated Description',
        start: { dateTime: '2025-05-18T16:00:00Z' },
        end: { dateTime: '2025-05-18T17:00:00Z' },
        created: '2025-05-05T12:00:00Z',
        updated: '2025-05-10T14:00:00Z',
        creator: { email: 'creator@example.com', self: true },
        organizer: { email: 'organizer@example.com', self: true },
        status: 'confirmed'
      }
    };
  });

  const mockDeleteEvent = jest.fn().mockImplementation(() => {
    return { status: 204, data: {} };
  });

  return {
    google: {
      calendar: jest.fn().mockImplementation(() => {
        return {
          events: {
            list: mockListEvents,
            insert: mockInsertEvent,
            get: mockGetEvent,
            patch: mockUpdateEvent,
            delete: mockDeleteEvent
          }
        };
      })
    }
  };
});

// Mock the logger
jest.mock('../../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Google Calendar Integration', () => {
  let mockAuthClient: OAuth2Client;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockAuthClient = new MockOAuth2Client() as OAuth2Client;
  });

  describe('listEvents', () => {
    it('should list calendar events for the user', async () => {
      // Arrange
      const options = {
        timeMin: new Date('2025-05-01').toISOString(),
        timeMax: new Date('2025-05-31').toISOString(),
        maxResults: 10
      };
      const calendarId = 'primary';

      // Act
      const events = await googleCalendar.listEvents(mockAuthClient, options, calendarId);

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-1');
      expect(events[0].title).toBe('Test Event 1');
      
      // Check that the Google API was called with correct parameters
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      expect(calendarApi.events.list).toHaveBeenCalledWith({
        calendarId: calendarId,
        timeMin: options.timeMin,
        timeMax: options.timeMax,
        maxResults: options.maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        q: undefined
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      const error = new Error('API Error');
      calendarApi.events.list.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        googleCalendar.listEvents(mockAuthClient, {}, 'primary')
      ).rejects.toThrow();
    });
  });

  describe('createEvent', () => {
    it('should create a new calendar event', async () => {
      // Arrange
      const eventDetails: Partial<CalendarEvent> = {
        title: 'Created Event',
        description: 'Created Description',
        startTime: '2025-05-20T14:00:00Z',
        endTime: '2025-05-20T15:00:00Z',
        calendarId: 'primary'
      };

      // Act
      const event = await googleCalendar.createEvent(mockAuthClient, eventDetails);

      // Assert
      expect(event).toBeDefined();
      expect(event.id).toBe('new-event-id');
      expect(event.title).toBe('Created Event');
      
      // Check that the Google API was called with correct parameters
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      expect(calendarApi.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: eventDetails.title,
          description: eventDetails.description,
          start: { dateTime: eventDetails.startTime, timeZone: 'UTC' },
          end: { dateTime: eventDetails.endTime, timeZone: 'UTC' }
        })
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      const error = new Error('API Error');
      calendarApi.events.insert.mockRejectedValueOnce(error);

      const eventDetails: Partial<CalendarEvent> = {
        title: 'Error Event',
        startTime: '2025-05-20T14:00:00Z',
        endTime: '2025-05-20T15:00:00Z',
        calendarId: 'primary'
      };

      // Act & Assert
      await expect(
        googleCalendar.createEvent(mockAuthClient, eventDetails)
      ).rejects.toThrow();
    });
  });

  describe('getEvent', () => {
    it('should get a specific calendar event', async () => {
      // Arrange
      const eventId = 'existing-event-id';
      const calendarId = 'primary';

      // Act
      const event = await googleCalendar.getEvent(mockAuthClient, eventId, calendarId);

      // Assert
      expect(event).toBeDefined();
      expect(event.id).toBe(eventId);
      expect(event.title).toBe('Existing Event');
      
      // Check that the Google API was called with correct parameters
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      expect(calendarApi.events.get).toHaveBeenCalledWith({
        calendarId,
        eventId
      });
    });

    it('should handle non-existent events', async () => {
      // Arrange
      const eventId = 'non-existent-event-id';
      const calendarId = 'primary';

      // Act & Assert
      await expect(
        googleCalendar.getEvent(mockAuthClient, eventId, calendarId)
      ).rejects.toThrow();
    });
  });

  describe('updateEvent', () => {
    it('should update an existing calendar event', async () => {
      // Arrange
      const eventId = 'existing-event-id';
      const eventDetails: Partial<CalendarEvent> = {
        title: 'Updated Event',
        description: 'Updated Description',
        startTime: '2025-05-18T16:00:00Z',
        endTime: '2025-05-18T17:00:00Z'
      };
      const calendarId = 'primary';

      // Act
      const event = await googleCalendar.updateEvent(
        mockAuthClient,
        eventId,
        eventDetails,
        calendarId
      );

      // Assert
      expect(event).toBeDefined();
      expect(event.id).toBe(eventId);
      expect(event.title).toBe('Updated Event');
      
      // Check that the Google API was called with correct parameters
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      expect(calendarApi.events.patch).toHaveBeenCalledWith({
        calendarId: calendarId,
        eventId: eventId,
        requestBody: expect.objectContaining({
          summary: eventDetails.title,
          description: eventDetails.description,
          start: { dateTime: eventDetails.startTime, timeZone: 'UTC' },
          end: { dateTime: eventDetails.endTime, timeZone: 'UTC' }
        })
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      const error = new Error('API Error');
      calendarApi.events.patch.mockRejectedValueOnce(error);

      const eventId = 'error-event-id';
      const eventDetails: Partial<CalendarEvent> = {
        title: 'Error Event'
      };

      // Act & Assert
      await expect(
        googleCalendar.updateEvent(mockAuthClient, eventId, eventDetails, 'primary')
      ).rejects.toThrow();
    });
  });

  describe('deleteEvent', () => {
    it('should delete a calendar event', async () => {
      // Arrange
      const eventId = 'existing-event-id';
      const calendarId = 'primary';

      // Act
      const result = await googleCalendar.deleteEvent(mockAuthClient, eventId, calendarId);

      // Assert
      expect(result).toBe(true);
      
      // Check that the Google API was called with correct parameters
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      expect(calendarApi.events.delete).toHaveBeenCalledWith({
        calendarId,
        eventId
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const { google } = require('googleapis');
      const calendarApi = google.calendar.mock.results[0].value;
      const error = new Error('API Error');
      calendarApi.events.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        googleCalendar.deleteEvent(mockAuthClient, 'error-event-id', 'primary')
      ).rejects.toThrow();
    });
  });
});