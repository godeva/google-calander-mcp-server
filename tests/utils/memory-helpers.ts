import { CommandContext } from '../../src/types';

/**
 * Creates a mock memory entry for testing
 * 
 * @param {Object} overrides - Override default memory entry properties
 * @returns {Object} A mock memory entry
 */
export const createMockMemoryEntry = (overrides: Record<string, any> = {}) => {
  return {
    id: 'memory-123',
    type: 'note',
    content: {
      title: 'Test Memory',
      body: 'This is a test memory for unit testing'
    },
    userId: 'user-123',
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'test',
      tags: ['test', 'unit-test']
    },
    embeddings: [],
    ...overrides
  };
};

/**
 * Creates a mock memory success response
 * 
 * @param {Object} data - Data to include in the success response
 * @returns {Object} A mock success response
 */
export const createMockMemorySuccess = (data: any = {}) => {
  return {
    success: true,
    data: {
      id: 'memory-123',
      ...data
    }
  };
};

/**
 * Creates a mock memory error response
 * 
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {Object} A mock error response
 */
export const createMockMemoryError = (code: string = 'MEMORY_ERROR', message: string = 'Memory operation failed') => {
  return {
    success: false,
    error: {
      code,
      message
    }
  };
};

/**
 * Standard memory context for testing
 */
export const mockMemoryContext: CommandContext = {
  userId: 'test-user-123',
  requestId: 'req-123',
  timestamp: new Date().toISOString()
};

/**
 * Mocks a search result with relevance scores
 *
 * @param {number} count - Number of mock results to generate
 * @returns {Array} Array of mock search results
 */
export const createMockSearchResults = (count: number = 3) => {
  const results: Array<{
    id: string;
    type: string;
    content: {
      title: string;
      body: string;
    };
    userId: string;
    timestamp: string;
    metadata: {
      source: string;
      tags: string[];
    };
    relevanceScore: number;
  }> = [];
  
  for (let i = 0; i < count; i++) {
    results.push({
      id: `memory-${i + 100}`,
      type: 'note',
      content: {
        title: `Search Result ${i + 1}`,
        body: `This is search result number ${i + 1}`
      },
      userId: 'user-123',
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'search',
        tags: ['search', 'result']
      },
      relevanceScore: 0.95 - (i * 0.1) // Descending relevance scores
    });
  }
  
  return results;
};

/**
 * Mocks a Pinecone vector database response
 *
 * @param {number} count - Number of mock results
 * @returns {Object} Mock Pinecone response
 */
export const mockPineconeResponse = (count: number = 3) => {
  const matches: Array<{
    id: string;
    score: number;
    metadata: {
      type: string;
      content: {
        title: string;
        body: string;
      };
      userId: string;
      timestamp: string;
      metadata: {
        source: string;
        tags: string[];
      };
    };
  }> = [];
  
  for (let i = 0; i < count; i++) {
    matches.push({
      id: `memory-${i + 100}`,
      score: 0.95 - (i * 0.1),
      metadata: {
        type: 'note',
        content: {
          title: `Search Result ${i + 1}`,
          body: `This is search result number ${i + 1}`
        },
        userId: 'user-123',
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'search',
          tags: ['search', 'result']
        }
      }
    });
  }
  
  return {
    matches
  };
};