# Story 2.8: Define Shared Utility Types

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.8
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **shared utility types in /utils namespace**,
So that **I have consistent patterns for logging, error handling, and common operations**.

## Acceptance Criteria

**Given** Common SDK structure exists
**When** I define utility types
**Then** src/utils/types.ts exports Logger interface
**And** Logger includes: info(message, context?), warn(), error(), debug()
**And** src/utils/types.ts exports ErrorResponse interface
**And** ErrorResponse includes: code, message, details?
**And** src/utils/types.ts exports HealthStatus interface
**And** HealthStatus includes: healthy, timestamp, details?
**And** /utils subpath export includes utility types
**And** JSDoc explains usage patterns for each utility

## Tasks / Subtasks

### Define Logger Interface
- [ ] Create Logger interface in src/utils/types.ts (AC: Then, And 1)
  - [ ] Add info(message: string, context?: object): void method
  - [ ] Add warn(message: string, context?: object): void method
  - [ ] Add error(message: string, context?: object): void method
  - [ ] Add debug(message: string, context?: object): void method
- [ ] Add JSDoc documentation (AC: And 7)
  - [ ] Explain Logger interface aligns with Winston
  - [ ] Show usage examples
  - [ ] Explain context object pattern

### Define ErrorResponse Interface
- [ ] Create ErrorResponse interface in src/utils/types.ts (AC: And 2, 3)
  - [ ] Add code field (string) - error code identifier
  - [ ] Add message field (string) - human-readable message
  - [ ] Add details field (object, optional) - additional error context
- [ ] Add JSDoc documentation (AC: And 7)
  - [ ] Explain ErrorResponse for standardized errors
  - [ ] Show example error responses
  - [ ] Reference FR72 (clear error messages)

### Define HealthStatus Interface
- [ ] Create HealthStatus interface in src/utils/types.ts (AC: And 4, 5)
  - [ ] Add healthy field (boolean) - overall health status
  - [ ] Add timestamp field (number) - when health check ran
  - [ ] Add details field (object, optional) - health check details
- [ ] Add JSDoc documentation (AC: And 7)
  - [ ] Explain HealthStatus for optional healthCheck() hook
  - [ ] Show example health status
  - [ ] Explain when to use

### Define Additional Utility Types
- [ ] Create Result<T, E> type (optional enhancement)
  - [ ] Success variant with data: T
  - [ ] Error variant with error: E
  - [ ] Useful for operations that can fail
- [ ] Create AsyncResult<T, E> type (optional)
  - [ ] Promise-wrapped Result type

### Update Barrel Exports
- [ ] Export from src/utils/index.ts (AC: And 6)
  - [ ] Export Logger interface
  - [ ] Export ErrorResponse interface
  - [ ] Export HealthStatus interface
  - [ ] Export any additional utility types

### Test Types
- [ ] Create test implementations
  - [ ] Implement Logger interface test class
  - [ ] Create ErrorResponse test objects
  - [ ] Create HealthStatus test objects
  - [ ] Verify TypeScript compilation

---

## Dev Notes

### Architecture Alignment
- Logger interface aligns with Winston (used by core Holo)
- PluginContext.logger follows this interface (injected during initialize)
- ErrorResponse for standardized error handling (FR72 - clear error messages)
- HealthStatus for optional healthCheck() hook
- Keep utilities minimal in MVP - expand based on plugin developer feedback

### Logger Interface Explanation
```typescript
interface Logger {
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
  debug(message: string, context?: object): void;
}
```

- Aligns with Winston logger methods
- Context object for structured logging
- Plugin receives logger via PluginContext.logger
- Prevents direct Winston dependency in plugins

### ErrorResponse Interface
```typescript
interface ErrorResponse {
  code: string;          // "VALIDATION_ERROR", "PLUGIN_LOAD_ERROR"
  message: string;       // Human-readable description
  details?: object;      // Additional context (field names, etc.)
}
```

### HealthStatus Interface
```typescript
interface HealthStatus {
  healthy: boolean;      // Overall health status
  timestamp: number;     // Unix timestamp
  details?: object;      // Health check details
}
```

### Testing Standards
- Test interface implementations compile
- Verify types are correctly exported
- Test usage in plugin context

### Dependencies
- **Prerequisites:** Story 2.7 (Holo types)
- **Blocks:** Story 2.9 (publishing needs all types complete)
- **Related FRs:** FR6 (shared utility types), FR72 (error handling)

### References
- [Source: docs/epics.md#Story-2.8]
- [FR6: Shared Utility Types]
- [FR72: Clear Error Messages]

---

## Dev Agent Record

### Context Reference
<!-- Story context XML path will be added here by context workflow -->

### Completion Notes
**Completed: 2025-12-01**

All acceptance criteria met:
- ✅ Logger interface defined with info(), warn(), error(), debug() methods
- ✅ ErrorResponse interface defined with code, message, details? fields
- ✅ HealthStatus interface defined with healthy, timestamp, details? fields
- ✅ Comprehensive JSDoc documentation added for all interfaces
- ✅ Additional Result<T,E> and AsyncResult<T,E> utility types added as enhancements
- ✅ All types exported via /utils subpath export
- ✅ Tests created and passing (10 tests, all green)
- ✅ TypeScript compilation successful

### File List
- `packages/common/src/utils/types.ts` - Main utility types definitions with JSDoc
- `packages/common/src/utils/index.ts` - Barrel export for utility types
- `tests/unit/common/utils/types.test.ts` - Comprehensive test suite for all utility types (following project test conventions)

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
- Utility type definitions
