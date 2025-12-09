# Epic Technical Specification: Core Plugin Infrastructure

Date: 2025-12-02
Author: BMad
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 establishes the **core plugin infrastructure** that enables Holo's transformation from a monolithic gateway to a modular platform. This epic implements the foundational services for plugin discovery, loading, validation, and registration that all future plugin types will depend on.

The plugin system is built on a **hybrid discovery approach** (static package.json parsing + chokidar file watching) that supports both fast startup and hot-reload capabilities. It implements **graceful degradation** patterns where plugin failures never crash the platform, enabling production resilience while maintaining development agility.

This infrastructure serves as the **foundation for IP protection** - by separating core Holo engine code from extension points, it enables outside developers and custom development work to extend the platform through plugins without accessing proprietary queue architecture or universal format translation logic.

## Objectives and Scope

### In Scope

- **Plugin Discovery Service** (Story 3.1): Scan node_modules/@holokai/* for installed plugins, parse package.json metadata
- **Plugin Loader Service** (Story 3.2): Dynamic import(), contract validation, graceful degradation for load failures
- **Generic Plugin Registry** (Story 3.3): Route plugins to type-specific registries, call plugin.initialize()
- **Provider Plugin Registry** (Story 3.4): O(1) lookup by providerType, atomic replace for hot-reload
- **Future-Ready Registries** (Story 3.5): Implement GuardPluginRegistry and WorkerPluginRegistry structures (unused in MVP)
- **Plugin Cache Service** (Story 3.6): In-memory cache for plugin metadata from configuration queue
- **Plugin Lifecycle Events** (Story 3.7): EventEmitter for plugin:loaded, plugin:failed, registry:updated events

### Out of Scope

- **Provider-specific logic**: Epic 4 (Provider Plugin Framework)
- **Hot-reload implementation**: Epic 5 (Hot-Reload System with chokidar)
- **Worker integration**: Epic 7 (Worker Integration & Legacy Coexistence)
- **OpenAI plugin conversion**: Epic 6 (OpenAI Reference Plugin)
- **Database schema for plugin metadata**: Future enhancement (NFR20, NFR28 specify no PostgreSQL dependency in MVP)
- **Plugin sandboxing/security isolation**: Post-MVP (NFR7 specifies same-process execution in MVP)

## System Architecture Alignment

Epic 3 implements the **core infrastructure layer** specified in the Plugin System Architecture document:

### Architectural Decisions Implemented

- **ADR-005: Graceful Degradation** - Plugin loader logs failures and skips broken plugins without crashing (FR15-16, FR46)
- **Hybrid Discovery** (ADR-003 foundation) - Static package.json parsing provides fast startup, file watching support added in Epic 5
- **Type-Specific Registries** - ProviderPluginRegistry uses specialized lookup methods (getByProviderType) vs generic IPlugin returns
- **Strategy Pattern Foundation** - Registry routing by pluginType enables clean separation for Epic 7 worker integration

### Component Alignment

| Architecture Component | Epic 3 Implementation | Location |
|------------------------|----------------------|----------|
| Plugin Discovery | PluginDiscoveryService (hybrid approach) | src/services/plugin/discovery.service.ts |
| Plugin Loading | PluginLoaderService (dynamic import + validation) | src/services/plugin/loader.service.ts |
| Plugin Registry (Generic) | PluginRegistryService (routing) | src/services/plugin/registry.service.ts |
| Provider Registry | ProviderPluginRegistry (O(1) lookup) | src/services/plugin/provider-registry.service.ts |
| Plugin Cache | PluginCacheService (in-memory metadata) | src/services/plugin/cache.service.ts |

### Integration Points

- **tsyringe DI**: All services use @injectable() decorator for dependency injection consistency
- **EventEmitter**: Plugin lifecycle events enable decoupled monitoring (foundation for Epic 5 hot-reload coordination)
- **Common SDK**: Validates plugins against @holokai/common contracts (PluginManifest, IPlugin, IProviderPlugin)
- **Configuration Queue**: Plugin metadata cached from existing queue infrastructure (no new dependencies)

## Detailed Design

### Services and Modules

| Service | Responsibility | Inputs | Outputs | Owner |
|---------|---------------|--------|---------|-------|
| **PluginDiscoveryService** | Scan node_modules/@holokai/* and parse package.json metadata | node_modules directory path | DiscoveredPlugin[] | Story 3.1 |
| **PluginLoaderService** | Dynamic import, validation, emit lifecycle events | DiscoveredPlugin[] | LoadedPlugin[] (IPlugin instances) | Story 3.2 |
| **PluginRegistryService** | Route plugins to type-specific registries, call initialize() | IPlugin instances | void (registers in memory) | Story 3.3 |
| **ProviderPluginRegistry** | Store/lookup provider plugins by providerType (O(1)) | IProviderPlugin | IProviderPlugin or null | Story 3.4 |
| **GuardPluginRegistry** | Store/lookup guard plugins by name (future-ready) | IGuardPlugin | IGuardPlugin or null | Story 3.5 |
| **WorkerPluginRegistry** | Store/lookup worker plugins by type (future-ready) | IWorkerPlugin | IWorkerPlugin or null | Story 3.5 |
| **PluginCacheService** | In-memory cache for plugin metadata from config queue | PluginMetadata messages | PluginMetadata or undefined | Story 3.6 |

**Dependency Injection Setup:**
```typescript
// All services injectable via tsyringe
@injectable()
export class PluginDiscoveryService extends ClassLogger { ... }

@injectable()
export class PluginLoaderService extends EventEmitter { ... }

@injectable()
export class PluginRegistryService {
  constructor(
    private readonly providerRegistry: ProviderPluginRegistry,
    private readonly guardRegistry: GuardPluginRegistry,
    private readonly workerRegistry: WorkerPluginRegistry
  ) {}
}
```

### Data Models and Contracts

**DiscoveredPlugin** (Story 3.1 Output)
```typescript
interface DiscoveredPlugin {
  packageName: string;      // e.g., "@holokai/provider-openai"
  version: string;          // e.g., "1.0.0"
  entryPoint: string;       // package.json "main" field
  pluginType: PluginType;   // inferred from package name pattern
  packagePath: string;      // absolute path to package directory
}
```

**IPlugin** (from @holokai/common, validated in Story 3.2)
```typescript
interface IPlugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
}

interface PluginManifest {
  name: string;
  version: string;
  pluginType: PluginType;
  description?: string;
  author?: string;
  license?: string;
  commonSdkVersion: string;  // semver range
  capabilities?: PluginCapabilities;
}
```

**IProviderPlugin** (from @holokai/common, used in Story 3.4)
```typescript
interface IProviderPlugin extends IPlugin {
  manifest: ProviderPluginManifest;
  createProvider(config: ProviderConfig): IProvider;
}

interface ProviderPluginManifest extends PluginManifest {
  pluginType: 'provider';
  providerType: string;        // e.g., "openai", "claude"
  sdkVersion: string;          // bundled SDK version
  capabilities: ProviderCapabilities;
}
```

**PluginMetadata** (Story 3.6 Cache)
```typescript
interface PluginMetadata {
  name: string;
  version: string;
  pluginType: PluginType;
  providerType?: string;       // for provider plugins
  capabilities?: Record<string, any>;
  source?: 'official' | 'community' | 'marketplace';  // future-ready
}
```

**IPluginRegistry<T>** (Generic Interface)
```typescript
interface IPluginRegistry<T extends IPlugin> {
  registerPlugin(plugin: T): void;
  unregisterPlugin(id: string): void;
  listPlugins(): T[];
  atomicReplace?(id: string, newPlugin: T): Promise<T | null>;
}
```

### APIs and Interfaces

**PluginDiscoveryService API** (Story 3.1)
```typescript
class PluginDiscoveryService {
  /**
   * Discover all plugins in node_modules/@holokai/*
   * @returns Array of discovered plugin metadata
   * @throws Never - returns empty array if node_modules missing
   */
  async discoverPlugins(): Promise<DiscoveredPlugin[]>;

  /**
   * Discover plugins of a specific type
   * @param pluginType - Filter by plugin type
   */
  async discoverPluginsByType(pluginType: PluginType): Promise<DiscoveredPlugin[]>;
}
```

**PluginLoaderService API** (Story 3.2)
```typescript
class PluginLoaderService extends EventEmitter {
  /**
   * Load and validate a single plugin
   * @emits 'plugin:loaded' on success
   * @emits 'plugin:failed' on failure
   * @returns Loaded plugin or null if failed
   */
  async loadPlugin(discovered: DiscoveredPlugin): Promise<IPlugin | null>;

