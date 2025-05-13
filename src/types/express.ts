import { Request } from 'express';

/**
 * Command data interface for MCP commands
 */
export interface CommandData {
  command: string;
  parameters: Record<string, any>;
  timestamp: string;
  requestId: string;
}

/**
 * Extend Express Request interface to include MCP command data
 */
declare global {
  namespace Express {
    interface Request {
      commandData?: CommandData;
      id?: string;
      user?: {
        id: string;
        email: string;
        name?: string;
        [key: string]: any;
      };
    }
  }
}