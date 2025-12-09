# Models API Specification

> **Navigation**: [README](README.md) · [Architecture](ARCHITECTURE.md) · [Coding Standards](CODING_STANDARDS.md)

---

## 1. Purpose & Scope

This specification defines the **authoritative data contracts**, **runtime cache structure**, and **controller implementation requirements** for provider-native `/models` endpoints in the Holo LLM proxy. It establishes strict guarantees for **byte-for-byte SDK compatibility** and **cross-provider model access** through the universal Holo translator.

### 1.1 Goals

1. **SDK Parity**: All provider controllers return responses **indistinguishable** from native SDK/REST API responses
2. **Universal Access**: Every user-accessible model is exposed through **all** provider endpoints in their native formats
3. **Type Safety**: Strict TypeScript types with ArkType runtime validation at all boundaries
4. **Zero Transformation**: No translation occurs in models endpoints; pre-computed provider metadata is returned verbatim
5. **Configuration-Driven**: Models are managed through the existing Holo configuration system (file or queue-based)

### 1.2 Non-Goals

- Implementation details of Moku (Central Admin system)
- Unified `/v1/models` endpoint (each provider has its own)
- Model translation logic (handled by existing Holo request/response translators)
- Database schema design (configuration managed externally)

---

## 2. Provider Endpoints (Routes)

Each provider exposes a models endpoint matching its native API convention:

| Provider | Endpoint | HTTP Method | Controller Method | SDK Method |
|----------|----------|-------------|-------------------|------------|
| **OpenAI** | `/api/openai/v1/models` | `GET` | `OpenAIController.models()` | `client.models.list()` |
| **Claude (Anthropic)** | `/api/claude/v1/models` | `GET` | `ClaudeController.models()` | `client.models.list()` |
| **Ollama** | `/api/ollama/tags` (alias `/api/tags`) | `GET` | `OllamaController.models()` | `client.list()` |

**Requirements**:
- Each endpoint returns **only** models formatted for that provider
- Responses **must** match SDK return types exactly (field names, types, container shape)
- Authentication required via `auth.organizationId` and `auth.appSlug`/`auth.appSlugs`
- No pagination parameters (all models returned in single response for now)

---

## 3. Existing Configuration System

### 3.1 Overview

Holo already implements a **configuration-driven architecture** where API nodes receive models and application metadata via the `ConfigService`. This system supports two modes:

- **FILE mode**: Loads configuration from a JSON file (`ConfigFileLoader`)
- **QUEUE mode**: Receives configuration via RabbitMQ from Moku Central Admin (`ConfigQueueLoader`)

### 3.2 Startup Flow

**File**: `src/app.ts`

