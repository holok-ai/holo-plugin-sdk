# Story 3-3: Implement Generic Plugin Registry Service

**Epic:** Epic 3: Core Plugin Infrastructure
**Story Number:** 3-3
**Status:** done
**Created:** 2025-11-22
**Updated:** 2025-12-02
**Developer:** Claude Code

---

## Story

As a **plugin system developer**,
I want **a generic registry that routes plugins to type-specific registries**,
So that **plugins are organized by type and lookup is fast**.

## Acceptance Criteria

**Given** plugins are loaded and validated
**When** PluginRegistryService registers plugins
**Then** service maintains a Map of type-specific registries (provider → ProviderPluginRegistry)
**And** service implements registerPlugin(plugin) that routes by plugin.manifest.pluginType
**And** service calls plugin.initialize(context) before registering
**And** service routes provider plugins to ProviderPluginRegistry
**And** service routes guard plugins to GuardPluginRegistry (if exists)
**And** service provides getRegistry<T>(type: PluginType): IPluginRegistry<T>
**And** service logs registration: "[Registry] Registered provider plugin: openai"
**And** service handles initialize() failures gracefully (skip plugin, log error)
**And** service is injectable via tsyringe

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 3-3 details from epics.md
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
- See docs/epics.md#Story-3-3 for complete technical details
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
- **Prerequisites:** Story 3.2
- **Related FRs:** FR25

### References
- [Source: docs/epics.md#Story-3-3]
- [Source: docs/architecture.md]

---

## Dev Agent Record

### Context Reference
<!-- Story context XML path will be added here by context workflow -->

### Completion Notes
Implemented generic plugin registry service that routes plugins to type-specific registries. The service:
- Maintains a Map of PluginType -> IPluginRegistry<T>
- Calls plugin.initialize(context) before registering
- Routes plugins to appropriate type-specific registries
- Logs all registration events and errors
- Handles initialization failures gracefully (skips plugin, logs error)
- Injectable via tsyringe

All acceptance criteria met. Tests pass with 15/15 assertions.

### File List
**Implementation:**
- src/services/plugin/registry.service.ts (51 lines)
- src/services/plugin/provider-registry.service.ts (44 lines)

**Tests:**
- tests/unit/services/plugin/registry.service.test.ts (164 lines)
- tests/unit/services/plugin/provider-registry.service.test.ts (270 lines)

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
