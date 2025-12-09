# Story 5-2: Implement Version-Based Change Detection

**Epic:** Epic 5: Hot-Reload System
**Story Number:** 5-2
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **system operator**,
I want **hot-reload to trigger only on actual version changes**,
So that **file system noise doesn't cause unnecessary reloads**.

## Acceptance Criteria

**Given** file watcher detects package.json change
**When** HotReloadService processes change
**Then** service reads new package.json to extract version
**And** service compares new version with current plugin version in registry
**And** service triggers reload only if versions differ
**And** service skips reload if version is unchanged (file touch, no update)
**And** service logs: "[HotReload] Version change detected: openai 1.0.0 → 1.1.0"
**And** service logs: "[HotReload] Version unchanged, skipping reload"
**And** service debounces per package (multiple events = one reload)
**And** debounce timeout is 500ms

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 5-2 complete details in docs/epics.md
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
- See docs/epics.md#Story-5-2 for complete technical details
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
- **Prerequisites:** Story 5.1
- **Related FRs:** FR20

### References
- [Source: docs/epics.md#Story-5-2]
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