```typescript
async function waitForInitialConfig(timeoutMs: number = 60000) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: Initial configuration not received within ${timeoutMs / 1000}s`));
    }, timeoutMs);

    configService.once('config:initialized', () => {
      clearTimeout(timer);
      resolve();
    });

    if (env.api.configMode === 'FILE') {
      const fileLoader = container.resolve(ConfigFileLoader);
      fileLoader.loadConfig();
    } else {
      const queueLoader = container.resolve(ConfigQueueLoader);
      queueLoader.loadConfig();
    }
  });
}
```

**Key Points**:
1. API server blocks on `waitForInitialConfig()` before accepting HTTP traffic
2. `ConfigService` emits `config:initialized` event when first configuration received
3. Routes only mounted after configuration loaded: `app.use('/api', createRoutes())`

### 3.3 Queue-Based Configuration (Moku Integration)

**File**: `src/admin/services/config.queue.loader.ts`

The `ConfigQueueLoader` implements the **registration and subscription pattern**:

1. **Setup Infrastructure** (`setupPlatformInfrastructure()`):
   - Connects to RabbitMQ
   - Creates platform exchange (`env.queue.platformExchange`)
   - Creates management queue for this server: `{managementQueue}.{apiServerId}`
   - Binds queue with routing key: `server.proxy.{apiServerId}`

2. **Register with Moku** (`registerWithMoku()`):
   - Sends `AnnouncementMessage` to Moku with server ID
   - Routing key: `announcement.{apiServerId}`
   - Message type: `AnnouncementType.PROXY`
   - Moku responds by pushing initial configuration

3. **Listen for Updates** (`startConfigUpdateListener()`):
   - Consumes messages from management queue
   - Passes each message to `ConfigService.processConfig()`
   - Continues listening for ongoing updates (no re-registration needed)

**Protocol Summary**:
- **Push-based**: Moku pushes configuration; API nodes don't poll
- **Event-driven**: Configuration updates arrive asynchronously via queue
- **Stateless nodes**: API nodes maintain in-memory cache, no local persistence

---

## 4. Configuration Data Structures

### 4.1 HoloConfig (Wire Format)

**File**: `src/admin/types/config.types.ts`

```typescript
export enum HoloConfigAction {
  NEW = 'NEW',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum HoloConfigType {
  ORGANIZATION = 'ORGANIZATION',
  APPLICATION = 'APPLICATION',
  JWT_TOKEN = 'JWT_TOKEN'
}

export interface OrganizationConfig {
  configType: HoloConfigType.ORGANIZATION,
  action: HoloConfigAction,
  data: Organization[]
}

export interface ApplicationConfig {
  configType: HoloConfigType.APPLICATION,
  action: HoloConfigAction,
  data: Application[]
}

export type HoloConfig = OrganizationConfig | ApplicationConfig | JwtTokenConfig;
```

**Configuration Types**:
- **ORGANIZATION**: Contains providers, applications, and metadata
- **APPLICATION**: Contains models, prompts, guards, evaluators per app
- **JWT_TOKEN**: Authentication tokens (not relevant to models endpoint)

### 4.2 Organization Structure

**File**: `src/cache/types/organization.ts`

```typescript
export interface Organization {
  id: string;
  name: string;
  slug: string;
  providers: Provider[];
  applications: Application[];
}
```

### 4.3 Application Structure

**File**: `src/cache/types/application.ts`

```typescript
export interface Application {
  urlSlug: string;
  organizationId: string;
  providerType: ProviderType;
  models: Model[];              // ← Models stored here
  systemPrompt?: Prompt;
  guards?: Prompt[];
  evaluators?: Prompt[];
}
```

**Key Insight**: Models are **nested within Applications**, not top-level entities.

### 4.4 Model Structure (Current)

**File**: `src/cache/types/model.ts`

```typescript
export interface Model {
  name: string;                     // Human-readable label
  accessModel: string;              // Internal routing key
  providerName: string;             // 'OPENAI' | 'CLAUDE' | 'OLLAMA'
  metadata?: {
    openai?: OpenAIModel;           // Exact OpenAI SDK shape
    claude?: ClaudeModelInfo;       // Exact Anthropic SDK shape
    ollama?: OllamaModelResponse;   // Exact Ollama SDK shape
  };
}
```

**Provider Metadata Types** (type aliases to SDK types):

```typescript
import type { Model as OpenAISDKModel } from 'openai/resources/models';
export type OpenAIModel = OpenAISDKModel;

import type { ModelInfo } from '@anthropic-ai/sdk/resources/models';
export type ClaudeModelInfo = ModelInfo;

import type { ModelDetails as OllamaSDKModelDetails, ModelResponse as OllamaSDKModelResponse } from 'ollama';
export type OllamaModelDetails = OllamaSDKModelDetails;
export type OllamaModelResponse = OllamaSDKModelResponse;
```

---

## 5. Configuration Processing Flow

### 5.1 ConfigService

**File**: `src/admin/services/config.service.ts`

```typescript
@injectable()
export class ConfigService extends EventEmitter {
  private initialized: boolean = false;

  constructor(
    private tokenService: TokenService,
    private organizationCacheService: OrganizationCacheService
  ) { super(); }

  async processConfig(holoConfig: HoloConfig): Promise<boolean> {
    const config = await this.validateConfig(holoConfig);

    if (config instanceof ArkErrors) {
      this.emit('config:error', new AdminConfigError(msg, config));
      return false;
    }

    switch (config.configType) {
      case HoloConfigType.JWT_TOKEN:
        this.tokenService.applyConfig(config);
        break;
      case HoloConfigType.ORGANIZATION:
        this.organizationCacheService.applyConfig(config);
        break;
      case HoloConfigType.APPLICATION:
        this.organizationCacheService.applyApplicationConfig(config);
        break;
    }

    this.emit(this.initialized ? 'config:updated' : 'config:initialized', config);
    if (!this.initialized) {
      this.initialized = true;
    }
    return true;
  }
}
```

**Key Behaviors**:
1. **Validation**: Uses ArkType validators before processing
2. **Event Emission**: Emits `config:initialized` (first time) or `config:updated` (subsequent)
3. **Routing**: Dispatches to specialized services based on `configType`

### 5.2 OrganizationCacheService

**File**: `src/admin/services/organization.cache.service.ts`

```typescript
@injectable()
export class OrganizationCacheService {
  private orgCaches = new Map<string, OrganizationCache>();

  applyConfig(c: OrganizationConfig) {
    const config = OrganizationConfigValidator.assert(c);
    switch (config.action) {
      case HoloConfigAction.DELETE:
        break; // Handle deletes
      default:
        this.setOrganizations(config.data);
        break;
    }
  }

  applyApplicationConfig(c: ApplicationConfig) {
    const config = ApplicationConfigValidator.assert(c);
    this.setApplications(config.data);
  }

  setOrganizations(organizations: readonly Organization[]) {
    for (let i = 0; i < organizations.length; i++) {
      this.set(organizations[i]);
    }
  }

