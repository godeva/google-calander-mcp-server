import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import createError from 'http-errors';

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Custom error handler middleware for Express
 * Formats error responses consistently and logs errors
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default status code is 500 if not specified
  const statusCode = err.statusCode || 500;
  
  // Log error details
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${err.message}`);
    logger.error(err.stack || 'No stack trace available');
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${err.message}`);
  }

  // Format response
  const response = {
    status: 'error',
    statusCode,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(err.details && { details: err.details })
  };

  res.status(statusCode).json(response);
};

/**
 * Create a 404 error for routes that don't exist
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(createError(404, `Route ${req.method} ${req.path} not found`));
};

/**
 * Create a typed error with status code and optional details
 */
export const createApiError = (
  statusCode: number,
  message: string,
  details?: unknown
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};