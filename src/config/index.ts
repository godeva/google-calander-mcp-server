import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 * 
 * This module manages all application configuration settings.
 * It loads values from environment variables with sensible defaults.
 */

// Base configuration object
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // Application settings
  app: {
    name: 'Google Calendar MCP Server',
    version: process.env.npm_package_version || '0.1.0',
    description: 'Model Control Protocol server for Google Calendar integration',
    port: parseInt(process.env.PORT || '3000', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Security settings
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    webhookSecret: process.env.WEBHOOK_SECRET || 'dev-webhook-secret'
  },
  
  // Google API settings
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/docs',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  },
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/mcp-server',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Redis cache settings
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10) // Default: 1 hour
  },
  
  // Queue settings
  queue: {
    jobAttemptLimit: parseInt(process.env.JOB_ATTEMPT_LIMIT || '3', 10),
    jobTimeout: parseInt(process.env.JOB_TIMEOUT || '60000', 10) // Default: 1 minute
  },
  
  // AI model settings
  ai: {
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
    fallbackEnabled: process.env.FALLBACK_ENABLED === 'true',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      orgId: process.env.OPENAI_ORG_ID || ''
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || ''
    }
  },
  
  // Scheduler settings
  scheduler: {
    timezone: process.env.TIMEZONE || 'UTC',
    logRotationDays: parseInt(process.env.LOG_ROTATION_DAYS || '7', 10),
    defaultCron: process.env.DEFAULT_CRON || '0 * * * *' // Default: Every hour
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // Default: 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // Default: 100 requests per minute
  }
};

/**
 * Get a configuration value by path
 * 
 * @param {string} path - Dot-notation path to the config value
 * @param {any} defaultValue - Default value if path is not found
 * @returns {any} Configuration value
 */
export const get = (path: string, defaultValue?: any): any => {
  const parts = path.split('.');
  let result: any = config;
  
  for (const part of parts) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[part];
  }
  
  return result === undefined ? defaultValue : result;
};

/**
 * Check if the application is running in development mode
 * 
 * @returns {boolean} Whether the app is in development mode
 */
export const isDevelopment = (): boolean => {
  return config.env === 'development';
};

/**
 * Check if the application is running in production mode
 * 
 * @returns {boolean} Whether the app is in production mode
 */
export const isProduction = (): boolean => {
  return config.env === 'production';
};

/**
 * Check if the application is running in test mode
 * 
 * @returns {boolean} Whether the app is in test mode
 */
export const isTest = (): boolean => {
  return config.env === 'test';
};

// Export the config object as default
export default config;