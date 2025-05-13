# AI Agenda MCP: Module Implementation Details

This document provides detailed implementation guidance for the core modules of the AI Agenda MCP server. It explains the internal structure, interfaces, and behaviors of each major component.

## MCP Router Module

The MCP Router is the central coordinator for the system, mapping commands to appropriate handlers and managing the flow of data.

### Command Protocol

Commands follow a standardized structure:

```typescript
interface MCPCommand {
  // Unique identifier for the command
  id: string;
  // The specific action to perform
  action: string;
  // Source of the command (CLI, API, webhook)
  source: CommandSource;
  // Command parameters
  params: Record<string, any>;
  // Authentication context
  auth: AuthContext;
  // Contextual information for command processing
  context?: Record<string, any>;
  // Timestamp when the command was created
  timestamp: number;
}
```

### Router Implementation

The router uses a middleware pattern similar to Express.js:

```typescript
class MCPRouter {
  private middlewares: RouterMiddleware[] = [];
  private handlers: Map<string, CommandHandler> = new Map();

  // Register middleware to process commands before handlers
  use(middleware: RouterMiddleware): void {
    this.middlewares.push(middleware);
  }

  // Register handler for specific actions
  registerHandler(action: string, handler: CommandHandler): void {
    this.handlers.set(action, handler);
  }

  // Process incoming command through middleware and handlers
  async processCommand(command: MCPCommand): Promise<CommandResult> {
    // Apply middleware chain
    let currentCommand = command;
    for (const middleware of this.middlewares) {
      currentCommand = await middleware(currentCommand);
    }

    // Find appropriate handler
    const handler = this.handlers.get(currentCommand.action);
    if (!handler) {
      throw new UnknownCommandError(`Unknown command action: ${currentCommand.action}`);
    }

    // Execute handler
    return await handler(currentCommand);
  }
}
```

### Handler Registration

Handlers are registered with action patterns that may include wildcards:

```typescript
// Calendar event creation handler
router.registerHandler('calendar.event.create', createEventHandler);

// Google Docs document handlers
router.registerHandler('docs.document.*', docsDocumentHandler);
```

## Natural Language Parser

The Natural Language Parser (NLP) module converts natural language inputs into structured commands.

### Parsing Flow

The parsing process follows these steps:

1. **Preprocessing**: Normalize text, handle punctuation, and tokenize
2. **Intent Detection**: Identify the primary intent of the request
3. **Entity Extraction**: Extract key entities (dates, times, people, etc.)
4. **Parameter Mapping**: Map extracted entities to command parameters
5. **Context Enrichment**: Add contextual information from memory
6. **Command Generation**: Create a properly formatted command

### Intent Detection

Intent detection uses a combination of keyword matching and AI models:

```typescript
class IntentDetector {
  private patterns: Map<string, RegExp[]> = new Map();
  private modelClient: AIModelClient;

  constructor(modelClient: AIModelClient) {
    this.modelClient = modelClient;
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Calendar-related patterns
    this.patterns.set('calendar.event.create', [
      /\bcreate\s+(?:an?|the)\s+(?:event|meeting|appointment)\b/i,
      /\bschedule\s+(?:an?|the)\s+(?:event|meeting|appointment)\b/i,
      /\badd\s+(?:an?|the)\s+(?:event|meeting|appointment)\b/i,
    ]);
    
    // Google Docs-related patterns
    this.patterns.set('docs.document.create', [
      /\bcreate\s+(?:an?|the)\s+(?:document|doc|note)\b/i,
      /\bwrite\s+(?:an?|the)\s+(?:document|doc|note)\b/i,
      /\bstart\s+(?:an?|the)\s+(?:document|doc|note)\b/i,
    ]);
    
    // More patterns...
  }

  // Detect intent using pattern matching first, then AI model if needed
  async detectIntent(text: string): Promise<IntentResult> {
    // Try pattern matching first (faster)
    for (const [intent, patterns] of this.patterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            intent,
            confidence: 0.9, // High confidence for pattern matches
            method: 'pattern',
          };
        }
      }
    }

    // Fall back to AI model
    return await this.detectIntentWithModel(text);
  }

  private async detectIntentWithModel(text: string): Promise<IntentResult> {
    const prompt = `Determine the primary intent of the following text. 
    Response should be one of: calendar.event.create, calendar.event.update, 
    calendar.event.delete, docs.document.create, docs.document.update, 
    docs.document.delete, preference.set, other.
    
    Text: "${text}"
    
    Intent:`;

    const response = await this.modelClient.complete({
      prompt,
      maxTokens: 10,
      temperature: 0.1, // Low temperature for more deterministic results
    });

    const intent = response.trim().toLowerCase();
    
    return {
      intent,
      confidence: 0.7, // Lower confidence for model-based detection
      method: 'model',
    };
  }
}
```

