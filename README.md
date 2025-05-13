# Google Calendar MCP Server

A Model Control Protocol (MCP) server implementation for Google Calendar integration. This server provides intelligent calendar management through natural language processing and machine learning.

## Features

- **Natural Language Processing**: Interact with your calendar using plain English commands
- **Intelligent Scheduling**: Smart scheduling that respects your preferences and availability
- **Google Calendar Integration**: Seamlessly connects with Google Calendar
- **Google Docs Integration**: Create and manage meeting notes and documents
- **MCP Protocol Support**: Implements the Model Control Protocol for AI integration
- **Extensible Architecture**: Modular design allows for easy integration of new features

## Table of Contents

- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Starting the Server](#starting-the-server)
  - [API Endpoints](#api-endpoints)
  - [MCP Commands](#mcp-commands)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding New Features](#adding-new-features)
  - [Testing](#testing)
- [License](#license)

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account with Calendar and Docs APIs enabled
- Redis (for task scheduling and caching)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/google-calendar-mcp-server.git
cd google-calendar-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your configuration:

```env
# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
WEBHOOK_SECRET=your-webhook-secret

# Google API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# AI Models
OPENAI_API_KEY=your-openai-api-key

# Redis
REDIS_URL=redis://localhost:6379
```

3. Set up your Google Cloud Platform project:

- Create a new project in the [Google Cloud Console](https://console.cloud.google.com/)
- Enable the Google Calendar API and Google Docs API
- Create OAuth 2.0 credentials and configure the redirect URI
- Download the credentials and update your `.env` file

## Usage

### Starting the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

### API Endpoints

The server exposes the following main endpoints:

- `GET /api/health`: Health check endpoint
- `POST /api/v1/mcp/process`: MCP command processing endpoint
- `GET /api/v1/auth/google/login`: Google OAuth login
- `GET /api/v1/auth/google/callback`: Google OAuth callback
- `GET /api/v1/user/profile`: Get user profile
- `GET /api/v1/user/preferences`: Get user preferences
- `PUT /api/v1/user/preferences`: Update user preferences
- `POST /api/v1/nlp/process`: Process natural language input
- `GET /api/v1/calendar/events`: List calendar events
- `POST /api/v1/calendar/events`: Create a calendar event
- `GET /api/v1/docs`: List Google Docs
- `POST /api/v1/docs`: Create a Google Doc

### MCP Commands

The server supports the following MCP commands:

- `CREATE_EVENT`: Create a calendar event
- `UPDATE_EVENT`: Update an existing calendar event
- `DELETE_EVENT`: Delete a calendar event
- `QUERY_EVENTS`: Query calendar events
- `CREATE_DOCUMENT`: Create a Google Doc
- `UPDATE_DOCUMENT`: Update a Google Doc
- `SET_PREFERENCE`: Update user preferences
- `GET_PREFERENCE`: Get user preferences

Example MCP command:

```json
{
  "command": "CREATE_EVENT",
  "parameters": {
    "title": "Team Meeting",
    "startTime": "2023-05-15T14:00:00Z",
    "endTime": "2023-05-15T15:00:00Z",
    "description": "Weekly team sync",
    "attendees": ["teammate@example.com"]
  }
}
```

## Development

### Project Structure

The project follows a modular architecture:

```
src/
├── api/            # API routes and controllers
├── config/         # Configuration management
├── core/           # Core functionality
│   ├── auth/       # Authentication and authorization
│   ├── memory/     # User context and preferences storage
│   ├── nlp/        # Natural language processing
│   ├── queue/      # Task queue management
│   ├── router/     # MCP router implementation
│   └── scheduler/  # Scheduled tasks
├── integrations/   # External service integrations
│   └── google/     # Google API integrations
│       ├── calendar/ # Google Calendar integration
│       └── docs/     # Google Docs integration
├── models/         # AI model adapters
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

### Adding New Features

1. Identify the appropriate module for your feature
2. Create the necessary files following the project structure
3. Update the module's index file to export your new feature
4. Add any required configurations to `config/index.ts`
5. Implement your feature with appropriate tests
6. Update the API or MCP router to expose your feature

### Testing

Run the tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
