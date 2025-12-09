# Holo Plugin System Architecture

**Project:** Holo LLM Gateway - Plugin System Modularization
**Date:** 2025-11-20
**Author:** Architecture Workflow (BMad Method)
**Status:** Decision Architecture - Implementation Ready

---

## Executive Summary

This architecture transforms Holo from a monolithic LLM gateway into a modular platform with a protected core and open plugin ecosystem. The plugin system enables hot-loadable provider plugins, IP protection through clear boundaries, and zero-downtime updates while maintaining complete backward compatibility with existing Holo infrastructure.

**Core Approach:** Strategy pattern for provider selection, type-specific registries for O(1) lookup, distributed hot-reload without coordination services, and graceful degradation for production resilience.

**No Starter Template:** This is a brownfield refactoring of existing Holo codebase. The plugin system integrates with established Express/RabbitMQ/PostgreSQL/tsyringe infrastructure.

---

## Decision Summary

| Category | Decision | Version/Details | Affects FRs | Rationale |
|----------|----------|-----------------|-------------|-----------|
| **Common SDK Structure** | Namespaced + Subpath Exports | @holokai/common with /plugin, /provider, /holo, /utils subpaths | FR1-FR9 | Tree-shakeable, explicit public API, prevents internal imports |
| **Plugin Contracts** | Rich Lifecycle with Context | IPlugin with initialize(context), destroy(), IProviderPlugin extends with validation | FR1-FR9, FR30-FR37 | Ensures AI agent consistency, context injection for dependencies |
| **Plugin Discovery** | Hybrid (package.json + file watch) | Static parse on startup + chokidar watch for hot-reload | FR10-FR17, FR19-FR23 | Fast startup, supports hot-reload, works with any package manager |
| **Plugin Registry** | Type-Specific Registries | ProviderPluginRegistry, GuardPluginRegistry with specialized lookup methods | FR24-FR29 | O(1) performance, type-safe returns, provider lookup by providerType |
| **Worker Integration** | Strategy Pattern | PluginProviderStrategy + LegacyProviderStrategy with canHandle() | FR38-FR46 | Clean separation, easy to remove legacy later, follows tsyringe DI |
| **Legacy Fallback** | Flag-Based per Provider | plugin_id field controls plugin vs legacy selection | FR73-FR80 | Gradual migration, explicit control, easy rollback per provider |
| **Monorepo Organization** | Top-Level packages/ | packages/common, packages/provider-* (future: git submodules) | FR56-FR61, FR81-FR86 | Clear IP boundaries, independent npm publishing, workspace convenience |
| **Plugin Metadata** | Rich Manifest | Required + optional fields, marketplace-ready (author, source, description) | FR5, FR34-FR36, FR85-FR88 | Complete discovery metadata, future-ready for marketplace |
| **Hot-Reload** | Chokidar-Based File Watch | Watch package.json changes, debounce, atomic registry swap | FR19-FR23, NFR3, NFR15 | Reliable cross-platform, <2s detection, works across worker instances |
| **Config Queue Integration** | Reference-Based (Normalized) | Separate plugin_metadata messages, providers reference by plugin_id | FR47-FR55, NFR20 | No duplication, efficient for many providers, clean separation |
| **ArkType Strategy** | Peer Dependency (Shared) | Root provides single ArkType version, plugins declare as peer | FR33, NFR25 | Consistent validation, single instance, optimal performance |
| **Error Handling** | Graceful Degradation | Log failures, skip broken plugins, worker starts regardless | FR15-FR16, FR46, NFR7 | Production resilience, partial functionality over total failure |
| **Package Naming** | Dual Namespace | Official: @holokai/provider-*, Community: *holo-provider-* (future) | FR37, FR90 | Official plugins clear, community can publish independently |
| **Testing Strategy** | Hybrid (Limited Unit + Integration Focus) | VERY LIMITED unit tests, primary focus on real API parity tests | FR60-FR68 | Validates actual behavior, catches integration issues, matches existing Holo tests |

---

## Project Structure

