import cron from 'node-cron';
import { logger } from '../../utils/logger';
import config from '../../config';
import { closeQueues, getQueueMetrics } from '../queue';

/**
 * Scheduler Module
 * 
 * Manages scheduled tasks using cron expressions
 */

// Store for scheduled tasks
const scheduledTasks: Record<string, cron.ScheduledTask> = {};

/**
 * Schedule a task using cron syntax
 * 
 * @param {string} name - Task name
 * @param {string} cronExpression - Cron expression (e.g., '0 * * * *')
 * @param {Function} task - Task function to execute
 * @param {boolean} immediate - Whether to run the task immediately
 * @returns {boolean} Whether the task was scheduled successfully
 */
export const scheduleTask = (
  name: string,
  cronExpression: string,
  task: () => Promise<void> | void,
  immediate: boolean = false
): boolean => {
  try {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression: ${cronExpression}`);
      return false;
    }
    
    // Cancel existing task with same name
    if (scheduledTasks[name]) {
      logger.info(`Cancelling existing scheduled task: ${name}`);
      scheduledTasks[name].stop();
      delete scheduledTasks[name];
    }
    
    // Create a wrapper function that logs errors
    const safeTask = async () => {
      try {
        logger.info(`Running scheduled task: ${name}`);
        await Promise.resolve(task());
        logger.info(`Completed scheduled task: ${name}`);
      } catch (error) {
        logger.error(`Error in scheduled task ${name}:`, error);
      }
    };
    
    // Schedule the task
    logger.info(`Scheduling task ${name} with cron: ${cronExpression}`);
    scheduledTasks[name] = cron.schedule(cronExpression, safeTask, {
      scheduled: true,
      timezone: config.scheduler.timezone
    });
    
    // Run immediately if requested
    if (immediate) {
      logger.info(`Running task ${name} immediately`);
      safeTask();
    }
    
    return true;
  } catch (error) {
    logger.error(`Error scheduling task ${name}:`, error);
    return false;
  }
};

/**
 * Cancel a scheduled task
 * 
 * @param {string} name - Task name
 * @returns {boolean} Whether the task was cancelled successfully
 */
export const cancelTask = (name: string): boolean => {
  try {
    const task = scheduledTasks[name];
    
    if (!task) {
      logger.warn(`No scheduled task found with name: ${name}`);
      return false;
    }
    
    logger.info(`Cancelling scheduled task: ${name}`);
    task.stop();
    delete scheduledTasks[name];
    
    return true;
  } catch (error) {
    logger.error(`Error cancelling task ${name}:`, error);
    return false;
  }
};

/**
 * List all scheduled tasks
 * 
 * @returns {Object} Object containing task names and their cron expressions
 */
export const listTasks = (): Record<string, { expression: string; status: string }> => {
  const tasks: Record<string, { expression: string; status: string }> = {};
  
  Object.entries(scheduledTasks).forEach(([name, task]) => {
    // Get the underlying cron expression
    // This is implementation-specific and might need to be adjusted
    const expression = (task as any).options?.cronExpression || 'unknown';
    
    tasks[name] = {
      expression,
      status: task.now ? 'running' : 'scheduled'
    };
  });
  
  return tasks;
};

/**
 * Initialize scheduled tasks for the application
 */
export const initializeScheduledTasks = (): void => {
  logger.info('Initializing scheduled tasks');
  
  // Queue metrics reporting task
  scheduleTask(
    'queue-metrics',
    '*/10 * * * *', // Every 10 minutes
    async () => {
      try {
        const metrics = await getQueueMetrics();
        logger.info('Queue metrics:', metrics);
      } catch (error) {
        logger.error('Error reporting queue metrics:', error);
      }
    }
  );
  
  // Health check task
  scheduleTask(
    'health-check',
    '*/30 * * * *', // Every 30 minutes
    () => {
      logger.info('Performing scheduled health check');
      // In a real implementation, this would check system health
      // and potentially trigger alerts for issues
    }
  );
  
  // Log cleanup task (daily at midnight)
  scheduleTask(
    'log-cleanup',
    '0 0 * * *',
    () => {
      logger.info('Performing log cleanup');
      // In a real implementation, this would archive or delete old logs
    }
  );
  
  logger.info('Scheduled tasks initialized');
};

/**
 * Stop all scheduled tasks
 */
export const stopAllTasks = (): void => {
  logger.info('Stopping all scheduled tasks');
  
  Object.entries(scheduledTasks).forEach(([name, task]) => {
    logger.info(`Stopping task: ${name}`);
    task.stop();
  });
  
  // Clear the tasks map
  Object.keys(scheduledTasks).forEach(key => {
    delete scheduledTasks[key];
  });
  
  logger.info('All scheduled tasks stopped');
};

/**
 * Gracefully shut down the scheduler
 */
export const shutdown = async (): Promise<void> => {
  logger.info('Shutting down scheduler');
  
  // Stop all scheduled tasks
  stopAllTasks();
  
  // Close queues
  await closeQueues();
  
  logger.info('Scheduler shutdown complete');
};