import { CommandResult } from '../../src/types';
import {
  Intent,
  IntentType,
  Entity,
  EntityType,
  NlpContext
} from '../../src/core/nlp';

// Define ProcessIntentResult as it's not exported from the module
interface ProcessIntentResult extends CommandResult {
  intent: Intent;
}

/**
 * Helper functions for testing NLP functionality
 */

/**
 * Create a mock Intent
 *
 * @param overrides - Properties to override in the mock intent
 * @returns A mock Intent
 */
export const createMockIntent = (overrides: Partial<Intent> = {}): Intent => {
  return {
    type: IntentType.CREATE_EVENT,
    confidence: 0.85,
    entities: [],
    ...overrides
  };
};

/**
 * Create a mock Entity
 *
 * @param type - The entity type
 * @param value - The entity value
 * @param overrides - Additional properties to override
 * @returns A mock Entity
 */
export const createMockEntity = (
  type: EntityType,
  value: string,
  overrides: Partial<Entity> = {}
): Entity => {
  return {
    type,
    value,
    confidence: 0.9,
    startIndex: 0,
    endIndex: value.length,
    metadata: {},
    ...overrides
  };
};

/**
 * Create a mock date/time entity
 *
 * @param value - String representation of the date/time
 * @param overrides - Additional properties to override
 * @returns A mock DATETIME Entity
 */
export const createMockDateTimeEntity = (
  value: string,
  overrides: Partial<Entity> = {}
): Entity => {
  return createMockEntity(EntityType.DATE_TIME, value, {
    metadata: {
      parsedDate: new Date(),
      isRange: false,
      isRecurring: false,
      ...overrides.metadata
    },
    ...overrides
  });
};

/**
 * Create a mock duration entity
 *
 * @param value - String representation of the duration
 * @param minutes - Duration in minutes
 * @param overrides - Additional properties to override
 * @returns A mock DURATION Entity
 */
export const createMockDurationEntity = (
  value: string,
  minutes: number,
  overrides: Partial<Entity> = {}
): Entity => {
  return createMockEntity(EntityType.DURATION, value, {
    metadata: {
      minutes,
      ...overrides.metadata
    },
    ...overrides
  });
};

/**
 * Create a mock person entity
 *
 * @param value - String representation of the person
 * @param email - The person's email
 * @param overrides - Additional properties to override
 * @returns A mock PERSON Entity
 */
export const createMockPersonEntity = (
  value: string,
  email: string | null = null,
  overrides: Partial<Entity> = {}
): Entity => {
  return createMockEntity(EntityType.PERSON, value, {
    metadata: {
      email,
      ...overrides.metadata
    },
    ...overrides
  });
};

/**
 * Create a mock location entity
 *
 * @param value - String representation of the location
 * @param overrides - Additional properties to override
 * @returns A mock LOCATION Entity
 */
export const createMockLocationEntity = (
  value: string,
  overrides: Partial<Entity> = {}
): Entity => {
  return createMockEntity(EntityType.LOCATION, value, overrides);
};

/**
 * Create a mock successful ProcessIntentResult
 *
 * @param overrides - Properties to override in the result
 * @returns A successful ProcessIntentResult
 */
export const createMockSuccessResult = (
  overrides: Partial<ProcessIntentResult> = {}
): ProcessIntentResult => {
  return {
    success: true,
    intent: createMockIntent(),
    data: {
      eventId: 'mock-event-id',
      action: 'created',
      summary: 'Mock action successful'
    },
    ...overrides
  };
};

/**
 * Create a mock failed ProcessIntentResult
 *
 * @param errorCode - The error code
 * @param errorMessage - The error message
 * @param overrides - Additional properties to override
 * @returns A failed ProcessIntentResult
 */
export const createMockErrorResult = (
  errorCode: string,
  errorMessage: string,
  overrides: Partial<ProcessIntentResult> = {}
): ProcessIntentResult => {
  return {
    success: false,
    intent: createMockIntent(),
    error: {
      code: errorCode,
      message: errorMessage
    },
    ...overrides
  };
};

/**
 * Mock NLP context for testing
 */
export const mockContext = {
  user: {
    id: 'mock-user-id',
    email: 'mockuser@example.com',
    name: 'Mock User',
    preferences: {
      defaultDuration: 30,
      defaultTimeZone: 'America/New_York',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: [1, 2, 3, 4, 5]
    }
  },
  session: {
    id: 'mock-session-id',
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  },
  history: [
    {
      role: 'user',
      content: 'What meetings do I have tomorrow?',
      timestamp: new Date().toISOString()
    },
    {
      role: 'assistant',
      content: 'You have 2 meetings scheduled for tomorrow.',
      timestamp: new Date().toISOString()
    }
  ],
  activeEvents: [
    {
      id: 'event-1',
      title: 'Team Standup',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
  ]
};