## Memory Module

The Memory module maintains user history, preferences, and contextual information.

### Memory Store

The memory store is implemented as a layered architecture with caching:

```typescript
class MemoryStore {
  private db: Database;
  private cache: CacheClient;

  constructor(db: Database, cache: CacheClient) {
    this.db = db;
    this.cache = cache;
  }

  // Store user history item
  async addHistoryItem(userId: string, item: HistoryItem): Promise<void> {
    // Store in database
    await this.db.collection('history').insertOne({
      userId,
      ...item,
      timestamp: new Date(),
    });
    
    // Invalidate relevant cache keys
    await this.cache.del(`user:${userId}:history:recent`);
  }

  // Get recent history items
  async getRecentHistory(userId: string, limit = 10): Promise<HistoryItem[]> {
    // Try cache first
    const cacheKey = `user:${userId}:history:recent`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database if not in cache
    const items = await this.db.collection('history')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    // Cache results
    await this.cache.set(cacheKey, JSON.stringify(items), { ttl: 60 * 5 }); // 5 minutes TTL
    
    return items;
  }

  // Store user preference
  async setPreference(userId: string, key: string, value: any): Promise<void> {
    // Upsert preference in database
    await this.db.collection('preferences').updateOne(
      { userId, key },
      { $set: { value, updatedAt: new Date() } },
      { upsert: true }
    );
    
    // Update cache
    const cacheKey = `user:${userId}:preferences`;
    await this.cache.del(cacheKey);
  }

  // Get user preferences
  async getPreferences(userId: string): Promise<Record<string, any>> {
    // Try cache first
    const cacheKey = `user:${userId}:preferences`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database if not in cache
    const preferences = await this.db.collection('preferences')
      .find({ userId })
      .toArray();
    
    // Transform to key-value format
    const result = preferences.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, any>);
    
    // Cache results
    await this.cache.set(cacheKey, JSON.stringify(result), { ttl: 60 * 60 }); // 1 hour TTL
    
    return result;
  }
}
```

## Task Queue Module

The Task Queue module manages asynchronous and scheduled tasks.

### Queue Configuration

Multiple queues are configured for different task types:

```typescript
class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private redis: Redis;
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Calendar-related queues
    this.createQueue('calendar:sync', {
      limiter: { max: 5, duration: 1000 }, // Rate limit
    });
    
    this.createQueue('calendar:reminders', {
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
    
    // Google Docs queues
    this.createQueue('docs:generation', {
      limiter: { max: 2, duration: 1000 }, // More strict rate limit
    });
    
    // Notification queue
    this.createQueue('notifications', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    });
  }

  // Add a job to a queue
  async addJob(queueName: string, data: any, options: JobOptions = {}): Promise<Job> {
    const queue = this.getQueue(queueName);
    return await queue.add(data, options);
  }

  // Schedule a job for later execution
  async scheduleJob(queueName: string, data: any, delay: number): Promise<Job> {
    return await this.addJob(queueName, data, { delay });
  }

  // Schedule a recurring job
  async scheduleRecurring(queueName: string, data: any, cron: string, options: any = {}): Promise<Job> {
    const queue = this.getQueue(queueName);
    return await queue.add(data, { 
      repeat: { cron },
      ...options,
    });
  }
}
```

## Model Layer

### Model Router

The Model Router selects the appropriate AI model for different tasks:

