# Archived Documentation

> **⚠️ DEPRECATED**: These files have been consolidated into the new documentation structure.

---

## Migration Guide

This directory contains **deprecated documentation** that has been consolidated into the new structure. Please use the new consolidated docs instead.

### Old Files → New Locations

#### Type Documentation

| Old File | New Location |
|----------|--------------|
| `HOLO_CHAT_REQUEST_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Holo Types |
| `HOLO_CHAT_RESPONSE_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Holo Types |
| `CLAUDE_REQUEST_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |
| `CLAUDE_RESPONSE_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |
| `OPENAI_REQUEST_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |
| `OPENAI_RESPONSE_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |
| `OLLAMA_REQUEST_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |
| `OLLAMA_RESPONSE_TYPES.md` | [TYPE_REFERENCE.md](../../TYPE_REFERENCE.md) § Provider Comparison |

#### Streaming Documentation

| Old File | New Location |
|----------|--------------|
| `STREAMING.md` | [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) |
| `STREAM_RESPONSE.md` (Claude) | [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) § Claude |
| `STREAM_RESPONSE.md` (OpenAI) | [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) § OpenAI |
| `STREAM_RESPONSE.md` (Ollama) | [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) § Ollama |
| `ORCHESTRATOR.md` | [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) § Claude Orchestration |

#### Translation Documentation

| Old File | New Location |
|----------|--------------|
| `TRANSLATION_MAPPINGS.md` (Claude) | [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) § Claude ↔ Holo |
| `TRANSLATION_MAPPING.md` (OpenAI) | [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) § OpenAI ↔ Holo |
| `TRANSLATION_MAPPING.md` (Ollama) | [TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md) § Ollama ↔ Holo |

#### Architecture Documentation

| Old File | New Location |
|----------|--------------|
| `TRANSLATOR_ARCHITECTURE.md` | [ARCHITECTURE.md](../../ARCHITECTURE.md) |
| `TRANSLATOR_METHODOLOGY.md` | [IMPLEMENTATION_GUIDE.md](../../IMPLEMENTATION_GUIDE.md) + [STREAMING_GUIDE.md](../../STREAMING_GUIDE.md) |

#### Specialized Documentation

| Old File | New Location |
|----------|--------------|
| `FACTORY_DESIGN.md` | [GUARD_ERRORS.md](../../GUARD_ERRORS.md) |

---

## New Documentation Structure

The new consolidated documentation is organized as follows:

### Core Documentation (7 files)

1. **[README.md](../../README.md)** - Navigation hub and quick-start guides
2. **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - System architecture and patterns
3. **[TYPE_REFERENCE.md](../../TYPE_REFERENCE.md)** - Complete type definitions with comparisons
4. **[TRANSLATION_GUIDE.md](../../TRANSLATION_GUIDE.md)** - Field mapping tables
5. **[STREAMING_GUIDE.md](../../STREAMING_GUIDE.md)** - Streaming architecture and patterns
6. **[IMPLEMENTATION_GUIDE.md](../../IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation
7. **[GUARD_ERRORS.md](../../GUARD_ERRORS.md)** - Error response patterns

### Provider-Specific READMEs (4 files)

1. **[claude/README.md](../../claude/README.md)** - Claude-specific reference
2. **[openai/README.md](../../openai/README.md)** - OpenAI-specific reference
3. **[ollama/README.md](../../ollama/README.md)** - Ollama-specific reference
4. **[holo/README.md](../../holo/README.md)** - Holo (canonical format) reference

---

## Key Improvements

### Before (19 scattered files)
- Hard to navigate
- High redundancy
- Difficult to compare providers
- No clear entry point

### After (7 consolidated + 4 provider READMEs)
- Clear navigation via README.md
- Single source of truth
- Side-by-side provider comparisons
- Task-based quick starts

---

## Timeline

- **Deprecated**: 2025-10-05
- **Keep Archived**: Indefinitely (for reference)
- **Removal**: No plans to delete (historical reference)

---

## Need Help?

If you can't find what you need in the new docs:

1. Check the [main README.md](../../README.md) for navigation
2. Use the "Quick Start by Task" section
3. Search across the 7 core docs (they're cross-linked)

---

**Last Updated**: 2025-10-05
