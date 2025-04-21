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
- **Worker Nodes**: Process LLM requests (currently uses mock implementation)
- **Response Streaming**: Server-Sent Events for streaming tokens back to clients

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
node src/worker/llm-worker.js
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

## License

MIT
