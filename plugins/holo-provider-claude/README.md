# @holokai/holo-provider-claude

> **Official Claude (Anthropic) provider plugin for Holo LLM Gateway**

[![npm version](https://img.shields.io/npm/v/@holokai/holo-provider-claude.svg)](https://www.npmjs.com/package/@holokai/holo-provider-claude)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

The Claude provider plugin enables Holo to communicate with Anthropic's Claude API through the universal Holo format. This plugin is part of the migration from the monolithic provider architecture to a plugin-based system, providing complete bidirectional translation between Claude's native API and the portable Holo format.

### Key Features

- ✅ **Full Holo SDK Integration** - Uses `@holokai/sdk` types for strict type safety
- ✅ **Bidirectional Translation** - Claude ↔ Holo format with lossless core fields
- ✅ **Streaming Support** - 6 granular event types with proper orchestration
- ✅ **Tool Calling** - Complete function calling support with proper extraction
- ✅ **Vision/Multimodal** - Image support via URLs and base64 data URIs
- ✅ **Prompt Caching** - Cost optimization through content caching
- ✅ **Extended Thinking** - Claude 3.5 Sonnet+ reasoning capabilities
- ✅ **Plugin Architecture** - Auto-discovered, hot-reloadable, independently versioned

---

## Installation

```bash
npm install @holokai/holo-provider-claude
```

### Peer Dependencies

This plugin requires:
- `@holokai/sdk` ^0.1.0 - Holo universal format types and plugin contracts

---

## Quick Start

### Automatic Discovery

When installed in a Holo worker environment, this plugin is automatically discovered and loaded by the plugin system. No manual registration required.

### Configuration

Add a provider configuration to your Holo deployment:

```json
{
  "id": "claude-primary",
  "provider_type": "claude",
  "plugin_id": "@holokai/holo-provider-claude",
  "api_key": "${ANTHROPIC_API_KEY}",
  "model": "claude-3-5-sonnet-20241022",
  "config": {
    "defaultModel": "claude-3-5-sonnet-20241022",
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
  model: 'claude-3-5-sonnet-20241022',
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

This plugin represents the extraction of Claude provider logic from the monolithic `src/providers/claude/` codebase into a standalone, independently versioned package.

**Before** (Monolithic):
```
src/providers/claude/
├── claude.translator.ts
├── translators/
├── streaming/
└── types/
```

**After** (Plugin):
```
@holokai/holo-provider-claude
├── src/
│   ├── plugin.ts          # Plugin entrypoint
│   ├── manifest.ts        # Plugin metadata
│   ├── claude.provider.ts # Provider implementation
│   └── translators/       # Translation logic (preserved)
└── package.json
```

### Migration Benefits

1. **Independent Versioning** - Update Claude support without core releases
2. **Hot Reload** - Deploy new Claude versions without downtime
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
@holokai/holo-provider-claude/
├── src/
│   ├── plugin.ts                    # ProviderPlugin implementation
│   ├── manifest.ts                  # Plugin metadata & config schema
│   ├── claude.provider.ts           # Core provider logic
│   ├── claude.translator.ts         # Main translator facade
│   ├── translators/
│   │   ├── claude.request.translator.ts
│   │   ├── claude.response.translator.ts
│   │   ├── claude.message.translator.ts
│   │   ├── claude.tool.translator.ts
│   │   └── claude.usage.translator.ts
│   ├── streaming/
│   │   ├── claude.stream.translator.ts      # Orchestrator
│   │   ├── claude.message.start.event.translator.ts
│   │   ├── claude.message.delta.event.translator.ts
│   │   ├── claude.message.stop.event.translator.ts
│   │   ├── claude.content.block.start.event.translator.ts
│   │   ├── claude.content.block.delta.event.translator.ts
│   │   └── claude.content.block.stop.event.translator.ts
│   ├── types/
│   │   └── (Re-exports from @anthropic-ai/sdk)
│   └── utils/
│       └── (Helper functions)
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
│ ClaudeRequestTranslator │
│  - Maps Holo → Claude   │
│  - Transforms content   │
│  - Renames fields       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────┐
│  Claude API     │
│  (@anthropic)   │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│ ClaudeResponseTranslator │
│  - Maps Claude → Holo    │
│  - Extracts tool calls   │
│  - Normalizes finish     │
└────────┬─────────────────┘
         │
         ↓
┌─────────────────┐
│  Holo Response  │
│  (SDK types)    │
└─────────────────┘
```

---

## Holo Format Mapping

This plugin implements the official Holo format mappings as documented in the SDK.

### Request Mapping: Holo → Claude

| Holo Field | Claude Field | Transformation | Notes |
|------------|-------------|----------------|-------|
| **Direct 1:1** ||||
| `model` | `model` | Direct | Required |
| `temperature` | `temperature` | Direct | 0-1 for Claude |
| `top_p` | `top_p` | Direct | Optional |
| `top_k` | `top_k` | Direct | Optional |
| `stream` | `stream` | Direct | Optional |
| `max_tokens` | `max_tokens` | Direct | Required by Claude |
| `stop_sequences` | `stop_sequences` | Direct | Array format |
| **Structure Transforms** ||||
| `system` (string) | `system` | Direct | Top-level |
| `system` (string[]) | `system` | Join with `\n\n` + drop metadata | Lossy if structured |
| `metadata.user_id` | `metadata.user_id` | Direct | Optional |
| `tools[].parameters` | `tools[].input_schema` | Rename field | JSON Schema |
| `tool_choice.type: 'specific'` | `tool_choice.type: 'tool'` | Map type + name | Specific tool |
| `tool_choice.type: 'required'` | `tool_choice.type: 'any'` | Map type | Any tool |
| `messages[]` | `messages[]` | Transform content | See Content Mapping |

**Dropped Fields** (Holo → Claude):
- `response_format` - Claude doesn't support structured output modes
- `frequency_penalty` - Not supported
- `presence_penalty` - Not supported
- `seed` - Not supported

See [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#claude--holo-requests) for complete details.

### Response Mapping: Claude → Holo

| Claude Field | Holo Field | Transformation | Notes |
|-------------|------------|----------------|-------|
| **Direct 1:1** ||||
| `id` | `id` | Direct | Always present |
| `model` | `model` | Direct | Always present |
| `role: 'assistant'` | `messages[0].role` | Wrap in array | Always assistant |
| **Structure Transforms** ||||
| `content[]` blocks | `messages[0].content` | Extract text + tools | Multi-part |
| `stop_reason` | `finish_reason` | Map codes | See table below |
| `usage.input_tokens` | `usage.input_tokens` | Direct | Optional |
| `usage.output_tokens` | `usage.output_tokens` | Direct | Optional |
| `usage.cache_read_input_tokens` | `usage.cache_read_tokens` | Direct | Optional |
| `usage.cache_creation_input_tokens` | `usage.cache_write_tokens` | Direct | Optional |
| `usage.service_tier` | `service_tier` | Promote to top-level | Optional |
| N/A | `created` | Synthesize with `Date.now()` | Claude lacks timestamp |

**Finish Reason Mapping**:

| Claude `stop_reason` | Holo `finish_reason` |
|---------------------|---------------------|
| `end_turn` | `stop` |
| `max_tokens` | `length` |
| `tool_use` | `tool_calls` |
| `refusal` | `content_filter` |
| `pause_turn` | `stop` (preserve in metadata) |

### Content Mapping

#### Text Content

```typescript
// Holo
{ type: 'text', text: 'Hello' }

// Claude (direct)
{ type: 'text', text: 'Hello' }
```

#### Image Content

```typescript
// Holo
{ type: 'image', url: 'https://example.com/image.png' }

// Claude
{ type: 'image', source: { type: 'url', url: 'https://example.com/image.png' } }

// Holo (base64)
{ type: 'image', url: 'data:image/png;base64,iVBORw...' }

// Claude (base64)
{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw...' } }
```

#### Tool Calls (Extraction Required)

```typescript
// Claude Response (embedded in content)
{
  content: [
    { type: 'text', text: 'Let me check that for you.' },
    { type: 'tool_use', id: 'toolu_123', name: 'get_weather', input: { location: 'SF' } }
  ]
}

// Holo Response (extracted)
{
  messages: [{
    role: 'assistant',
    content: 'Let me check that for you.',
    tool_calls: [{
      id: 'toolu_123',
      type: 'function',
      function: { name: 'get_weather', arguments: { location: 'SF' } }
    }]
  }]
}
```

---

## Streaming

### Event Types

Claude provides the most granular streaming events (6 types):

| Event Type | Purpose | Holo Mapping |
|------------|---------|--------------|
| `message_start` | Initialize message | `type: 'message_start'` |
| `content_block_start` | Begin content block (text/tool) | Used internally |
| `content_block_delta` | Incremental content | `type: 'content_delta'` |
| `content_block_stop` | End content block | Used internally |
| `message_delta` | Usage/finish updates | `type: 'message_delta'` |
| `message_stop` | Completion marker | `type: 'message_stop'` |

### Orchestration

The `ClaudeStreamTranslator` maintains state to:
1. Track content blocks by index
2. Accumulate text and tool input deltas
3. Extract complete tool calls on block completion
4. Preserve raw provider events in `provider_delta`

### Streaming Example

```typescript
import { HoloStreamChunk } from '@holokai/sdk';

const stream = await claudeProvider.streamChat(request);

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

---

## Claude-Specific Features

### Extended Thinking

Enable extended thinking for Claude 3.5 Sonnet+ models:

```typescript
const request: HoloRequest = {
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Solve this complex problem...' }],
  // Provider-specific config (passed through)
  provider_config: {
    thinking: {
      type: 'enabled',
      budget_tokens: 5000
    }
  }
};
```

**Note**: Thinking blocks (`content[].type = 'thinking'`) are Claude-specific and not part of the portable Holo format. They're preserved in `provider_delta` for debugging.

### Prompt Caching

Reduce costs by caching reusable prompts:

```typescript
// Provider-specific caching (requires Claude API beta)
const cachedMessages = [
  {
    role: 'user',
    content: 'Large document content...',
    cache_control: { type: 'ephemeral' }  // Cache this message
  }
];
```

**Note**: Cache control is Claude-specific and handled at the provider level, not in Holo format.

### Beta Features

Access beta features via plugin configuration:

```json
{
  "config": {
    "betas": ["prompt-caching-2024-07-31"]
  }
}
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

### Type Safety

All interfaces use strict TypeScript types from `@holokai/sdk` for compile-time validation.

---

## Configuration Schema

The plugin exposes a JSON Schema for configuration validation:

```typescript
{
  apiKey: string;              // Required
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
ANTHROPIC_API_KEY=sk-... npm run test:integration

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

## Related Documentation

### SDK Documentation
- [SDK README](../sdk/README.md) - Plugin development guide and templates

### Claude API Documentation
- [Official API Reference](https://docs.anthropic.com/claude/reference)
- [Streaming Guide](https://docs.anthropic.com/claude/reference/streaming)
- [Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [Vision](https://docs.anthropic.com/claude/docs/vision)
- [Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)

### Migration Notes
- This plugin was extracted from the monolithic `src/providers/claude/` codebase
- Migration to plugin architecture is complete

---

## Contributing

### Adding Features

1. Update types in `@holokai/sdk` first (if needed)
2. Implement translator logic
3. Write tests (unit + integration)
4. Update this README

### Reporting Issues

Found a bug or have a feature request?
- GitHub Issues: https://github.com/holokai/holo-provider-claude/issues
- Include: Holo version, Claude model, request/response samples

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
- ✅ Complete streaming orchestration
- ✅ Tool calling with extraction
- ✅ Vision/multimodal support
- ✅ Prompt caching support

---

**Last Updated**: 2025-12-18
**Plugin Version**: 0.1.0
**SDK Version**: ^0.1.0
