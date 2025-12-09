# Story 7-2: Integrate Plugin System into Worker Startup

**Epic:** Epic 7: Worker Integration & Legacy Coexistence
**Story Number:** 7-2
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **worker developer**,
I want **plugin system initialized during worker startup**,
So that **plugins are loaded before worker accepts requests**.

## Acceptance Criteria

**Given** worker startup sequence exists
**When** worker initializes
**Then** worker resolves PluginLoaderService from DI container
**And** worker calls pluginLoader.loadAllPlugins() before accepting requests
**And** loadAllPlugins() discovers, loads, validates, and registers all plugins
**And** worker resolves HotReloadService from DI container
**And** worker calls hotReload.startWatching() after plugin loading completes
**And** worker resolves PluginCacheService from DI container
**And** worker subscribes to 'plugin_metadata' config queue messages
**And** worker startup completes even if plugin loading fails (FR46)
**And** worker logs: "[Worker] Plugin system initialized: 3 plugins loaded" 

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 7-2 complete details in docs/epics.md
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
- See docs/epics.md#Story-7-2 for complete technical details
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
- **Prerequisites:** Story 7.1
- **Related FRs:** FR38-40, FR46

### References
- [Source: docs/epics.md#Story-7-2]
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
