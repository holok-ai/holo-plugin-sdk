# Holo Universal Format

## Overview

The **Holo format** serves as the universal translation hub in HoloKai's hub-and-spoke architecture. It prevents N² translations between providers by standardizing on a single, portable format. All provider translations flow through Holo:

```
Provider → Holo → Provider
```

## Design Principles

1. **Portable First**: Only include fields that can be meaningfully translated across ≥2 providers
2. **Lossless Core**: Preserve essential functionality during round-trip translations
3. **Provider-Agnostic**: No provider-specific constructs in the core format
4. **Graceful Degradation**: Unsupported features are dropped safely, not errors

## Architecture Pattern

```
┌─────────┐
│ Claude  │────┐
└─────────┘    │
               │    ┌──────────┐
┌─────────┐    ├───→│   Holo   │←───┐
│ OpenAI  │────┘    │  Format  │    │
└─────────┘         └──────────┘    │
                                    │
┌─────────┐                         │
│ Ollama  │─────────────────────────┘
└─────────┘
```

## Core Types

### HoloRequest

Universal request format supporting:
- **Common fields** (all providers): `model`, `messages`, `temperature`, `top_p`, `stream`, `tools`
- **Mapped fields** (≥2 providers): `system`, `max_tokens`, `stop_sequences`, `response_format`, etc.
- **Request types**: `chat` (default) or `generate` (Ollama-specific)

### HoloResponse

Universal response format with:
- **Core fields**: `id`, `model`, `messages`, `finish_reason`, `usage`
- **Portable content**: Text, images, tool calls, tool results
- **Usage tracking**: Input/output tokens, cache stats, service tier

### HoloMessage

Flexible message format supporting:
- **Roles**: `user`, `assistant`, `tool`
- **Content**: String or structured `HoloContent[]` (text, images, tool calls)
- **Tool integration**: Tool calls and results with proper linking

### HoloContent

Discriminated union of content types:
- `text`: Plain text content
- `image`: Images via URL or base64 data URI
- Additional types for tool results

## Type Safety

All Holo types are:
- ✅ **Strictly typed** with proper TypeScript interfaces
- ✅ **Validated** using ArkType at runtime boundaries
- ✅ **Self-documenting** with comprehensive JSDoc comments
- ✅ **Version-stable** for plugin compatibility

## Usage in Plugins

Plugins interact with Holo format through the SDK:

```typescript
import type { HoloRequest, HoloResponse } from '@holokai/sdk';

// Translate provider format to Holo
function toHolo(providerRequest: MyProviderRequest): HoloRequest {
  return {
    model: providerRequest.model,
    messages: providerRequest.messages.map(mapMessage),
    temperature: providerRequest.temperature,
    // ... map other fields
  };
}

// Translate Holo to provider format
function fromHolo(holoRequest: HoloRequest): MyProviderRequest {
  return {
    model: holoRequest.model,
    messages: holoRequest.messages?.map(mapMessage) ?? [],
    // ... map other fields
  };
}
```

## Field Categories

### 🟢 Common (All Providers)

Fields supported by Claude, OpenAI, and Ollama:
- `model` - Model identifier (required)
- `messages` - Conversation history
- `temperature` - Sampling temperature (0-2)
- `top_p` - Nucleus sampling
- `stream` - Enable streaming responses
- `tools` - Available functions/tools

### 🟡 Mapped (≥2 Providers)

Fields with functional equivalents in multiple providers:
- `system` - System prompt (top-level)
- `max_tokens` - Maximum tokens to generate
- `stop_sequences` - Stop sequences
- `response_format` - Output format (JSON, text)
- `service_tier` - Priority tier
- `tool_choice` - Tool selection strategy
- `top_k` - Top-k sampling
- `frequency_penalty` - Frequency penalty
- `presence_penalty` - Presence penalty
- `seed` - Random seed for determinism
- `metadata` - Request metadata

### 🔵 Provider-Specific

Features unique to one provider are **NOT** in Holo format:
- Claude: `thinking`, `betas`, `mcp_servers`, `container`
- OpenAI: `reasoning_effort`, `audio`, `modalities`, `logprobs`, `n`
- Ollama: `keep_alive`, specific `options` fields

These should be handled in provider-specific plugins if needed.

## Streaming

Holo provides normalized streaming through `HoloStreamChunk`:

```typescript
interface HoloStreamChunk {
  id?: string;
  model?: string;
  created?: number;
  delta?: HoloStreamingDelta;
  done?: boolean;
  finish_reason?: HoloFinishReason;
  usage?: HoloUsage;
}
```

Streaming events are normalized to:
- `message_start` - Begin new message
- `content_delta` - Incremental content
- `message_delta` - Usage/metadata updates
- `message_stop` - End of stream

## Next Steps

- [Provider Mapping Tables](./PROVIDER_MAPPINGS.md) - Detailed field-by-field mappings
- [Translation Guide](./TRANSLATION_GUIDE.md) - How to implement translations
- [Type Reference](./TYPE_REFERENCE.md) - Complete type definitions

---

**Version**: 1.0.0
**Last Updated**: 2025-12-09
