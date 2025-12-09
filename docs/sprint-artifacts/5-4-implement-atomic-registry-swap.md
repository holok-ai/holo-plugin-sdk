# Story 5-4: Implement Atomic Registry Swap

**Epic:** Epic 5: Hot-Reload System
**Story Number:** 5-4
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **system operator**,
I want **plugin hot-reload to be atomic with zero dropped requests**,
So that **in-flight requests complete successfully during reload**.

## Acceptance Criteria

**Given** new plugin is loaded and initialized
**When** HotReloadService swaps plugins
**Then** old plugin continues serving requests until new plugin is ready
**And** new plugin is initialized via plugin.initialize(context) before swap
**And** registry.atomicReplace(providerType, newPlugin) is used
**And** atomicReplace() updates Map in single operation (atomic)
**And** old plugin destroy() is called AFTER swap completes
**And** in-flight requests using old plugin complete successfully
**And** new requests immediately use new plugin after swap
**And** FR23: Plugin updates do not interrupt in-flight requests

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 5-4 complete details in docs/epics.md
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
- See docs/epics.md#Story-5-4 for complete technical details
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
- **Prerequisites:** Story 3.4
- **Related FRs:** FR22-23

### References
- [Source: docs/epics.md#Story-5-4]
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
