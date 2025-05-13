import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * API Error class for HTTP errors
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;
  
  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    
    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new API error
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {ApiError} API error instance
 */
export const createApiError = (
  statusCode: number,
  message: string,
  details?: any
): ApiError => {
  return new ApiError(statusCode, message, details);
};

/**
 * Global error handler middleware
 * 
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const handleError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 internal server error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = undefined;
  
  // If it's our API error, use its details
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  
  // Log the error (but not for 404s)
  if (statusCode !== 404) {
    logger.error(`Error ${statusCode}: ${message}`, {
      path: req.path,
      method: req.method,
      statusCode,
      ...(details ? { details } : {}),
      stack: err.stack
    });
  }
  
  // Send response
  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
    }
  });
};

/**
 * Handle uncaught exceptions and promise rejections
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled promise rejection:', reason);
  });
};