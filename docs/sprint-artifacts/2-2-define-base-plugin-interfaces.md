# Story 2.2: Define Base Plugin Interfaces

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.2
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **base plugin interfaces (IPlugin) with lifecycle hooks**,
So that **I can implement plugins that integrate with Holo's plugin system**.

## Acceptance Criteria

**Given** Common SDK package structure exists
**When** I define base plugin interfaces
**Then** src/plugin/interfaces.ts exports IPlugin interface
**And** IPlugin includes: manifest (PluginManifest), initialize(context), destroy()
**And** IPlugin includes optional: onConfigUpdate(config), healthCheck()
**And** src/plugin/types.ts exports PluginContext interface
**And** PluginContext includes: logger, registryService, configQueue
**And** src/plugin/types.ts exports PluginType enum: provider, guard, evaluator, logger, worker
**And** all interfaces are documented with JSDoc comments
**And** TypeScript strict mode validates interface contracts
**And** interfaces compile without errors

## Tasks / Subtasks

### Define IPlugin Interface
- [ ] Create IPlugin interface in src/plugin/interfaces.ts (AC: Then)
  - [ ] Add manifest property of type PluginManifest
  - [ ] Add initialize(context: PluginContext): Promise<void> method
  - [ ] Add destroy(): Promise<void> method
- [ ] Add optional lifecycle hooks (AC: And 2)
  - [ ] Add onConfigUpdate?(config: unknown): Promise<void>
  - [ ] Add healthCheck?(): Promise<HealthStatus>
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Document IPlugin interface purpose
  - [ ] Document each required method
  - [ ] Document optional hooks with usage examples
  - [ ] Include implementation examples

### Define PluginContext Interface
- [ ] Create PluginContext interface in src/plugin/types.ts (AC: And 3)
  - [ ] Add logger property (Logger interface from utils)
  - [ ] Add registryService property
  - [ ] Add configQueue property
  - [ ] Document what each property provides
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Explain DI pattern for plugin initialization
  - [ ] Show how to use injected dependencies

### Define PluginType Enum
- [ ] Create PluginType enum in src/plugin/types.ts (AC: And 4)
  - [ ] Add 'provider' type
  - [ ] Add 'guard' type
  - [ ] Add 'evaluator' type
  - [ ] Add 'logger' type
  - [ ] Add 'worker' type
- [ ] Add JSDoc documentation (AC: And 6)
  - [ ] Explain each plugin type purpose
  - [ ] Note which types are MVP vs future

### Define Supporting Types
- [ ] Create PluginManifest interface placeholder (AC: And 4)
  - [ ] Add basic structure (will be completed in Story 2.4)
  - [ ] Include name, version, pluginType fields
- [ ] Import/reference utility types
  - [ ] Reference Logger interface from utils namespace
  - [ ] Reference HealthStatus interface from utils namespace

### Update Barrel Exports
- [ ] Export from src/plugin/index.ts (AC: compilation)
  - [ ] Export IPlugin interface
  - [ ] Export PluginContext interface
  - [ ] Export PluginType enum
  - [ ] Export PluginManifest type

### Verify TypeScript Compilation
- [ ] Test strict mode compilation (AC: And 7)
  - [ ] Enable strict: true in tsconfig.json
  - [ ] Run tsc to verify no errors
  - [ ] Check all types are properly defined
- [ ] Verify interface contracts (AC: And 7)
  - [ ] Create test implementation class
  - [ ] Verify TypeScript enforces all required methods
  - [ ] Verify optional methods are truly optional

---

## Dev Notes

### Architecture Alignment
- IPlugin is the base contract ALL plugins must implement (FR2)
- initialize(context) provides DI for logger, registry access
- destroy() for cleanup (close connections, clear timers) - must be idempotent
- Optional hooks (onConfigUpdate, healthCheck) for advanced plugins
- PluginType enum matches Architecture: provider | guard | evaluator | logger | worker (FR3)

### Lifecycle Patterns
```typescript
interface IPlugin {
  readonly manifest: PluginManifest;

  // Required lifecycle hooks
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;

  // Optional lifecycle hooks
  onConfigUpdate?(config: unknown): Promise<void>;
  healthCheck?(): Promise<HealthStatus>;
}
```

### Implementation Guidelines
- Per CLAUDE.md: No comments unless code is not self-explanatory
- Interfaces need JSDoc documentation (they define contracts)
- initialize() must be idempotent (safe to call multiple times)
- destroy() must be idempotent and handle cleanup gracefully
- Context provides all dependencies - no global state

### Testing Standards
- Create sample implementation in tests to verify contract
- Verify TypeScript catches missing required methods
- Test that optional methods are truly optional

### Dependencies
- **Prerequisites:** Story 2.1 (package structure)
- **Blocks:** Story 2.3 (type-specific interfaces extend IPlugin)
- **Related FRs:** FR2 (IPlugin interface), FR3 (PluginType enum)

### References
- [Source: docs/epics.md#Story-2.2]
- [Source: docs/architecture.md#Initialization-Patterns]
- [FR2: Base Plugin Interface]
- [FR3: Plugin Type Enum]

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
- Core plugin contract definition