  setApplications(applications: readonly Application[]) {
    for (let i = 0; i < applications.length; i++) {
      const { organizationId } = applications[i];
      const orgCache = this.get(organizationId);
      orgCache?.set('applications', 'urlSlug', applications[i]);
    }
  }
}
```

**Cache Structure**:
- **Top-level**: `Map<organizationId, OrganizationCache>`
- **Per-org**: `OrganizationCache` manages providers and applications
- **Per-app**: Applications contain models array

### 5.3 OrganizationService (Controller Interface)

**File**: `src/admin/services/organization.service.ts`

```typescript
@injectable()
export class OrganizationService extends ClassLogger {
  constructor(private orgCacheService: OrganizationCacheService) { super(); }

  getModels(orgId: string, urlSlug: string): Model[] | undefined {
    return this.orgCacheService.getApplication(orgId, urlSlug)?.models;
  }

  getAllModels(orgId: string, urlSlugs: string[]): Model[] {
    const models = new Set<Model>();
    for (const slug of urlSlugs) {
      const app = this.orgCacheService.getApplication(orgId, slug);
      if (app?.models) {
        for (const model of app.models) {
          models.add(model);
        }
      }
    }
    return Array.from(models);
  }
}
```

**API for Controllers**:
- `getModels(orgId, appSlug)`: Get models for single app
- `getAllModels(orgId, appSlugs)`: Get union of models across multiple apps (deduplicated)

---

## 6. Controller Implementation Requirements

Each provider controller **must** implement a `models()` method following this pattern:

### 6.1 Standard Flow (All Providers)

```typescript
@injectable()
export class ProviderController extends BaseController {
  constructor(
    private organizationService: OrganizationService
  ) {
    super();
  }

  public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    const logger = this.mlog(this.models);
    logger.info('Getting models');
    const { auth } = req;

    // 1. Auth validation
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let providerModels: ProviderModelType[] = [];

    // 2. Fetch models (single app or all apps)
    if (auth.organizationId && auth?.appSlug) {
      logger.debug(`Getting models for app: ${auth.appSlug}`);
      const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
      providerModels = allModels.map(m => m.metadata!.provider as ProviderModelType);
    } else if (auth.appSlugs) {
      logger.debug('No app defined, getting all models');
      const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
      providerModels = allModels.map(m => m.metadata!.provider as ProviderModelType);
    }

    // 3. Return in provider-native container format
    res.status(200).json({
      // Provider-specific container (see below)
    });
  };
}
```

### 6.2 OpenAI Controller

**File**: `src/api/controllers/openai.controller.ts`

```typescript
public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
  const logger = this.mlog(this.models);
  logger.info('Getting models');
  const { auth } = req;

  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let openaiModels: OpenAIModel[] = [];

  if (auth.organizationId && auth?.appSlug) {
    logger.debug(`Getting models for app: ${auth.appSlug}`);
    const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
    openaiModels = allModels.map(m => m.metadata!.openai as OpenAIModel);
  } else if (auth.appSlugs) {
    logger.debug('No app defined, getting all models');
    const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
    openaiModels = allModels.map(m => m.metadata!.openai as OpenAIModel);
  }

  res.status(200).json({
    object: 'list',
    data: openaiModels
  });
};
```

**Output Format** (matches OpenAI SDK):
```json
{
  "object": "list",
  "data": [
    { "id": "gpt-4", "created": 1687882410, "object": "model", "owned_by": "openai" }
  ]
}
```

### 6.3 Claude Controller

**File**: `src/api/controllers/claude.controller.ts`

```typescript
public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
  const logger = this.mlog(this.models);
  logger.info('Getting models');
  const { auth } = req;

  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let claudeModels: ClaudeModelInfo[] = [];

  if (auth.organizationId && auth?.appSlug) {
    logger.debug(`Getting models for app: ${auth.appSlug}`);
    const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
    claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
  } else if (auth.appSlugs) {
    logger.debug('No app defined, getting all models');
    const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
    claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
  }

  res.status(200).json({
    data: claudeModels,
    has_more: false,
    first_id: claudeModels.length > 0 ? claudeModels[0].id : null,
    last_id: claudeModels.length > 0 ? claudeModels[claudeModels.length - 1].id : null
  });
};
```

**Output Format** (matches Claude SDK):
```json
{
  "data": [
    { "id": "claude-sonnet-4-20250514", "created_at": "2025-02-19T00:00:00Z", "display_name": "Claude Sonnet 4", "type": "model" }
  ],
  "has_more": false,
  "first_id": "claude-sonnet-4-20250514",
  "last_id": "claude-sonnet-4-20250514"
}
```

**Pagination Fields** (mandatory):
- `has_more`: Always `false` (full list returned)
- `first_id`: First model ID or `null` if empty
- `last_id`: Last model ID or `null` if empty

### 6.4 Ollama Controller

**File**: `src/api/controllers/ollama.controller.ts`

```typescript
public models = async (req: HttpApiRequest, res: Response): Promise<void> => {
  const logger = this.mlog(this.models);
  logger.info('Getting models');
  const { auth } = req;

  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let ollamaModels: OllamaModelResponse[] = [];

  if (auth.organizationId && auth?.appSlug) {
    logger.debug(`Getting models for app: ${auth.appSlug}`);
    const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
    ollamaModels = allModels.map(m => m.metadata!.ollama as OllamaModelResponse);
  } else if (auth.appSlugs) {
    logger.debug('No app defined, getting all models');
    const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
    ollamaModels = allModels.map(m => m.metadata!.ollama as OllamaModelResponse);
  }

  res.status(200).json({
    models: ollamaModels
  });
};
```

**Output Format** (matches Ollama SDK):
```json
{
  "models": [
    {
      "name": "llama3:8b",
      "model": "llama3:8b",
      "modified_at": "2025-05-10T08:06:48.639712648-07:00",
      "size": 4683075271,
      "digest": "0a8c266910232fd3291e71e5ba1e058cc5af9d411192cf88b6d30e92b6e73163",
      "details": { "parent_model": "", "format": "gguf", "family": "qwen2", "families": ["qwen2"], "parameter_size": "7.6B", "quantization_level": "Q4_K_M" }
    }
  ]
}
```

### 6.5 Controller Constraints (Hard Requirements)

1. **No Transformation**: Controllers **never** transform provider metadata (field renaming, type coercion, unit conversion)
2. **No Filtering by Provider**: Return **all** models user has access to (cross-provider access is the goal)
3. **Scope Enforcement**: Filter by `(organizationId, appSlug/appSlugs)` from `auth`
4. **Logging**: Use `ClassLogger.mlog()` pattern for method-scoped logging
5. **Error Handling**: Use `BaseController.handleError()` for consistent error responses
6. **Empty State**: Return proper empty containers:
   - OpenAI: `{ object: 'list', data: [] }`
   - Claude: `{ data: [], has_more: false, first_id: null, last_id: null }`
   - Ollama: `{ models: [] }`

---

## 7. Provider-Native Metadata Types

These types are **type aliases** to official SDK types (zero duplication):

### 7.1 OpenAI

```typescript
// src/cache/types/model.ts
import type { Model as OpenAISDKModel } from 'openai/resources/models';
export type OpenAIModel = OpenAISDKModel;