```
llm-proxy/
├── packages/                              # Plugin packages (publishable to npm)
│   ├── common/                            # @holokai/common
│   │   ├── package.json                   # Subpath exports: /plugin, /provider, /holo, /utils
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── plugin/                    # Plugin system namespace
│   │   │   │   ├── index.ts               # Barrel export
│   │   │   │   ├── interfaces.ts          # IPlugin, IProviderPlugin, IGuardPlugin
│   │   │   │   ├── types.ts               # PluginManifest, PluginType, PluginContext
│   │   │   │   └── validators.ts          # ArkType validators for contracts
│   │   │   ├── provider/                  # Provider-specific namespace
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts               # ProviderConfig, ProviderCapabilities
│   │   │   │   └── validators.ts          # Provider validators
│   │   │   ├── holo/                      # Holo universal format namespace
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts               # HoloRequest, HoloResponse
│   │   │   │   └── validators.ts          # Holo format validators
│   │   │   └── utils/                     # Shared utilities namespace
│   │   │       ├── index.ts
│   │   │       └── logger.ts              # Logger utilities
│   │   └── dist/                          # Compiled output (mirrors src/)
│   │
│   ├── provider-openai/                   # @holokai/provider-openai
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                   # Default export: IProviderPlugin
│   │   │   ├── plugin.ts                  # OpenAI plugin implementation
│   │   │   ├── provider.ts                # OpenAI provider (extracted from core)
│   │   │   └── translator.ts              # Holo format translator
│   │   ├── tests/
│   │   │   ├── unit/                      # Limited unit tests (contracts only)
│   │   │   └── integration/               # Primary: Real API parity tests
│   │   └── dist/
│   │
│   ├── provider-claude/                   # @holokai/provider-claude (same structure)
│   ├── provider-ollama/                   # @holokai/provider-ollama
│   └── provider-perplexity/               # @holokai/provider-perplexity
│
├── src/                                   # Core Holo (private, NOT published)
│   ├── api/                               # HTTP API (unchanged)
│   ├── providers/                         # Legacy providers (coexist during migration)
│   │   ├── ai.provider.ts                 # Base interface (remains)
│   │   ├── base.translator.ts             # Shared translation logic (remains)
│   │   ├── auditors.ts                    # Core auditing (remains)
│   │   ├── openai/                        # Legacy OpenAI (remove post-migration)
│   │   ├── claude/                        # Legacy Claude (remove post-migration)
│   │   └── ...
│   ├── services/
│   │   ├── plugin/                        # NEW: Plugin system services
│   │   │   ├── discovery.service.ts       # Hybrid discovery (package.json + chokidar)
│   │   │   ├── loader.service.ts          # Plugin loading with graceful degradation + events
│   │   │   ├── registry.service.ts        # Generic registry router
│   │   │   ├── provider-registry.ts       # ProviderPluginRegistry (type-specific)
│   │   │   ├── guard-registry.ts          # GuardPluginRegistry (future)
│   │   │   ├── hot-reload.service.ts      # Chokidar-based distributed hot-reload
│   │   │   └── cache.service.ts           # Plugin metadata cache (in-memory Map)
│   │   ├── provider-factory.service.ts    # MODIFIED: Uses Strategy pattern
│   │   │   ├── strategies/
│   │   │   │   ├── plugin-provider.strategy.ts
│   │   │   │   └── legacy-provider.strategy.ts  # Remove post-migration
│   │   └── ...
│   ├── servers/
│   │   ├── worker.server.ts               # MODIFIED: Initializes plugin system on startup
│   │   ├── audit.server.ts                # Unchanged
│   │   └── analysis.server.ts             # Unchanged
│   ├── db/                                # EXISTING: PostgreSQL (unchanged, may refactor later)
│   ├── cache/                             # EXISTING: Core Holo caching (unchanged, may refactor later)
│   ├── admin/                             # Unchanged
│   ├── guards/                            # Unchanged (future: guard plugins)
│   ├── types/                             # Core types
│   └── app.ts                             # API server (unchanged)
│
├── tests/
│   ├── integration/
│   │   ├── plugin-system.test.ts          # Plugin loading, hot-reload tests
│   │   └── provider-parity.test.ts        # Legacy vs plugin comparison
│   └── unit/                              # VERY LIMITED (contract validation only)
│
├── package.json                           # Root workspace config (npm workspaces)
├── tsconfig.json                          # Root TypeScript config
├── jest.config.cjs                        # Test configuration
└── README.md
```

---

## FR Category to Architecture Mapping

