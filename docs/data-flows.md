# AI Agenda MCP: Data Flows

This document illustrates the key data flows within the AI Agenda MCP system. Understanding these flows helps developers see how the different components interact during common operations.

## Natural Language Command Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI as Command Line Interface
    participant Router as MCP Router
    participant NLP as Natural Language Parser
    participant Memory as Memory Module
    participant Model as AI Model Router
    participant Calendar as Google Calendar Integration

    User->>CLI: "Schedule a meeting with John tomorrow at 2pm"
    CLI->>Router: Forward natural language command
    Router->>NLP: Process natural language
    NLP->>Memory: Retrieve context and preferences
    Memory->>NLP: Return user context
    NLP->>Model: Parse intent and entities
    Model->>NLP: Return structured data
    NLP->>Router: Return command object
    Router->>Calendar: Create calendar event
    Calendar->>Router: Return created event
    Router->>Memory: Store action in history
    Router->>CLI: Return success response
    CLI->>User: "Created meeting with John tomorrow at 2pm"
```

## Google Calendar Event Creation Flow

```mermaid
sequenceDiagram
    participant Router as MCP Router
    participant Auth as Authentication Module
    participant Calendar as Google Calendar Integration
    participant Queue as Task Queue
    participant Google as Google Calendar API

    Router->>Auth: Get access token
    Auth->>Router: Return valid token
    Router->>Calendar: Create event request
    Calendar->>Google: API request with token
    Google->>Calendar: Return created event
    Calendar->>Queue: Schedule reminders
    Queue->>Calendar: Confirm scheduled jobs
    Calendar->>Router: Return success result
```

## Google Docs Creation Flow

```mermaid
sequenceDiagram
    participant Router as MCP Router
    participant Auth as Authentication Module
    participant Docs as Google Docs Integration
    participant Model as AI Model Router
    participant Google as Google Docs API

    Router->>Auth: Get access token
    Auth->>Router: Return valid token
    Router->>Model: Generate document content
    Model->>Router: Return generated content
    Router->>Docs: Create document with content
    Docs->>Google: API request with token
    Google->>Docs: Return created document
    Docs->>Router: Return success result
```

## Recurring Task Flow

```mermaid
sequenceDiagram
    participant User
    participant API as REST API
    participant Router as MCP Router
    participant Queue as Task Queue
    participant Scheduler as Cron Scheduler
    participant Integration as Integration Module

    User->>API: "Create weekly report every Monday at 9am"
    API->>Router: Forward command
    Router->>Queue: Create recurring task
    Queue->>Scheduler: Register cron job
    
    loop Every Monday at 9am
        Scheduler->>Queue: Trigger job
        Queue->>Integration: Execute task
        Integration->>Queue: Return result
    end
    
    Router->>API: Confirm setup
    API->>User: "Weekly report scheduled for Mondays at 9am"
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Web/CLI Client
    participant API as API Server
    participant Auth as Auth Module
    participant Google as Google OAuth

    User->>Client: Initiate authentication
    Client->>API: Request auth URL
    API->>Auth: Generate OAuth URL
    Auth->>API: Return OAuth URL
    API->>Client: Redirect to OAuth URL
    Client->>Google: User authenticates
    Google->>Client: Return with auth code
    Client->>API: Submit auth code
    API->>Auth: Exchange code for tokens
    Auth->>Google: Token request
    Google->>Auth: Access & refresh tokens
    Auth->>API: Store tokens & create session
    API->>Client: Return success with session
    Client->>User: Authentication complete
```

## Memory and Context Flow

```mermaid
sequenceDiagram
    participant NLP as Natural Language Parser
    participant Memory as Memory Module
    participant DB as Database
    participant Cache as Cache
    
    NLP->>Memory: Request user context
    Memory->>Cache: Check for cached context
    
    alt Context in cache
        Cache->>Memory: Return cached context
    else Context not in cache
        Memory->>DB: Query database
        DB->>Memory: Return context data
        Memory->>Cache: Store in cache
    end
    
    Memory->>NLP: Return enriched context
    
    NLP->>Memory: Update context with new data
    Memory->>DB: Persist updated context
    Memory->>Cache: Update cached context
```

## Model Selection Flow

```mermaid
sequenceDiagram
    participant NLP as Natural Language Parser
    participant Router as Model Router
    participant GPT as GPT-4o Adapter
    participant Claude as Claude Adapter
    participant Gemini as Gemini Adapter
    
    NLP->>Router: Request with model preference
    
    alt Preferred model available
        Router->>GPT: Forward request
        GPT->>Router: Return response
    else Primary model fails
        Router->>Claude: Attempt with fallback
        Claude->>Router: Return response
    else Specific task requirement
        Router->>Gemini: Use specialized model
        Gemini->>Router: Return response
    end
    
    Router->>NLP: Return processed result
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Client as Client Interface
    participant Router as MCP Router
    participant Service as Service Module
    participant Error as Error Handler
    
    Client->>Router: Send request
    Router->>Service: Process request
    
    alt Success path
        Service->>Router: Return success result
        Router->>Client: Return formatted response
    else Service error
        Service--xRouter: Throw error
        Router->>Error: Handle service error
        Error->>Router: Return error response
        Router->>Client: Return error with guidance
    else Authentication error
        Service--xRouter: Throw auth error
        Router->>Error: Handle auth error
        Error->>Client: Redirect to authentication
    end
```

## Data Synchronization Flow

```mermaid
sequenceDiagram
    participant Scheduler as Cron Scheduler
    participant Queue as Task Queue
    participant Sync as Sync Service
    participant Google as Google APIs
    participant DB as Local Database
    
    Scheduler->>Queue: Trigger sync job
    Queue->>Sync: Execute sync task
    
    Sync->>Google: Request recent changes
    Google->>Sync: Return changed data
    
    Sync->>DB: Update local data
    DB->>Sync: Confirm update
    
    alt Conflicts detected
        Sync->>Queue: Schedule conflict resolution
        Queue->>Sync: Resolve conflicts later
    end
    
    Sync->>Queue: Complete sync task
```

These diagrams illustrate the primary data flows within the system. They show how components interact during typical operations and help developers understand the system's behavior at runtime.