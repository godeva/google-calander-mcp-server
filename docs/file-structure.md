# AI Agenda MCP: File Structure

This document outlines the recommended file structure for the AI Agenda MCP project, organized according to the modular architecture design. The structure follows a feature-based organization pattern with clear separation of concerns.

## Root Directory Structure

```
ai-agenda-mcp/
├── docs/                      # Documentation files
│   ├── architecture.md        # System architecture documentation
│   ├── api-reference.md       # API documentation
│   └── file-structure.md      # This file
├── src/                       # Source code
│   ├── cli/                   # Command Line Interface
│   ├── api/                   # RESTful API endpoints
│   ├── webhooks/              # Webhook handlers
│   ├── core/                  # Core MCP functionality
│   ├── integrations/          # External service integrations
│   ├── models/                # AI model adapters
│   ├── infrastructure/        # Database, cache, etc.
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript type definitions
│   ├── config/                # Configuration files
│   └── app.ts                 # Application entry point
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── scripts/                   # Utility scripts
├── .env.example               # Example environment variables
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker configuration
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest test configuration
└── README.md                  # Project overview
```

## Detailed Module Structure

### Client Layer (`src/cli`, `src/api`, `src/webhooks`)

```
src/cli/
├── commands/                  # Command implementations
│   ├── calendar.ts            # Calendar-related commands
│   ├── docs.ts                # Google Docs-related commands
│   └── preference.ts          # User preference commands
├── utils/                     # CLI-specific utilities
├── index.ts                   # CLI entry point
└── types.ts                   # CLI-specific type definitions

src/api/
├── controllers/               # Request handlers
│   ├── authController.ts      # Authentication endpoints
│   ├── calendarController.ts  # Calendar endpoints
│   ├── docsController.ts      # Google Docs endpoints
│   └── preferenceController.ts # User preference endpoints
├── middleware/                # Express middleware
│   ├── auth.ts                # Authentication middleware
│   ├── validation.ts          # Request validation
│   └── rateLimit.ts           # Rate limiting
├── routes/                    # API route definitions
│   ├── v1/                    # v1 API routes
│   └── index.ts               # Route registration
├── swagger/                   # API documentation
├── index.ts                   # API setup
└── types.ts                   # API-specific type definitions

src/webhooks/
├── handlers/                  # Webhook event handlers
│   ├── calendar.ts            # Calendar webhook handlers
│   └── docs.ts                # Google Docs webhook handlers
├── middleware/                # Webhook-specific middleware
│   └── verification.ts        # Webhook signature verification
├── routes.ts                  # Webhook route definitions
├── index.ts                   # Webhook setup
└── types.ts                   # Webhook-specific type definitions
```

### Core Layer (`src/core`)

```
src/core/
├── router/                    # MCP Router implementation
│   ├── handlers/              # Command handlers
│   ├── middleware/            # Router middleware
│   ├── routes.ts              # Route definitions
│   └── index.ts               # Router setup
├── auth/                      # Authentication module
│   ├── oauth.ts               # OAuth implementation
│   ├── token.ts               # Token management
│   ├── rbac.ts                # Role-based access control
│   └── index.ts               # Auth module setup
├── nlp/                       # Natural Language Parser
│   ├── parsers/               # Specialized parsers
│   │   ├── calendar.ts        # Calendar-specific parsing
│   │   ├── docs.ts            # Google Docs-specific parsing
│   │   └── common.ts          # Common parsing utilities
│   ├── entity-extraction.ts   # Entity extraction
│   ├── intent-detection.ts    # Intent detection
│   ├── context-resolution.ts  # Contextual reference resolution
│   └── index.ts               # NLP setup
├── memory/                    # Memory module
│   ├── history.ts             # User history tracking
│   ├── preferences.ts         # User preferences
│   ├── context.ts             # Conversation context
│   ├── retrieval.ts           # Memory retrieval mechanisms
│   └── index.ts               # Memory module setup
├── queue/                     # Task Queue
│   ├── producers/             # Queue job producers
│   ├── consumers/             # Queue job consumers
│   ├── jobs/                  # Job definitions
│   ├── middleware/            # Queue middleware
│   └── index.ts               # Queue setup
└── index.ts                   # Core module exports
```

### Integration Layer (`src/integrations`)

