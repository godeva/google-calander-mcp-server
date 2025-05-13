import {
  storeContext,
  getContext,
  clearContext,
  storePreferences,
  getPreferences,
  storeMessage,
  getHistory,
  clearHistory,
  getRelevantContext
} from '../../../../src/core/memory';
import { UserPreferences } from '../../../../src/types';

describe('Memory Module', () => {
  const testUserId = 'test-user-123';
  
  // Reset the in-memory storage between tests
  beforeEach(async () => {
    await clearContext(testUserId);
    await clearHistory(testUserId);
  });
  
  describe('Context Management', () => {
    it('should store and retrieve context data', async () => {
      // Arrange
      const contextKey = 'lastCalendarEvent';
      const contextValue = { id: 'event-123', title: 'Test Meeting' };
      
      // Act
      await storeContext(testUserId, contextKey, contextValue);
      const retrievedContext = await getContext(testUserId, contextKey);
      
      // Assert
      expect(retrievedContext).toEqual(contextValue);
    });
    
    it('should return null for non-existent context', async () => {
      // Arrange
      const nonExistentKey = 'nonExistentKey';
      
      // Act
      const result = await getContext(testUserId, nonExistentKey);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should clear specific context key', async () => {
      // Arrange
      const contextKey1 = 'key1';
      const contextKey2 = 'key2';
      
      // Act
      await storeContext(testUserId, contextKey1, 'value1');
      await storeContext(testUserId, contextKey2, 'value2');
      await clearContext(testUserId, contextKey1);
      
      const result1 = await getContext(testUserId, contextKey1);
      const result2 = await getContext(testUserId, contextKey2);
      
      // Assert
      expect(result1).toBeNull();
      expect(result2).toBe('value2');
    });
    
    it('should clear all context when no key is specified', async () => {
      // Arrange
      const contextKey1 = 'key1';
      const contextKey2 = 'key2';
      
      // Act
      await storeContext(testUserId, contextKey1, 'value1');
      await storeContext(testUserId, contextKey2, 'value2');
      await clearContext(testUserId);
      
      const result1 = await getContext(testUserId, contextKey1);
      const result2 = await getContext(testUserId, contextKey2);
      
      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
    
    it('should retrieve relevant context based on query', async () => {
      // Arrange
      await storeContext(testUserId, 'calendar', { lastViewed: new Date() });
      await storeContext(testUserId, 'email', { unread: 5 });
      
      // Act
      const relevantContext = await getRelevantContext(testUserId, 'calendar');
      
      // Assert
      expect(relevantContext).toBeDefined();
      expect(relevantContext.calendar).toBeDefined();
    });
  });
  
  describe('Preferences Management', () => {
    it('should store and retrieve user preferences', async () => {
      // Arrange
      const preferences: Partial<UserPreferences> = {
        timezone: 'America/New_York',
        preferredLanguage: 'en',
        defaultMeetingDuration: 30,
        defaultReminderSettings: {
          useDefault: false,
          reminders: [
            { method: 'popup', minutes: 10 }
          ]
        }
      };
      
      // Act
      const storedPrefs = await storePreferences(testUserId, preferences);
      const retrievedPrefs = await getPreferences(testUserId);
      
      // Assert
      expect(retrievedPrefs).toBeDefined();
      expect(retrievedPrefs?.timezone).toBe('America/New_York');
      expect(retrievedPrefs?.preferredLanguage).toBe('en');
      expect(retrievedPrefs?.defaultMeetingDuration).toBe(30);
      expect(retrievedPrefs?.defaultReminderSettings?.useDefault).toBe(false);
      expect(retrievedPrefs?.defaultReminderSettings?.reminders?.[0].method).toBe('popup');
    });
    
    it('should merge new preferences with existing ones', async () => {
      // Arrange
      const initialPrefs: Partial<UserPreferences> = {
        preferredLanguage: 'en',
        defaultMeetingDuration: 60
      };
      
      const updatedPrefs: Partial<UserPreferences> = {
        preferredLanguage: 'fr',
        timezone: 'Europe/London'
      };
      
      // Act
      await storePreferences(testUserId, initialPrefs);
      await storePreferences(testUserId, updatedPrefs);
      const result = await getPreferences(testUserId);
      
      // Assert
      expect(result?.preferredLanguage).toBe('fr'); // Updated
      expect(result?.defaultMeetingDuration).toBe(60); // Retained
      expect(result?.timezone).toBe('Europe/London'); // Added
    });
    
    it('should return null for non-existent user preferences', async () => {
      // Arrange
      const nonExistentUser = 'non-existent-user';
      
      // Act
      const result = await getPreferences(nonExistentUser);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('Conversation History', () => {
    it('should store and retrieve conversation history', async () => {
      // Arrange
      const userMessage = 'Schedule a meeting for tomorrow';
      const assistantMessage = 'I have scheduled a meeting for tomorrow at 10am';
      
      // Act
      await storeMessage(testUserId, userMessage, 'user');
      await storeMessage(testUserId, assistantMessage, 'assistant');
      const history = await getHistory(testUserId);
      
      // Assert
      expect(history.length).toBe(2);
      expect(history[0].message).toBe(userMessage);
      expect(history[0].role).toBe('user');
      expect(history[1].message).toBe(assistantMessage);
      expect(history[1].role).toBe('assistant');
    });
    
    it('should limit history to specified number of messages', async () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        await storeMessage(testUserId, `Message ${i}`, 'user');
      }
      
      // Act
      const fullHistory = await getHistory(testUserId);
      const limitedHistory = await getHistory(testUserId, 3);
      
      // Assert
      expect(fullHistory.length).toBe(5);
      expect(limitedHistory.length).toBe(3);
      expect(limitedHistory[0].message).toBe('Message 3');
      expect(limitedHistory[2].message).toBe('Message 5');
    });
    
    it('should return empty array for user with no history', async () => {
      // Arrange
      const emptyUser = 'empty-user';
      
      // Act
      const history = await getHistory(emptyUser);
      
      // Assert
      expect(history).toEqual([]);
    });
    
    it('should clear conversation history', async () => {
      // Arrange
      await storeMessage(testUserId, 'Test message', 'user');
      
      // Act
      await clearHistory(testUserId);
      const history = await getHistory(testUserId);
      
      // Assert
      expect(history).toEqual([]);
    });
    
    it('should handle large history by truncating old messages', async () => {
      // Test large number of messages to verify truncation
      jest.setTimeout(10000); // Increase timeout for this test
      
      // Arrange - Create more than 100 messages (the history limit)
      for (let i = 1; i <= 110; i++) {
        await storeMessage(testUserId, `Bulk message ${i}`, 'user');
      }
      
      // Act
      const history = await getHistory(testUserId, 200);
      
      // Assert
      expect(history.length).toBe(100); // Should be truncated to 100
      expect(history[0].message).toBe('Bulk message 11');
      expect(history[99].message).toBe('Bulk message 110');
    });
  });
});