```typescript
class ModelRouter {
  private modelAdapters: Map<string, ModelAdapter> = new Map();
  private defaultModel: string;
  
  constructor(defaultModel: string) {
    this.defaultModel = defaultModel;
  }

  // Register a model adapter
  registerModel(name: string, adapter: ModelAdapter): void {
    this.modelAdapters.set(name, adapter);
  }

  // Select appropriate model based on request
  selectModel(request: ModelRequest): ModelAdapter {
    // Try specific model if requested
    if (request.model && this.modelAdapters.has(request.model)) {
      return this.modelAdapters.get(request.model)!;
    }
    
    // Use default model
    if (this.modelAdapters.has(this.defaultModel)) {
      return this.modelAdapters.get(this.defaultModel)!;
    }
    
    // Fall back to first available model
    const firstModel = this.modelAdapters.values().next().value;
    if (firstModel) {
      return firstModel;
    }
    
    throw new Error('No model adapters available');
  }

  // Execute request with appropriate model
  async executeRequest(request: ModelRequest): Promise<ModelResponse> {
    try {
      // Select model
      const adapter = this.selectModel(request);
      
      // Execute request
      return await adapter.execute(request);
    } catch (error) {
      // If primary model fails, try fallback
      if (request.allowFallback && !request.isFallback) {
        return await this.executeFallbackRequest(request, error);
      }
      
      // No fallback available or fallback also failed
      throw error;
    }
  }

  // Try fallback model if primary fails
  private async executeFallbackRequest(request: ModelRequest, originalError: Error): Promise<ModelResponse> {
    // Get available models excluding the one that failed
    const availableModels = Array.from(this.modelAdapters.keys())
      .filter(name => name !== request.model);
    
    if (availableModels.length === 0) {
      throw originalError; // No fallback available
    }
    
    // Create fallback request
    const fallbackRequest: ModelRequest = {
      ...request,
      model: availableModels[0],
      isFallback: true,
    };
    
    // Log fallback attempt
    logger.warn(`Falling back to model ${fallbackRequest.model} due to error with ${request.model}`, {
      error: originalError.message,
      originalModel: request.model,
      fallbackModel: fallbackRequest.model,
    });
    
    // Execute with fallback model
    return await this.executeRequest(fallbackRequest);
  }
}
```

### Model Adapter

Model adapters provide a consistent interface to different LLM providers:

```typescript
abstract class ModelAdapter {
  protected config: ModelConfig;
  
  constructor(config: ModelConfig) {
    this.config = config;
  }

  // Execute model request (to be implemented by specific adapters)
  abstract execute(request: ModelRequest): Promise<ModelResponse>;
  
  // Get token count for input
  abstract getTokenCount(text: string): number;
  
  // Check if request is within token limits
  protected validateTokenCount(request: ModelRequest): void {
    const inputTokens = this.getTokenCount(request.prompt);
    
    if (inputTokens + (request.maxTokens || 100) > this.config.maxTokens) {
      throw new TokenLimitError('Request exceeds model token limit');
    }
  }
  
  // Transform common parameters to model-specific format
  protected abstract transformRequest(request: ModelRequest): any;
  
  // Transform model-specific response to common format
  protected abstract transformResponse(response: any): ModelResponse;
}

// GPT-4o Adapter Implementation
class GPT4Adapter extends ModelAdapter {
  private client: OpenAIClient;
  
  constructor(config: ModelConfig, client: OpenAIClient) {
    super(config);
    this.client = client;
  }

  async execute(request: ModelRequest): Promise<ModelResponse> {
    // Validate token count
    this.validateTokenCount(request);
    
    // Transform to OpenAI-specific format
    const openaiRequest = this.transformRequest(request);
    
    // Execute request
    const response = await this.client.createCompletion(openaiRequest);
    
    // Transform to common format
    return this.transformResponse(response);
  }

  getTokenCount(text: string): number {
    // Implement token counting logic for GPT models
    // Could use a library like tiktoken
    return Math.ceil(text.length / 4); // Simple approximation
  }

  protected transformRequest(request: ModelRequest): any {
    return {
      model: 'gpt-4o',
      prompt: request.prompt,
      max_tokens: request.maxTokens || 100,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 1,
      presence_penalty: request.presencePenalty ?? 0,
      frequency_penalty: request.frequencyPenalty ?? 0,
      stop: request.stopSequences,
    };
  }

  protected transformResponse(response: any): ModelResponse {
    return {
      text: response.choices[0].text,
      tokenUsage: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
      model: 'gpt-4o',
      finishReason: response.choices[0].finish_reason,
    };
  }
}
```

## Integration Components

### Google Calendar Integration

Overview of key calendar integration components:

```typescript
// Calendar event creation handler
async function createEventHandler(command: MCPCommand): Promise<CommandResult> {
  const { userId } = command.auth;
  const { title, start, end, location, description, attendees, reminders } = command.params;
  
  // Create event
  const event = await calendarService.createEvent(userId, {
    title,
    start,
    end,
    location,
    description,
    attendees,
    reminders,
  });
  
  // Set up reminders if requested
  if (reminders) {
    await reminderService.scheduleReminders(userId, event.id, reminders);
  }
  
  // Add to user history
  await memoryService.addHistoryItem(userId, {
    type: 'calendar.event.create',
    data: {
      eventId: event.id,
      title: event.title,
      start: event.start,
    },
    timestamp: Date.now(),
  });
  
  return {
    success: true,
    data: event,
    message: `Created calendar event "${event.title}" on ${formatDate(event.start)}`,
  };
}
```