```
src/integrations/
├── google/                    # Google API integrations
│   ├── calendar/              # Google Calendar integration
│   │   ├── events.ts          # Event management
│   │   ├── reminders.ts       # Reminder management
│   │   ├── recurring.ts       # Recurring event handling
│   │   ├── permissions.ts     # Calendar permissions
│   │   └── index.ts           # Calendar integration setup
│   ├── docs/                  # Google Docs integration
│   │   ├── documents.ts       # Document management
│   │   ├── templates.ts       # Template handling
│   │   ├── permissions.ts     # Document permissions
│   │   ├── versioning.ts      # Version control
│   │   └── index.ts           # Docs integration setup
│   └── auth.ts                # Google Auth utilities
├── common/                    # Common integration utilities
│   ├── retry.ts               # Retry mechanisms
│   ├── rateLimit.ts           # Rate limiting
│   └── metrics.ts             # Integration metrics
└── index.ts                   # Integrations setup
```

### Model Layer (`src/models`)

```
src/models/
├── router/                    # AI Model Router
│   ├── selector.ts            # Model selection logic
│   ├── fallback.ts            # Fallback mechanisms
│   ├── load-balancer.ts       # Load balancing
│   └── index.ts               # Router setup
├── adapters/                  # Model-specific adapters
│   ├── gpt.ts                 # GPT-4o adapter
│   ├── claude.ts              # Claude adapter
│   ├── gemini.ts              # Gemini adapter
│   └── base.ts                # Base adapter interface
├── prompts/                   # Model prompts
│   ├── calendar.ts            # Calendar-related prompts
│   ├── docs.ts                # Google Docs-related prompts
│   └── common.ts              # Common prompts
├── utils/                     # Model utilities
│   ├── tokenizer.ts           # Token counting
│   ├── prompt-optimizer.ts    # Prompt optimization
│   └── response-parser.ts     # Response parsing
└── index.ts                   # Models setup
```

### Infrastructure Layer (`src/infrastructure`)

```
src/infrastructure/
├── database/                  # Database implementation
│   ├── models/                # Data models
│   │   ├── user.ts            # User model
│   │   ├── history.ts         # History model
│   │   ├── preference.ts      # Preference model
│   │   └── task.ts            # Task model
│   ├── repositories/          # Data access patterns
│   ├── migrations/            # Database migrations
│   └── index.ts               # Database setup
├── cache/                     # Cache implementation
│   ├── providers/             # Cache providers
│   ├── strategies/            # Caching strategies
│   └── index.ts               # Cache setup
├── scheduler/                 # Cron scheduler
│   ├── jobs/                  # Scheduled job definitions
│   ├── triggers/              # Job triggers
│   ├── handlers/              # Job handlers
│   └── index.ts               # Scheduler setup
└── index.ts                   # Infrastructure setup
```

### Utils and Config (`src/utils`, `src/config`)

```
src/utils/
├── logger.ts                  # Logging utility
├── error-handler.ts           # Error handling
├── validators.ts              # Input validation
├── date-time.ts               # Date and time utilities
└── security.ts                # Security utilities

src/config/
├── app.ts                     # Application configuration
├── database.ts                # Database configuration
├── models.ts                  # AI models configuration
├── integrations.ts            # Integrations configuration
└── index.ts                   # Configuration setup
```

### Type Definitions (`src/types`)

```
src/types/
├── api.ts                     # API-related types
├── calendar.ts                # Calendar-related types
├── docs.ts                    # Google Docs-related types
├── models.ts                  # AI model-related types
├── queue.ts                   # Queue-related types
└── index.ts                   # Type exports
```

## Configuration Files

### Environment Variables (`.env.example`)

```
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Authentication
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=your-session-secret

# Database
MONGODB_URI=mongodb://localhost:27017/ai-agenda-mcp

# Cache
REDIS_URL=redis://localhost:6379

# AI Models
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=mongodb://mongo:27017/ai-agenda-mcp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

## Development Workflow

The project follows a modular development approach where each component can be developed and tested independently. The recommended workflow is:

1. Implement core functionality first (router, auth, NLP)
2. Develop infrastructure components (database, cache, scheduler)
3. Add model adapters with appropriate fallback mechanisms
4. Implement integration modules with comprehensive error handling
5. Build client interfaces (API, CLI, webhooks)
6. Write tests for each component
7. Document all APIs and components

## Testing Strategy

The testing structure follows the modular organization of the project:

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test interactions between multiple components
- **End-to-End Tests**: Test complete user flows from client to integrations

Each test file should be placed in the corresponding directory structure that mirrors the `src` directory.

## Continuous Integration/Deployment

The project can be configured with GitHub Actions or similar CI/CD tools:

- Run linting and tests on pull requests
- Build and push Docker images on merges to main branch
- Deploy to staging/production environments based on branch/tag

Deployment scripts and configuration should be placed in the `scripts` directory.