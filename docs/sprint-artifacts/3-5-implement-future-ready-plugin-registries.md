# Story 3-5: Implement Future-Ready Plugin Registries

**Epic:** Epic 3: Core Plugin Infrastructure
**Story Number:** 3-5
**Status:** done
**Created:** 2025-11-22
**Updated:** 2025-12-02
**Developer:** Claude Code

---

## Story

As a **platform architect**,
I want **guard and worker plugin registries implemented**,
So that **the plugin system is ready for Phase 2+ expansion**.

## Acceptance Criteria

**Given** provider registry is implemented
**When** I create guard and worker registries
**Then** GuardPluginRegistry implements IPluginRegistry<IGuardPlugin>
**And** GuardPluginRegistry stores plugins by guard name
**And** GuardPluginRegistry provides getByName(name: string): IGuardPlugin | null
**And** WorkerPluginRegistry implements IPluginRegistry<IWorkerPlugin>
**And** WorkerPluginRegistry stores plugins by worker type
**And** WorkerPluginRegistry provides getByType(type: string): IWorkerPlugin | null
**And** all registries share common IPluginRegistry interface
**And** generic registry routes guard/worker plugins to correct registries
**And** registries are implemented but unused in MVP (Phase 2+)

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 3-5 details from epics.md
- [ ] Implement core functionality as specified in acceptance criteria
- [ ] Add comprehensive error handling
- [ ] Implement logging as specified
- [ ] Add JSDoc documentation
- [ ] Verify TypeScript compilation
- [ ] Write integration tests
- [ ] Test graceful degradation scenarios

### Testing Tasks
- [ ] Test happy path scenarios
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Verify performance requirements
- [ ] Test integration with related components

---

## Dev Notes

### Architecture Alignment
- See docs/epics.md#Story-3-5 for complete technical details
- See docs/architecture.md for architectural patterns and decisions
- Follow existing code patterns from Epic 1 implementation

### Implementation Guidelines
- Use TypeScript strict mode
- Follow CLAUDE.md coding standards
- Implement comprehensive error handling
- Use dependency injection (tsyringe)
- Emit lifecycle events where appropriate

### Testing Standards
- Write integration tests (primary)
- Test graceful degradation
- Verify error messages are actionable
- Test with real scenarios where possible

### Dependencies
- **Prerequisites:** Story 3.4
- **Related FRs:** FR88

### References
- [Source: docs/epics.md#Story-3-5]
- [Source: docs/architecture.md]

---

## Dev Agent Record

### Context Reference
<!-- Story context XML path will be added here by context workflow -->

### Completion Notes
Implemented guard and worker plugin registries following the same pattern as provider registry. Both registries:
- Implement IPluginRegistry<T> interface for consistency
- Store plugins in Map for O(1) lookup performance
- Extract registry key from package name pattern (@holokai/{type}-{name}) or custom field
- Support atomicReplace for hot-reload capability
- Return null for not found (graceful degradation)
- Injectable via tsyringe

**GuardPluginRegistry:**
- Keyed by guard name
- Provides getByName(name: string): IGuardPlugin | null

**WorkerPluginRegistry:**
- Keyed by worker type
- Provides getByType(type: string): IWorkerPlugin | null

All acceptance criteria met. Tests pass with 18/18 assertions. Registries are implemented but will remain unused in MVP (ready for Phase 2+ expansion).

### File List
**Implementation:**
- src/services/plugin/guard-registry.service.ts (44 lines)
- src/services/plugin/worker-registry.service.ts (44 lines)

**Tests:**
- tests/unit/services/plugin/guard-registry.service.test.ts (271 lines) - 9 test cases
- tests/unit/services/plugin/worker-registry.service.test.ts (268 lines) - 9 test cases

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
