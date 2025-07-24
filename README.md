# LLM Proxy Server

A scalable, distributed LLM proxy server built with TypeScript that provides unified access to multiple Large Language Model providers through standardized APIs. The system uses RabbitMQ for distributed processing and PostgreSQL for audit logging.

## 🏗️ Architecture Overview

The LLM Proxy Server follows a distributed microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   RabbitMQ      │    │   Worker Nodes  │
│   (Express)     │◄──►│   (Message      │◄──►│   (LLM          │
│                 │    │    Broker)      │    │    Processing)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Audit Service │    │   LLM Providers │
│   (Database)    │    │   (Logging)     │    │   (OpenAI,      │
│                 │    │                 │    │    Claude,      │
│                 │    │                 │    │    Ollama)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **API Server** (`src/app.ts`): Main Express.js application handling HTTP requests
2. **Worker Server** (`src/servers/worker.server.ts`): Processes LLM requests from the queue
3. **Audit Server** (`src/servers/audit.server.ts`): Logs all requests for compliance
4. **Provider Services** (`src/providers/`): Interfaces to different LLM APIs
5. **Queue Service** (`src/services/queue.service.ts`): RabbitMQ message handling
6. **Response Service** (`src/services/response.service.ts`): Streaming response management

## 🚀 Key Features

### Multi-Provider Support
- **OpenAI**: Full GPT model family support with streaming
- **Claude**: Anthropic's Claude models via their API
- **Ollama**: Local model hosting integration
- **Extensible**: Easy to add new providers

### API Compatibility
- **OpenAI-Compatible**: `/api/openai/v1/chat/completions`
- **Claude-Compatible**: `/api/claude/v1/messages`
- **Custom Endpoints**: `/api/generate`, `/api/chat`

### Streaming Responses
- Server-Sent Events (SSE) for real-time streaming
- Efficient connection pooling and routing
- Client disconnect handling

### Horizontal Scaling
- Queue-based work distribution
- Stateless worker nodes
- Load balancing across multiple workers

### Audit & Compliance
- Complete request/response logging
- PostgreSQL-backed audit trails
- Configurable audit levels

## 📡 API Endpoints

### Standard Endpoints

#### Generate Text
```http
POST /api/generate
Content-Type: application/json

{
  "model": "gpt-4",
  "prompt": "Write a haiku about programming",
  "stream": true,
  "options": {
    "temperature": 0.7,
    "max_tokens": 100
  }
}
```

#### Chat Completion
```http
POST /api/chat
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "stream": true,
  "options": {
    "temperature": 0.5
  }
}
```

### OpenAI-Compatible Endpoints

#### Chat Completions
```http
POST /api/openai/v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "stream": true
}
```

#### List Models
```http
GET /api/openai/v1/models
```

### Claude-Compatible Endpoints

#### Messages
```http
POST /api/claude/v1/messages
Content-Type: application/json

{
  "model": "claude-3-sonnet-20240229",
  "messages": [
    {
      "role": "user",
      "content": "Explain machine learning"
    }
  ],
  "max_tokens": 1000
}
```

### Health & Status

#### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 🔧 Configuration

### Environment Variables

#### API Server Configuration
```bash
# Server settings
PORT=3000
NODE_ENV=production
SERVER_ID=api_server_001

# Worker settings
WORKER_ID=worker_001

# Audit settings
AUDIT_ID=audit_001
```

#### Database Configuration
```bash
# PostgreSQL settings
DATABASE_URL="postgresql://user:password@localhost:5432/llm_proxy"
APP_PG_HOST=localhost
APP_PG_PORT=5432
APP_PG_DATABASE=llm_proxy
APP_PG_USER=postgres
APP_PG_PASSWORD=password
APP_PG_SSL=false
APP_PG_MAX_CONNECTIONS=20
```

#### RabbitMQ Configuration
```bash
# Message queue settings
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_REQUEST_QUEUE=llm_requests
RABBITMQ_RESPONSE_QUEUE=llm_responses
RABBITMQ_AUDIT_REQUEST_QUEUE=llm_requests_audit
RABBITMQ_AUDIT_RESPONSE_QUEUE=llm_responses_audit
```

#### Provider Configuration
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Claude/Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60000
```

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- RabbitMQ 3.8+
- Docker & Docker Compose (optional)

### Quick Start with Docker
```bash
# Clone and navigate to project
git clone <repository>
cd llm-proxy