  /**
   * Load multiple plugins with graceful degradation
   * @returns Successfully loaded plugins only
   */
  async loadPlugins(discovered: DiscoveredPlugin[]): Promise<IPlugin[]>;

  /**
   * Validate plugin manifest using ArkType
   * @throws ValidationError if manifest invalid
   */
  private validateManifest(manifest: unknown): PluginManifest;
}
```

**PluginRegistryService API** (Story 3.3)
```typescript
class PluginRegistryService {
  /**
   * Register plugin in appropriate type-specific registry
   * Calls plugin.initialize() before registration
   * @emits 'registry:updated' after successful registration
   */
  async registerPlugin(plugin: IPlugin): Promise<void>;

  /**
   * Get type-specific registry
   * @returns Type-specific registry instance
   */
  getRegistry<T extends IPlugin>(type: PluginType): IPluginRegistry<T>;
}
```

**ProviderPluginRegistry API** (Story 3.4)
```typescript
class ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin> {
  /**
   * Get provider plugin by providerType (O(1) lookup)
   * @param providerType - e.g., "openai", "claude"
   * @returns Plugin instance or null if not found
   */
  getByProviderType(providerType: string): IProviderPlugin | null;

  /**
   * Register provider plugin
   * @param plugin - Provider plugin instance
   */
  registerPlugin(plugin: IProviderPlugin): void;