// Effective shape:
// {
//   id: string;
//   created: number;           // Unix timestamp (seconds)
//   object: 'model';
//   owned_by: string;
// }
```

### 7.2 Claude (Anthropic)

```typescript
// src/cache/types/model.ts
import type { ModelInfo } from '@anthropic-ai/sdk/resources/models';
export type ClaudeModelInfo = ModelInfo;

// Effective shape:
// {
//   id: string;
//   created_at: string;        // RFC 3339 datetime
//   display_name: string;
//   type: 'model';
// }
```

### 7.3 Ollama

```typescript
// src/cache/types/model.ts
import type { ModelDetails as OllamaSDKModelDetails, ModelResponse as OllamaSDKModelResponse } from 'ollama';
export type OllamaModelDetails = OllamaSDKModelDetails;
export type OllamaModelResponse = OllamaSDKModelResponse;

// Effective shape:
// {
//   name: string;
//   modified_at: string;       // ISO 8601 (keep as string, NOT Date)
//   model: string;
//   size: number;
//   digest: string;
//   details: {
//     parent_model: string;
//     format: string;
//     family: string;
//     families: string[];
//     parameter_size: string;
//     quantization_level: string;
//   };
//   expires_at?: string;       // ISO 8601
//   size_vram?: number;
// }
```

**Critical**: Ollama SDK auto-parses ISO 8601 to `Date` objects, but **our cache must store strings** to ensure REST API parity.

---

## 8. Validation Standards

### 8.1 ArkType Validators

**Location**: `src/cache/validators/model.validator.ts`

```typescript
import { type, Type } from 'arktype';
import type { OpenAIModel, ClaudeModelInfo, OllamaModelResponse } from '../types/model';

// OpenAI Model Validator
export const OpenAIModelValidator = type({
  id: 'string',
  created: 'number',
  object: '"model"',
  owned_by: 'string'
}) satisfies Type<OpenAIModel>;

// Claude Model Validator
export const ClaudeModelInfoValidator = type({
  id: 'string',
  created_at: 'string',
  display_name: 'string',
  type: '"model"'
}) satisfies Type<ClaudeModelInfo>;