| FR Category | Architecture Component | Location |
|-------------|------------------------|----------|
| **Common SDK (FR1-FR9)** | @holokai/common package with subpath exports | packages/common/ |
| **Plugin Discovery (FR10-FR17)** | PluginDiscoveryService (hybrid package.json + chokidar) | src/services/plugin/discovery.service.ts |
| **Hot-Reload (FR18-FR23)** | DistributedHotReloadService (chokidar, atomic swap) | src/services/plugin/hot-reload.service.ts |
| **Registries (FR24-FR29)** | Type-specific registries with O(1) lookup | src/services/plugin/provider-registry.ts, guard-registry.ts |
| **Provider Plugins (FR30-FR37)** | IProviderPlugin implementations in plugin packages | packages/provider-*/ |
| **Worker Integration (FR38-FR46)** | Strategy pattern in ProviderFactory + Worker initialization | src/services/provider-factory.service.ts, src/servers/worker.server.ts |
| **Configuration (FR47-FR55)** | Plugin metadata cache + config queue integration | src/services/plugin/cache.service.ts |
| **Project Structure (FR56-FR61)** | Monorepo packages/ organization | packages/ directory |
| **Testing (FR62-FR68)** | Hybrid testing (limited unit, focus integration) | tests/, packages/*/tests/ |
| **Developer Experience (FR69-FR74)** | Common SDK documentation, plugin examples | packages/common/, packages/provider-openai/ (reference) |
| **Migration (FR75-FR80)** | Strategy pattern + flag-based selection | provider-factory strategies |
| **IP Protection (FR81-FR86)** | src/ (private) vs packages/ (public) separation | Monorepo structure |
| **Future-Ready (FR87-FR90)** | Rich manifest, dual namespace design | PluginManifest schema, discovery patterns |

---

## Technology Stack Details

### Core Technologies (Existing Holo)

- **Runtime:** Node.js >= 18.0.0
- **Language:** TypeScript 5.8.3 (strict mode)
- **Framework:** Express 4.21.2
- **Message Queue:** RabbitMQ (amqplib)
- **Database:** PostgreSQL (pg)
- **Dependency Injection:** tsyringe
- **Validation:** ArkType (peer dependency, shared version)
- **Logger:** Winston

### Plugin System Additions

- **File Watching:** chokidar (^3.6.0) - Reliable cross-platform file watcher for hot-reload
- **Module Resolution:** Native Node.js dynamic import() for plugin loading
- **Events:** Node.js EventEmitter for plugin lifecycle events

### Plugin Package Dependencies

Each plugin package declares:
```json
{
  "peerDependencies": {
    "@holokai/common": "^1.0.0",
    "arktype": "^2.0.0"
  },
  "dependencies": {
    "openai": "4.73.1"  // Provider SDK - EXACT version
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Integration Points

### Worker → Plugin System Integration

```typescript
// Worker startup sequence
async function initializeWorker(): Promise<void> {
  // 1. Initialize plugin system
  const pluginLoader = container.resolve(PluginLoaderService);
  await pluginLoader.loadAllPlugins();  // Graceful degradation if any fail

  const hotReload = container.resolve(HotReloadService);
  hotReload.startWatching();  // Enable hot-reload

  // 2. Subscribe to configuration queue (existing)
  const configQueue = container.resolve(ConfigurationQueue);

  // NEW: Subscribe to plugin metadata messages
  configQueue.subscribe('plugin_metadata', (msg: PluginMetadataMessage) => {
    const cacheService = container.resolve(PluginCacheService);
    msg.plugins.forEach(p => cacheService.set(p.name, p));
  });

  // Existing: Subscribe to provider configs
  configQueue.subscribe('provider_config', handleProviderConfig);

  // 3. Start worker (existing)
  worker.start();
}
```

### Provider Factory → Strategy Selection

```typescript
// Strategy pattern for plugin vs legacy
class ProviderFactory {
  private strategies: IProviderStrategy[];

  constructor(
    pluginStrategy: PluginProviderStrategy,
    legacyStrategy: LegacyProviderStrategy
  ) {
    this.strategies = [pluginStrategy, legacyStrategy];
  }

  createProvider(config: ProviderConfig): AIProvider {
    const strategy = this.strategies.find(s => s.canHandle(config));
    if (!strategy) throw new Error('No strategy found');
    return strategy.createProvider(config);
  }
}

// Plugin strategy
class PluginProviderStrategy implements IProviderStrategy {
  canHandle(config: ProviderConfig): boolean {
    return config.plugin_id != null;
  }

  createProvider(config: ProviderConfig): AIProvider {
    const registry = this.registryService.getRegistry<IProviderPlugin>('provider');
    const plugin = registry.getByProviderType(config.provider_type);
    if (!plugin) throw new Error(`Plugin not found: ${config.provider_type}`);
    return plugin.createProvider(config);
  }
}
```

### Configuration Queue → Plugin Metadata

```typescript
// Central server sends plugin metadata (separate from provider configs)
interface PluginMetadataMessage {
  type: 'plugin_metadata';
  plugins: PluginMetadata[];  // Bulk update
}

// Workers cache plugin metadata
configQueue.subscribe('plugin_metadata', (msg) => {
  msg.plugins.forEach(plugin => pluginCache.set(plugin.name, plugin));
});

// Provider configs reference plugins by ID
interface ProviderConfig {
  plugin_id: string | null;  // Reference to cached plugin metadata
  provider_type: string;
  // ... rest of config
}
```

### Existing Infrastructure (Unchanged)

- **RabbitMQ Queues:** No changes to queue architecture (NFR19)
- **PostgreSQL:** No plugin metadata in database (MVP - NFR20, NFR28)
- **tsyringe DI:** Plugin services registered in DI container
- **Express API:** No changes to API endpoints (NFR26)
- **Response Streaming (SSE):** Plugins work with existing streaming (NFR22)

---

## Novel Pattern Design: Distributed Hot-Reload

**Problem:** Multiple worker instances need to hot-reload the same plugin simultaneously when `npm install` updates a package, WITHOUT any central coordination service (Redis, database, etc.).

**Solution:** File-based coordination using package.json version timestamps + atomic registry swaps.

```typescript
/**
 * Distributed Hot-Reload Pattern
 *
 * Each worker independently watches node_modules/@holokai/*/package.json
 * and detects version changes. No coordination needed - file system is
 * the source of truth.
 */
