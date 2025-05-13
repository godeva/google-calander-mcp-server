import { logger } from '../../utils/logger';
import config from '../../config';
import { CommandResult } from '../../types';

/**
 * Natural Language Parser (NLP) Module
 * 
 * Handles the processing of natural language inputs and converts them to
 * structured commands that can be executed by the system.
 */

// Types of intents the NLP module can identify
export enum IntentType {
  CREATE_EVENT = 'CREATE_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  QUERY_EVENTS = 'QUERY_EVENTS',
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  UPDATE_DOCUMENT = 'UPDATE_DOCUMENT',
  SET_PREFERENCE = 'SET_PREFERENCE',
  GET_PREFERENCE = 'GET_PREFERENCE',
  UNKNOWN = 'UNKNOWN'
}

// Entity types that can be extracted from natural language
export enum EntityType {
  DATE_TIME = 'DATE_TIME',
  DURATION = 'DURATION',
  LOCATION = 'LOCATION',
  PERSON = 'PERSON',
  TITLE = 'TITLE',
  DESCRIPTION = 'DESCRIPTION'
}

// Structure for extracted entities
export interface Entity {
  type: EntityType;
  value: any;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  metadata?: Record<string, any>;
}

// Structure for detected intents
export interface Intent {
  type: IntentType;
  confidence: number;
  entities: Entity[];
}

// Context from previous interactions
export interface NlpContext {
  previousIntents?: Intent[];
  recentEntities?: Entity[];
  userData?: Record<string, any>;
  conversationId?: string;
}

/**
 * Parse natural language input into structured intents and entities
 * 
 * @param {string} input - Natural language input from user
 * @param {NlpContext} context - Optional context from previous interactions
 * @returns {Promise<Intent>} The detected intent with extracted entities
 */
export const parseInput = async (
  input: string,
  context?: NlpContext
): Promise<Intent> => {
  try {
    logger.info(`Parsing input: "${input}"`);
    
    // In a real implementation, this would use an AI model via the model adapter
    // For demonstration purposes, we'll use a simple rule-based approach
    
    // Clean and normalize the input
    const normalizedInput = input.trim().toLowerCase();
    
    // Check for meeting/event creation patterns
    if (normalizedInput.includes('schedule') || 
        normalizedInput.includes('create') || 
        normalizedInput.includes('add') || 
        normalizedInput.includes('set up')) {
      
      if (normalizedInput.includes('meeting') || 
          normalizedInput.includes('appointment') || 
          normalizedInput.includes('event')) {
        
        return {
          type: IntentType.CREATE_EVENT,
          confidence: 0.9,
          entities: extractEntities(normalizedInput)
        };
      }
      
      if (normalizedInput.includes('document') || 
          normalizedInput.includes('note') || 
          normalizedInput.includes('doc')) {
        
        return {
          type: IntentType.CREATE_DOCUMENT,
          confidence: 0.85,
          entities: extractEntities(normalizedInput)
        };
      }
    }
    
    // Check for preference-setting patterns
    if (normalizedInput.includes('preference') || 
        normalizedInput.includes('setting') || 
        normalizedInput.includes('configure')) {
      
      return {
        type: IntentType.SET_PREFERENCE,
        confidence: 0.8,
        entities: extractEntities(normalizedInput)
      };
    }
    
    // Default to unknown intent with low confidence
    return {
      type: IntentType.UNKNOWN,
      confidence: 0.3,
      entities: []
    };
    
  } catch (error) {
    logger.error('Error parsing input:', error);
    return {
      type: IntentType.UNKNOWN,
      confidence: 0.1,
      entities: []
    };
  }
};

/**
 * Extract entities from the input text
 * 
 * @param {string} input - Input text to extract entities from
 * @returns {Entity[]} Array of extracted entities
 */
