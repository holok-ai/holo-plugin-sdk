# API Contracts

## Overview

This document describes the REST API contracts for the Holo LLM Gateway. The API provides unified interfaces to multiple LLM providers (OpenAI, Claude, Ollama, Perplexity) with authentication, queue-based processing, and response auditing.

## Base URL

All API endpoints are served under `/api` base path.

## Authentication

All endpoints (except `/health`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are validated against the organization cache and must contain valid organization/application context.

## API Endpoints

### Health Check

#### GET `/health`

Health check endpoint for monitoring service availability.

**Authentication:** None required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

### Ollama API (Base Routes)

#### POST `/api/generate`

Generate completion using Ollama-compatible interface.

**Authentication:** JWT required

**Request Body:**
```json
{
  "model": "string",
  "prompt": "string",
  "options": {}
}
```

**Response:** Streaming or complete generation response

---

#### POST `/api/chat`

Chat completion using Ollama-compatible interface.

**Authentication:** JWT required

**Request Body:**
```json
{
  "model": "string",
  "messages": [],
  "stream": boolean
}
```

**Response:** Chat completion response

---

#### GET `/api/tags`

List available models (Ollama-compatible).

**Authentication:** JWT required

**Response:**
```json
{
  "models": [
    {
      "name": "string",
      "modified_at": "string",
      "size": number
    }
  ]
}
```

---

### OpenAI API

#### POST `/api/openai/v1/chat/completions`

OpenAI-compatible chat completions endpoint.

**Authentication:** JWT required

**Request Body:**
```json
{
  "model": "string",
  "messages": [
    {
      "role": "system|user|assistant",
      "content": "string"
    }
  ],
  "temperature": number,
  "max_tokens": number,
  "stream": boolean
}
```

**Response:** OpenAI chat completion format (streaming or complete)

---

#### POST `/api/openai/v1/responses`

Create a response using OpenAI format.

**Authentication:** JWT required

**Request Body:** OpenAI-compatible request format

**Response:** OpenAI-compatible response format

---

#### GET `/api/openai/v1/models`

List available models in OpenAI format.

**Authentication:** JWT required

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "string",
      "object": "model",
      "created": number,
      "owned_by": "string"
    }
  ]
}
```

---

### Claude API

#### POST `/api/claude/v1/messages`

Anthropic Claude messages endpoint.

**Authentication:** JWT required

**Request Body:**
```json
{
  "model": "string",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string|array"
    }
  ],
  "max_tokens": number,
  "temperature": number,
  "system": "string",
  "stream": boolean
}
```

**Response:** Claude messages API format

---

#### GET `/api/claude/v1/models`

List available Claude models.

**Authentication:** JWT required

**Response:** List of available Claude models

---

### Perplexity API

#### POST `/api/perplexity/chat/completions`

Perplexity chat completions endpoint.

**Authentication:** None (handled differently)

**Request Body:** Perplexity-compatible chat completion request

**Response:** Perplexity chat completion response

---

#### POST `/api/perplexity/models`

Get Perplexity models.

**Authentication:** None (handled differently)

**Response:** List of Perplexity models

---

### Custom Application Routes

#### POST `/api/custom/:provider/:appSlug/*`

Dynamic custom application routing endpoint. Allows applications to define custom URL patterns that map to specific provider configurations.

**Authentication:** JWT required

**Path Parameters:**
- `provider`: Provider type (openai, claude, ollama, etc.)
- `appSlug`: Application slug identifier
- `*`: Wildcard path for flexible routing

**Request Body:** Provider-specific request format

**Response:** Provider-specific response format

---

## Common Response Patterns

### Success Response

All successful API calls return appropriate data with HTTP 200 status.

### Error Response

```json
{
  "error": {
    "message": "string",
    "type": "string",
    "code": "string"
  }
}
```

HTTP Status Codes:
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid JWT)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (model/resource not found)
- `429`: Rate Limited
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Request Flow

1. **Client Request** → API endpoint
2. **JWT Authentication** → Token validation
3. **Request Validation** → ArkType validators
4. **Queue Submission** → RabbitMQ queue
5. **Worker Processing** → Provider translation & API call
6. **Response Queue** → Response sent back via queue
7. **Response Delivery** → Streaming or complete response to client
8. **Audit Logging** → Optional database logging

---

## Provider Translation

The gateway translates between unified API formats and provider-specific formats:

- **OpenAI** → Native OpenAI API format
- **Claude** → Anthropic Messages API format
- **Ollama** → Ollama API format
- **Perplexity** → Perplexity API format

Each provider has dedicated translators in `src/providers/{provider}/translators/` for bidirectional format conversion.

---

## Streaming Support

All chat completion endpoints support streaming responses when `stream: true` is set:

- Responses are sent as Server-Sent Events (SSE)
- Format follows provider-specific streaming protocols
- Each chunk is translated to the requested output format

---

## Data Models

For detailed information about database entities (Provider, Model, Application, LlmRequest, LlmResponse), see [Data Models](./data-models.md).