class DistributedHotReloadService extends EventEmitter {
  private watcher: chokidar.FSWatcher;
  private reloadDebounce: Map<string, NodeJS.Timeout> = new Map();

  startWatching(): void {
    // Watch package.json files (version changes = new plugin)
    this.watcher = chokidar.watch('node_modules/@holokai/*/package.json', {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,  // Wait for npm install to finish
        pollInterval: 100
      }
    });

    this.watcher.on('change', (path) => this.handlePackageChange(path));
    this.watcher.on('add', (path) => this.handlePackageAdded(path));
  }

  private async handlePackageChange(packageJsonPath: string): Promise<void> {
    const packageName = this.extractPackageName(packageJsonPath);

    // Debounce per package (npm install triggers multiple events)
    this.debounceReload(packageName, async () => {
      const newVersion = await this.readPackageVersion(packageJsonPath);
      const currentVersion = this.pluginRegistry.getVersion(packageName);

      if (newVersion !== currentVersion) {
        this.emit('plugin:reloading', packageName, currentVersion, newVersion);
        await this.reloadPlugin(packageName);
      }
    });
  }

  private async reloadPlugin(packageName: string): Promise<void> {
    try {
      // 1. Clear require cache (entire dependency tree)
      this.clearModuleCacheRecursive(packageName);

      // 2. Re-import plugin (cache-busted)
      const pluginModule = await import(`@holokai/${packageName}?t=${Date.now()}`);
      const newPlugin: IProviderPlugin = pluginModule.default;

      // 3. Initialize new plugin
      await newPlugin.initialize(this.pluginContext);

      // 4. ATOMIC REGISTRY SWAP
      // Old plugin continues serving requests until new one is ready
      const oldPlugin = await this.pluginRegistry.atomicReplace(packageName, newPlugin);

      // 5. Cleanup old plugin
      if (oldPlugin) {
        await oldPlugin.destroy();
      }

      this.emit('plugin:reloaded', newPlugin);
      logger.info(`[HotReload] Successfully reloaded ${packageName} v${newPlugin.manifest.version}`);

    } catch (error) {
      this.emit('plugin:failed', packageName, error);
      logger.error(`[HotReload] Failed to reload ${packageName}, keeping previous version`, { error });
      // Previous version continues serving (graceful degradation)
    }
  }

  // Atomic swap ensures zero request failures during reload
  async atomicReplace(packageName: string, newPlugin: IPlugin): Promise<IPlugin | null> {
    const oldPlugin = this.plugins.get(packageName);

    // New plugin becomes active immediately (atomic)
    this.plugins.set(packageName, newPlugin);

    return oldPlugin ?? null;
  }
}
```

**Key Properties:**
- **Independent Detection:** Each worker detects changes via file system watch
- **Atomic Swap:** Old plugin serves requests until new plugin is initialized
- **Graceful Degradation:** If reload fails, old version continues
- **Version-Based:** Uses package.json version to detect true changes (not just file touch)
- **Debouncing:** Prevents reload storms during npm install
- **No Coordination:** File system timestamps are the source of truth

This pattern enables FR19-FR23 (hot-reload) + NFR15 (works across multiple workers) without Redis or database coordination.

---

## Implementation Patterns (AI Agent Consistency Rules)

### Naming Conventions

**File Naming:**
```
plugin.ts                    // Main plugin class
provider.ts                  // Provider implementation
translator.ts                // Holo format translator
{feature}.service.ts         // Services: discovery.service.ts
{type}-registry.ts           // Registries: provider-registry.ts
{feature}.strategy.ts        // Strategies: plugin-provider.strategy.ts
```

**Class Naming:**
```typescript
class OpenAIProviderPlugin   // {Provider}ProviderPlugin
class OpenAIProvider         // {Provider}Provider
class OpenAITranslator       // {Provider}Translator
class PluginDiscoveryService // {Feature}Service
class ProviderPluginRegistry // {Type}PluginRegistry
```

**Export Naming:**
```typescript
export default plugin        // Plugins use default export
export { OpenAIProvider }    // Named exports for utilities
```

### Structure Patterns

**Plugin Package Structure (MANDATORY):**
```
packages/provider-{name}/
├── src/
│   ├── index.ts            // MUST export plugin as default
│   ├── plugin.ts           // MUST implement IProviderPlugin
│   ├── provider.ts         // Provider implementation
│   └── translator.ts       // Holo translator
├── tests/
│   ├── integration/        // Real API tests (PRIMARY)
│   └── unit/              // Minimal contract tests only
├── package.json
└── tsconfig.json
```

**Service Organization:**
```
src/services/plugin/
├── discovery.service.ts    // One concern per file
├── loader.service.ts
├── registry.service.ts
└── ...
```

### Format Patterns

**Plugin Manifest Format:**
```typescript
const manifest: PluginManifest = {
  name: '@holokai/provider-openai',     // Full package name
  version: '1.0.0',                     // Semver ALWAYS
  pluginType: 'provider',               // Lowercase enum value
  providerType: 'openai',               // Lowercase, matches Holo convention
  sdkVersion: 'openai@4.73.1',         // Format: {package}@{version}
  commonSdkVersion: '^1.0.0',          // Semver range
  capabilities: { /* ... */ },
  author: 'HoloKai Team',
  source: 'official',
  description: 'OpenAI provider plugin'
};
```

**Error Logging Format:**
```typescript
logger.error('[PluginName] Error message', {
  context: 'specific context',
  error: error.message
});
```

**Config Queue Message Format:**
```typescript
interface PluginMetadataMessage {
  type: 'plugin_metadata';
  plugins: PluginMetadata[];  // Always array, even for single plugin
}
```

### Communication Patterns

**Plugin Initialization:**
```typescript
await plugin.initialize(context);  // MUST be async, MUST accept PluginContext
```

**Provider Creation:**
```typescript
const provider = plugin.createProvider(config);  // Sync method, returns AIProvider
```

**Registry Lookup:**
```typescript
const plugin = registry.getByProviderType('openai');  // NOT getByName for providers
```

**Strategy Selection:**
```typescript
const strategy = strategies.find(s => s.canHandle(config));  // Use find, not filter[0]
```

### Lifecycle Patterns

**Plugin Lifecycle Order (MANDATORY):**
```
1. Import plugin module
2. Validate plugin.manifest with ArkType
3. Call plugin.initialize(context)
4. Register in type-specific registry
5. Plugin ready for use
```

**Shutdown Order:**
```
1. Call plugin.destroy()
2. Unregister from registry
3. Clear from cache
```

### Location Patterns

**Import Paths (Subpath Exports):**
```typescript
import { IProviderPlugin } from '@holokai/common/plugin';     // Subpath exports
import { ProviderConfig } from '@holokai/common/provider';
import { HoloRequest } from '@holokai/common/holo';