  /**
   * Atomic replace for hot-reload (Epic 5)
   * @returns Old plugin instance or null
   */
  atomicReplace(providerType: string, newPlugin: IProviderPlugin): Promise<IProviderPlugin | null>;

  unregisterPlugin(providerType: string): void;
  listPlugins(): IProviderPlugin[];
}
```

**PluginCacheService API** (Story 3.6)
```typescript
class PluginCacheService {
  /**
   * Store plugin metadata in memory cache
   */
  set(name: string, metadata: PluginMetadata): void;

  /**
   * Retrieve plugin metadata
   * @returns Metadata or undefined if not cached
   */
  get(name: string): PluginMetadata | undefined;

  /**
   * Check if plugin metadata is cached
   */
  has(name: string): boolean;

  /**
   * Clear all cached metadata (testing only)
   */
  clear(): void;
}
```

### Workflows and Sequencing

**Plugin System Initialization Flow** (Worker Startup)
```
1. Worker Server starts
2. PluginDiscoveryService.discoverPlugins()
   → Scans node_modules/@holokai/*
   → Parses package.json files
   → Returns DiscoveredPlugin[]
3. PluginLoaderService.loadPlugins(discovered)
   → For each plugin:
     a. Dynamic import(packageName)
     b. Validate default export is IPlugin
     c. Validate manifest with ArkType
     d. Check commonSdkVersion compatibility
     e. Emit 'plugin:loaded' or 'plugin:failed'
   → Returns successfully loaded plugins only
4. For each loaded plugin:
   PluginRegistryService.registerPlugin(plugin)
   → Call plugin.initialize(context)
   → Route to type-specific registry by pluginType
   → ProviderPluginRegistry stores by providerType
5. Worker ready to accept requests
```

**Plugin Lookup Flow** (Worker Request Processing - Epic 7)
```
1. Worker receives provider config with plugin_id
2. Worker retrieves PluginRegistryService
3. Get ProviderPluginRegistry: registry.getRegistry<IProviderPlugin>('provider')
4. Lookup plugin: providerRegistry.getByProviderType(config.provider_type)
5. If plugin found:
   → plugin.createProvider(config)
6. If plugin not found:
   → Fall back to legacy provider (Epic 7)
```

**Plugin Metadata Cache Flow** (Configuration Queue Integration)
```
1. Central server sends plugin_metadata message via RabbitMQ
2. Worker ConfigurationQueue receives message
3. For each plugin in message.plugins:
   PluginCacheService.set(plugin.name, plugin)
4. Cache available for provider config references
```

**Graceful Degradation Flow** (Plugin Load Failure)
```
1. PluginLoaderService.loadPlugin() encounters error:
   - Import failure (module not found)
   - Invalid manifest (missing required fields)
   - SDK version incompatibility
2. Log error with context:
   logger.error('[Plugin] Failed to load @holokai/provider-x', { error, manifest })
3. Emit 'plugin:failed' event with packageName and error
4. Return null (do NOT throw)
5. Continue loading remaining plugins
6. Worker starts successfully with partial plugin set
```

## Non-Functional Requirements

### Performance

- **NFR1:** Plugin lookup must be O(1) - Map-based registry storage keyed by providerType
- **NFR2:** Plugin loading at startup must not add >5 seconds to worker initialization
  - Target: <2 seconds for 20 plugins
  - Implementation: Parallel plugin loading with Promise.all()
- **NFR3:** Hot-reload must detect/load plugins within 2 seconds (Epic 5)
- **NFR4:** Plugin-based provider latency must match legacy (±5ms acceptable)
- **NFR5:** Memory overhead per plugin ≤10MB
- **NFR6:** Support 20+ plugins without performance degradation
- **NFR17:** Registry memory scales linearly O(n) with plugin count

### Security

- **NFR7:** Plugins run in same process as worker (no sandboxing in MVP)
- **NFR8:** Plugin contracts must not expose internal Holo queue/orchestration code
  - IPlugin interface from @holokai/common only exposes extension points
  - Core src/ code remains private, packages/ code is public
- **NFR11:** Plugin discovery limited to @holokai/* scope (prevents arbitrary code execution)
  - PluginDiscoveryService only scans node_modules/@holokai/
  - No community namespace (*holo-provider-*) in MVP
- **NFR12:** Core Holo source code remains in private repository
- **NFR13:** Common SDK (@holokai/common) is open-source (MIT license)

### Reliability/Availability

- **FR15-16, FR46:** Graceful degradation - plugin failures never crash platform
  - PluginLoaderService logs failures and continues
  - Worker starts successfully even if all plugins fail to load
  - Partial plugin functionality preferred over total failure
- **NFR14:** Plugin system supports horizontal worker scaling (stateless registries)
- **NFR15:** Hot-reload works consistently across multiple worker instances (Epic 5)
- **ADR-005:** Graceful degradation is architectural principle
  - Return null for not found (not throw)
  - Skip broken plugins, continue with valid ones
  - Log all failures with actionable context

### Observability

- **Plugin Lifecycle Events** (Story 3.7):
  - `plugin:loaded` - Emitted after successful plugin load with plugin object
  - `plugin:failed` - Emitted after load failure with packageName and error
  - `plugin:initializing` - Emitted before plugin.initialize() call
  - `plugin:initialized` - Emitted after successful initialization
  - `registry:updated` - Emitted after plugin registration
- **Logging Requirements:**
  - All services extend ClassLogger for consistent logging
  - Plugin discovery: Log count and list of discovered plugins
  - Plugin loading: Log success/failure with package name and version
  - Registry operations: Log plugin type and identifier on register/lookup
  - Error context: Include packageName, manifest, error stack in failures
- **Metrics (Future):**
  - plugins.discovered (counter)
  - plugins.loaded (counter)
  - plugins.failed (counter)
  - plugin.load.duration (histogram)

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose | Epic 3 Usage |
|------------|---------|---------|--------------|
| **@holokai/common** | ^0.1.0 | Plugin contracts and types | Validate against IPlugin, IProviderPlugin, PluginManifest |
| **arktype** | ^2.1.22 | Runtime type validation | Validate plugin manifests (peer dependency) |
| **tsyringe** | ^4.8.0 | Dependency injection | @injectable() decorator for all services |
| **winston** | ^3.17.0 | Structured logging | ClassLogger base class for all services |
| **node:fs/promises** | Built-in | File system operations | Read package.json files in discovery |
| **node:path** | Built-in | Path manipulation | Resolve node_modules paths |
| **events** | Built-in | EventEmitter | Plugin lifecycle events (Story 3.7) |

### Integration Points

**With Epic 2 (@holokai/common):**
- Import IPlugin, IProviderPlugin, IGuardPlugin, IWorkerPlugin interfaces
- Import PluginManifest, ProviderPluginManifest types
- Use PluginType enum for routing
- Validate using pluginManifestValidator from Common SDK

**With Existing Holo Infrastructure:**
- **tsyringe DI**: Register all plugin services in container
- **ClassLogger**: Extend for consistent logging patterns
- **Configuration Queue**: Plugin cache receives metadata (Story 3.6)
- **Worker Server**: Initialize plugin system on startup (Epic 7 integration)

**Future Integration Points:**
- **Epic 4**: Provider plugins use these registries
- **Epic 5**: Hot-reload service uses discovery + loader services
- **Epic 6**: OpenAI plugin validates through loader service
- **Epic 7**: Workers use PluginRegistryService for provider lookup

### No New Infrastructure Dependencies

- No new databases (NFR20, NFR28)
- No new message queues (uses existing RabbitMQ)
- No new external services
- Compatible with existing Docker/Kubernetes deployment

## Acceptance Criteria (Authoritative)

### Story 3.1: Plugin Discovery Service

**AC-3.1.1:** Service scans node_modules/@holokai/* directories for installed plugins
**AC-3.1.2:** Service parses each package.json to extract name, version, main entry point
**AC-3.1.3:** Service identifies plugin type from package name pattern (provider-*, guard-*, etc.)
**AC-3.1.4:** Service returns list of discovered plugins with package metadata
**AC-3.1.5:** Service logs discovery results: "Found 3 plugins: @holokai/provider-openai, ..."
**AC-3.1.6:** Service handles missing node_modules gracefully (returns empty list)
**AC-3.1.7:** Service is implemented in src/services/plugin/discovery.service.ts
**AC-3.1.8:** Service uses @injectable() decorator for tsyringe DI

### Story 3.2: Plugin Loader Service

**AC-3.2.1:** Service uses dynamic import() for each discovered plugin
**AC-3.2.2:** Service validates plugin default export is an object
**AC-3.2.3:** Service validates plugin has manifest property
**AC-3.2.4:** Service validates manifest using pluginManifestValidator (ArkType)
**AC-3.2.5:** Service rejects plugins with incompatible commonSdkVersion
**AC-3.2.6:** Service logs load success: "[Plugin] Loaded @holokai/provider-openai v1.0.0"
**AC-3.2.7:** Service logs load failure without throwing: "[Plugin] Failed to load X: reason"
**AC-3.2.8:** Service skips failed plugins and continues with remaining (graceful degradation)
**AC-3.2.9:** Service emits 'plugin:loaded' event for successful loads
**AC-3.2.10:** Service emits 'plugin:failed' event with error details

### Story 3.3: Generic Plugin Registry Service

**AC-3.3.1:** Service maintains a Map of type-specific registries (provider → ProviderPluginRegistry)
**AC-3.3.2:** Service implements registerPlugin(plugin) that routes by plugin.manifest.pluginType
**AC-3.3.3:** Service calls plugin.initialize(context) before registering
**AC-3.3.4:** Service routes provider plugins to ProviderPluginRegistry
**AC-3.3.5:** Service routes guard plugins to GuardPluginRegistry (if exists)
**AC-3.3.6:** Service provides getRegistry<T>(type: PluginType): IPluginRegistry<T>
**AC-3.3.7:** Service logs registration: "[Registry] Registered provider plugin: openai"
**AC-3.3.8:** Service handles initialize() failures gracefully (skip plugin, log error)
**AC-3.3.9:** Service is injectable via tsyringe

### Story 3.4: Provider Plugin Registry

**AC-3.4.1:** Registry stores plugin in Map keyed by providerType (not package name)
**AC-3.4.2:** Registry implements IPluginRegistry<IProviderPlugin> interface
**AC-3.4.3:** Registry provides registerPlugin(plugin: IProviderPlugin)
**AC-3.4.4:** Registry provides getByProviderType(type: string): IProviderPlugin | null
**AC-3.4.5:** Registry provides unregisterPlugin(providerType: string)
**AC-3.4.6:** Registry provides listPlugins(): IProviderPlugin[]
**AC-3.4.7:** Registry provides atomicReplace(type, newPlugin) for hot-reload
**AC-3.4.8:** getByProviderType returns null for not found (not throw)
**AC-3.4.9:** O(1) lookup performance via Map (NFR1)

### Story 3.5: Future-Ready Plugin Registries

**AC-3.5.1:** GuardPluginRegistry implements IPluginRegistry<IGuardPlugin>
**AC-3.5.2:** GuardPluginRegistry stores plugins by guard name
**AC-3.5.3:** GuardPluginRegistry provides getByName(name: string): IGuardPlugin | null
**AC-3.5.4:** WorkerPluginRegistry implements IPluginRegistry<IWorkerPlugin>
**AC-3.5.5:** WorkerPluginRegistry stores plugins by worker type
**AC-3.5.6:** WorkerPluginRegistry provides getByType(type: string): IWorkerPlugin | null
**AC-3.5.7:** All registries share common IPluginRegistry interface
**AC-3.5.8:** Generic registry routes guard/worker plugins to correct registries
**AC-3.5.9:** Registries are implemented but unused in MVP (Phase 2+)

### Story 3.6: Plugin Cache Service

**AC-3.6.1:** Service stores plugin metadata in Map<string, PluginMetadata>
**AC-3.6.2:** Service provides set(name: string, metadata: PluginMetadata)
**AC-3.6.3:** Service provides get(name: string): PluginMetadata | undefined
**AC-3.6.4:** Service provides has(name: string): boolean
**AC-3.6.5:** Service provides clear() for testing
**AC-3.6.6:** PluginMetadata includes: name, version, pluginType, providerType, capabilities
**AC-3.6.7:** Cache is in-memory only (no persistence in MVP)
**AC-3.6.8:** Service is injectable via tsyringe

### Story 3.7: Plugin Lifecycle Events

**AC-3.7.1:** PluginLoaderService extends EventEmitter
**AC-3.7.2:** Service emits 'plugin:loaded' with plugin object after successful load
**AC-3.7.3:** Service emits 'plugin:failed' with packageName and error after load failure
**AC-3.7.4:** Service emits 'plugin:initializing' with plugin before initialize()
**AC-3.7.5:** Service emits 'plugin:initialized' with plugin after initialize() succeeds
**AC-3.7.6:** PluginRegistryService emits 'registry:updated' after plugin registration
**AC-3.7.7:** Events include typed parameters: EventEmitter<PluginLifecycleEvents>
**AC-3.7.8:** Event handlers MUST NOT throw (fire-and-forget pattern)
**AC-3.7.9:** Architecture consistency rules for event naming: {domain}:{action}

## Traceability Mapping

| AC ID | PRD FR/NFR | Component | Test Approach |
|-------|------------|-----------|---------------|
| AC-3.1.1 - AC-3.1.8 | FR10-17 | PluginDiscoveryService | Unit: Mock fs.readdir, verify package.json parsing |
| AC-3.2.1 - AC-3.2.10 | FR11-16, NFR7 | PluginLoaderService | Unit: Mock dynamic import, verify validation; Integration: Load real test plugin |
| AC-3.3.1 - AC-3.3.9 | FR24-26 | PluginRegistryService | Unit: Verify routing logic, initialize() calls |
| AC-3.4.1 - AC-3.4.9 | FR27-29, NFR1 | ProviderPluginRegistry | Unit: Verify Map operations, O(1) lookup; Integration: Load + lookup real plugin |
| AC-3.5.1 - AC-3.5.9 | FR88-90 | Guard/WorkerPluginRegistry | Unit: Verify interface compliance, structure only (unused in MVP) |
| AC-3.6.1 - AC-3.6.8 | FR47-49, NFR20 | PluginCacheService | Unit: Verify Map operations, no persistence |
| AC-3.7.1 - AC-3.7.9 | FR17 | EventEmitter integration | Unit: Verify events emitted with correct payloads |

**FR Coverage:**
- FR10-17: Plugin discovery and loading ✓
- FR24-29: Plugin registries ✓
- FR47-49: Plugin cache ✓
- FR87-90: Future-ready design ✓

**NFR Coverage:**
- NFR1: O(1) lookup via Map ✓
- NFR2: <5s startup overhead ✓
- NFR7: Same-process execution ✓
- NFR14-15: Stateless, horizontally scalable ✓
- NFR20: No PostgreSQL dependency ✓

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Plugin Discovery Performance on Large node_modules** (Low probability, Medium impact)
- **Description:** Scanning node_modules with thousands of packages could slow startup
- **Mitigation:** Only scan @holokai/* namespace (limited scope), parallel file reads
- **Residual Risk:** First startup may be slower, but acceptable for worker initialization

**RISK-2: Dynamic Import() Module Resolution** (Low probability, High impact)
- **Description:** Dynamic import() may fail with ESM/CJS interop issues
- **Mitigation:** Common SDK and all plugins use ESM ("type": "module"), test early in Epic 6
- **Residual Risk:** Community plugins might not follow conventions (Phase 2 concern)

**RISK-3: Event Listener Memory Leaks** (Medium probability, Medium impact)
- **Description:** Unremoved event listeners could cause memory leaks over time
- **Mitigation:** Document proper listener cleanup, test hot-reload cycles in Epic 5
- **Residual Risk:** Plugin developers might not clean up listeners (Epic 8 documentation)

**RISK-4: Epic Dependencies** (Medium probability, High impact)
- **Description:** Epic 3 infrastructure useless without Epic 6 (OpenAI plugin) validation
- **Mitigation:** Implement Epic 3 services with clear contracts, validate with test plugin in Story 3.2
- **Residual Risk:** May discover interface gaps when implementing real plugin in Epic 6

### Assumptions

**ASSUMPTION-1:** @holokai/common package is published and accessible via npm (Epic 2 complete)
**ASSUMPTION-2:** Plugins follow naming convention @holokai/{type}-{name} (enforced by discovery)
**ASSUMPTION-3:** Node.js dynamic import() works reliably for ESM packages
**ASSUMPTION-4:** tsyringe DI container is initialized before plugin system startup
**ASSUMPTION-5:** Workers have read access to node_modules directory
**ASSUMPTION-6:** Plugin manifests are valid JSON (parse errors caught gracefully)

### Open Questions

**QUESTION-1:** Should PluginContext passed to initialize() include logger instance?
- **Impact:** Affects IPlugin interface design (Epic 2)
- **Decision Needed:** Before Story 3.3 implementation
- **Recommendation:** Yes - include logger for consistent plugin logging

**QUESTION-2:** Should plugin cache support TTL or expiration?
- **Impact:** Memory management for long-running workers
- **Decision Needed:** Before Story 3.6 implementation
- **Recommendation:** No TTL in MVP (simple Map), add in Phase 2 if needed

**QUESTION-3:** Should registry provide bulk registration API?
- **Impact:** Performance optimization for startup
- **Decision Needed:** Before Story 3.3 implementation
- **Recommendation:** No - registerPlugin() called per plugin is sufficient, parallel loading handles performance

## Test Strategy Summary

### Unit Testing (Primary Focus)

**PluginDiscoveryService:**
- Mock fs.readdir() to return test package paths
- Mock fs.readFile() to return test package.json content
- Verify plugin type inference from package names
- Test graceful handling of missing node_modules
- Test graceful handling of malformed package.json

**PluginLoaderService:**
- Mock dynamic import() to return test plugin objects
- Verify manifest validation with valid and invalid manifests
- Verify SDK version compatibility checking
- Test graceful degradation (continue after failures)
- Verify event emission (plugin:loaded, plugin:failed)

**PluginRegistryService:**
- Verify routing to correct type-specific registry
- Mock plugin.initialize() to test error handling
- Verify registry:updated events
- Test with multiple plugin types

**ProviderPluginRegistry:**
- Verify Map operations (register, lookup, unregister)
- Test O(1) lookup performance
- Verify null return for not found (not throw)
- Test atomicReplace for hot-reload foundation

**PluginCacheService:**
- Verify Map operations (get, set, has, clear)
- Test with various metadata shapes
- Verify no persistence (in-memory only)

### Integration Testing (Limited Scope)

**End-to-End Plugin Loading:**
- Create simple test plugin package in fixtures/
- Discover → Load → Register → Lookup flow
- Verify real plugin.initialize() called
- Verify plugin accessible via registry

**Event Integration:**
- Verify events propagate through full loading cycle
- Test event listener attachment and cleanup

### Test Frameworks

- **Jest** for unit and integration tests
- **ts-jest** for TypeScript support
- **Test fixtures** in tests/fixtures/test-plugin/

### Coverage Targets

- Unit test coverage: >80% for all services
- Integration test coverage: Core flows validated
- Edge cases: Graceful degradation scenarios tested

### Test Execution

```bash
npm test -- tests/unit/services/plugin/
npm test -- tests/integration/plugin-system/
```

### Epic 6 Validation

Epic 3 infrastructure will be fully validated when Epic 6 implements real OpenAI plugin. Unit tests prove individual components work; Epic 6 proves the system works end-to-end.
