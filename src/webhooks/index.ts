import { Router } from 'express';
import { notFoundHandler } from '../utils/error-handler';

// Import webhook handlers
// These will be implemented later
// import { calendarWebhook } from './handlers/calendar';
// import { docsWebhook } from './handlers/docs';

// Create the webhooks router
const router = Router();

// Webhook documentation
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Google Calendar MCP Webhook Endpoints',
    version: '1.0.0',
    documentation: '/api/docs/webhooks'
  });
});

// Register webhook endpoints
// router.post('/calendar', calendarWebhook);
// router.post('/docs', docsWebhook);

// Handle 404 for webhook routes
router.use(notFoundHandler);

export { router };