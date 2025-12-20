# @holokai/holo-provider-openai

> **Official OpenAI provider plugin for Holo LLM Gateway**

[![npm version](https://img.shields.io/npm/v/@holokai/holo-provider-openai.svg)](https://www.npmjs.com/package/@holokai/holo-provider-openai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

The OpenAI provider plugin enables Holo to communicate with OpenAI's Chat Completions and Responses APIs through the universal Holo format. This plugin is part of the migration from the monolithic provider architecture to a plugin-based system, providing complete bidirectional translation between OpenAI's native APIs and the portable Holo format.

### Key Features

- ✅ **Full Holo SDK Integration** - Uses `@holokai/sdk` types for strict type safety
- ✅ **Bidirectional Translation** - OpenAI ↔ Holo format with lossless core fields
- ✅ **Dual API Support** - Both Chat Completions and Responses APIs
- ✅ **Streaming Support** - Delta-based streaming with proper chunk handling
- ✅ **Tool Calling** - Complete function calling support with direct mapping
- ✅ **Vision/Multimodal** - Image support via URLs and base64 data URIs
- ✅ **Structured Outputs** - JSON schema validation and JSON object mode
- ✅ **Multi-Choice Support** - OpenAI-specific `n` parameter for multiple completions
- ✅ **Plugin Architecture** - Auto-discovered, hot-reloadable, independently versioned

---

## Installation

```bash
npm install @holokai/holo-provider-openai
```

### Peer Dependencies

This plugin requires:
- `@holokai/sdk` ^0.1.0 - Holo universal format types and plugin contracts
- `arktype` ^2.0.0 - Runtime type validation
- `openai` ^6.9.1 - Official OpenAI SDK

---

## Quick Start

### Automatic Discovery

When installed in a Holo worker environment, this plugin is automatically discovered and loaded by the plugin system. No manual registration required.

### Configuration

Add a provider configuration to your Holo deployment:

```json
{
  "id": "openai-primary",
  "provider_type": "openai",
  "plugin_id": "@holokai/holo-provider-openai",
  "api_key": "${OPENAI_API_KEY}",
  "model": "gpt-4o",
  "config": {
    "defaultModel": "gpt-4o",
    "timeoutMs": 60000,
    "maxRetries": 2,
    "enableVision": true
  }
}
```

### Usage in Code

```typescript
import { HoloRequest, HoloResponse } from '@holokai/sdk';

const request: HoloRequest = {
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Explain quantum computing briefly.' }
  ],
  max_tokens: 1000,
  temperature: 0.7
};

// Plugin handles translation automatically
const response: HoloResponse = await holoClient.chat(request);
```

---

## Migration from Monolithic Architecture

### What Changed

This plugin represents the extraction of OpenAI provider logic from the monolithic `src/providers/openai/` codebase into a standalone, independently versioned package.

**Before** (Monolithic):
```
src/providers/openai/
├── openai.translator.ts
├── translators/
│   ├── chatcompletion/
│   └── responses/
├── services/
├── streaming/
└── types/
```

**After** (Plugin):
```
@holokai/holo-provider-openai
├── src/
│   ├── plugin.ts               # Plugin entrypoint
│   ├── manifest.ts             # Plugin metadata
│   ├── openai.provider.ts      # Provider implementation
│   └── translators/            # Translation logic (preserved)
└── package.json
```

### Migration Benefits

1. **Independent Versioning** - Update OpenAI support without core releases
2. **Hot Reload** - Deploy new OpenAI versions without downtime
3. **Type Safety** - Strict SDK types eliminate `Record<string, unknown>`
4. **Reduced Coupling** - Plugin contracts enforce clean boundaries
5. **Marketplace Ready** - Can be published to NPM independently

### Breaking Changes

- **Import paths changed**: Use `@holokai/sdk` for types instead of `../../types`
- **Configuration schema**: Now validated via plugin manifest
- **Dependency injection**: Uses plugin container instead of core DI

---

## Architecture

### Plugin Structure

```
@holokai/holo-provider-openai/
├── src/
│   ├── plugin.ts                                   # ProviderPlugin implementation
│   ├── manifest.ts                                 # Plugin metadata & config schema
│   ├── openai.provider.ts                          # Core provider logic with routing
│   ├── openai.translator.ts                        # Main translator facade
│   ├── translators/
│   │   ├── openai.chatcompletion.request.translator.ts
│   │   ├── openai.chatcompletion.response.translator.ts
│   │   ├── openai.responses.request.translator.ts
│   │   ├── openai.message.translator.ts
│   │   ├── openai.content.translator.ts
│   │   ├── openai.tool.translator.ts
│   │   └── openai.usage.translator.ts
│   ├── streaming/
│   │   ├── openai.stream.translator.ts             # Orchestrator
│   │   ├── openai.message.start.translator.ts
│   │   ├── openai.message.delta.translator.ts
│   │   ├── openai.message.stop.translator.ts
│   │   └── openai.content.delta.translator.ts
│   ├── services/
│   │   ├── openai.chatcompletions.service.ts       # Chat Completions logic
│   │   └── openai.responses.service.ts             # Responses API logic
│   ├── types/
│   │   ├── chatcompletion.types.ts                 # 60 types
│   │   └── responses.ts                            # 168 types
│   └── validators/
│       ├── openai.chatcompletion.validators.ts     # 50 validators
│       └── openai.responses.validators.ts          # 150 validators
└── package.json
```

### Translation Flow

```
┌─────────────────┐
│  Holo Request   │
│  (SDK types)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│ OpenAIRequestTranslator │
│  - Maps Holo → OpenAI   │
│  - Wraps tool format    │
│  - Renames fields       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────┐
│  OpenAI API     │
│  (Chat/Response)│
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│ OpenAIResponseTranslator │
│  - Maps OpenAI → Holo    │
│  - Converts timestamps   │
│  - Extracts from choices │
└────────┬─────────────────┘
         │
         ↓
┌─────────────────┐
│  Holo Response  │
│  (SDK types)    │
└─────────────────┘
```

### Dual API Support

The provider intelligently routes requests based on structure:

```typescript
private isResponsesAPIRequest(payload: ProviderRequest): payload is OpenAIResponseCreateParams {
    return 'input' in payload && !('messages' in payload);
}
```

- **Chat Completions API**: Has `messages` field (most common)
- **Responses API**: Has `input` field instead of `messages`

---

## Holo Format Mapping

This plugin implements the official Holo format mappings as documented in the SDK.

### Request Mapping: Holo → OpenAI (Chat Completions)

| Holo Field | OpenAI Field | Transformation | Notes |
|------------|-------------|----------------|-------|
| **Direct 1:1** ||||
| `model` | `model` | Direct | Required |
| `temperature` | `temperature` | Direct | 0-2 for OpenAI |
| `top_p` | `top_p` | Direct | Optional |
| `stream` | `stream` | Direct | Optional |
| `max_tokens` | `max_tokens` | Direct | Optional |
| `stop_sequences` | `stop` | Rename | Array format |
| `frequency_penalty` | `frequency_penalty` | Direct | Optional |
| `presence_penalty` | `presence_penalty` | Direct | Optional |
| `seed` | `seed` | Direct | Optional |
| **Structure Transforms** ||||
| `system` (string) | First message with `role:'system'` | Inject as message | Optional |
| `messages` | `messages` | Direct | Array of messages |
| `metadata.user_id` | `user` | Promote to top-level | Optional |
| `tools[].parameters` | `tools[].function.parameters` | Wrap in function | JSON Schema |
| `tool_choice.type: 'specific'` | `{type: 'function', function: {name}}` | Wrap with name | Specific tool |
| `tool_choice.type: 'required'` | `'required'` | Map type | Any tool required |
| `tool_choice.type: 'auto'` | `'auto'` | Direct | Default |
| `tool_choice.type: 'none'` | `'none'` | Direct | Disable tools |
| `response_format.type: 'json_object'` | `{type: 'json_object'}` | Wrap | JSON mode |
| `response_format.type: 'json_schema'` | `{type: 'json_schema', json_schema: {...}}` | Nest schema | Structured output |

**OpenAI-Specific Fields** (not in Holo core):
- `n` - Number of choices (handled via multi-choice streaming)
- `logprobs` - Token probabilities (not in Holo spec)
- `logit_bias` - Token bias (not in Holo spec)
- `parallel_tool_calls` - Allow parallel execution (not in Holo spec)
- `service_tier` - Priority tier (optional in Holo)

See [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#openai--holo-requests) for complete details.

### Request Mapping: Holo → OpenAI (Responses API)

| Holo Field | OpenAI Field | Transformation | Notes |
|------------|-------------|----------------|-------|
| **Direct 1:1** ||||
| `model` | `model` | Direct | Required |
| `temperature` | `temperature` | Direct | Optional |
| `top_p` | `top_p` | Direct | Optional |
| `stream` | `stream` | Direct | Optional |
| **Structure Transforms** ||||
| `messages` | `input` | Rename field | Different field name |
| `system` (string) | `input[0]` with `role: 'system'` | Inject as first item | Optional |
| `max_tokens` | `max_output_tokens` | Rename | Optional |
| `tools` | `tools` | Transform structure | See Tool Mapping |
| `tool_choice` | `tool_choice` | Similar to Chat | Optional |
| `metadata.user_id` | `metadata.user_id` | Nest in metadata | Optional |

**Note**: Responses API uses `input` instead of `messages` and `max_output_tokens` instead of `max_tokens`.

### Response Mapping: OpenAI → Holo

| OpenAI Field | Holo Field | Transformation | Notes |
|-------------|------------|----------------|-------|
| **Direct 1:1** ||||
| `id` | `id` | Direct | Always present |
| `model` | `model` | Direct | Always present |
| `choices[0].message.role` | `messages[0].role` | Extract from choices | Always 'assistant' |
| `choices[0].message.content` | `messages[0].content` | Extract from choices | Text content |
| `choices[0].message.tool_calls` | `messages[0].tool_calls` | Extract from choices | If present |
| **Structure Transforms** ||||
| `created` | `created` | Multiply by 1000 | Seconds → milliseconds |
| `choices[0].finish_reason` | `finish_reason` | Map codes | See table below |
| `usage.prompt_tokens` | `usage.input_tokens` | Rename | Optional |
| `usage.completion_tokens` | `usage.output_tokens` | Rename | Optional |
| `usage.prompt_tokens_details.cached_tokens` | `usage.cache_read_tokens` | Rename | Optional |
| Computed | `usage.total_tokens` | `input + output` | Derived |
| `service_tier` | `service_tier` | Direct | Top-level field |

**Timestamp Conversion**:
- OpenAI: Unix timestamp in seconds (`number`)
- Holo: Milliseconds since epoch (`number`)
- Conversion: `created * 1000`

**Finish Reason Mapping**:

| OpenAI `finish_reason` | Holo `finish_reason` | Notes |
|----------------------|---------------------|-------|
| `'stop'` | `'stop'` | Natural completion |
| `'length'` | `'length'` | Hit token limit |
| `'tool_calls'` | `'tool_calls'` | Model called tools |
| `'content_filter'` | `'content_filter'` | Content filtered |
| `'function_call'` | `'tool_calls'` | Legacy function calling |

See [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#openai--holo-responses) for complete details.

### Content Mapping

#### Text Content

```typescript
// Holo
{ type: 'text', text: 'Hello' }

// OpenAI (direct)
{ type: 'text', text: 'Hello' }
```

#### Image Content

```typescript
// Holo
{ type: 'image', url: 'https://example.com/image.png' }

// OpenAI
{ type: 'image_url', image_url: { url: 'https://example.com/image.png' } }

// Holo (base64)
{ type: 'image', url: 'data:image/png;base64,iVBORw...' }

// OpenAI (base64)
{ type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw...' } }
```

#### Tool Calls (Direct Mapping)

```typescript
// OpenAI Response
{
  choices: [{
    message: {
      role: 'assistant',
      content: '',
      tool_calls: [{
        id: 'call_abc',
        type: 'function',
        function: { name: 'get_weather', arguments: '{"location":"SF"}' }
      }]
    }
  }]
}

// Holo Response (extracted)
{
  messages: [{
    role: 'assistant',
    content: '',
    tool_calls: [{
      id: 'call_abc',
      type: 'function',
      function: { name: 'get_weather', arguments: { location: 'SF' } }
    }]
  }]
}
```

**Note**: OpenAI uses the same tool call format as Holo, so mapping is direct extraction from `choices[0].message`.

---

## Streaming

### Delta-Based Streaming

OpenAI uses incremental deltas for streaming:

#### Chat Completions Streaming

```typescript
// Chunk 1: Role initialization
{
  id: 'chatcmpl-123',
  model: 'gpt-4o',
  created: 1234567890,
  choices: [{
    index: 0,
    delta: { role: 'assistant', content: '' },
    finish_reason: null
  }]
}

// Chunk 2: Content delta
{
  id: 'chatcmpl-123',
  model: 'gpt-4o',
  created: 1234567890,
  choices: [{
    index: 0,
    delta: { content: 'Hello' },
    finish_reason: null
  }]
}

// Chunk 3: Final chunk with usage
{
  id: 'chatcmpl-123',
  model: 'gpt-4o',
  created: 1234567890,
  choices: [{
    index: 0,
    delta: {},
    finish_reason: 'stop'
  }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
}
```

#### Holo Mapping

The plugin translates OpenAI chunks to Holo streaming events:

| OpenAI Chunk | Holo Event | Notes |
|--------------|-----------|-------|
| First chunk (`delta.role`) | `message_start` | Initialize message |
| Content chunks (`delta.content`) | `content_delta` | Incremental text |
| Tool call chunks (`delta.tool_calls`) | `message_delta` (with tools) | Tool accumulation |
| Final chunk (`finish_reason`) | `message_stop` | Completion + usage |

### Streaming Example

```typescript
import { HoloStreamChunk } from '@holokai/sdk';

const stream = await openaiProvider.streamChat(request);

for await (const chunk: HoloStreamChunk of stream) {
  switch (chunk.delta?.type) {
    case 'message_start':
      console.log('Message started:', chunk.id);
      break;
    case 'content_delta':
      process.stdout.write(chunk.delta.delta.content ?? '');
      break;
    case 'message_delta':
      console.log('Usage:', chunk.usage);
      break;
    case 'message_stop':
      console.log('Complete. Reason:', chunk.finish_reason);
      break;
  }
}
```

### Multi-Choice Streaming

OpenAI supports multiple completions via the `n` parameter:

```typescript
// OpenAI request
{
  model: 'gpt-4o',
  messages: [...],
  n: 3  // Generate 3 completions
}

// OpenAI response chunks include choice index
{
  choices: [{
    index: 0,  // First completion
    delta: { content: 'Option A' }
  }]
}
{
  choices: [{
    index: 1,  // Second completion
    delta: { content: 'Option B' }
  }]
}
```

**Note**: Multi-choice (`n > 1`) is OpenAI-specific and not part of portable Holo spec. Handled via streaming with `delta.choice` index.

---

## OpenAI-Specific Features

### Structured Outputs

Enable JSON schema validation:

```typescript
const request: HoloRequest = {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Generate a user profile' }],
  response_format: {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name', 'age']
    }
  }
};
```

### JSON Object Mode

Force JSON output without schema:

```typescript
const request: HoloRequest = {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Generate JSON' }],
  response_format: {
    type: 'json_object'
  }
};
```

### Prompt Caching

OpenAI caches prompts automatically based on usage patterns. No explicit cache control needed.

### Service Tier

Request priority tier:

```typescript
const request: HoloRequest = {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Urgent request' }],
  service_tier: 'default'  // or 'auto'
};
```

### Logprobs

**Note**: Not part of Holo spec. Use provider-specific config:

```typescript
const request: HoloRequest = {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  provider_config: {
    logprobs: true,
    top_logprobs: 5
  }
};
```

---

## Type Safety

### SDK Integration

This plugin uses strict SDK types exclusively:

```typescript
import type {
  HoloRequest,
  HoloResponse,
  HoloMessage,
  HoloTool,
  HoloJsonSchema  // ✅ Proper JSON Schema types
} from '@holokai/sdk';

// ❌ NO: Record<string, unknown>
// ✅ YES: HoloJsonSchema
```

### Migration from Legacy Types

**Before** (Legacy provider):
```typescript
import { HoloTool } from '../../types/holo/requests';

interface HoloTool {
  parameters?: Record<string, unknown>; // ❌ Loose typing
}
```

**After** (Plugin SDK):
```typescript
import type { HoloTool, HoloJsonSchema } from '@holokai/sdk';

interface HoloTool {
  parameters?: HoloJsonSchema; // ✅ Strict JSON Schema Draft 7
}
```

### Runtime Validation

All translations validate with ArkType:

```typescript
import { validateHoloRequest } from '@holokai/sdk/validators';

const result = validateHoloRequest(untrustedInput);
if (result.problems) {
  throw new ValidationError(result.problems);
}

const safeRequest: HoloRequest = result.data;
```

### ArkType Standards

From CLAUDE.md requirements:

1. ✅ ALWAYS use `satisfies Type<TypeName>` on every validator
2. ✅ NEVER use `Record<string, unknown>` - create proper validators
3. ✅ NEVER use `type('string')` for union types - look up actual enum values
4. ✅ ALWAYS look at actual SDK `.d.ts` files before implementing
5. ✅ Start with basic types first, build up to complex dependent types
6. ✅ Copy exact structure from SDK types - never guess
7. ✅ Required vs optional: No `?` means required
8. ✅ Fix validators to match types - never change to `any`

---

## Configuration Schema

The plugin exposes a JSON Schema for configuration validation:

```typescript
{
  apiKey: string;              // Required
  organizationId?: string;     // Optional organization ID
  baseUrl?: string;            // Optional custom endpoint
  defaultModel?: string;       // Fallback model
  allowedModels?: string[];    // Model allowlist
  timeoutMs?: number;          // Request timeout (default: 60000)
  maxRetries?: number;         // Retry attempts (default: 2)
  enableVision?: boolean;      // Vision support (default: true)
  logRequests?: boolean;       // Observability (default: false)
  telemetrySampleRate?: number;// Sampling rate (default: 1.0)
}
```

See [manifest.ts](./src/manifest.ts) for the complete schema.

---

## Development

### Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Type checking
npm run type-check

# Run tests
npm test
```

### Testing

```bash
# Unit tests
npm test

# Integration tests (requires API key)
OPENAI_API_KEY=sk-... npm run test:integration

# Watch mode
npm run test:watch
```

### Building

```bash
# Production build
npm run build

# Watch mode
npm run build:watch

# Clean
npm run clean
```

---

## Known Issues & Workarounds

### Timestamp Format

**Issue**: OpenAI returns timestamps as Unix seconds, not milliseconds.

**Workaround**: Plugin automatically converts: `created * 1000`.

### Multi-Choice Non-Portability

**Issue**: `n` parameter for multiple completions is OpenAI-specific.

**Behavior**: Not part of portable Holo spec. Use streaming with choice index tracking if needed.

### Tool Call Arguments Parsing

**Issue**: OpenAI returns `tool_calls[].function.arguments` as JSON string.

**Workaround**: Plugin automatically parses to object for Holo format.

### Empty Content in Tool Calls

**Issue**: When model calls tools, `content` may be empty string.

**Behavior**: Plugin preserves empty content as-is per OpenAI spec.

### Service Tier Availability

**Issue**: Service tier is only available for certain models/tiers.

**Behavior**: Field is optional; omitted if not supported by model.

---

## Related Documentation

### SDK Documentation
- [Holo Format Overview](../../packages/sdk/docs/HOLO_FORMAT.md)
- [Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md) - Complete OpenAI mappings
- [Capability Analysis](../../packages/sdk/docs/CAPABILITY_ANALYSIS.md) - Coverage verification
- [SDK README](../../packages/sdk/README.md) - Plugin development guide

### OpenAI Documentation
- [Official API Reference](https://platform.openai.com/docs/api-reference)
- [Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Vision](https://platform.openai.com/docs/guides/vision)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

### Legacy Documentation (Archived)
- `src/providers/docs/archive/` - Original monolithic provider docs
- Migration from these to plugin architecture is complete

---

## Contributing

### Adding Features

1. Update types in `@holokai/sdk` first (if needed)
2. Implement translator logic
3. Add validators with ArkType
4. Write tests (unit + integration)
5. Update this README

### Reporting Issues

Found a bug or have a feature request?
- GitHub Issues: https://github.com/holokai/holo-provider-openai/issues
- Include: Holo version, OpenAI model, request/response samples

---

## License

MIT © Holokai

---

## Changelog

### v0.1.0 (Current)
- ✅ Initial plugin release
- ✅ Extracted from monolithic architecture
- ✅ Migrated to SDK types
- ✅ Validated against Holo format spec
- ✅ Dual API support (Chat Completions + Responses)
- ✅ Complete streaming orchestration
- ✅ Tool calling support
- ✅ Vision/multimodal support
- ✅ Structured outputs support
- ✅ 200/228 type validators (88% coverage)

---

**Last Updated**: 2025-12-18
**Plugin Version**: 0.1.0
**SDK Version**: ^0.1.0
**OpenAI SDK**: ^6.9.1