export const extractEntities = (input: string): Entity[] => {
  const entities: Entity[] = [];
  
  // Simple date/time extraction (naive implementation for demonstration)
  const dateTimePatterns = [
    { regex: /today at (\d{1,2})(:\d{2})?\s*(am|pm)/i, type: EntityType.DATE_TIME },
    { regex: /tomorrow at (\d{1,2})(:\d{2})?\s*(am|pm)/i, type: EntityType.DATE_TIME },
    { regex: /(next|this) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: EntityType.DATE_TIME },
    { regex: /(\d{1,2})(:\d{2})?\s*(am|pm)/i, type: EntityType.DATE_TIME }
  ];
  
  for (const pattern of dateTimePatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      entities.push({
        type: pattern.type,
        value: match[0],
        confidence: 0.8,
        startIndex: match.index,
        endIndex: match.index! + match[0].length
      });
    }
  }
  
  // Simple duration extraction
  const durationPatterns = [
    { regex: /for (\d+) (minute|minutes|hour|hours)/i, type: EntityType.DURATION },
    { regex: /(\d+) (minute|minutes|hour|hours) long/i, type: EntityType.DURATION }
  ];
  
  for (const pattern of durationPatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      entities.push({
        type: pattern.type,
        value: match[0],
        confidence: 0.85,
        startIndex: match.index,
        endIndex: match.index! + match[0].length
      });
    }
  }
  
  // Simple location extraction
  const locationPatterns = [
    { regex: /at ([\w\s]+)(,|\.|\s|$)/i, type: EntityType.LOCATION }
  ];
  
  for (const pattern of locationPatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      entities.push({
        type: pattern.type,
        value: match[1].trim(),
        confidence: 0.7,
        startIndex: match.index,
        endIndex: match.index! + match[0].length
      });
    }
  }
  
  // Extract people mentions
  const personPatterns = [
    { regex: /with ([\w\s]+)(,|\.|\s|$)/i, type: EntityType.PERSON }
  ];
  
  for (const pattern of personPatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      entities.push({
        type: pattern.type,
        value: match[1].trim(),
        confidence: 0.75,
        startIndex: match.index,
        endIndex: match.index! + match[0].length
      });
    }
  }
  
  return entities;
};

/**
 * Process the parsed intent and execute the corresponding action
 * 
 * @param {Intent} intent - The detected intent with entities
 * @param {NlpContext} context - Context from previous interactions
 * @returns {Promise<CommandResult>} Result of the executed command
 */
export const processIntent = async (
  intent: Intent,
  context?: NlpContext
): Promise<CommandResult> => {
  try {
    logger.info(`Processing intent: ${intent.type} with confidence ${intent.confidence}`);
    
    // Check if confidence level is too low
    if (intent.confidence < 0.5) {
      return {
        success: false,
        error: {
          code: 'LOW_CONFIDENCE',
          message: 'Could not understand the request with sufficient confidence'
        }
      };
    }
    
    // Process different intents
    switch (intent.type) {
      case IntentType.CREATE_EVENT:
        // In a real implementation, this would call the Calendar integration
        return {
          success: true,
          data: {
            message: 'Event created successfully',
            intent: intent.type,
            entities: intent.entities
          }
        };
        
      case IntentType.CREATE_DOCUMENT:
        // In a real implementation, this would call the Docs integration
        return {
          success: true,
          data: {
            message: 'Document created successfully',
            intent: intent.type,
            entities: intent.entities
          }
        };
        
      case IntentType.SET_PREFERENCE:
        // In a real implementation, this would update user preferences
        return {
          success: true,
          data: {
            message: 'Preferences updated successfully',
            intent: intent.type,
            entities: intent.entities
          }
        };
        
      case IntentType.UNKNOWN:
      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_INTENT',
            message: 'Could not determine what you want to do'
          }
        };
    }
    
  } catch (error) {
    logger.error('Error processing intent:', error);
    return {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'An error occurred while processing your request'
      }
    };
  }
};