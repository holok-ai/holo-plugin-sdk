# Story 6-1: Extract OpenAI Provider to Plugin Package

**Epic:** Epic 6: OpenAI Reference Plugin
**Story Number:** 6-1
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **existing OpenAI provider code extracted to a plugin package**,
So that **it can be built, tested, and published independently**.

## Acceptance Criteria

**Given** monorepo is set up with Common SDK published
**When** I extract OpenAI provider
**Then** packages/provider-openai/ directory exists
**And** src/index.ts exports OpenAIProviderPlugin as default
**And** src/plugin.ts implements IProviderPlugin interface
**And** src/provider.ts contains OpenAI SDK wrapper (extracted from src/providers/openai/)
**And** src/translator.ts contains Holo format translator (extracted from src/providers/openai/)
**And** package.json name is "@holokai/provider-openai"
**And** package.json includes dependency: openai@4.73.1 (EXACT version, FR32)
**And** package.json includes peerDependencies: @holokai/common, arktype
**And** TypeScript compiles without errors
**And** Legacy OpenAI code in src/providers/openai/ remains (coexistence during migration)

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 6-1 complete details in docs/epics.md
- [ ] Implement core functionality per acceptance criteria
- [ ] Add comprehensive error handling and logging
- [ ] Follow architecture patterns and decisions
- [ ] Add JSDoc documentation where needed
- [ ] Verify TypeScript strict mode compilation
- [ ] Write integration tests (primary focus)
- [ ] Test graceful degradation scenarios

### Testing Tasks
- [ ] Test happy path scenarios
- [ ] Test error and edge cases
- [ ] Verify performance requirements (if applicable)
- [ ] Test integration with related components
- [ ] Verify backward compatibility (if applicable)

---

## Dev Notes

### Architecture Alignment
- See docs/epics.md#Story-6-1 for complete technical details
- See docs/architecture.md for architectural patterns and ADRs
- Follow existing code patterns from previous epic implementations
- Reference technical notes section in epics.md for this story

### Implementation Guidelines
- Use TypeScript strict mode
- Follow CLAUDE.md coding standards (especially ArkType rules)
- Implement comprehensive error handling
- Use dependency injection (tsyringe @injectable)
- Emit lifecycle events where appropriate
- Log actionable messages (per FR72)

### Testing Standards
- Follow Architecture ADR-007: Hybrid testing strategy
- Write integration tests (70% of test coverage)
- Test graceful degradation patterns
- Verify error messages are actionable
- Use real scenarios where possible (minimize mocking)

### Dependencies
- **Prerequisites:** Epic 5 complete
- **Related FRs:** FR36, FR56

### References
- [Source: docs/epics.md#Story-6-1]
- [Source: docs/architecture.md]

---

## Dev Agent Record

### Context Reference
<!-- Story context XML path will be added here by context workflow -->

### Completion Notes
**Date:** 2025-12-03

**Implementation Summary:**
✅ ALL OpenAI provider code extracted to packages/provider-openai/src/:
- provider.ts (OpenAIProvider class - 124 lines)
- translator.ts (OpenAITranslator with DI - 50 lines)
- auditor.ts (OpenAIAuditor - 185 lines)
- translators/ (10+ translator files - ~1500 lines)
- services/ (ChatCompletions + Responses services - ~300 lines)
- types/ (OpenAI type definitions - ~200 lines)
- validators/ (Config validators - ~100 lines)

✅ Created plugin wrapper (src/plugin.ts - 102 lines)
✅ Updated index.ts with proper exports
✅ Package structure follows template from Story 4-1

⚠️ **Remaining Work (Story 6-3):**
The extracted code has ~50 TypeScript import errors because it references:
- ../ai.provider (base class from src/providers/)
- ../../utils (ErrorMessages, ClassLogger from src/utils/)
- ../../services (ResponseService from src/services/)
- ../../db/types (Provider DB type)
- ../types (ProviderRequest, AIRequestStat types)
- ../holo (Holo format types - now in @holokai/common)

**Resolution Strategy:**
1. Copy base provider abstractions to plugin (ai.provider.ts, base.translator.ts)
2. Copy minimal utils needed (error messages, logger)
3. Replace DB Provider type with ProviderConfig from @holokai/common
4. Replace service dependencies with simpler implementations
5. Update imports to use @holokai/common/holo for Holo types

**Estimated:** 2-3 hours to resolve all dependencies and compile cleanly

### File List
Created/Modified:
- packages/provider-openai/src/plugin.ts (NEW - plugin wrapper)
- packages/provider-openai/src/index.ts (UPDATED - proper exports)
- packages/provider-openai/src/provider.ts (COPIED from src/providers/openai/)
- packages/provider-openai/src/translator.ts (COPIED)
- packages/provider-openai/src/auditor.ts (COPIED)
- packages/provider-openai/src/translators/* (COPIED - 10+ files)
- packages/provider-openai/src/services/* (COPIED - 2 services)
- packages/provider-openai/src/types/* (COPIED - 3 type files)
- packages/provider-openai/src/validators/* (COPIED - 3 validators)
- packages/provider-openai/IMPLEMENTATION-PLAN.md (documentation)

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
