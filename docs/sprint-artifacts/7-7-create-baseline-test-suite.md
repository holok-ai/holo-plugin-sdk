# Story 7.7: Create Baseline Test Suite

**Epic:** 7 - Worker Integration & Legacy Coexistence
**Story Number:** 7.7
**Status:** done
**Created:** 2025-11-21
**Updated:** 2025-11-21
**Developer:** TBD

---

## Story

As a **development team**,
I want **a portable baseline test suite that validates the plugin system**,
So that **any CI/CD pipeline can execute quality gates without infrastructure coupling**.

## Acceptance Criteria

**Given** the plugin system is implemented across Epics 1-7
**When** I run the baseline test suite
**Then** the following test commands are available:

1. ✅ `npm run test:baseline` executes all validation tests
2. ✅ `npm run test:monorepo` validates workspace structure and dependencies
3. ✅ `npm run test:boundaries` validates import rules via ESLint
4. ✅ `npm run test:build` verifies all packages compile successfully
5. ✅ `npm run test:performance` baselines legacy provider latency
6. ✅ `npm run test:integration` runs plugin system integration tests
7. ✅ Tests are runnable locally AND in any CI/CD system
8. ✅ Zero external dependencies beyond npm/node
9. ✅ Test output includes clear pass/fail status with actionable error messages
10. ✅ Performance baseline metrics are saved for comparison

## Tasks / Subtasks

### Setup Test Infrastructure
- [x] Install test frameworks (AC: 1)
  - [x] Add Jest for unit/integration testing
  - [ ] Add Playwright for E2E testing (if needed)
  - [ ] Add k6 or similar for performance testing
  - [x] Configure test reporters for CI compatibility
- [x] Create test directory structure (AC: 1)
  - [x] tests/baseline/monorepo/
  - [x] tests/baseline/boundaries/
  - [x] tests/baseline/build/
  - [x] tests/baseline/performance/
  - [x] tests/baseline/integration/

### Implement Monorepo Validation Tests
- [x] Create monorepo structure tests (AC: 2)
  - [x] Verify packages/ directory exists
  - [x] Validate npm workspaces configuration
  - [x] Check package.json dependencies use correct protocols
  - [x] Verify TypeScript project references
  - [x] Validate composite project configuration
- [x] Test workspace linking (AC: 2)
  - [x] Verify @holokai/common can be imported from providers
  - [x] Verify circular dependency prevention

### Implement Import Boundary Tests
- [x] Create boundary validation tests (AC: 3)
  - [x] Test that packages cannot import from src/
  - [x] Test that common cannot import from providers
  - [x] Test that providers cannot import from each other
  - [x] Verify ESLint catches violations
  - [x] Generate violation report with clear messages
- [x] Test IP protection boundaries (AC: 3)
  - [x] Verify src/ remains private
  - [x] Verify packages/ can be published

### Implement Build Verification Tests
- [x] Create build validation tests (AC: 4)
  - [x] Run `npm run build` at root
  - [x] Verify dist/ directories created for all packages
  - [x] Check TypeScript declaration files generated
  - [x] Validate source maps present
  - [x] Test incremental builds work
- [x] Test package publishing readiness (AC: 4)
  - [x] Run npm pack dry-run
  - [x] Verify package contents correct
  - [x] Check subpath exports work

### Implement Performance Baseline Tests
- [x] Create legacy provider benchmarks (AC: 5)
  - [x] Measure OpenAI legacy provider latency
  - [x] Measure streaming response times
  - [x] Measure memory usage per provider
  - [x] Save baseline metrics to JSON file
- [x] Create comparison tests (AC: 5)
  - [x] Load baseline metrics
  - [x] Compare current performance
  - [x] Flag if degradation > 5ms (NFR4)

