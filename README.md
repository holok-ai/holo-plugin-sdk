# LLM Proxy Server

A scalable, distributed LLM proxy server that provides an Ollama-compatible API and distributes work via RabbitMQ message queues.

## Features

- Ollama-compatible API endpoints
- Distributed processing with RabbitMQ
- Streaming responses
- Docker Compose deployment
- Horizontal scaling

## Architecture

- **API Server**: Processes requests and manages client connections
- **Queue System**: RabbitMQ for reliable message passing
- **Worker Nodes**: Process LLM requests with configurable LLM providers (Mock, Ollama)
- **Response Streaming**: Server-Sent Events for streaming tokens back to clients
- **Pluggable LLM Providers**: Support for different LLM backends

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

## License

MIT