# Start all services
docker-compose up -d

# Scale workers as needed
docker-compose up -d --scale worker=3

# View logs
docker-compose logs -f api
```

### Development Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configurations

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Start in development mode
npm run api:dev     # API server
npm run worker:dev  # Worker node
npm run audit:dev   # Audit service
```

### Production Deployment
```bash
# Build TypeScript
npm run build

# Start services
npm start          # API server
npm run worker     # Worker node
npm run audit      # Audit service
```

## 🔌 Provider Integration

### Adding a New Provider

1. **Create Provider Class** (`src/providers/new-provider.provider.ts`):
```typescript
import AIProvider from './ai.provider';
import { ModelInfo } from './types';

export class NewProvider extends AIProvider {
  name: string = 'newprovider';
  
  async init(): Promise<void> {
    // Initialize provider client
  }
  
  async getModels(): Promise<ModelInfo[]> {
    // Fetch available models
  }
  
  async generate(requestId: string, sourceId: string, model: string, 
                prompt: string, options: {}, stream: boolean): Promise<void> {
    // Implement text generation
  }
  
  async chat(requestId: string, sourceId: string, model: string,
            messages: any[], options: {}, stream: boolean): Promise<void> {
    // Implement chat completion
  }
}
```

2. **Register Provider** (`src/services/provider.service.ts`):
```typescript
// Add to refreshAvailableProviders method
if (provider.name === 'newprovider') {
  const aiProvider = new NewProvider(provider.config, this.queueService, serverId);
  await aiProvider.init();
  this.aiProviders.set('newprovider', aiProvider);
}
```

3. **Add Configuration**:
```typescript
// Add to src/env.ts or configuration system
export namespace newProvider {
  export const apiKey = process.env.NEW_PROVIDER_API_KEY;
  export const baseUrl = process.env.NEW_PROVIDER_BASE_URL;
}
```

## 📊 Monitoring & Observability

### Logging
The system uses Winston for structured logging:
- **API Server**: Request/response logging with Morgan
- **Workers**: Job processing and error logging
- **Audit**: Compliance and security logging

### Metrics
Key metrics to monitor:
- Request throughput and latency
- Queue depth and processing time
- Provider response times and error rates
- Active stream connections
- Database connection pool usage

### Health Checks
- `/health`: Basic application health
- Database connectivity checks
- RabbitMQ connection status
- Provider API availability

## 🔒 Security Considerations

### API Security
- Input validation and sanitization
- Rate limiting (implement as needed)
- API key management for providers
- Request/response size limits

### Data Privacy
- Audit logging configuration
- Provider data handling policies
- Request data retention policies
- SSL/TLS encryption in transit

### Infrastructure Security
- Database connection encryption
- RabbitMQ authentication
- Container security best practices
- Environment variable protection

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="Provider"
npm test -- --testNamePattern="API"
```

### Testing Endpoints
```bash
# Test OpenAI compatibility
curl -X POST http://localhost:3000/api/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'

# Test Claude compatibility
curl -X POST http://localhost:3000/api/claude/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

## 🚀 Performance Optimization

### Scaling Strategies
1. **Horizontal Scaling**: Add more worker nodes
2. **Provider Optimization**: Implement connection pooling
3. **Caching**: Cache model lists and configurations
4. **Load Balancing**: Distribute API requests

### Resource Management
- Configure appropriate queue sizes
- Monitor memory usage in workers
- Optimize database connection pools
- Implement request timeouts

## 📋 Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Verify database connectivity
npx prisma db push
```

#### Provider Issues
```bash
# Test provider connectivity
curl -X GET http://localhost:3000/api/models

# Check provider configuration
docker-compose logs worker
```

#### Performance Issues
```bash
# Monitor queue depths
# Check worker logs for processing times
# Verify database query performance
```

## 🛠️ Development Guidelines

### Code Structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external integrations
- **Providers**: LLM API implementations
- **Types**: TypeScript type definitions
- **Utils**: Shared utility functions

### Best Practices
- Use dependency injection (TSyringe)
- Implement proper error handling
- Add comprehensive logging
- Write unit and integration tests
- Follow TypeScript strict mode
- Use environment-based configuration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Ensure CI/CD passes

For questions or support, please refer to the project documentation or create an issue in the repository.
