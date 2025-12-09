# Story 5-1: Implement File Watcher Service with Chokidar

**Epic:** Epic 5: Hot-Reload System
**Story Number:** 5-1
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **system operator**,
I want **the system to detect plugin package changes automatically**,
So that **updated plugins are reloaded without manual intervention**.

## Acceptance Criteria

**Given** chokidar is installed as dependency
**When** HotReloadService starts watching
**Then** service watches node_modules/@holokai/*/package.json files
**And** service uses chokidar.watch() with awaitWriteFinish option
**And** awaitWriteFinish.stabilityThreshold is 1000ms (waits for npm install)
**And** service emits 'change' event when package.json is modified
**And** service emits 'add' event when new package.json is added
**And** service ignores initial file scan (ignoreInitial: true)
**And** service detects changes within 2 seconds (NFR3)
**And** service is cross-platform compatible (Linux, macOS, Windows dev)
**And** service is implemented in src/services/plugin/hot-reload.service.ts

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 5-1 complete details in docs/epics.md
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
- See docs/epics.md#Story-5-1 for complete technical details
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
- **Prerequisites:** Epic 4 complete
- **Related FRs:** FR18-19, NFR3

### References
- [Source: docs/epics.md#Story-5-1]
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
