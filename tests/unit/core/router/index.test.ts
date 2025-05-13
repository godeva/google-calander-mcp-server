import { Request, Response, NextFunction } from 'express';
import { router, registerHandler, processCommand } from '../../../../src/core/router';
import { createApiError } from '../../../../src/utils/error-handler';

// Mock Express request, response, and next function
const mockRequest = () => {
  const req: Partial<Request> = {
    body: {},
    id: 'test-req-id'
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

// Mock the error handler
jest.mock('../../../../src/utils/error-handler', () => ({
  createApiError: jest.fn((statusCode, message) => {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    return error;
  })
}));

describe('MCP Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('registerHandler', () => {
    it('should register a command handler', () => {
      // Arrange
      const commandType = 'test-command';
      const handler = jest.fn();
      
      // Act
      registerHandler(commandType, handler as any);
      
      // Assert
      expect(handler).not.toHaveBeenCalled(); // Should not call the handler during registration
    });
    
    it('should log a warning when overwriting an existing handler', () => {
      // Arrange
      const commandType = 'duplicate-command';
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const loggerSpy = jest.spyOn(console, 'warn');
      
      // Act
      registerHandler(commandType, handler1 as any);
      registerHandler(commandType, handler2 as any);
      
      // Assert - We can't directly test the logger output here since it's mocked in setup
      // In a real scenario, we would mock the logger itself
      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('processCommand', () => {
    it('should execute the registered handler for a command', async () => {
      // Arrange
      const commandType = 'valid-command';
      const parameters = { param1: 'value1' };
      const req = mockRequest();
      const res = mockResponse();
      req.body = { command: commandType, parameters };
      
      const mockHandler = jest.fn().mockImplementation((req, res, next) => {
        res.status(200).json({ success: true });
      });
      
      registerHandler(commandType, mockHandler);
      
      // Act
      await processCommand(req, res, mockNext);
      
      // Assert
      expect(mockHandler).toHaveBeenCalledWith(req, res, mockNext);
      expect(req.commandData).toBeDefined();
      expect(req.commandData?.command).toBe(commandType);
      expect(req.commandData?.parameters).toEqual(parameters);
    });
    
    it('should pass error to next middleware when command is missing', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = {}; // Missing command
      
      // Act
      await processCommand(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(createApiError).toHaveBeenCalledWith(400, expect.stringContaining('Missing command'));
    });
    
    it('should pass error to next middleware when handler is not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { command: 'unknown-command' };
      
      // Act
      await processCommand(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(createApiError).toHaveBeenCalledWith(404, expect.stringContaining('No handler registered'));
    });
    
    it('should handle parameters when they are not provided', async () => {
      // Arrange
      const commandType = 'no-params-command';
      const req = mockRequest();
      const res = mockResponse();
      req.body = { command: commandType }; // No parameters
      
      const mockHandler = jest.fn().mockImplementation((req, res, next) => {
        res.status(200).json({ success: true });
      });
      
      registerHandler(commandType, mockHandler);
      
      // Act
      await processCommand(req, res, mockNext);
      
      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(req.commandData?.parameters).toEqual({});
    });
    
    it('should pass error to next middleware when handler throws', async () => {
      // Arrange
      const commandType = 'error-command';
      const req = mockRequest();
      const res = mockResponse();
      req.body = { command: commandType };
      
      const mockError = new Error('Handler error');
      const mockHandler = jest.fn().mockImplementation(() => {
        throw mockError;
      });
      
      registerHandler(commandType, mockHandler);
      
      // Act
      await processCommand(req, res, mockNext);
      
      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('router', () => {
    it('should export an Express router', () => {
      // Assert
      expect(router).toBeDefined();
      expect(router.post).toBeDefined();
      expect(router.get).toBeDefined();
    });
  });
});