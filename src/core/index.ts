/**
 * Core Module
 * 
 * This is the main entry point for the core functionality of the Google Calendar MCP server.
 * It exports all the submodules for use throughout the application.
 */

// Re-export all submodules
export * from './router';
export * from './auth';
export * from './nlp';
export * from './memory';
export * from './queue';
export * from './scheduler';

// Import submodules for initialization
import { router as mcpRouter } from './router';
import { initializeQueueProcessors } from './queue';
import { initializeScheduledTasks } from './scheduler';
import { logger } from '../utils/logger';

/**
 * Initialize all core modules
 * 
 * This function sets up all the necessary components of the core module,
 * such as initializing the queue processors and scheduled tasks.
 */
export const initializeCore = async (): Promise<void> => {
  try {
    logger.info('Initializing core modules...');
    
    // Initialize queue processors
    initializeQueueProcessors();
    
    // Initialize scheduled tasks
    initializeScheduledTasks();
    
    logger.info('Core modules initialized successfully');
  } catch (error) {
    logger.error('Error initializing core modules:', error);
    throw error;
  }
};

// Export the MCP router for use in the main application
export const router = mcpRouter;