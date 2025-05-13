import { 
  parseInput, 
  extractEntities,
  processIntent,
  IntentType,
  EntityType,
  Intent,
  Entity,
  NlpContext
} from '../../../../src/core/nlp';

describe('NLP Module', () => {
  describe('parseInput', () => {
    it('should parse a meeting creation command', async () => {
      // Arrange
      const input = 'schedule a meeting with John tomorrow at 2pm';
      
      // Act
      const result = await parseInput(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(IntentType.CREATE_EVENT);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.entities.length).toBeGreaterThan(0);
    });
    
    it('should parse a document creation command', async () => {
      // Arrange
      const input = 'create a document about project status';
      
      // Act
      const result = await parseInput(input);
      
      // Assert
      expect(result.type).toBe(IntentType.CREATE_DOCUMENT);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
    
    it('should handle preference setting commands', async () => {
      // Arrange
      const input = 'set my preference for notifications to enabled';
      
      // Act
      const result = await parseInput(input);
      
      // Assert
      expect(result.type).toBe(IntentType.SET_PREFERENCE);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
    
    it('should return unknown intent for unrecognized inputs', async () => {
      // Arrange
      const input = 'xyzabc123';
      
      // Act
      const result = await parseInput(input);
      
      // Assert
      expect(result.type).toBe(IntentType.UNKNOWN);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
  
  describe('extractEntities', () => {
    it('should extract date and time entities', () => {
      // Arrange
      const input = 'schedule a meeting tomorrow at 2pm';
      
      // Act
      const entities = extractEntities(input);
      
      // Assert
      expect(entities.length).toBeGreaterThan(0);
      const dateTimeEntity = entities.find(e => e.type === EntityType.DATE_TIME);
      expect(dateTimeEntity).toBeDefined();
      expect(dateTimeEntity?.value).toContain('tomorrow at 2pm');
    });
    
    it('should extract duration entities', () => {
      // Arrange
      const input = 'schedule a meeting for 30 minutes';
      
      // Act
      const entities = extractEntities(input);
      
      // Assert
      const durationEntity = entities.find(e => e.type === EntityType.DURATION);
      expect(durationEntity).toBeDefined();
      expect(durationEntity?.value).toContain('30 minutes');
    });
    
    it('should extract location entities', () => {
      // Arrange
      const input = 'schedule a meeting at Conference Room A';
      
      // Act
      const entities = extractEntities(input);
      
      // Assert
      const locationEntity = entities.find(e => e.type === EntityType.LOCATION);
      expect(locationEntity).toBeDefined();
      expect(locationEntity?.value).toBe('Conference Room A');
    });
    
    it('should extract person entities', () => {
      // Arrange
      const input = 'schedule a meeting with John Smith';
      
      // Act
      const entities = extractEntities(input);
      
      // Assert
      const personEntity = entities.find(e => e.type === EntityType.PERSON);
      expect(personEntity).toBeDefined();
      expect(personEntity?.value).toBe('John Smith');
    });
    
    it('should return empty array when no entities found', () => {
      // Arrange
      const input = 'help';
      
      // Act
      const entities = extractEntities(input);
      
      // Assert
      expect(entities).toEqual([]);
    });
  });
  
  describe('processIntent', () => {
    it('should process a valid CREATE_EVENT intent', async () => {
      // Arrange
      const intent: Intent = {
        type: IntentType.CREATE_EVENT,
        confidence: 0.9,
        entities: [{
          type: EntityType.DATE_TIME,
          value: 'tomorrow at 2pm',
          confidence: 0.8
        }]
      };
      
      // Act
      const result = await processIntent(intent);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.message).toContain('created successfully');
    });
    
    it('should process a valid CREATE_DOCUMENT intent', async () => {
      // Arrange
      const intent: Intent = {
        type: IntentType.CREATE_DOCUMENT,
        confidence: 0.85,
        entities: []
      };
      
      // Act
      const result = await processIntent(intent);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.message).toContain('Document created');
    });
    
    it('should handle low confidence intents', async () => {
      // Arrange
      const intent: Intent = {
        type: IntentType.SET_PREFERENCE,
        confidence: 0.3, // Below threshold
        entities: []
      };
      
      // Act
      const result = await processIntent(intent);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('LOW_CONFIDENCE');
    });
    
    it('should handle unknown intents', async () => {
      // Arrange
      const intent: Intent = {
        type: IntentType.UNKNOWN,
        confidence: 0.1,
        entities: []
      };
      
      // Act
      const result = await processIntent(intent);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNKNOWN_INTENT');
    });
  });
  
  describe('End-to-end NLP pipeline', () => {
    it('should process natural language input through the entire pipeline', async () => {
      // Arrange
      const input = 'schedule a meeting with Jane tomorrow at 3pm';
      const context: NlpContext = {
        conversationId: 'test-conversation'
      };
      
      // Act
      const intent = await parseInput(input, context);
      const result = await processIntent(intent, context);
      
      // Assert
      expect(intent.type).toBe(IntentType.CREATE_EVENT);
      expect(result.success).toBe(true);
      expect(result.data?.intent).toBe(IntentType.CREATE_EVENT);
    });
  });
});