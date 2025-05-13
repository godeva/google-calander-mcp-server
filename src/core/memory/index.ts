import { logger } from '../../utils/logger';
import config from '../../config';
import { UserPreferences } from '../../types';

/**
 * Memory module for managing user history, context, and preferences
 * 
 * This implementation uses in-memory storage for demonstration purposes.
 * A production implementation would use persistent storage (e.g., MongoDB).
 */

// In-memory storage for user context
const contextStore: Record<string, any> = {};

// In-memory storage for user preferences
const preferenceStore: Record<string, UserPreferences> = {};

// In-memory storage for conversation history
const historyStore: Record<string, Array<{ timestamp: number; message: string; role: string }>> = {};

/**
 * Store context data for a user
 * 
 * @param {string} userId - User ID
 * @param {string} key - Context key
 * @param {any} value - Context value
 * @returns {Promise<void>}
 */
export const storeContext = async (
  userId: string,
  key: string,
  value: any
): Promise<void> => {
  try {
    if (!contextStore[userId]) {
      contextStore[userId] = {};
    }
    
    contextStore[userId][key] = {
      value,
      timestamp: Date.now()
    };
    
    logger.debug(`Stored context for user ${userId}: ${key}`);
  } catch (error) {
    logger.error(`Error storing context for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Retrieve context data for a user
 * 
 * @param {string} userId - User ID
 * @param {string} key - Context key
 * @returns {Promise<any>} Context value
 */
export const getContext = async (
  userId: string,
  key: string
): Promise<any> => {
  try {
    if (!contextStore[userId] || !contextStore[userId][key]) {
      return null;
    }
    
    return contextStore[userId][key].value;
  } catch (error) {
    logger.error(`Error retrieving context for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Clear user context
 * 
 * @param {string} userId - User ID
 * @param {string} key - Optional context key to clear specific context
 * @returns {Promise<void>}
 */
export const clearContext = async (
  userId: string,
  key?: string
): Promise<void> => {
  try {
    if (!contextStore[userId]) {
      return;
    }
    
    if (key) {
      delete contextStore[userId][key];
      logger.debug(`Cleared context key ${key} for user ${userId}`);
    } else {
      delete contextStore[userId];
      logger.debug(`Cleared all context for user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error clearing context for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Store user preferences
 * 
 * @param {string} userId - User ID
 * @param {Partial<UserPreferences>} preferences - User preference data
 * @returns {Promise<UserPreferences>} Updated user preferences
 */
export const storePreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
  try {
    const currentPrefs = preferenceStore[userId] || {
      userId,
      updatedAt: new Date()
    };
    
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      updatedAt: new Date()
    };
    
    preferenceStore[userId] = updatedPrefs;
    logger.debug(`Stored preferences for user ${userId}`);
    
    return updatedPrefs;
  } catch (error) {
    logger.error(`Error storing preferences for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user preferences
 * 
 * @param {string} userId - User ID
 * @returns {Promise<UserPreferences | null>} User preferences
 */
export const getPreferences = async (
  userId: string
): Promise<UserPreferences | null> => {
  try {
    return preferenceStore[userId] || null;
  } catch (error) {
    logger.error(`Error retrieving preferences for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Store a message in the user's conversation history
 * 
 * @param {string} userId - User ID
 * @param {string} message - Message content
 * @param {string} role - Message role (user, assistant, system)
 * @returns {Promise<void>}
 */
export const storeMessage = async (
  userId: string,
  message: string,
  role: string
): Promise<void> => {
  try {
    if (!historyStore[userId]) {
      historyStore[userId] = [];
    }
    
    // Add message to history
    historyStore[userId].push({
      timestamp: Date.now(),
      message,
      role
    });
    
    // Limit history size
    const maxHistoryItems = 100;
    if (historyStore[userId].length > maxHistoryItems) {
      historyStore[userId] = historyStore[userId].slice(-maxHistoryItems);
    }
    
    logger.debug(`Stored message for user ${userId}`);
  } catch (error) {
    logger.error(`Error storing message for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user conversation history
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array<{ timestamp: number; message: string; role: string }>>}
 */
export const getHistory = async (
  userId: string,
  limit: number = 10
): Promise<Array<{ timestamp: number; message: string; role: string }>> => {
  try {
    if (!historyStore[userId]) {
      return [];
    }
    
    return historyStore[userId].slice(-limit);
  } catch (error) {
    logger.error(`Error retrieving history for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Clear user conversation history
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const clearHistory = async (
  userId: string
): Promise<void> => {
  try {
    delete historyStore[userId];
    logger.debug(`Cleared conversation history for user ${userId}`);
  } catch (error) {
    logger.error(`Error clearing history for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user's relevant context based on a query
 * 
 * @param {string} userId - User ID
 * @param {string} query - Query to match against context
 * @returns {Promise<any>} Relevant context
 */
export const getRelevantContext = async (
  userId: string,
  query: string
): Promise<any> => {
  try {
    // In a real implementation, this would use semantic search or similarity matching
    // For demonstration purposes, we'll return all context
    if (!contextStore[userId]) {
      return {};
    }
    
    return contextStore[userId];
  } catch (error) {
    logger.error(`Error retrieving relevant context for user ${userId}:`, error);
    throw error;
  }
};