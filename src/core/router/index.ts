import { Request, Response, NextFunction, Router } from 'express';
import { logger } from '../../utils/logger';
import { createApiError } from '../../utils/error-handler';
import config from '../../config';

/**
 * Model Control Protocol (MCP) Router
 * 
 * The central router for handling MCP requests based on the command pattern.
 * It orchestrates the flow of commands to appropriate handlers.
 */

// Router instance
const router = Router();

// Handler registry - maps command types to their handlers
const handlers: Record<string, (req: Request, res: Response, next: NextFunction) => Promise<void>> = {};

/**
 * Register a command handler
 * 
 * @param commandType The command type to register a handler for
 * @param handler The function that handles the command
 */
export const registerHandler = (
  commandType: string,
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): void => {
  if (handlers[commandType]) {
    logger.warn(`Overwriting existing handler for command type: ${commandType}`);
  }
  
  handlers[commandType] = handler;
  logger.info(`Registered handler for command type: ${commandType}`);
};

/**
 * Process an MCP command
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const processCommand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { command, parameters } = req.body;
    
    if (!command) {
      throw createApiError(400, 'Missing command field in request body');
    }
    
    const handler = handlers[command];
    
    if (!handler) {
      throw createApiError(404, `No handler registered for command: ${command}`);
    }
    
    logger.info(`Processing command: ${command}`);
    
    // Add command metadata to request for handlers to use
    req.commandData = {
      command,
      parameters: parameters || {},
      timestamp: new Date().toISOString(),
      requestId: req.id || `req-${Date.now()}`
    };
    
    // Execute the handler
    await handler(req, res, next);
    
  } catch (error) {
    next(error);
  }
};

// Main MCP route for processing commands
router.post('/process', processCommand);

// Health check route for the MCP router
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.app.version
  });
});

// Export the router and registration function
export { router };