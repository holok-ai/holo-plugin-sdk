# Story 6-4: Create Integration Tests for Legacy Provider

**Epic:** Epic 6: OpenAI Reference Plugin
**Story Number:** 6-4
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **QA engineer**,
I want **integration tests that verify legacy OpenAI provider behavior**,
So that **I have a baseline for comparing plugin implementation**.

## Acceptance Criteria

**Given** legacy OpenAI provider exists in src/providers/openai/
**When** I run integration tests
**Then** tests make real API calls to OpenAI (no mocking, FR65)
**And** tests verify non-streaming chat completions
**And** tests verify streaming chat completions (SSE)
**And** tests verify function/tool calling
**And** tests verify vision capabilities (image inputs)
**And** tests capture response structure, tokens, timing
**And** tests use existing OpenAI integration test suite (tests/integration/openai.test.ts)
**And** tests pass consistently with real OpenAI API
**And** test results are saved as baseline for comparison

## Tasks / Subtasks

### Implementation Tasks
- [ ] Review Story 6-4 complete details in docs/epics.md
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
- See docs/epics.md#Story-6-4 for complete technical details
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
- **Prerequisites:** Story 6.3
- **Related FRs:** FR62, FR65

### References
- [Source: docs/epics.md#Story-6-4]
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