// Ollama Model Validator
export const OllamaModelResponseValidator = type({
  name: 'string',
  modified_at: 'string',
  model: 'string',
  size: 'number',
  digest: 'string',
  details: {
    parent_model: 'string',
    format: 'string',
    family: 'string',
    families: 'string[]',
    parameter_size: 'string',
    quantization_level: 'string'
  },
  'expires_at?': 'string',
  'size_vram?': 'number'
}) satisfies Type<OllamaModelResponse>;
```

### 8.2 Validation Boundaries

**Validate at**:
- Configuration ingestion (`ConfigService.validateConfig()`)
- Individual models within application configuration
- Controller output (optional sanity check in development)

**Do NOT validate**:
- Internal cache reads (trusted after ingestion)
- Provider metadata passed directly to response (pre-validated)

---

## 9. Universal Model Access Design

### 9.1 Core Principle

**Every model accessible to a user is exposed through ALL provider endpoints in their native formats.**

This enables:
1. **SDK Agnosticism**: Clients can use any provider SDK to discover all models
2. **Cross-Provider Requests**: Call `gpt-4` through Claude API, or `claude-sonnet-4` through OpenAI API
3. **Transparent Translation**: Holo request/response translators handle format conversion at request time

### 9.2 Configuration Example

**Moku sends this configuration** (via queue or file):

```json
{
  "configType": "APPLICATION",
  "action": "NEW",
  "data": [
    {
      "urlSlug": "my-app",
      "organizationId": "org_123",
      "providerType": "OPENAI",
      "models": [
        {
          "name": "GPT-4",
          "accessModel": "gpt-4",
          "providerName": "OPENAI",
          "metadata": {
            "openai": { "id": "gpt-4", "created": 1687882410, "object": "model", "owned_by": "openai" },
            "claude": { "id": "gpt-4", "created_at": "2023-06-27T19:13:30Z", "display_name": "GPT-4 (via Holo)", "type": "model" },
            "ollama": { "name": "gpt-4", "model": "gpt-4", "modified_at": "2023-06-27T19:13:30Z", "size": 0, "digest": "sha256:abc", "details": {...} }
          }
        },
        {
          "name": "Claude Sonnet 4",
          "accessModel": "claude-sonnet-4-20250514",
          "providerName": "CLAUDE",
          "metadata": {
            "openai": { "id": "claude-sonnet-4-20250514", "created": 1740000000, "object": "model", "owned_by": "anthropic" },
            "claude": { "id": "claude-sonnet-4-20250514", "created_at": "2025-02-19T00:00:00Z", "display_name": "Claude Sonnet 4", "type": "model" },
            "ollama": { "name": "claude-sonnet-4-20250514", "model": "claude-sonnet-4-20250514", "modified_at": "2025-02-19T00:00:00Z", "size": 0, "digest": "sha256:def", "details": {...} }
          }
        },
        {
          "name": "Llama 3 8B",
          "accessModel": "llama3:8b",
          "providerName": "OLLAMA",
          "metadata": {
            "openai": { "id": "llama3:8b", "created": 1715000000, "object": "model", "owned_by": "meta" },
            "claude": { "id": "llama3:8b", "created_at": "2024-05-06T00:00:00Z", "display_name": "Llama 3 8B (via Holo)", "type": "model" },
            "ollama": { "name": "llama3:8b", "model": "llama3:8b", "modified_at": "2025-05-10T08:06:48Z", "size": 4683075271, "digest": "sha256:0a8c...", "details": { "format": "gguf", ... } }
          }
        }
      ]
    }
  ]
}
```

**API Responses** (after processing this config):

**`GET /api/openai/v1/models`**:
```json
{
  "object": "list",
  "data": [
    { "id": "gpt-4", "created": 1687882410, "object": "model", "owned_by": "openai" },
    { "id": "claude-sonnet-4-20250514", "created": 1740000000, "object": "model", "owned_by": "anthropic" },
    { "id": "llama3:8b", "created": 1715000000, "object": "model", "owned_by": "meta" }
  ]
}
```

**`GET /api/claude/v1/models`**:
```json
{
  "data": [
    { "id": "gpt-4", "created_at": "2023-06-27T19:13:30Z", "display_name": "GPT-4 (via Holo)", "type": "model" },
    { "id": "claude-sonnet-4-20250514", "created_at": "2025-02-19T00:00:00Z", "display_name": "Claude Sonnet 4", "type": "model" },
    { "id": "llama3:8b", "created_at": "2024-05-06T00:00:00Z", "display_name": "Llama 3 8B (via Holo)", "type": "model" }
  ],
  "has_more": false,
  "first_id": "gpt-4",
  "last_id": "llama3:8b"
}
```

**`GET /api/ollama/tags`**:
```json
{
  "models": [
    { "name": "gpt-4", "model": "gpt-4", "modified_at": "2023-06-27T19:13:30Z", "size": 0, "digest": "sha256:abc", "details": {...} },
    { "name": "claude-sonnet-4-20250514", "model": "claude-sonnet-4-20250514", "modified_at": "2025-02-19T00:00:00Z", "size": 0, "digest": "sha256:def", "details": {...} },
    { "name": "llama3:8b", "model": "llama3:8b", "modified_at": "2025-05-10T08:06:48Z", "size": 4683075271, "digest": "sha256:0a8c...", "details": { "format": "gguf", ... } }
  ]
}
```

### 9.3 Client Usage Example

```typescript
// Client using OpenAI SDK discovers all models
import OpenAI from 'openai';
const client = new OpenAI({ baseURL: 'https://holo-proxy.com/api/openai/v1', apiKey: 'org_key' });

