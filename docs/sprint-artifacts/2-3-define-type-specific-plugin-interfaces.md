# Story 2.3: Define Type-Specific Plugin Interfaces

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.3
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **type-specific plugin interfaces (IProviderPlugin, IGuardPlugin, etc.)**,
So that **I know exactly what methods to implement for each plugin type**.

## Acceptance Criteria

**Given** base plugin interfaces are defined
**When** I create type-specific interfaces
**Then** src/plugin/interfaces.ts exports IProviderPlugin extends IPlugin
**And** IProviderPlugin adds: createProvider(config), validateConfig(config), getCapabilities()
**And** src/plugin/interfaces.ts exports IGuardPlugin extends IPlugin
**And** IGuardPlugin adds: guard(request), shouldBlock(request)
**And** src/plugin/interfaces.ts exports IWorkerPlugin extends IPlugin
**And** IWorkerPlugin adds: process(job), canHandle(jobType)
**And** each interface includes JSDoc with usage examples
**And** TypeScript enforces method signatures at compile time
**And** Architecture ADR-006 type-specific registries align with these interfaces

## Tasks / Subtasks

### Define IProviderPlugin Interface
- [ ] Create IProviderPlugin interface (AC: Then, And 1)
  - [ ] Extend IPlugin base interface
  - [ ] Add createProvider(config: ProviderConfig): AIProvider method
  - [ ] Add validateConfig(config: unknown): boolean method
  - [ ] Add getCapabilities(): ProviderCapabilities method
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Document IProviderPlugin purpose
  - [ ] Explain createProvider factory pattern
  - [ ] Explain validateConfig usage
  - [ ] Explain getCapabilities declaration
  - [ ] Include code examples

### Define IGuardPlugin Interface
- [ ] Create IGuardPlugin interface (AC: And 2, 3)
  - [ ] Extend IPlugin base interface
  - [ ] Add guard(request: unknown): Promise<GuardResult> method
  - [ ] Add shouldBlock(request: unknown): Promise<boolean> method
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Document IGuardPlugin purpose
  - [ ] Explain guard evaluation pattern
  - [ ] Note this is future-ready (Phase 2+)

### Define IWorkerPlugin Interface
- [ ] Create IWorkerPlugin interface (AC: And 4, 5)
  - [ ] Extend IPlugin base interface
  - [ ] Add process(job: unknown): Promise<unknown> method
  - [ ] Add canHandle(jobType: string): boolean method
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Document IWorkerPlugin purpose
  - [ ] Explain job processing pattern
  - [ ] Note this is future-ready (Phase 2+)

### Define Supporting Types
- [ ] Create ProviderConfig type reference
  - [ ] Import from provider namespace (will be defined in Story 2.6)
  - [ ] Add placeholder if not yet defined
- [ ] Create ProviderCapabilities type reference
  - [ ] Import from provider namespace (will be defined in Story 2.6)
  - [ ] Add placeholder if not yet defined
- [ ] Create GuardResult type placeholder
  - [ ] Define basic structure for future use
- [ ] Reference AIProvider interface
  - [ ] Note it exists in core Holo (backward compatibility)

### Update Barrel Exports
- [ ] Export from src/plugin/index.ts
  - [ ] Export IProviderPlugin interface
  - [ ] Export IGuardPlugin interface
  - [ ] Export IWorkerPlugin interface

### Verify TypeScript Compilation
- [ ] Test interface contracts (AC: And 7)
  - [ ] Create sample IProviderPlugin implementation
  - [ ] Verify TypeScript enforces all methods
  - [ ] Verify method signatures are correct
- [ ] Test discriminated unions (AC: And 7)
  - [ ] Verify manifest.pluginType narrows interface type
  - [ ] Test type guards work correctly

---

## Dev Notes

### Architecture Alignment
- IProviderPlugin is critical for MVP (FR4, FR30-31)
- IGuardPlugin and IWorkerPlugin are future-ready (Phase 2+) but defined now (FR88)
- Discriminated unions via extends IPlugin (manifest.pluginType narrows type)
- Architecture specifies type-specific registries need specialized interfaces

### IProviderPlugin Methods
```typescript
interface IProviderPlugin extends IPlugin {
  // Factory method - returns provider instance
  createProvider(config: ProviderConfig): AIProvider;

  // Validation - checks config before creating provider
  validateConfig(config: unknown): boolean;

  // Capabilities declaration - what features this provider supports
  getCapabilities(): ProviderCapabilities;
}
```

### Method Signatures Explained
- **createProvider(config):** Returns NEW AIProvider instance (not singleton)
- **validateConfig(config):** Returns boolean, logs errors internally (doesn't throw)
- **getCapabilities():** Returns cached capabilities (streaming, tools, vision, etc.)

### Testing Standards
- Create test implementations for each interface
- Verify TypeScript enforces all required methods
- Test that interfaces extend IPlugin correctly
- Architecture ADR-007: Hybrid testing strategy

### Dependencies
- **Prerequisites:** Story 2.2 (base interfaces)
- **Blocks:** Story 2.5 (validators need interface definitions)
- **Related FRs:** FR4 (type-specific interfaces), FR30-31 (IProviderPlugin methods), FR88 (future-ready design)

### References
- [Source: docs/epics.md#Story-2.3]
- [Source: docs/architecture.md#ADR-006-Type-Specific-Registries]
- [FR4: Type-Specific Plugin Interfaces]
- [FR30-31: Provider Plugin Methods]

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
- Type-specific plugin contracts
