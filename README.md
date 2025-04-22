# LLM Proxy Server

A scalable, distributed LLM proxy server that provides an Ollama-compatible API and distributes work via RabbitMQ message queues.

## Features

- Ollama-compatible API endpoints
- Distributed processing with RabbitMQ
- Streaming responses
- Docker Compose deployment
- Horizontal scaling
- Request auditing with PostgreSQL

## Architecture

- **API Server**: Processes requests and manages client connections
- **Queue System**: RabbitMQ for reliable message passing
- **Worker Nodes**: Process LLM requests with configurable LLM providers (Mock, Ollama)
- **Efficient Response Streaming**: Centralized handling of streaming responses using Server-Sent Events
- **Pluggable LLM Providers**: Support for different LLM backends (Mock, Ollama)
- **Audit Service**: Captures all LLM requests and logs them to PostgreSQL for compliance and analysis

### Response Handling Architecture

The system uses a centralized response handling approach:

1. All workers send response chunks to a single shared queue
2. A central response controller consumes from this queue
3. The controller routes messages to the appropriate response stream based on requestId
4. This approach reduces connection overhead and improves scalability

### Audit System Architecture

The audit system uses a fan-out pattern to capture all LLM requests:

1. LLM requests are published to a fanout exchange instead of directly to a queue
2. The main processing queue and audit queue both subscribe to this exchange
3. The audit service processes each request and stores it in PostgreSQL
4. This approach ensures zero impact on request processing performance

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18 or higher (for local development)

### Running with Docker Compose

```bash
# Start the services
docker-compose up

# Alternatively, run in detached mode
docker-compose up -d

# Scale workers as needed
docker-compose up -d --scale worker=5
```

### Development Setup

```bash
# Install dependencies
npm install

# Start the API server
npm run dev

# Start a worker
npm run worker

# Start the audit service
cd src/audit
node audit-server.js
```

## API Endpoints

- `POST /api/generate` - Generate text from a prompt
- `POST /api/chat` - Chat completion
- `POST /api/chat/completions` - OpenAI-compatible chat completion
- `GET /api/models` - List available models
- `GET /api/status` - Get system status
- `GET /api/queue/status` - Get queue metrics

## Example Usage

```bash
# Generate text
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "mock-llama2-7b", "prompt": "Hello, world!"}'

# Chat completion
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model": "mock-mistral-7b", "messages": [{"role": "user", "content": "Tell me a joke"}]}'
```

## Configuring LLM Providers

The application supports different LLM providers that can be configured via environment variables.

### Environment Variables

```
# General settings
PORT=3000
NODE_ENV=development
RABBITMQ_URL=amqp://localhost

# LLM Provider settings
LLM_PROVIDER=ollama  # Supported values: mock, ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60000

# Audit settings
AUDIT_ENABLED=false
AUDIT_PG_HOST=localhost
AUDIT_PG_PORT=5432
AUDIT_PG_DATABASE=llm_audit
AUDIT_PG_USER=postgres
AUDIT_PG_PASSWORD=postgres
```

### Available Providers

1. **Mock Provider** (default)
   - Simulates LLM responses for testing
   - No external dependencies

2. **Ollama Provider**
   - Connects to an Ollama server
   - Supports all models available on your Ollama instance
   - Requires an Ollama server running

### Adding a New Provider

To add a new LLM provider:

1. Create a new provider implementation in `src/llm/providers/`
2. Implement the interface from `src/llm/provider-interface.js`
3. Register the provider in `src/llm/factory.js`
4. Add configuration options in `src/config/config.js`

## Audit System

The audit system captures all LLM requests and stores them in a PostgreSQL database for compliance, monitoring, and analytics purposes.

### Accessing Audit Data

1. **Using pgAdmin**: The Docker Compose setup includes a pgAdmin instance accessible at http://localhost:5050 (admin@example.com/adminpassword)
2. **Direct SQL Queries**: Connect to the PostgreSQL database (port 5432) and query the `llm_request_audit` table
3. **Example Queries**: See the Audit Service README for example SQL queries

### Audit Configuration

The audit service can be enabled/disabled and configured via environment variables. See the full documentation in `src/audit/README.md`.

## License

MIT
