import { Router } from 'express';
import { notFoundHandler } from '../utils/error-handler';

// Import route modules
// These will be implemented later
// import { router as authRouter } from './routes/v1/auth';
// import { router as calendarRouter } from './routes/v1/calendar';
// import { router as docsRouter } from './routes/v1/docs';
// import { router as preferenceRouter } from './routes/v1/preference';

// Create the main API router
const router = Router();

// API version 1 base path
const v1BasePath = '/v1';

// API documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Google Calendar MCP API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Mount API v1 routes
// router.use(`${v1BasePath}/auth`, authRouter);
// router.use(`${v1BasePath}/calendar`, calendarRouter);
// router.use(`${v1BasePath}/docs`, docsRouter);
// router.use(`${v1BasePath}/preferences`, preferenceRouter);

// Handle 404 for API routes
router.use(notFoundHandler);

export { router };