### Implement Integration Tests
- [x] Create plugin discovery tests (AC: 6)
  - [x] Test scanning node_modules/@holokai/*
  - [x] Test loading plugin manifests
  - [x] Test plugin validation
  - [x] Test graceful failure handling
- [x] Create plugin registry tests (AC: 6)
  - [x] Test plugin registration
  - [x] Test O(1) lookup performance
  - [x] Test type-specific registries
- [x] Create hot-reload simulation tests (AC: 6)
  - [x] Test file watcher detection
  - [x] Test version-based reload triggers
  - [x] Test atomic registry swap
  - [x] Test no request interruption

### Create NPM Scripts
- [x] Add test scripts to package.json (AC: 1, 7)
  - [x] "test:baseline": Run all tests
  - [x] "test:monorepo": Run workspace tests
  - [x] "test:boundaries": Run ESLint boundary checks
  - [x] "test:build": Run build verification
  - [x] "test:performance": Run performance baseline
  - [x] "test:integration": Run integration suite
- [x] Configure test environments (AC: 7, 8)
  - [x] Set NODE_ENV appropriately
  - [x] Configure test timeouts
  - [x] Set up test data fixtures

### Documentation and Reporting
- [x] Create test documentation (AC: 9)
  - [x] Document what each test suite validates
  - [x] Explain how to run tests locally
  - [x] Provide troubleshooting guide
- [x] Configure test reporting (AC: 9, 10)
  - [x] JSON output for CI parsing
  - [x] Human-readable console output
  - [x] Performance metrics dashboard
  - [x] Coverage reports

---

## Dev Notes

### Architecture Alignment
- This story directly addresses GAP-001 and GAP-002 from the Implementation Readiness Report
- Tests must be CI/CD agnostic - no GitHub Actions specific features
- Use standard npm scripts that any pipeline can execute
- Follow existing test patterns from Epic 1 implementation

### Testing Standards
- Follow Architecture ADR-007: Hybrid testing strategy
- 70% Integration, 20% E2E, 10% Unit split
- Use real APIs where possible (per FR65)
- Mock only when necessary for determinism

### Performance Considerations
- NFR4: Plugin latency must match legacy ±5ms
- NFR2: Plugin loading must not increase startup >5s
- NFR3: Hot-reload detection must occur <2s
- Baseline metrics critical for validation

### Dependencies
- This story can execute after Epic 1 is complete
- Does not depend on Epic 2-6 completion
- Should run before starting Epic 2 development
- Validates Epic 1 implementation

### References
- [Source: docs/implementation-readiness-report-2025-11-21.md#Critical-Issues]
- [Source: docs/test-design-system.md#Sprint-0-Recommendations]
- [Source: docs/epics.md#Epic-7]
- [Source: Architecture ADR-007 - Testing Strategy]

---

## Dev Agent Record

### Context Reference
- docs/sprint-artifacts/7-7-create-baseline-test-suite.context.xml

### Completion Notes
Successfully implemented the baseline test suite for Sprint 0. Created comprehensive tests across 5 categories (monorepo, boundaries, build, performance, integration) that validate Epic 1 implementation and establish test infrastructure. All tests are portable and CI/CD agnostic as required. Tests are passing and provide clear error messages. Performance baseline framework established for future comparisons.

### File List
- tests/baseline/monorepo/workspace.test.ts (new)
- tests/baseline/boundaries/import-boundaries.test.ts (new)
- tests/baseline/build/compilation.test.ts (new)
- tests/baseline/performance/provider-baseline.test.ts (new)
- tests/baseline/integration/plugin-system.test.ts (new)
- tests/baseline/README.md (new)
- package.json (modified - added test scripts)

---

## Change Log

### Version 1.0 - 2025-11-21
- Initial story creation based on readiness assessment findings
- Added to address test infrastructure gap (GAP-001)
- Provides Epic 1 validation capability (GAP-002)

### Version 1.1 - 2025-11-22
- Implemented complete baseline test suite
- Created 5 test categories with 40+ individual tests
- Added NPM scripts for test execution
- Tests validated and passing