# Provider Translation System

> **Universal abstraction layer** for LLM providers (Claude, OpenAI, Ollama) using **Holo** as the portable format.

## 📚 Documentation Index

### Core Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture, base patterns, validators | Developers understanding the system |
| **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** | Complete type definitions with side-by-side comparisons | Anyone working with types |
| **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** | Field mapping tables (Holo ↔ Provider) | Implementing translations |
| **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** | Streaming architecture, event lifecycle, patterns | Streaming implementations |
| **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** | Step-by-step guide to add new providers/translators | New implementations |
| **[GUARD_ERRORS.md](GUARD_ERRORS.md)** | Guard failure error response patterns | Error handling |

### Provider-Specific Documentation

Each provider has a README with quick reference:
- **[claude/README.md](claude/README.md)** - Claude-specific notes
- **[openai/README.md](openai/README.md)** - OpenAI-specific notes
- **[ollama/README.md](ollama/README.md)** - Ollama-specific notes
- **[holo/README.md](../../plugins/sdk/src/holo/HOLO.md)** - Holo (canonical format) notes

---

## 🎯 Quick Start by Task

### "I need to understand the architecture"
1. Start with [ARCHITECTURE.md](ARCHITECTURE.md) - core principles
2. Review [TYPE_REFERENCE.md](TYPE_REFERENCE.md) § Holo Types
3. See [STREAMING_GUIDE.md](STREAMING_GUIDE.md) § Core Concepts

### "I need to add a new provider"
1. Read [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - step-by-step checklist
2. Review [TYPE_REFERENCE.md](TYPE_REFERENCE.md) - understand types
3. Study [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) - mapping patterns
4. Follow [STREAMING_GUIDE.md](STREAMING_GUIDE.md) - streaming implementation

### "I need to understand Holo types"
1. Go to [TYPE_REFERENCE.md](TYPE_REFERENCE.md) § Holo Types (Canonical)
2. See comparison tables for provider differences

### "I need to map Provider X ↔ Holo"
1. Check [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) § Provider Quick Reference
2. Look for specific field in comparison tables

### "I need to implement streaming"
1. Read [STREAMING_GUIDE.md](STREAMING_GUIDE.md) § Event Lifecycle
2. Review implementation patterns (per-choice, tool fragments, etc.)
3. See provider-specific event structures

### "I need to handle guard failures"
1. Read [GUARD_ERRORS.md](GUARD_ERRORS.md)
2. See error response vs normal response comparison

---

## 🏗️ System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Holo (Portable)  │ ← Universal Format
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼───────┐   ┌────────▼───────┐
│ Claude         │   │ OpenAI         │   │ Ollama         │
│ Translator     │   │ Translator     │   │ Translator     │
└───────┬────────┘   └────────┬───────┘   └────────┬───────┘
        │                     │                     │
┌───────▼────────┐   ┌────────▼───────┐   ┌────────▼───────┐
│ Claude API     │   │ OpenAI API     │   │ Ollama API     │
└────────────────┘   └────────────────┘   └────────────────┘
```

### Key Concepts

- **Holo**: Portable abstraction layer (hub-and-spoke model)
- **Stateless Translators**: No state between calls
- **Bidirectional**: All translators support Holo ↔ Provider
- **Validator-First**: ArkType validators enforce contracts
- **Lossless**: `provider_delta` preserves raw events for round-tripping

### Translation Flow

**Request Flow:**
```
Client Request → Holo Format → Provider Translator → Provider API
```

**Response Flow:**
```
Provider API → Provider Translator → Holo Format → Client
```

**Streaming Flow:**
```
Provider Chunk → Event Translator → Holo StreamChunk → Client
```

---

## 📊 Supported Providers

| Provider | Request | Response | Streaming | Status |
|----------|---------|----------|-----------|--------|
| **Claude** | ✅ | ✅ | ✅ (6 events) | Complete |
| **OpenAI** | ✅ | ✅ | ✅ (4 events) | Complete |
| **Ollama** | ✅ | ✅ | ✅ (3 events) | Complete |
| **Holo** | ✅ | ✅ | ✅ (Canonical) | Complete |

---

## 🔧 Implementation Status

### Request/Response Translators

| Component | Claude | OpenAI | Ollama |
|-----------|--------|--------|--------|
| Request Translator | ✅ | ✅ | ✅ (Chat + Generate) |
| Response Translator | ✅ | ✅ | ✅ (Chat + Generate) |
| Message Translator | ✅ | ✅ | ✅ |
| Tool Translator | ✅ | ✅ | ✅ |
| Usage Translator | ✅ | ✅ | ✅ |

### Streaming Translators

| Event Type | Claude | OpenAI | Ollama |
|------------|--------|--------|--------|
| Message Start | ✅ | ✅ | N/A (no explicit start) |
| Content Delta | ✅ | ✅ | ✅ |
| Message Delta | ✅ | ✅ | ✅ |
| Message Stop | ✅ | ✅ | ✅ |
| Content Block Start | ✅ | N/A | N/A |
| Content Block Stop | ✅ | N/A | N/A |
| **Orchestrator** | ✅ | ✅ | ✅ |

---

## 🐛 Known Issues

### High Priority
- **OpenAI "Lean" provider_delta Pattern**: Creates reconstructed subsets instead of storing full source (violates lossless principle)
  - **Files**: All OpenAI streaming translators
  - **Fix**: Store full `source` chunk in `provider_delta`

### Low Priority
- **Ollama Type Safety**: Uses `as any` cast in message delta translator
- **HoloRequestFactory**: Empty stub (unused in code)
- **TODOs**: 3 TODO comments in codebase

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) § Troubleshooting for details.

---

## 📖 Further Reading

### External Documentation
- [Claude API Docs](https://docs.anthropic.com/claude/reference)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)

### Internal Documentation
- Architecture patterns: [ARCHITECTURE.md](ARCHITECTURE.md)
- Type definitions: [TYPE_REFERENCE.md](TYPE_REFERENCE.md)
- Translation mappings: [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)
- Streaming guide: [STREAMING_GUIDE.md](STREAMING_GUIDE.md)
- Implementation guide: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)

---

## 🤝 Contributing

When adding new providers or modifying existing ones:

1. **Read**: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for step-by-step instructions
2. **Follow**: [ARCHITECTURE.md](ARCHITECTURE.md) patterns (stateless, validators, etc.)
3. **Document**: Update [TYPE_REFERENCE.md](TYPE_REFERENCE.md) and [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)
4. **Test**: Bidirectional translation and round-trip fidelity

---

## 📝 Documentation Status

**Current**: 19 files scattered across directories
**Goal**: 7 consolidated files + per-provider READMEs
**Migration**: In progress (Phase 1 complete)

### Deprecated Documentation

The following files are **deprecated** and will be archived after consolidation is complete:

- Individual type files (CLAUDE_REQUEST_TYPES.md, etc.) → See [TYPE_REFERENCE.md](TYPE_REFERENCE.md)
- Individual mapping files (TRANSLATION_MAPPING.md per provider) → See [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)
- Individual streaming files (STREAM_RESPONSE.md per provider) → See [STREAMING_GUIDE.md](STREAMING_GUIDE.md)
- TRANSLATOR_METHODOLOGY.md → Split into [STREAMING_GUIDE.md](STREAMING_GUIDE.md) + [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- TRANSLATOR_ARCHITECTURE.md → Merged into [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
