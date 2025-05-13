import { 
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  watchCalendar,
  stopWatchCalendar
} from '../../../../src/integrations/google/calendar';
import { CalendarEvent, AuthToken } from '../../../../src/types';
import { OAuth2Client } from 'google-auth-library';

// Mock Google APIs and OAuth
jest.mock('googleapis', () => {
  // Mock calendar implementation
  const mockCalendarInstance = {
    events: {
      insert: jest.fn().mockResolvedValue({
        data: {
          id: 'event-123',
          summary: 'Test Event',
          start: { dateTime: '2023-04-01T10:00:00Z' },
          end: { dateTime: '2023-04-01T11:00:00Z' }
        }
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          id: 'event-123',
          summary: 'Test Event',
          description: 'Test Description',
          start: { dateTime: '2023-04-01T10:00:00Z' },
          end: { dateTime: '2023-04-01T11:00:00Z' },
          attendees: [{ email: 'attendee@example.com' }]
        }
      }),
      patch: jest.fn().mockResolvedValue({
        data: {
          id: 'event-123',
          summary: 'Updated Event',
          start: { dateTime: '2023-04-01T10:00:00Z' },
          end: { dateTime: '2023-04-01T11:00:00Z' }
        }
      }),
      delete: jest.fn().mockResolvedValue({ status: 204, data: {} }),
      list: jest.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: 'event-123',
              summary: 'Test Event 1',
              start: { dateTime: '2023-04-01T10:00:00Z' },
              end: { dateTime: '2023-04-01T11:00:00Z' }
            },
            {
              id: 'event-456',
              summary: 'Test Event 2',
              start: { dateTime: '2023-04-02T14:00:00Z' },
              end: { dateTime: '2023-04-02T15:00:00Z' }
            }
          ]
        }
      }),
      watch: jest.fn().mockResolvedValue({
        data: {
          id: 'channel-123',
          resourceId: 'resource-123',
          expiration: '1234567890000'
        }
      })
    },
    channels: {
      stop: jest.fn().mockResolvedValue({ status: 204 })
    }
  };

  return {
    google: {
      calendar: jest.fn().mockReturnValue(mockCalendarInstance)
    }
  };
});

// Mock OAuth2Client
const mockAuth = {
  setCredentials: jest.fn(),
  getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
} as unknown as OAuth2Client;

