import Queue from 'bull';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import config from '../../config';

/**
 * Task Queue Module
 * 
 * Manages asynchronous and scheduled tasks using Bull/Redis
 */

// Queue options
const queueOptions = {
  redis: config.cache.redisUrl,
  defaultJobOptions: {
    attempts: config.queue.jobAttemptLimit,
    removeOnComplete: true,
    removeOnFail: false
  }
};

// Create Redis client for queue
const createRedisClient = (): Redis => {
  const client = new Redis(config.cache.redisUrl);
  client.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });
  return client;
};

// Queue instances for different job types
export const calendarQueue = new Queue('calendar-jobs', {
  ...queueOptions,
  createClient: createRedisClient
});

export const docsQueue = new Queue('docs-jobs', {
  ...queueOptions,
  createClient: createRedisClient
});

export const notificationQueue = new Queue('notification-jobs', {
  ...queueOptions,
  createClient: createRedisClient
});

/**
 * Initialize queue processors
 */
export const initializeQueueProcessors = (): void => {
  // Calendar job processor
  calendarQueue.process(async (job) => {
    try {
      logger.info(`Processing calendar job ${job.id} of type ${job.name}`);
      
      // Process different calendar job types
      switch (job.name) {
        case 'create-event':
          // In a real implementation, call the calendar integration
          logger.info(`Creating calendar event: ${JSON.stringify(job.data)}`);
          break;
          
        case 'update-event':
          logger.info(`Updating calendar event: ${JSON.stringify(job.data)}`);
          break;
          
        case 'delete-event':
          logger.info(`Deleting calendar event: ${JSON.stringify(job.data)}`);
          break;
          
        default:
          logger.warn(`Unknown calendar job type: ${job.name}`);
      }
      
      return { success: true, processedAt: new Date().toISOString() };
    } catch (error) {
      logger.error(`Error processing calendar job ${job.id}:`, error);
      throw error;
    }
  });
  
  // Docs job processor
  docsQueue.process(async (job) => {
    try {
      logger.info(`Processing docs job ${job.id} of type ${job.name}`);
      
      // Process different docs job types
      switch (job.name) {
        case 'create-document':
          logger.info(`Creating document: ${JSON.stringify(job.data)}`);
          break;
          
        case 'update-document':
          logger.info(`Updating document: ${JSON.stringify(job.data)}`);
          break;
          
        default:
          logger.warn(`Unknown docs job type: ${job.name}`);
      }
      
      return { success: true, processedAt: new Date().toISOString() };
    } catch (error) {
      logger.error(`Error processing docs job ${job.id}:`, error);
      throw error;
    }
  });
  
  // Notification job processor
  notificationQueue.process(async (job) => {
    try {
      logger.info(`Processing notification job ${job.id} of type ${job.name}`);
      
      // Process different notification job types
      switch (job.name) {
        case 'send-reminder':
          logger.info(`Sending reminder: ${JSON.stringify(job.data)}`);
          // In a real implementation, send an actual notification
          break;
          
        default:
          logger.warn(`Unknown notification job type: ${job.name}`);
      }
      
      return { success: true, processedAt: new Date().toISOString() };
    } catch (error) {
      logger.error(`Error processing notification job ${job.id}:`, error);
      throw error;
    }
  });
  
  // Set up error handlers
  calendarQueue.on('error', (error) => {
    logger.error('Calendar queue error:', error);
  });
  
  docsQueue.on('error', (error) => {
    logger.error('Docs queue error:', error);
  });
  
  notificationQueue.on('error', (error) => {
    logger.error('Notification queue error:', error);
  });
  
  logger.info('Queue processors initialized');
};

/**
 * Add a job to create a calendar event
 * 
 * @param {Object} eventData - Calendar event data
 * @param {Object} options - Job options
 * @returns {Promise<any>} Job instance
 */
export const scheduleEventCreation = async (
  eventData: any,
  options: { priority?: number; delay?: number } = {}
): Promise<any> => {
  try {
    const job = await calendarQueue.add('create-event', eventData, {
      priority: options.priority,
      delay: options.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    
    logger.info(`Scheduled event creation job ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Error scheduling event creation:', error);
    throw error;
  }
};

/**
 * Add a job to create a Google Doc
 * 
 * @param {Object} docData - Document data
 * @param {Object} options - Job options
 * @returns {Promise<any>} Job instance
 */
export const scheduleDocumentCreation = async (
  docData: any,
  options: { priority?: number; delay?: number } = {}
): Promise<any> => {
  try {
    const job = await docsQueue.add('create-document', docData, {
      priority: options.priority,
      delay: options.delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    
    logger.info(`Scheduled document creation job ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Error scheduling document creation:', error);
    throw error;
  }
};

/**
 * Schedule a reminder notification
 * 
 * @param {Object} reminderData - Reminder data
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Promise<any>} Job instance
 */
export const scheduleReminder = async (
  reminderData: any,
  delayMs: number
): Promise<any> => {
  try {
    const job = await notificationQueue.add('send-reminder', reminderData, {
      delay: delayMs,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000
      }
    });
    
    logger.info(`Scheduled reminder job ${job.id} with delay ${delayMs}ms`);
    return job;
  } catch (error) {
    logger.error('Error scheduling reminder:', error);
    throw error;
  }
};

/**
 * Get queue health metrics
 * 
 * @returns {Promise<Object>} Queue metrics
 */
export const getQueueMetrics = async (): Promise<Record<string, any>> => {
  try {
    const [
      calendarCounts,
      docsCounts,
      notificationCounts
    ] = await Promise.all([
      calendarQueue.getJobCounts(),
      docsQueue.getJobCounts(),
      notificationQueue.getJobCounts()
    ]);
    
    return {
      calendar: calendarCounts,
      docs: docsCounts,
      notification: notificationCounts,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting queue metrics:', error);
    throw error;
  }
};

/**
 * Clean up and close queue connections
 */
export const closeQueues = async (): Promise<void> => {
  try {
    await Promise.all([
      calendarQueue.close(),
      docsQueue.close(),
      notificationQueue.close()
    ]);
    
    logger.info('Queues closed successfully');
  } catch (error) {
    logger.error('Error closing queues:', error);
    throw error;
  }
};