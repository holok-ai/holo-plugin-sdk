# Provider System

**Last Updated:** 2025-11-11

## Overview

Universal abstraction layer for LLM providers using **Holo** as the portable interchange format.

### Supported Providers

| Provider | Status | Documentation |
|----------|--------|---------------|
| **OpenAI** | ✅ Complete | [openai/README.md](openai/README.md) |
| **Claude** | ✅ Complete | [claude/README.md](claude/README.md) |
| **Ollama** | ✅ Complete | [ollama/README.md](ollama/README.md) |
| **Holo** | ✅ Canonical Format | [holo/README.md](holo/README.md) |
| **Perplexity** | 🚧 In Progress | - |

## Architecture

### Hub-and-Spoke Model

```
                    ┌─────────────────┐
                    │  Holo (Portable)│
                    │   Canonical Hub │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼───────┐  ┌────────▼───────┐
│ Claude         │  │ OpenAI         │  │ Ollama         │
│ Translator     │  │ Translator     │  │ Translator     │
└────────────────┘  └────────────────┘  └────────────────┘
```

**Benefits:**
- **N translations** instead of N² (3 providers → 3 translators vs 6)
- **Single source of truth** for portable format
- **Independent evolution** of provider implementations
- **Testable isolation** of each translation layer

### Design Principles

1. **Stateless Translators** - No instance variables, pure functions
2. **Bidirectional Translation** - Holo ↔ Provider in both directions
3. **Lossless Where Possible** - Preserve provider-specific data in `metadata` or `provider_delta`
4. **Type-Safe** - All types validated with arktype, no `any` or `unknown`

## Provider Features

### OpenAI

- **APIs:** Chat Completions + Responses API
- **Streaming:** Chunk-based with 54 event types (Responses API)
- **Tools:** Function calling, web search, code interpreter, computer use, MCP
- **Models:** GPT-4, o1, o3, o4-mini
- **Unique Features:** Multi-choice (n>1), reasoning models, structured outputs

### Claude

- **API:** Messages API
- **Streaming:** 6 granular events (most detailed)
- **Tools:** Function calling with parallel execution
- **Models:** Claude 3.5 Sonnet, Claude 3 Opus
- **Unique Features:** Prompt caching, extended thinking, MCP integration

### Ollama

- **APIs:** Chat + Generate (dual mode)
- **Streaming:** Simple frame-based (done=true/false)
- **Tools:** Function calling (chat mode only)
- **Models:** Llama, Mistral, Gemma, etc. (local deployment)
- **Unique Features:** Hardware control (GPU/NUMA), keep-alive, context continuation

## Quick Start

Each provider's README contains:
- ✅ Complete API reference
- ✅ Request/response mapping tables
- ✅ Streaming event documentation
- ✅ Usage examples
- ✅ Known issues and edge cases
- ✅ Provider-specific features

**Start here:**
1. Read [holo/README.md](holo/README.md) to understand the canonical format
2. Read your target provider's README for specific mappings
3. Check provider implementations for code examples

## File Structure

```
src/providers/
├── README.md (this file)
├── holo/
│   ├── README.md
│   └── types/
├── openai/
│   ├── README.md
│   ├── types/
│   ├── validators/
│   ├── services/
│   └── translators/
├── claude/
│   ├── README.md
│   ├── types/
│   ├── validators/
│   └── translators/
└── ollama/
    ├── README.md
    ├── types/
    ├── validators/
    └── translators/
```

## Adding a New Provider

1. Create provider directory structure
2. Define types and validators (arktype)
3. Implement bidirectional translators (Holo ↔ Provider)
4. Add streaming support
5. Write comprehensive README with mapping tables
6. Add tests

See [holo/README.md](holo/README.md) § "Adding a New Provider" for detailed checklist.

---

**Last Updated:** 2025-11-11