describe('Google Calendar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createEvent', () => {
    it('should create a calendar event successfully', async () => {
      // Arrange
      const eventData: Partial<CalendarEvent> = {
        title: 'Test Event',
        description: 'Test Description',
        startTime: '2023-04-01T10:00:00Z',
        endTime: '2023-04-01T11:00:00Z',
        attendees: [
          { email: 'attendee@example.com' }
        ]
      };
      
      // Act
      const result = await createEvent(mockAuth, eventData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('event-123');
      expect(result.title).toBe('Test Event');
    });
    
    it('should throw error with incomplete event data', async () => {
      // Arrange
      const eventData: Partial<CalendarEvent> = {
        title: 'Test Event'
        // Missing required startTime and endTime
      };
      
      // Mock the API to throw an error
      const { google } = require('googleapis');
      google.calendar().events.insert.mockRejectedValue(new Error('Invalid event data'));
      
      // Act & Assert
      await expect(createEvent(mockAuth, eventData)).rejects.toThrow();
    });
  });
  
  describe('getEvent', () => {
    it('should retrieve a calendar event by ID', async () => {
      // Arrange
      const eventId = 'event-123';
      const calendarId = 'primary';
      
      // Act
      const result = await getEvent(mockAuth, eventId, calendarId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('event-123');
      expect(result.title).toBe('Test Event');
    });
    
    it('should throw error when retrieving a non-existent event', async () => {
      // Arrange
      const eventId = 'non-existent-event';
      
      // Mock the events.get method to simulate a 404 error
      const { google } = require('googleapis');
      google.calendar().events.get.mockRejectedValue({
        code: 404,
        message: 'Event not found'
      });
      
      // Act & Assert
      await expect(getEvent(mockAuth, eventId)).rejects.toThrow();
    });
  });
  
  describe('updateEvent', () => {
    it('should update an existing calendar event', async () => {
      // Arrange
      const eventId = 'event-123';
      const eventData: Partial<CalendarEvent> = {
        title: 'Updated Event'
      };
      
      // Act
      const result = await updateEvent(mockAuth, eventId, eventData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Event');
    });
    
    it('should throw error when updating fails', async () => {
      // Arrange
      const eventId = 'event-123';
      const eventData: Partial<CalendarEvent> = {
        title: 'Failed Update'
      };
      
      // Mock the events.patch method to simulate an error
      const { google } = require('googleapis');
      google.calendar().events.patch.mockRejectedValue(new Error('Update failed'));
      
      // Act & Assert
      await expect(updateEvent(mockAuth, eventId, eventData)).rejects.toThrow();
    });
  });
  
  describe('deleteEvent', () => {
    it('should delete a calendar event by ID', async () => {
      // Arrange
      const eventId = 'event-123';
      const calendarId = 'primary';
      
      // Act
      const result = await deleteEvent(mockAuth, eventId, calendarId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should throw error when deletion fails', async () => {
      // Arrange
      const eventId = 'error-event-id';
      
      // Mock the events.delete method to simulate an error
      const { google } = require('googleapis');
      google.calendar().events.delete.mockRejectedValue(new Error('Deletion failed'));
      
      // Act & Assert
      await expect(deleteEvent(mockAuth, eventId)).rejects.toThrow();
    });
  });
  
  describe('listEvents', () => {
    it('should list calendar events within a time range', async () => {
      // Arrange
      const options = {
        timeMin: '2023-04-01T00:00:00Z',
        timeMax: '2023-04-30T23:59:59Z'
      };
      
      // Act
      const results = await listEvents(mockAuth, options);
      
      // Assert
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('event-123');
      expect(results[1].id).toBe('event-456');
    });
    
    it('should handle empty results', async () => {
      // Arrange
      // Mock the events.list method to return empty results
      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: [] }
      });
      
      // Act
      const results = await listEvents(mockAuth);
      
      // Assert
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
    
    it('should throw error when listing fails', async () => {
      // Arrange
      // Mock the events.list method to simulate an error
      const { google } = require('googleapis');
      google.calendar().events.list.mockRejectedValue(new Error('Listing failed'));
      
      // Act & Assert
      await expect(listEvents(mockAuth)).rejects.toThrow();
    });
  });
  
  describe('watchCalendar', () => {
    it('should set up watch for calendar changes', async () => {
      // Arrange
      const channelId = 'channel-123';
      const webhookUrl = 'https://example.com/webhook';
      
      // Act
      const result = await watchCalendar(mockAuth, channelId, webhookUrl);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('channel-123');
      expect(result.resourceId).toBe('resource-123');
    });
    
    it('should throw error when watch setup fails', async () => {
      // Arrange
      const channelId = 'channel-123';
      const webhookUrl = 'https://example.com/webhook';
      
      // Mock the events.watch method to simulate an error
      const { google } = require('googleapis');
      google.calendar().events.watch.mockRejectedValue(new Error('Watch setup failed'));
      
      // Act & Assert
      await expect(watchCalendar(mockAuth, channelId, webhookUrl)).rejects.toThrow();
    });
  });
  
  describe('stopWatchCalendar', () => {
    it('should stop watching calendar changes', async () => {
      // Arrange
      const channelId = 'channel-123';
      const resourceId = 'resource-123';
      
      // Act
      const result = await stopWatchCalendar(mockAuth, channelId, resourceId);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should throw error when stopping watch fails', async () => {
      // Arrange
      const channelId = 'channel-123';
      const resourceId = 'resource-123';
      
      // Mock the channels.stop method to simulate an error
      const { google } = require('googleapis');
      google.calendar().channels.stop.mockRejectedValue(new Error('Stop watch failed'));
      
      // Act & Assert
      await expect(stopWatchCalendar(mockAuth, channelId, resourceId)).rejects.toThrow();
    });
  });
});