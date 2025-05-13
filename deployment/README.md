# Google Calendar MCP Server Deployment Guide

This guide provides instructions for deploying the Google Calendar MCP Server to different environments. The server supports various deployment options:

- Docker
- Kubernetes
- Local Development
- Cloud Providers (AWS, GCP, Azure)

## Prerequisites

- Node.js v14 or higher
- Docker and Docker Compose (for container deployment)
- Kubernetes (for orchestration)
- Google Cloud Platform account with APIs enabled
- Redis instance
- MongoDB instance (optional)

## Environment Configuration

Before deploying, make sure to properly configure your environment variables. Copy the `.env.example` file to `.env` and update the values according to your environment.

Critical variables include:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, test, production)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `JWT_SECRET`: Secret for signing JWT tokens
- `REDIS_URL`: URL for Redis connection

## Docker Deployment

The simplest way to deploy the application is using Docker.

### Building the Docker Image

```bash
docker build -t google-calendar-mcp-server:latest .
```

### Running with Docker Compose

The repository includes a `docker-compose.yml` file to simplify deployment:

```bash
docker-compose up -d
```

This will start:
- The MCP server application
- Redis for caching and queue management
- MongoDB (optional, if configured)

### Docker Image Configuration

The Docker image is configured with:
- Node.js runtime
- Non-root user for security
- Health check endpoint
- Proper signal handling for graceful shutdown

## Kubernetes Deployment

For production environments, Kubernetes is recommended.

### Prerequisites

- Kubernetes cluster
- kubectl configured
- Helm (optional, for chart installation)

### Deploying with kubectl

1. Apply the configuration files:

```bash
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/secret.yaml
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
```

2. Verify the deployment:

```bash
kubectl get pods -n mcp-server
```

### Helm Chart Installation

Alternatively, use the provided Helm chart:

```bash
helm install mcp-server ./deployment/helm/mcp-server
```

## Local Development Deployment

For local development:

```bash
npm install
npm run dev
```

## Cloud Provider Deployment

### AWS Elastic Beanstalk

1. Install the EB CLI
2. Initialize EB in your project:
   ```bash
   eb init
   ```
3. Deploy:
   ```bash
   eb deploy
   ```

### Google Cloud Run

1. Build and push the Docker image to Google Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/your-project/mcp-server
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy mcp-server --image gcr.io/your-project/mcp-server --platform managed
   ```

### Azure App Service

1. Create an App Service Plan and Web App
2. Set up CI/CD using GitHub Actions or Azure DevOps
3. Deploy using the Azure CLI or portal

## Monitoring and Logging

The application is configured to output logs in JSON format when running in production mode, which can be easily ingested by logging platforms.

### Recommended Tools

- Prometheus for metrics
- Grafana for visualization
- ELK stack for log aggregation
- Sentry for error tracking

## Scaling Considerations

- The application is stateless and can scale horizontally
- Redis is used for distributed locking and shared state
- Session data is stored in Redis for shared state across instances
- JWT tokens are used for authentication to avoid session affinity requirements

## Security Considerations

- All API endpoints are secured with authentication except health checks
- OAuth2 is used for Google authentication
- JWT tokens are short-lived and can be revoked
- HTTPS is required for production deployments
- Secrets are stored securely and not in the codebase
- Docker containers run as non-root users

## Backup and Disaster Recovery

- Regular database backups are recommended
- Use Redis persistence for queue reliability
- Implement proper monitoring and alerting
- Document recovery procedures for different failure scenarios