const models = await client.models.list();
// Returns: { data: [ {id: "gpt-4"}, {id: "claude-sonnet-4-20250514"}, {id: "llama3:8b"} ] }

// Client can now call ANY model through OpenAI SDK
const response = await client.chat.completions.create({
  model: "claude-sonnet-4-20250514",  // Claude model called via OpenAI SDK!
  messages: [{ role: "user", content: "Hello" }]
});
// Holo translator converts OpenAI request → Claude request, then Claude response → OpenAI response
```

### 9.4 No Model Translator

**Models endpoints are metadata-only**. No translation occurs here.

Translation happens at **request time** when clients send chat/completion requests:
1. Client calls `/api/openai/v1/chat/completions` with `model: "claude-sonnet-4"`
2. `RequestService` identifies native provider as Claude
3. `OpenAIRequestTranslator` converts OpenAI request → Holo canonical format
4. `ClaudeRequestTranslator` converts Holo format → Claude native format
5. Claude SDK executes request
6. Response path reverses: Claude → Holo → OpenAI format

Models endpoints simply expose **pre-computed metadata** in each provider's format.

---

## 10. Moku Configuration Protocol

### 10.1 Announcement & Registration

**Node Sends** (via `ConfigQueueLoader.registerWithMoku()`):
```json
{
  "type": "PROXY",
  "serverId": "api-server-001",
  "timestamp": "2025-10-12T09:32:15Z"
}
```

**Routing Key**: `announcement.{serverId}` (e.g., `announcement.api-server-001`)

**Moku Response**: Pushes initial configuration to node's management queue

### 10.2 Management Queue Setup

**Queue Name**: `{managementQueue}.{serverId}` (e.g., `holo.management.api-server-001`)

**Routing Key**: `server.proxy.{serverId}` (e.g., `server.proxy.api-server-001`)

**Bound to**: Platform exchange (topic exchange)

### 10.3 Configuration Message Flow

1. **Moku** sends `HoloConfig` message to platform exchange
2. **RabbitMQ** routes message to node's management queue (based on routing key)
3. **ConfigQueueLoader** consumes message from queue
4. **ConfigService** validates and processes config
5. **OrganizationCacheService** updates in-memory cache
6. **Controllers** immediately see new models on next request

### 10.4 Configuration Actions

**NEW**: Initial configuration or complete replacement
- `ConfigService` emits `config:initialized` (first time) or `config:updated`
- Cache replaces all data for this config type

**UPDATE**: Incremental updates (merge behavior)
- Same as NEW for current implementation
- Future: may implement partial updates

**DELETE**: Remove specific entities
- Currently no-op in `OrganizationCacheService.applyConfig()`
- Future: implement cache eviction

---

## 11. Observability & Monitoring

### 11.1 Configuration Metrics

**Per config message**:
- `holo.config.received` (counter) - tags: `(org, config_type, action)`
- `holo.config.applied` (counter) - tags: `(org, config_type)`
- `holo.config.rejected` (counter) - tags: `(org, config_type, reason)`
- `holo.config.validation_error` (counter) - tags: `(config_type, error_type)`

### 11.2 Controller Metrics

**Per request**:
- `holo.api.models.request` (counter) - tags: `(org, provider, app_slug)`
- `holo.api.models.response_size` (histogram) - number of models returned
- `holo.api.models.latency` (histogram) - response time in ms

### 11.3 Logging Standards

**Configuration**:
```typescript
logger.info('Processing config', {
  configType,
  action,
  data_count: config.data.length
});

