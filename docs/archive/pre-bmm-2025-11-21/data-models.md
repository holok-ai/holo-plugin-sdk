# Data Models

## Overview

This document describes the data models and database schema used by the Holo LLM Gateway. The system uses PostgreSQL as its primary database for storing configuration, requests, responses, and audit data.

## Database Connection

The application uses `pg` (node-postgres) with connection pooling managed by the `AppDB` class (`src/db/app.db.ts`).

### Connection Configuration

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
```

Configuration is loaded from environment variables via `env.appDb.config`.

---

## Core Entities

### Base Entity

All entities extend a base entity structure:

```typescript
interface BaseEntity {
  id: string;              // UUID primary key
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  last_modified_by?: string;
}
```

---

### Provider

Represents an LLM provider configuration (OpenAI, Claude, Ollama, etc.).

**Table:** `providers`

```typescript
interface Provider extends BaseEntity {
  organization_id: string;           // Organization owner
  name: string;                      // Provider name
  type: ProviderType;                // openai | claude | ollama | perplexity
  description?: string;
  config: Record<string, any>;       // Provider-specific configuration (API keys, endpoints, etc.)
  status?: { enabled?: boolean };
}
```

**Key Operations:**
- List all enabled providers for an organization
- Get provider configuration by ID or name
- Update provider credentials and settings

---

### Model

Represents an LLM model configuration available through a provider.

**Table:** `models`

```typescript
interface Model extends BaseEntity {
  organization_id: string;
  name: string;                      // Model identifier (e.g., "gpt-4", "claude-3-opus")
  description?: string;
  capabilities: Record<string, any>; // Model capabilities (context_length, supports_vision, etc.)
  parameters: Record<string, any>;   // Default parameters
  metadata: Record<string, any>;     // Additional metadata
  status: {
    enabled: boolean;
    available: boolean;
  };
}
```

**Computed Fields:**
- `enabled`: Model is enabled for use
- `available`: Model is currently available (not disabled or deprecated)

**Key Operations:**
- `ModelDB.list()`: Get all enabled and available models
- `ModelDB.get(name)`: Get specific model by name

---

### Application

Represents a configured application that uses the LLM gateway with specific provider/model settings.

**Table:** `applications`

```typescript
interface Application extends BaseEntity {
  name: string;
  provider_id: string;               // FK to providers
  model_id: string;                  // FK to models
  system_prompt: string;             // Default system prompt
  url_slug: string;                  // URL identifier for routing
  active?: boolean;                  // Computed: active and available
  organization_id: string;
  team_id?: string;
}
```

**Key Features:**
- Custom URL routing via `/api/custom/:provider/:appSlug/*`
- Default system prompts per application
- Organization and team-based access control

---

### LlmRequest

Represents an incoming LLM request from a client.

**Table:** `llm_requests`

```typescript
interface LlmRequest {
  id: string;
  organization_id?: string;
  request_id: string;                // Client-provided or generated request ID
  request_type: string;              // completion | chat | embedding
  model_slug: string;                // Model identifier
  user_prompt?: string;              // User message/prompt
  system_prompt?: string;            // System prompt
  options?: Record<string, any>;     // Request parameters (temperature, max_tokens, etc.)
  source_id?: string;                // Source system identifier
  user_id?: string;                  // End user identifier
  application_id: string;            // FK to applications
  provider_slug: string;             // Provider identifier
  timestamp: string;                 // Request timestamp
  raw_request?: Record<string, any>; // Full original request
}
```

**Key Operations:**
- `RequestDB.insert()`: Store incoming request

---

### LlmResponse

Represents the response from an LLM provider.

**Table:** `llm_responses`

```typescript
interface LlmResponse {
  id: string;
  organization_id?: string;
  created_at: string;
  user_id?: string;
  application_id: string;
  request_id: string;                // Links to llm_requests
  provider_slug: string;
  model_slug: string;
  status: LlmStatus;                 // success | error | timeout | partial | rate_limited | invalid_request
  error_message?: string;
  response?: string;                 // Text response
  response_raw?: Record<string, any>; // Full provider response
  usage_raw?: Record<string, any>;   // Raw usage data from provider
  input_tokens?: number;
  output_tokens?: number;
  time_to_first_token?: number;      // Latency metric (ms)
  total_processing_time?: number;    // Total time (ms)
  cost: number;                      // Calculated cost
  score?: number;                    // Quality/evaluation score
  worker_id: string;                 // Worker that processed the request
}
```

**Status Enum:**
```typescript
enum LlmStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  PARTIAL = 'partial',
  RATE_LIMITED = 'rate_limited',
  INVALID_REQUEST = 'invalid_request'
}
```

**Key Operations:**
- `ResponseDB.insert()`: Store response (returns generated ID)

---

### Evaluator

Represents an evaluator configuration for response quality assessment.

**Table:** `evaluators`

```typescript
interface Evaluator extends BaseEntity {
  name: string;
  description?: string | null;
  prompt_id?: string | null;         // FK to prompts (for LLM-based evaluators)
  parameters: Record<string, any>;
  evaluator_type: string;            // Type of evaluator (regex, llm, custom)
  enabled: boolean;
  available: boolean;
  deleted?: boolean;
  active?: boolean;                  // Computed: enabled AND available AND NOT deleted
}
```

---

### EvaluatorData

Stores evaluation results for LLM responses.

**Table:** `evaluator_data`

```typescript
interface EvaluatorData {
  id: string;
  created_at: Date;
  evaluator_id: string;              // FK to evaluators
  llmresponse_id: string;            // FK to llm_responses
  results: Record<string, any>;      // Evaluation results
  scoring: Record<string, any>;      // Scoring data
}
```

---

### Prompt

Represents a reusable prompt template.

**Table:** `prompts`

```typescript
interface Prompt extends BaseEntity {
  organization_id: string;
  name: string;
  description?: string;
  provider?: string;
  providerType: 'ollama' | 'claude' | 'openai' | 'gemini' | 'grok';
  prompt_type: 'chat' | 'completion' | 'image' | 'audio' | 'vision';
  system_prompt?: string;
  user_prompt: string;
  parameters: Record<string, any>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop_sequences: string[];
  model?: string;
  safety_settings?: Record<string, any>;
  grok_settings?: Record<string, any>;
  tags: string[];
  version: string;
  is_active: boolean;
}
```

---

### AnalysisResult

Stores analysis results (for audit/analysis server).

**Table:** `analysis_results`

```typescript
interface AnalysisResult {
  id: string;                        // UUID
  created_at: Date;
  analysis_name: string | null;
  reference: Record<string, any>;    // Reference data
  results: Record<string, any>;      // Analysis results
}
```

---

## Database Operations

### AppDB Class

The `AppDB` class provides a type-safe query interface:

```typescript
// Query returning array of results
async query<T>(text: string, params?: any[]): Promise<T[]>

// Query returning single row
async queryOne<T>(text: string, params?: any[]): Promise<T | null>

// Query returning single scalar value
async queryScalar<U>(text: string, params?: any[]): Promise<U | null>

// Execute multiple queries in a transaction
async transaction<T>(callback: (client: any) => Promise<T>): Promise<T>

// Batch queries
async queryBatch(queries: Array<{ text: string; params?: any[] }>): Promise<any[]>
```

### Example Usage

```typescript
// Get all available models
const models = await modelDB.list();

// Get specific model
const model = await modelDB.get('gpt-4');

// Insert request
await requestDB.insert({
  organization_id: '...',
  request_id: '...',
  request_type: 'chat',
  // ... other fields
});

// Insert response with transaction
const result = await responseDB.insert({
  organization_id: '...',
  request_id: '...',
  status: LlmStatus.SUCCESS,
  // ... other fields
});
```

---

## Data Flow

1. **Request Ingestion**
   - Request received via API
   - Validated and authenticated
   - Stored in `llm_requests` table
   - Queued for processing

2. **Processing**
   - Worker picks up request from queue
   - Translates to provider format
   - Calls provider API
   - Receives response

3. **Response Storage**
   - Response stored in `llm_responses` table
   - Linked to original request via `request_id`
   - Usage metrics calculated and stored
   - Optional evaluation triggered

4. **Evaluation** (if enabled)
   - Evaluator processes response
   - Results stored in `evaluator_data` table
   - Score updated in `llm_responses.score`

---

## Relationships

```
organizations
  ├── providers
  │     └── models
  ├── applications
  │     ├── llm_requests
  │     └── llm_responses
  ├── prompts
  └── evaluators
        └── evaluator_data
```

---

## Indexing Strategy

Key indexes for performance:

- `llm_requests.request_id`: Fast request lookup
- `llm_requests.organization_id`: Organization-based queries
- `llm_responses.request_id`: Link responses to requests
- `models.name` + `models.enabled` + `models.available`: Fast model lookup
- `applications.url_slug`: Fast custom route resolution

---

## Caching Layer

In addition to the database, the system maintains an in-memory cache for frequently accessed data:

- **OrganizationCache**: Organization configurations
- **ProviderCache**: Provider settings
- **TokenCache**: JWT token validation
- **ApplicationCache**: Application configurations

Cache types are defined in `src/cache/types/` and validated with ArkType validators.

---

## Migration Strategy

The system does not currently use Prisma migrations (Prisma is installed but schema files are not present). Database schema appears to be managed externally or through raw SQL migrations.

For detailed migration patterns, check the existing database or consult with the DBA/DevOps team.
