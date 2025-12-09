# Story 7-5: Implement Provider Strategy Logging and Observability

**Epic:** Epic 7: Worker Integration & Legacy Coexistence
**Story Number:** 7-5
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **system operator**,
I want **clear logging of which strategy is used for each provider**,
So that **I can monitor plugin vs legacy usage during migration**.

## Acceptance Criteria

**Given** workers create providers using strategies
**When** provider is created
**Then** worker logs which strategy was used
**And** log includes: provider type, strategy (plugin/legacy), plugin version (if plugin)
**And** log format: "[Worker] Created provider: openai via PluginProviderStrategy (@holokai/provider-openai@1.0.0)"
**And** log format: "[Worker] Created provider: claude via LegacyProviderStrategy"
**And** logs are structured (JSON) for easy parsing
**And** metrics are collected: provider.created counter with labels (provider_type, strategy)
**And** FR44: Workers log whether plugin or legacy provider is used for each instance

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 7-5 complete details in docs/epics.md
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
- See docs/epics.md#Story-7-5 for complete technical details
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
- **Prerequisites:** Story 7.4
- **Related FRs:** FR44

### References
- [Source: docs/epics.md#Story-7-5]
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