logger.error('Config validation failed', {
  configType,
  validation_errors: result.summary
});
```

**Controllers**:
```typescript
logger.info('Getting models', { organization_id, app_slug });
logger.debug('Returning models', { organization_id, app_slug, model_count });
```

---

## 12. Security & Isolation

### 12.1 Tenant Isolation

**Enforcement Points**:
1. **Controllers**: Only return models matching `auth.organizationId`
2. **Cache Queries**: Filter by `organization_id` at service layer
3. **App-level Isolation**: Further filter by `auth.appSlug`

**Guarantees**:
- No model leakage across organizations
- App-level isolation within organizations
- No privilege escalation via model access

### 12.2 Configuration Validation

**Process**:
1. **Schema Validation**: ArkType validates `HoloConfig` structure
2. **Type Checking**: Validates `Organization`, `Application`, `Model` types
3. **Rejection**: Invalid configs are rejected, logged, and not applied

### 12.3 Queue Security

**Mechanisms**:
- **Exclusive Queues**: Each API server has unique management queue
- **Routing Key Isolation**: Server-specific routing keys prevent cross-talk
- **ACLs**: RabbitMQ access controls (managed externally)

---

## 13. Failure Modes & Recovery

### 13.1 Configuration Failures

| Failure Type | Behavior | Recovery |
|--------------|----------|----------|
| **Invalid Config** | Reject, log error, emit `config:error` | Moku sends corrected config |
| **Validation Error** | Reject, log validation details | Moku fixes data format |
| **Timeout (Initial)** | Reject startup, exit process | Ops restarts server, fixes Moku |
| **Queue Disconnect** | Retry connection, keep serving | Auto-reconnect via `QueueService` |

### 13.2 Controller Failures

| Failure Type | Behavior | HTTP Status | Recovery |
|--------------|----------|-------------|----------|
| **Missing Auth** | Return `{ error: 'Unauthorized' }` | 401 | Client includes valid auth token |
| **Empty Model List** | Return empty container | 200 | Moku pushes models for org/app |
| **Cache Miss** | Return empty container | 200 | Check configuration validity |
| **Service Exception** | Return `{ error: 'Internal server error' }` | 500 | Ops investigates logs |

### 13.3 Degraded Mode Operation

**Scenario**: Moku unreachable, queue disconnected

**Behavior**:
- Nodes continue serving **last known good state** from in-memory cache
- Log warnings about configuration staleness
- Health check reports `degraded` status but keeps serving traffic
- When Moku reconnects, nodes receive catch-up updates automatically

**Guarantee**: No service disruption due to Moku downtime (cache persists in memory)

---

## 14. Testing Requirements

### 14.1 Unit Tests (per controller)

**Coverage**:
1. **Empty state**: Returns proper empty container
2. **Single model**: Returns one model in correct format
3. **Multiple models**: Returns all models, preserves order
4. **Auth validation**: Rejects missing auth (401)
5. **Scope filtering**: Only returns models for authorized apps
6. **Metadata mapping**: Correctly extracts `metadata.{provider}` field
7. **Type safety**: TypeScript compiles without errors

**Example** (OpenAI controller):
```typescript
describe('OpenAIController.models', () => {
  it('should return empty list when no models available', async () => {
    mockOrgService.getModels.mockReturnValue([]);

    await controller.models(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ object: 'list', data: [] });
  });

  it('should return all models in OpenAI format', async () => {
    const cachedModels: Model[] = [
      { name: 'GPT-4', accessModel: 'gpt-4', providerName: 'OPENAI', metadata: { openai: { id: 'gpt-4', created: 123, object: 'model', owned_by: 'openai' } } },
      { name: 'Claude', accessModel: 'claude-sonnet-4', providerName: 'CLAUDE', metadata: { openai: { id: 'claude-sonnet-4', created: 456, object: 'model', owned_by: 'anthropic' } } }
    ];
    mockOrgService.getModels.mockReturnValue(cachedModels);

    await controller.models(req, res);

    expect(res.json).toHaveBeenCalledWith({
      object: 'list',
      data: [
        { id: 'gpt-4', created: 123, object: 'model', owned_by: 'openai' },
        { id: 'claude-sonnet-4', created: 456, object: 'model', owned_by: 'anthropic' }
      ]
    });
  });
});
```

### 14.2 Integration Tests (configuration)

**Coverage**:
1. **File loading**: Loads config from JSON file correctly
2. **Queue loading**: Receives config from RabbitMQ
3. **Config processing**: Applies ORGANIZATION and APPLICATION configs
4. **Cache updates**: Verifies in-memory cache reflects config
5. **Event emission**: Validates `config:initialized` and `config:updated` events

### 14.3 Contract Tests (SDK parity)

**Approach**: Generate fixtures from real SDK responses, assert byte-for-byte match

**Example**:
```typescript
// Fetch real OpenAI models response
const realOpenAIResponse = await realOpenAIClient.models.list();

// Fetch Holo proxy response
const holoResponse = await holoClient.get('/api/openai/v1/models');

