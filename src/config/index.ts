import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Base configuration for all environments
const baseConfig = {
  env,
  app: {
    name: 'Google Calendar MCP Server',
    version: '0.1.0',
    description: 'AI-powered assistant for Google Calendar and Google Docs using MCP',
    port: Number(process.env.PORT) || 3000,
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'change-this-session-secret',
    jwtSecret: process.env.JWT_SECRET || 'change-this-jwt-secret',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/google-calendar-mcp',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || ''
  },
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redisPassword: process.env.REDIS_PASSWORD || ''
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    scopes: process.env.GOOGLE_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  },
  ai: {
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-4o',
    fallbackEnabled: process.env.MODEL_FALLBACK_ENABLED === 'true',
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
  queue: {
    maxConcurrentJobs: Number(process.env.MAX_CONCURRENT_JOBS) || 5,
    jobAttemptLimit: Number(process.env.JOB_ATTEMPT_LIMIT) || 3,
    jobRetentionDays: Number(process.env.JOB_RETENTION_DAYS) || 7
  },
  reminders: {
    defaultEnabled: process.env.DEFAULT_REMINDERS_ENABLED === 'true',
    defaultMinutesBefore: process.env.DEFAULT_REMINDER_MINUTES_BEFORE 
      ? JSON.parse(process.env.DEFAULT_REMINDER_MINUTES_BEFORE) 
      : [1440, 60] // 1 day and 1 hour before
  },
  logging: {
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
    enablePerformanceMetrics: process.env.ENABLE_PERFORMANCE_METRICS === 'true'
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

// Environment-specific configurations
const envConfig: Record<string, Record<string, unknown>> = {
  development: {},
  test: {
    database: {
      mongoUri: 'mongodb://localhost:27017/google-calendar-mcp-test'
    }
  },
  production: {
    app: {
      logLevel: 'warn'
    }
  }
};

// Merge base and environment-specific configurations
const config = {
  ...baseConfig,
  ...(envConfig[env] || {})
};

export default config;