### Google Docs Integration

Overview of key docs integration components:

```typescript
// Document creation handler
async function createDocumentHandler(command: MCPCommand): Promise<CommandResult> {
  const { userId } = command.auth;
  const { title, content, template, folderId } = command.params;
  
  // Create document
  const document = await docsService.createDocument(userId, {
    title,
    content,
    template,
    folderId,
  });
  
  // Add to user history
  await memoryService.addHistoryItem(userId, {
    type: 'docs.document.create',
    data: {
      documentId: document.id,
      title: document.title,
    },
    timestamp: Date.now(),
  });
  
  return {
    success: true,
    data: document,
    message: `Created Google Doc "${document.title}"`,
    contextUpdates: {
      lastDocumentId: document.id,
      lastDocumentTitle: document.title,
    },
  };
}
```

## Security Considerations

### Authentication Flow

Secure authentication implementation:

```typescript
class AuthenticationService {
  private googleClient: GoogleClient;
  private tokenStore: TokenStore;
  
  constructor(googleClient: GoogleClient, tokenStore: TokenStore) {
    this.googleClient = googleClient;
    this.tokenStore = tokenStore;
  }

  // Get OAuth URL for initial authentication
  getAuthUrl(redirectUri: string, scopes: string[]): string {
    return this.googleClient.getAuthUrl(redirectUri, scopes);
  }

  // Exchange auth code for tokens
  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const tokenResponse = await this.googleClient.exchangeCode(code, redirectUri);
    
    // Store tokens
    await this.tokenStore.storeTokens(tokenResponse.userId, {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: Date.now() + tokenResponse.expiresIn * 1000,
      scopes: tokenResponse.scopes,
    });
    
    return tokenResponse;
  }

  // Get valid access token, refreshing if necessary
  async getAccessToken(userId: string): Promise<string> {
    const tokens = await this.tokenStore.getTokens(userId);
    
    if (!tokens) {
      throw new AuthenticationError('User not authenticated');
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
      // Refresh token
      const refreshedTokens = await this.googleClient.refreshToken(tokens.refreshToken);
      
      // Update stored tokens
      await this.tokenStore.storeTokens(userId, {
        ...tokens,
        accessToken: refreshedTokens.accessToken,
        expiresAt: Date.now() + refreshedTokens.expiresIn * 1000,
      });
      
      return refreshedTokens.accessToken;
    }
    
    // Return existing valid token
    return tokens.accessToken;
  }
}
```

## Data Flow Examples

### Creating a Calendar Event from Natural Language

```
User input: "Schedule a meeting with Sarah about project planning next Monday at 2pm for one hour"

1. **NLP Parsing**:
   - Intent: calendar.event.create
   - Entities:
     - title: "Project Planning Meeting"
     - attendees: ["Sarah"]
     - date: next Monday
     - startTime: 2:00 PM
     - duration: 1 hour

2. **Command Generation**:
   - action: calendar.event.create
   - params:
     - title: "Project Planning Meeting"
     - start: { dateTime: "2023-05-15T14:00:00-04:00", timeZone: "America/New_York" }
     - end: { dateTime: "2023-05-15T15:00:00-04:00", timeZone: "America/New_York" }
     - attendees: ["sarah@example.com"] (resolved from contacts)
     - reminders: { useDefault: true }

3. **Command Execution**:
   - Calendar integration creates event
   - Reminder tasks scheduled
   - History recorded

4. **Response**:
   - "Created calendar event 'Project Planning Meeting' on Monday, May 15 at 2:00 PM with Sarah"
```

### Creating a Weekly Reflection Journal

```
User input: "Set up a weekly reflection journal document every Sunday"

1. **NLP Parsing**:
   - Intent: docs.document.create.recurring
   - Entities:
     - title: "Weekly Reflection Journal"
     - recurrence: "WEEKLY on Sunday"

2. **Command Generation**:
   - action: docs.document.create.recurring
   - params:
     - title: "Weekly Reflection Journal"
     - template: "weekly-reflection"
     - recurrence: { frequency: "WEEKLY", dayOfWeek: "SUNDAY" }

3. **Command Execution**:
   - Task queue schedules recurring document creation
   - First document created immediately
   - Scheduled for recurring creation

4. **Response**:
   - "Created 'Weekly Reflection Journal' document and scheduled for automatic creation every Sunday"