// Assert structure match (field names, types)
expect(holoResponse.data).toHaveProperty('object', 'list');
expect(holoResponse.data.data).toBeInstanceOf(Array);
expect(holoResponse.data.data[0]).toMatchObject({
  id: expect.any(String),
  created: expect.any(Number),
  object: 'model',
  owned_by: expect.any(String)
});
```

---

## 15. Architecture Alignment

### 15.1 ARCHITECTURE.md Compliance

This spec adheres to the hybrid architecture documented in `ARCHITECTURE.md`:

- **Core Layer**: Type definitions (`src/cache/types/model.ts`) are pure TypeScript, no I/O
- **API Layer**: Provider SDK type aliases reference official SDKs
- **Server Layer**: Controllers (`src/api/controllers/*.controller.ts`) handle Express Request/Response
- **Service Layer**: `OrganizationService` abstracts cache access (in-memory, no DB queries)
- **Admin Layer**: Configuration services manage tenant/app/model metadata

**Dependency Flow**: `Controllers → OrganizationService → OrganizationCacheService → InMemoryCache → Core Types`

### 15.2 CODING_STANDARDS.md Compliance

- **DI Pattern**: Controllers use `@injectable()` with constructor injection
- **Logging**: Uses `ClassLogger.mlog()` for method-scoped logging
- **Validation**: ArkType validators at configuration boundaries
- **Type Safety**: `strictNullChecks`, `noImplicitAny` enabled; all types explicit
- **Async/Await**: No `.then()` chains; consistent async/await usage
- **Error Handling**: `BaseController.handleError()` for HTTP errors
- **Event Emitters**: `ConfigService` and loaders extend `EventEmitter` for async coordination

### 15.3 Translator Pattern (Non-Involvement)

**Key Distinction**: Models endpoints do **NOT** use translators.

Translators (`BaseTranslator`, `HoloTranslator`, provider-specific translators) are for **request/response translation** during chat/completion calls, not for models metadata.

Models endpoints serve **pre-translated metadata** that Moku populated during configuration push.

---

## 16. Appendix: Cross-References

### 16.1 Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture, directory structure, layer separation
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — TypeScript conventions, DI patterns, validation standards

### 16.2 Key Files

**Configuration System**:
- `src/app.ts` — Startup flow, `waitForInitialConfig()`
- `src/admin/services/config.service.ts` — Configuration processor, event emitter
- `src/admin/services/config.file.loader.ts` — File-based config loading
- `src/admin/services/config.queue.loader.ts` — Queue-based config loading (Moku integration)
- `src/admin/types/config.types.ts` — `HoloConfig`, `HoloConfigAction`, `HoloConfigType`

**Cache System**:
- `src/cache/types/organization.ts` — Organization structure
- `src/cache/types/application.ts` — Application structure (contains models)
- `src/cache/types/model.ts` — Model interface, provider type aliases
- `src/admin/services/organization.cache.service.ts` — In-memory cache implementation
- `src/admin/services/organization.service.ts` — Controller-facing API

**Controllers**:
- `src/api/controllers/openai.controller.ts` — OpenAI models endpoint
- `src/api/controllers/claude.controller.ts` — Claude models endpoint
- `src/api/controllers/ollama.controller.ts` — Ollama models endpoint
- `src/api/controllers/base.controller.ts` — Shared error handling

**Routes**:
- `src/api/routes/openai.routes.ts` — `GET /api/openai/v1/models`
- `src/api/routes/claude.routes.ts` — `GET /api/claude/v1/models`
- `src/api/routes/ollama.routes.ts` — `GET /api/ollama/tags`

**Validators**:
- `src/cache/validators/model.validator.ts` — ArkType validators for provider types
- `src/admin/validators/config.validators.ts` — HoloConfig validators

### 16.3 External Dependencies

**SDK Type Sources**:
- `openai` (npm) — OpenAI SDK types
- `@anthropic-ai/sdk` (npm) — Claude SDK types
- `ollama` (npm) — Ollama SDK types

**Validation**:
- `arktype` (npm) — Runtime type validation

**DI**:
- `tsyringe` (npm) — Dependency injection container
- `reflect-metadata` (npm) — Decorator metadata

**Messaging**:
- `amqplib` (npm) — RabbitMQ client

---

## 17. Summary & Contractual Guarantees

This specification establishes the following **hard contracts**:

1. **SDK Byte-for-Byte Parity**: Controller responses are indistinguishable from native SDK responses (field names, types, container shapes)

2. **Universal Model Access**: All user-accessible models are exposed through ALL provider endpoints in their native formats (no provider filtering)

3. **Configuration-Driven**: Models are managed through existing `ConfigService` infrastructure (file or queue-based)

4. **Type Safety**: Provider metadata types are type aliases to official SDK types (zero duplication, automatic sync with SDK updates)

5. **Strict Validation**: ArkType validators enforce contracts at configuration ingestion boundaries

6. **Zero Transformation**: Controllers return pre-computed provider metadata verbatim (no field mapping, no type coercion)

7. **Startup Blocking**: API server blocks until initial configuration received (`waitForInitialConfig()`)

8. **Event-Driven**: Configuration updates trigger cache updates; controllers see changes immediately

9. **Tenant Isolation**: Strict filtering by `(organizationId, appSlug)` at controller layer

10. **Graceful Degradation**: Nodes serve last known good state during Moku unavailability

**Compliance**: All implementations must pass unit tests, integration tests, and contract tests verifying these guarantees.

---

**Version**: 2.0
**Last Updated**: 2025-10-12
**Status**: **AUTHORITATIVE**
