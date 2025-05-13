import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { router as apiRouter } from './api';
import { router as webhooksRouter } from './webhooks';
import { initializeCore } from './core';
import { initializeIntegrations } from './integrations';
import { initializeModels } from './models';
import { logger } from './utils/logger';
import { handleError, createApiError } from './utils/error-handler';
import config from './config';

/**
 * Google Calendar MCP Server Application
 * 
 * This is the main entry point for the application.
 */

// Create Express application
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.security.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(compression()); // Response compression
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use(morgan(config.env === 'production' ? 'combined' : 'dev', {
  stream: {
    write: (message: string) => logger.http(message.trim())
  }
}));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  next();
});

// Mount routers
app.use('/api', apiRouter);
app.use('/webhooks', webhooksRouter);

// Root health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Google Calendar MCP Server',
    version: config.app.version,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createApiError(404, `Route ${req.method} ${req.path} not found`));
});

// Error handler
app.use(handleError);

// Application startup function
const startServer = async (): Promise<void> => {
  try {
    // Initialize all modules
    await initializeCore();
    await initializeIntegrations();
    await initializeModels();
    
    // Start the server
    const port = config.app.port || 3000;
    app.listen(port, () => {
      logger.info(`Server started on port ${port} in ${config.env} mode`);
      logger.info(`API endpoint: http://localhost:${port}/api`);
      logger.info(`Webhooks endpoint: http://localhost:${port}/webhooks`);
    });
    
    // Handle graceful shutdown
    const shutdown = async (): Promise<void> => {
      logger.info('Shutting down server...');
      // Perform cleanup operations here
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
export { app, startServer };