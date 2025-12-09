# Story 5-3: Implement Module Cache Clearing

**Epic:** Epic 5: Hot-Reload System
**Story Number:** 5-3
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin system developer**,
I want **Node.js module cache cleared before reloading plugins**,
So that **the new plugin code is actually loaded (not cached old code)**.

## Acceptance Criteria

**Given** version change is detected
**When** HotReloadService reloads plugin
**Then** service clears require.cache for plugin package
**And** service clears require.cache recursively for plugin dependencies
**And** service uses cache-busting query parameter for dynamic import
**And** import uses: `import('@holokai/plugin?t=' + Date.now())`
**And** service handles module cache clearing errors gracefully
**And** service does NOT clear core Holo module cache (only plugin cache)
**And** cache clearing is logged: "[HotReload] Cleared cache for @holokai/provider-openai" 

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 5-3 complete details in docs/epics.md
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
- See docs/epics.md#Story-5-3 for complete technical details
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
- **Prerequisites:** Story 5.2
- **Related FRs:** FR21

### References
- [Source: docs/epics.md#Story-5-3]
- [Source: docs/architecture.md]

---

## Dev Agent Record

### Context Reference
<!-- Story context XML path will be added here by context workflow -->

### Completion Notes
<!-- To be filled by dev agent during implementation -->

### File List
<!-- To be filled by dev agent during implementation -->

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
