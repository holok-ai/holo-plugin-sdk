# Story 2-3: Define Type-Specific Plugin Interfaces

**Epic:** Epic 2 - Common SDK Package (@holokai/common)
**Story Type (DoD Level):** API/Backend
**Story Points:** 3
**Owner:** Architect
**Status:** in-progress
**Created:** 2025-11-24
**Updated:** 2025-11-24
**Started:** 2025-11-24
**Sprint:** 1

---

## Description

As a **plugin developer**,
I want **type-specific plugin interfaces (IProviderPlugin, IGuardPlugin, etc.)**,
So that **I know exactly what methods to implement for each plugin type**.

This story extends the base IPlugin interface to create specialized interfaces for each plugin type: provider, guard, evaluator, logger, and worker. Each interface adds type-specific methods and properties that define the unique capabilities of that plugin type.

---

## Acceptance Criteria

- [x] IProviderPlugin interface extending IPlugin with provider-specific methods
- [x] IGuardPlugin interface for request/response validation and security
- [x] IEvaluatorPlugin interface for LLM output evaluation
- [x] ILoggerPlugin interface for custom logging backends
- [x] IWorkerPlugin interface for background processing
- [x] Type-specific configuration interfaces for each plugin type
- [x] Capability declaration interfaces for each type
- [x] JSDoc documentation explaining each plugin type's purpose
- [x] Usage examples for each interface
- [x] Interfaces compile without errors

---

## Technical Approach

### Type-Specific Interfaces

1. **IProviderPlugin** - LLM provider integration
   - `createProvider(config: ProviderConfig): Promise<unknown>`
   - `validateConfig(config: ProviderConfig): Promise<boolean>`
   - `getCapabilities(): ProviderCapabilities`
   - `getSupportedModels(): string[]`

2. **IGuardPlugin** - Security and validation
   - `validateRequest(request: unknown): Promise<GuardResult>`
   - `validateResponse(response: unknown): Promise<GuardResult>`
   - `getGuardType(): GuardType`
   - `getRules(): GuardRule[]`

3. **IEvaluatorPlugin** - Output evaluation
   - `evaluate(input: unknown, output: unknown): Promise<EvaluationResult>`
   - `getMetrics(): EvaluationMetric[]`
   - `configure(config: EvaluatorConfig): Promise<void>`

4. **ILoggerPlugin** - Logging backends
   - `log(entry: LogEntry): Promise<void>`
   - `query(filter: LogFilter): Promise<LogEntry[]>`
   - `flush(): Promise<void>`

5. **IWorkerPlugin** - Background processing
   - `process(task: WorkerTask): Promise<WorkerResult>`
   - `getQueueStatus(): QueueStatus`
   - `cancelTask(taskId: string): Promise<boolean>`

### Key Considerations

- Each interface extends IPlugin for common functionality
- Type-specific methods are required, not optional
- Configuration types are specific to each plugin type
- Return types use Promises for async operations
- Clear separation of concerns between types

---

## Definition of Done Checklist (Story-Level)

### 1. Technical Readiness ✅

- [x] Build passes (`npm run build` in packages/common)
- [x] Type checking passes (`npx tsc --noEmit`)
- [x] Linting passes (`npm run lint`)
- [x] All existing tests pass
- [ ] New tests added for interfaces (deferred to Story 2.5)

### 2. Functional Completeness ✅

- [x] All acceptance criteria met
- [x] All five plugin types have interfaces
- [x] Supporting types defined (capabilities, configs, results)
- [x] Clear purpose for each plugin type

### 3. Architectural Quality ✅

- [x] Interface segregation maintained
- [x] No unnecessary dependencies
- [x] Extensible for future plugin types
- [x] Type safety ensured

### 4. Code Quality ✅

- [x] Clear naming conventions
- [x] Comprehensive JSDoc comments
- [x] Usage examples provided
- [x] No use of `any` type

### 5. Git & Documentation ✅

- [x] Branch: `feature/monorepo-plugins`
- [ ] Commits follow conventional format (ready to commit)
- [x] Interface documentation complete
- [x] Plugin type guide created

### 6. Environment & Deployment ✅

- [x] Package exports updated
- [x] Version compatibility maintained
- [x] No breaking changes to Story 2.2 work

---

## Documentation Requirements

### Documentation Triggers

- [x] **API Change** → Interface documentation
- [x] **New Feature** → Plugin type guide

### Required Documentation Updates

- [ ] JSDoc for all type-specific interfaces
- [ ] Usage examples for each plugin type
- [ ] README section on plugin types
- [ ] Migration guide for existing providers

---

## Test Plan

### Unit Tests

- [ ] Mock implementations for each plugin type
- [ ] Type checking validation
- [ ] Interface extension tests

### Integration Tests

- [ ] Plugin type detection
- [ ] Configuration validation per type
- [ ] Capability reporting

### Manual Testing

- [ ] Create sample plugins of each type
- [ ] Verify TypeScript compilation
- [ ] Test intellisense/autocomplete

---

## Dependencies

- **Depends On:**
  - Story 2.2 (Base plugin interfaces) - COMPLETE
- **Blocks:**
  - Story 2.5 (ArkType validators)
  - Story 4.2 (Provider plugin implementation)

---

## Notes

- Provider type is most critical for MVP
- Guard and Worker types are for future extensibility
- Consider marketplace requirements for capabilities
- Ensure compatibility with existing provider system

---

## Implementation Log

### 2025-11-24 – Status Change: drafted → in-progress

- Development started by Architect
- Branch: `feature/monorepo-plugins`

### 2025-11-24 – Implementation Complete

- Created IProviderPlugin interface for LLM provider integrations
- Created IGuardPlugin interface for request/response validation
- Created IEvaluatorPlugin interface for output evaluation
- Created ILoggerPlugin interface for custom logging backends
- Created IWorkerPlugin interface for background processing
- All interfaces extend base IPlugin for consistency
- Comprehensive JSDoc with usage examples
- Build and lint passing

---

## Retrospective Notes

[To be completed after story completion]
