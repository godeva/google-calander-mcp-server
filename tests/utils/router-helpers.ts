import { CommandResult, CommandContext } from '../../src/types';

/**
 * Helper functions for testing the MCP router module
 */

/**
 * Mock command structure
 */
export interface MockCommand {
  command: string;
  parameters: Record<string, any>;
}

/**
 * Create a mock command context
 *
 * @param overrides - Properties to override in the mock context
 * @returns A mock command context
 */
export const createMockCommandContext = (overrides: Partial<CommandContext> = {}): CommandContext => {
  return {
    userId: 'user-123',
    userEmail: 'user123@example.com',
    requestId: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sessionData: {},
    ...overrides
  };
};

/**
 * Mock command handler function
 */
export type MockCommandHandler = (
  command: string,
  parameters: Record<string, any>,
  context: CommandContext
) => Promise<CommandResult>;

/**
 * Create a mock successful command handler
 *
 * @param responseData - Data to include in the success response
 * @returns A mock command handler that returns success
 */
export const createMockSuccessHandler = (responseData: any): MockCommandHandler => {
  return async (): Promise<CommandResult> => {
    return {
      success: true,
      data: responseData
    };
  };
};

/**
 * Create a mock failing command handler
 *
 * @param errorCode - Error code to return
 * @param errorMessage - Error message to return
 * @returns A mock command handler that returns an error
 */
export const createMockErrorHandler = (
  errorCode: string,
  errorMessage: string
): MockCommandHandler => {
  return async (): Promise<CommandResult> => {
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    };
  };
};

/**
 * Create a mock command handler that validates inputs
 *
 * @param requiredParams - Array of parameter names that must be present
 * @param successResponse - Response to return if validation passes
 * @returns A mock command handler that validates parameters
 */
export const createValidatingMockHandler = (
  requiredParams: string[],
  successResponse: any
): MockCommandHandler => {
  return async (
    command: string,
    parameters: Record<string, any>,
    context: CommandContext
  ): Promise<CommandResult> => {
    // Check for required parameters
    for (const param of requiredParams) {
      if (parameters[param] === undefined) {
        return {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: `Required parameter '${param}' is missing`,
            details: { parameter: param }
          }
        };
      }
    }

    // All validation passed
    return {
      success: true,
      data: successResponse
    };
  };
};

/**
 * Create a mock command handler that simulates an error
 *
 * @returns A mock command handler that throws an error
 */
export const createThrowingMockHandler = (): MockCommandHandler => {
  return async (): Promise<CommandResult> => {
    throw new Error('Simulated error in command handler');
  };
};

/**
 * Create a mock command handler that delays response
 *
 * @param delayMs - Milliseconds to delay
 * @param result - Result to return after delay
 * @returns A mock command handler with delay
 */
export const createDelayedMockHandler = (
  delayMs: number,
  result: CommandResult
): MockCommandHandler => {
  return async (): Promise<CommandResult> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(result), delayMs);
    });
  };
};

/**
 * Mock command object factory
 *
 * @param command - Command name
 * @param parameters - Command parameters
 * @returns A mock command object
 */
export const createMockCommand = (
  command: string,
  parameters: Record<string, any> = {}
): MockCommand => {
  return {
    command,
    parameters
  };
};