// NOT: import { IProviderPlugin } from '@holokai/common';  // WRONG
// NOT: import { IProviderPlugin } from '@holokai/common/src/plugin';  // WRONG
```

**Service Injection (tsyringe):**
```typescript
@injectable()
class PluginDiscoveryService {
  constructor(
    @inject('Logger') private logger: Logger,
    @inject('PluginRegistryService') private registry: PluginRegistryService
  ) {}
}
```

### Consistency Rules

- **Logging:** Structured logs with context object, NEVER template strings with sensitive data
- **Error Handling:**
  - Provider API error responses → Stream/send AS IS to client (e.g., OpenAI 429 rate limit)
  - Thrown exceptions in provider code → Bubble to Holo error middleware → 500 response
  - Plugin load errors → Log, graceful degradation, continue with other plugins
- **Async/Await:** ALWAYS use async/await, NEVER use .then() chains
- **TypeScript:** strict mode, no `any` types, `satisfies Type<T>` for ArkType validators
- **Comments:** Only when code is not self-explanatory (per CLAUDE.md)
- **Imports:** Absolute paths from package root, NOT relative paths across package boundaries
- **Date/Time:** ISO 8601 strings, UTC timezone, native Date objects (no moment.js)

### Initialization Patterns

**Idempotent Initialization:**
```typescript
class OpenAIProviderPlugin implements IProviderPlugin {
  private initialized = false;

  async initialize(context: PluginContext): Promise<void> {
    if (this.initialized) return;  // Safe to call multiple times

    this.logger = context.logger;
    this.initialized = true;
  }

  // NO side effects in constructor
  constructor() {
    this.manifest = { /* ... */ };  // ONLY assign manifest
  }
}
```

### Resource Cleanup

**destroy() MUST Clean Up:**
```typescript
async destroy(): Promise<void> {
  // Close connections, clear timers, remove listeners
  await this.provider?.cleanup();
  this.logger = undefined;
  this.initialized = false;
  this.capabilitiesCache = undefined;
}
```

### Validation Patterns

**Fail Fast at Boundaries:**
```typescript
validateConfig(config: unknown): boolean {
  const result = providerConfigValidator(config);
  if (result instanceof type.errors) {
    this.logger.error('[OpenAI] Invalid config', {
      errors: result.summary
    });
    return false;
  }
  return true;
}

// Use satisfies pattern (per CLAUDE.md)
const providerConfigValidator = type({
  api_key: 'string',
  model: 'string'
}).satisfies<Type<ProviderConfig>>();  // NEVER use 'any'
```

### Dependency Management

**Plugin package.json MUST Specify:**
```json
{
  "peerDependencies": {
    "@holokai/common": "^1.0.0",
    "arktype": "^2.0.0"
  },
  "dependencies": {
    "openai": "4.73.1"  // EXACT version, not range
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Null Safety

```typescript
// Optional chaining for nullable access
const result = plugin?.createProvider?.(config);

// Explicit null checks for critical paths
if (!plugin) {
  throw new Error('Plugin not found');
}

// Return null for "not found", throw for "error"
getByProviderType(type: string): IProviderPlugin | null {
  return this.plugins.get(type) ?? null;
}
```

### Promise Handling

```typescript
// NEVER ignore promise rejections
await plugin.initialize(context).catch(error => {
  logger.error('[Plugin] Init failed', { error });
  throw error;  // Re-throw after logging
});

// Use Promise.allSettled for parallel operations
const results = await Promise.allSettled(plugins.map(p => p.initialize(context)));
```

### Type Safety

```typescript
// Discriminated unions for different plugin types
interface ProviderPlugin extends BasePlugin {
  manifest: { pluginType: 'provider' };
  createProvider(config: ProviderConfig): AIProvider;
}

// Type guards for narrowing
function isProviderPlugin(plugin: IPlugin): plugin is IProviderPlugin {
  return plugin.manifest.pluginType === 'provider';
}
```

### Event Patterns

**Plugin Lifecycle Events:**
```typescript
// Typed event emitter for plugin lifecycle
interface PluginLifecycleEvents {
  'plugin:loaded': (plugin: IPlugin) => void;
  'plugin:failed': (packageName: string, error: Error) => void;
  'plugin:reloading': (packageName: string, oldVersion: string, newVersion: string) => void;
  'plugin:reloaded': (plugin: IPlugin) => void;
  'plugin:destroyed': (packageName: string) => void;
  'registry:updated': (pluginType: PluginType, plugin: IPlugin) => void;
}

// Services emit events
class PluginLoaderService extends EventEmitter {
  async loadPlugin(packageName: string): Promise<IPlugin | null> {
    try {
      const plugin = await import(`@holokai/${packageName}`);
      await plugin.default.initialize(this.context);

      this.emit('plugin:loaded', plugin.default);  // Emit event
      return plugin.default;
    } catch (error) {
      this.emit('plugin:failed', packageName, error);
      logger.error(`[Plugin] Load failed: ${packageName}`, { error });
      return null;
    }
  }
}

// Subscribers listen to events (decoupled)
class PluginMonitoringService {
  constructor(loaderService: PluginLoaderService) {
    loaderService.on('plugin:loaded', (plugin) => {
      logger.info(`[Monitor] Plugin loaded: ${plugin.manifest.name}`);
      this.metrics.increment('plugins.loaded');
    });

    loaderService.on('plugin:failed', (name, error) => {
      this.metrics.increment('plugins.failed');
      this.alerting.sendAlert(`Plugin load failure: ${name}`);
    });
  }
}
```

**Event Naming Convention:**
```
{domain}:{action}
- plugin:loaded
- plugin:failed
- plugin:reloading
- plugin:reloaded
- plugin:destroyed
- registry:updated
```

**Event Handler Safety:**
```typescript
// Event handlers MUST NOT throw
this.on('plugin:loaded', (plugin) => {
  try {
    // Handle event
  } catch (error) {
    logger.error('[EventHandler] Failed', { error });
    // Don't propagate - handlers are fire-and-forget
  }
});
```

---

## Data Architecture

### Plugin Metadata (In-Memory Cache)

```typescript
// Simple Map-based cache for plugin metadata from config queue
class PluginCacheService {
  private cache: Map<string, PluginMetadata> = new Map();

  set(name: string, metadata: PluginMetadata): void {
    this.cache.set(name, metadata);
  }

  get(name: string): PluginMetadata | undefined {
    return this.cache.get(name);
  }
}

interface PluginMetadata {
  name: string;
  version: string;
  pluginType: PluginType;
  providerType?: string;
  // ... rest of manifest fields
}
```

**Note:** No database storage for plugin metadata in MVP (NFR20, NFR28). Future: Database schema for plugin tracking (FR89).

### Provider Configuration

```typescript
// Existing provider config structure (enhanced with plugin_id)
interface ProviderConfig {
  id: string;
  provider_type: string;
  plugin_id: string | null;  // NEW: Reference to plugin (null = legacy)
  api_key: string;
  model: string;
  // ... existing fields
}
```

### Type-Specific Registry Storage

```typescript
// In-memory Map for O(1) lookup
class ProviderPluginRegistry {
  private plugins: Map<string, IProviderPlugin> = new Map();

  register(plugin: IProviderPlugin): void {
    this.plugins.set(plugin.manifest.providerType, plugin);  // Key by providerType
  }

  getByProviderType(providerType: string): IProviderPlugin | null {
    return this.plugins.get(providerType) ?? null;
  }
}
```

---

## API Contracts

### No New Customer-Facing Endpoints

The plugin system is **transparent** to API users. All existing Holo endpoints remain unchanged:

- OpenAI endpoints: `/api/openai/v1/*`
- Claude endpoints: `/api/claude/v1/*`
- Ollama endpoints: `/api/*`
- Custom application routes: `/api/custom/:provider/:appSlug/*`

### Internal Plugin Contracts

**IPlugin (Base Contract):**
```typescript
interface IPlugin {
  manifest: PluginManifest;

  // Lifecycle hooks
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
  onConfigUpdate?(config: unknown): Promise<void>;
  healthCheck?(): Promise<HealthStatus>;
}

interface PluginContext {
  logger: Logger;
  registryService: PluginRegistryService;
  configQueue: ConfigurationQueue;
}
```

**IProviderPlugin (Provider-Specific):**
```typescript
interface IProviderPlugin extends IPlugin {
  createProvider(config: ProviderConfig): AIProvider;
  validateConfig(config: unknown): boolean;
  getCapabilities(): ProviderCapabilities;
}
```

**PluginManifest (Metadata Schema):**
```typescript
interface PluginManifest {
  // REQUIRED for all plugins
  name: string;
  version: string;
  pluginType: PluginType;
  commonSdkVersion: string;

  // REQUIRED for provider plugins
  providerType?: string;
  sdkVersion?: string;
  capabilities?: ProviderCapabilities;

  // OPTIONAL for all plugins
  author?: string;
  description?: string;
  source?: 'official' | 'community' | 'marketplace';
  holoVersion?: string;
}
```

---

## Security Architecture

### IP Protection Boundaries

**Private (Core Holo):**
- `src/` directory remains in private repository
- Queue-based architecture (proprietary)
- Holo universal format translation logic (proprietary)
- Worker coordination and orchestration (proprietary)
- Audit/analysis infrastructure (proprietary)

**Public (Plugin Ecosystem):**
- `packages/common/` published to public NPM
- `packages/provider-*/` published to public NPM
- Plugin contracts expose only extension points
- No core implementation details in Common SDK

### Plugin Security

**MVP (No Sandboxing):**
- Plugins run in same process as worker (NFR7)
- Trusted installation via npm (no arbitrary code execution)
- Plugin discovery limited to `@holokai/*` scope (NFR11)

**Future Considerations (Design Only):**
- Plugin signature validation (NFR9)
- Community package discovery with verification workflow
- Marketplace plugin approval process

### Authentication & Authorization

**No Changes to Existing Auth:**
- JWT-based authentication unchanged
- Organization-based access control unchanged
- Application-level guards unchanged
- Provider-specific permissions unchanged

**Plugin System Security:**
- Configuration queue authenticated via existing RabbitMQ credentials
- Plugin metadata validated using ArkType contracts
- Plugin packages installed via npm (trusted method)

---

## Performance Considerations

### O(1) Plugin Lookup (NFR1)

Type-specific registries use Map-based storage keyed by provider type:
```typescript
// O(1) lookup
const plugin = registry.getByProviderType('openai');
```

### Hot-Reload Detection <2s (NFR3)

Chokidar detects file changes within 1-2 seconds:
```typescript
chokidar.watch('node_modules/@holokai/*/package.json', {
  awaitWriteFinish: { stabilityThreshold: 1000 }
});
```

### Plugin Latency Variance ≤5ms (NFR4)

- Map-based registry lookup: ~0.1ms
- Strategy selection: ~0.1ms
- Plugin method call overhead: <1ms
- Total overhead: <2ms (well within ±5ms budget)

### Memory Overhead ≤10MB per Plugin (NFR5)

- Plugin code: ~1-2MB
- Dependencies: ~5-8MB (provider SDK)
- Runtime state: <1MB
- Total: ~8MB (within budget)

### Caching Strategy

```typescript
// Cache expensive operations
private capabilitiesCache?: ProviderCapabilities;

getCapabilities(): ProviderCapabilities {
  if (!this.capabilitiesCache) {
    this.capabilitiesCache = this.computeCapabilities();
  }
  return this.capabilitiesCache;
}
```

---

## Deployment Architecture

### Existing Holo Deployment (Unchanged)

- **API Servers:** Stateless, horizontally scaled
- **Workers:** Stateless, horizontally scaled (5-20+ instances)
- **RabbitMQ:** Managed service (CloudAMQP, Amazon MQ)
- **PostgreSQL:** Managed service (RDS, Aurora)
- **Load Balancer:** Distributes API traffic

### Plugin System Integration

**Worker Deployment:**
- Workers install plugin packages via npm during build
- Each worker independently discovers and loads plugins
- Hot-reload works consistently across all worker instances (NFR15)
- No coordination service needed (file-based detection)

**Plugin Package Deployment:**
- Plugins published to public NPM registry
- Workers install plugins: `npm install @holokai/provider-openai`
- Update plugins: `npm install @holokai/provider-openai@latest`
- Hot-reload detects version changes automatically

**Zero-Downtime Updates:**
- Rolling deployment of workers with new plugin versions
- Atomic registry swap ensures no request failures during reload
- Gradual migration via plugin_id flag (per provider control)

---

## Development Environment

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 (or yarn/pnpm with workspace support)
- TypeScript >= 5.0.0
- Docker (for RabbitMQ and PostgreSQL)

### Setup Commands

```bash
# Clone repository
git clone <holo-repo>
cd llm-proxy

# Install dependencies (workspace setup)
npm install

# Build all packages
npm run build

# Run tests
npm test                         # All tests
npm run test:integration         # Integration tests only

# Start development environment
# Terminal 1: API Server
npm run api:dev

# Terminal 2: Worker Server
npm run worker:dev

# Terminal 3: Audit Server
npm run audit:dev
```

### Plugin Development Workflow

```bash
# Create new provider plugin
cd packages/
mkdir provider-{name}
cd provider-{name}

# Initialize package
npm init -y

# Install dependencies
npm install --save-dev typescript @types/node
npm install --peer @holokai/common arktype
npm install {provider-sdk}  # e.g., openai@4.73.1

# Implement plugin (see packages/provider-openai for reference)
# Write integration tests
# Build and test
npm run build
npm test
npm run test:integration

# Publish to NPM (when ready)
npm publish --access public
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Subpath Exports for Common SDK

**Decision:** Use package.json `exports` field with subpaths (/plugin, /provider, /holo, /utils) instead of barrel exports.

**Rationale:**
- Tree-shakeable (only import what's needed)
- Explicit public API (prevents internal imports)
- Modern Node.js pattern (requires Node 12+, we're on 18+)
- TypeScript tooling fully supports subpath exports

**Alternatives Considered:**
- Flat exports: Simple but no tree-shaking, large bundles
- Namespaced folders only: Internal organization but no explicit boundaries

### ADR-002: Strategy Pattern for Provider Selection

**Decision:** Use Strategy pattern with PluginProviderStrategy + LegacyProviderStrategy instead of inline if/else checks.

**Rationale:**
- Clean separation of concerns (plugin logic separate from legacy)
- Easy to remove legacy strategy post-migration (no code intermingling)
- Testable independently (mock strategies)
- Follows existing tsyringe DI pattern in Holo
- Open/closed principle (add new strategies without modifying factory)

**Alternatives Considered:**
- Inline checks: Simpler initially but mixes concerns, hard to remove legacy later
- Adapter pattern: Still mixes concerns, doesn't provide clear migration path

### ADR-003: Chokidar for Hot-Reload

**Decision:** Use chokidar library for file watching instead of native fs.watch.

**Rationale:**
- Reliable cross-platform (handles platform differences)
- Built-in debouncing (prevents reload storms)
- Battle-tested (used by webpack, vite, etc.)
- Supports awaitWriteFinish (waits for npm install to complete)
- Meets NFR3 requirement (<2s detection)

**Alternatives Considered:**
- Native fs.watch: Unreliable across platforms, no debouncing
- Polling: Simple but inefficient, 2s delay hardcoded

### ADR-004: Reference-Based Config Queue Integration

**Decision:** Send plugin metadata separately from provider configs, cache in workers, providers reference by plugin_id.

**Rationale:**
- No duplication (plugin metadata sent once, many providers reference it)
- Efficient for many providers using same plugin
- Clean separation (plugin metadata vs provider config)
- No PostgreSQL dependency (NFR20)

**Alternatives Considered:**
- Embedded: Simple but duplicates metadata across provider configs
- Separate message type with coordination: More complex, no significant benefit

### ADR-005: Graceful Degradation for Plugin Failures

**Decision:** Workers continue startup even if plugins fail to load, skip broken plugins.

**Rationale:**
- Explicitly required by PRD (FR15, FR16, FR46)
- Production resilience (partial functionality > total failure)
- Allows deploying with known broken plugin for debugging
- Matches Holo's existing resilience patterns

**Alternatives Considered:**
- Fail fast: Forces quality but one broken plugin = entire worker down
- Configurable: More complexity, production needs graceful degradation regardless

### ADR-006: Type-Specific Registries

**Decision:** Separate ProviderPluginRegistry, GuardPluginRegistry with specialized lookup methods instead of single unified registry.

**Rationale:**
- Type-safe returns (IProviderPlugin, not generic IPlugin)
- Specialized lookup (getByProviderType for providers)
- O(1) performance (Map keyed by provider type)
- Prevents agent confusion (strongly-typed registry methods)

**Alternatives Considered:**
- Single unified registry: Simpler but no type safety, generic returns
- Hybrid registry with multiple indexes: Complex maintenance, type safety harder

### ADR-007: Hybrid Testing Strategy (Limited Unit + Integration Focus)

**Decision:** VERY LIMITED unit tests (contract validation only), PRIMARY FOCUS on integration tests with real provider APIs.

**Rationale:**
- Plugin behavior is defined by actual provider API interactions
- Unit tests can't verify parity with legacy providers
- Real API tests catch integration issues (API changes, SDK updates)
- Matches existing Holo test structure (integration tests already exist)
- User explicitly requested "VERY LIMITED UNIT TESTS"

**Alternatives Considered:**
- Unit tests only: Fast but don't test actual behavior
- Mock-based integration tests: Don't catch real API issues

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-20_
_For: BMad (Expert)_
