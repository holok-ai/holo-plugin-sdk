# holo - Technical Specification [DRAFT - SUPERSEDED BY PRD]

**Author:** BMad
**Date:** 2025-11-20
**Status:** DRAFT - Superseded by modularization PRD
**Original Scope:** Provider Plugin System
**Development Context:** Brownfield - TypeScript/Node.js distributed LLM gateway

---

## 🚨 DRAFT STATUS

This tech-spec was created during initial discovery but has been **superseded by a broader Product Requirements Document (PRD)** covering Holo's complete modularization strategy.

**Why superseded:**
- Initial scope: Provider plugins with hot-loading
- Discovered scope: Generic plugin architecture for ALL extensible components (providers, guards, evaluators, loggers, workers)
- Additional requirements: Common SDK package, project restructuring, migration roadmap

**What happens next:**
1. PM creates PRD for "Holo Modularization & Plugin Architecture"
2. PRD defines strategic vision, project structure, and roadmap
3. This tech-spec becomes reference material for **one epic** within that PRD (provider plugins)
4. Additional epics will be created for: guards, evaluators, loggers, workers, common SDK

**This document is preserved as:**
- Reference for technical implementation details
- Provider plugin architecture (first implementation)
- Integration testing strategy
- Database schema proposals

**See:** `docs/prd-modularization.md` (to be created)

---

## Context

### Available Documents

**Documents Loaded:**
- ✅ index.md - Comprehensive brownfield project documentation
- ✅ architecture.md - Detailed architecture analysis with clean architecture recommendations
- ✅ archive/PROVIDER_ARCHITECTURE.md - Current provider implementation patterns
- ✅ project-overview.md - Executive summary, tech stack, architecture overview
- ✅ package.json - Dependencies and build scripts

**No Product Brief or Research documents found** - Standalone brownfield change

### Project Stack

**Runtime & Core:**
- **Node.js:** >= 18.0.0
- **TypeScript:** 5.8.3
- **Express:** 4.21.2 (HTTP server)
- **RabbitMQ:** amqplib 0.10.9 (message queue)
- **PostgreSQL:** pg 8.11.3 (database)

**Key Dependencies:**
- **tsyringe:** 4.10.0 (dependency injection)
- **ArkType:** 2.1.22 (runtime validation) - PEER DEPENDENCY for plugins
- **Winston:** 3.18.3 (logging)

**Provider SDKs (currently bundled):**
- **OpenAI:** 6.8.1
- **Anthropic:** 0.67.0
- **Ollama:** 0.6.0

**Build & Test:**
- **Jest:** 29.7.0 (integration tests only)
- **ts-node:** 10.9.2 (development runtime)
- **nodemon:** 3.1.10 (hot reload)

### Existing Codebase Structure

**Architecture Pattern:** Queue-based distributed microservices

**Key Directories:**
```
llm-proxy/
├── src/
│   ├── api/                    # Express HTTP layer
│   ├── providers/              # Provider integrations (OpenAI, Claude, Ollama, Perplexity)
│   │   ├── ai.provider.ts      # Base AIProvider abstract class
│   │   ├── openai/             # OpenAI implementation
│   │   ├── claude/             # Claude implementation
│   │   ├── ollama/             # Ollama implementation
│   │   ├── perplexity/         # Perplexity implementation
│   │   └── holo/               # Holo universal format
│   ├── services/               # Business logic services
│   │   ├── provider.service.ts # Provider registry
│   │   ├── queue.service.ts    # RabbitMQ management
│   │   └── response.service.ts # Response handling
│   ├── servers/                # Multi-server processes
│   │   ├── worker.server.ts    # Worker nodes (process requests)
│   │   ├── audit.server.ts     # Audit logging
│   │   └── analysis.server.ts  # Analytics
│   ├── db/                     # PostgreSQL access layer
│   ├── admin/                  # Configuration management
│   ├── cache/                  # In-memory caching
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Utility functions
├── tests/
│   └── integration/            # Integration tests (real provider calls, no mocks)
├── package.json
├── tsconfig.json
└── jest.config.cjs
```

**Current Provider Pattern:**
- Each provider extends `AIProvider` abstract class
- Implements `IProvider` interface
- Uses translator pattern for Holo ↔ Provider format conversion
- Hardcoded imports in worker server
- Tightly coupled to SDK versions

**Request Flow (Current):**
```
Client → API Server → RabbitMQ → Worker Server → ProviderService → AIProvider → SDK API
```

---

## The Change

### Problem Statement

**Three Critical Pain Points:**

1. **Deployment Coupling**
   - Provider SDK updates require full platform redeployment
   - Cannot update OpenAI SDK without rebuilding and redeploying Holo core
   - Risk: Platform downtime for every SDK patch
   - **Applies to other extensible components** (guards, evaluators, logging) as well

2. **Version Lock-In**
   - Single provider SDK version across all users/organizations
   - Cannot support multiple SDK versions simultaneously
   - Example: User needs OpenAI SDK 6.8.1 for compatibility, another needs 7.0.0
   - No version pinning per provider instance (e.g., "OpenAI Primary" vs "OpenAI LM Studio")

3. **Closed Ecosystem**
   - All provider integrations must be built and maintained internally
   - No mechanism for community contributions
   - Adding obscure providers (e.g., local LLMs, enterprise APIs) requires core changes
   - **Same problem extends to**: Custom guards, evaluators, loggers, analyzers
   - Blocks innovation and extensibility

**Vision:** Plugin system architecture that supports **multiple plugin types** (providers, guards, evaluators, loggers, etc.) with a unified discovery and loading mechanism.

**Current State:**
```typescript
// Worker Server - Hardcoded Imports
import { OpenAIProvider } from '../providers/openai/openai.provider';
import { ClaudeProvider } from '../providers/claude/claude.provider';

// Hardcoded Factory
switch(providerType) {
  case ProviderType.OPENAI: return new OpenAIProvider(...);
  case ProviderType.CLAUDE: return new ClaudeProvider(...);
}
```

**Impact:**
- **25+ deployments in last 6 months** due to SDK updates
- **Zero ability to version providers** per user need
- **100% internal maintenance burden** for all provider integrations

### Proposed Solution

**Provider Plugin System with Hot-Loading**

Transform providers from hardcoded integrations into independently versioned, hot-loadable NPM packages.

**Architecture:**
```
Worker Server
    ↓
PluginRegistryService (discovers & loads plugins)
    ↓
@holokai/provider-openai@6.8.1 (NPM package)
    ↓
OpenAI SDK 6.8.1
```

**Key Capabilities:**

1. **Generic Plugin Discovery**
   - Scan node_modules for `@holokai/{type}-*` packages (provider, guard, evaluator, logger)
   - Hot-reload on package installation (file watcher)
   - Sync discovered plugins to database (plugins table with type field)

2. **Type-Specific Plugin Registries**
   - Generic PluginRegistryService for all plugin types
   - Type-specific registries: ProviderPluginRegistry, GuardPluginRegistry, etc.
   - Each registry implements common IPluginRegistry interface

3. **Strict Contract Enforcement**
   - Base `IPlugin` interface (common to all plugin types)
   - Type-specific interfaces: `IProviderPlugin`, `IGuardPlugin`, `IEvaluatorPlugin`
   - ArkType runtime validation
   - Plugins must export class implementing type-specific contract

4. **Instance-Based Configuration**
   - Plugin = Installed package (e.g., @holokai/provider-openai)
   - Instance = User configuration (e.g., "OpenAI Primary", "OpenAI LM Studio")
   - Multiple instances per plugin with different configs
   - **Applies to all plugin types** (provider instances, guard instances, etc.)

5. **Gradual Migration**
   - Legacy providers remain functional (fallback)
   - Migrate one provider at a time (start with OpenAI)
   - No breaking changes during migration
   - **Provider plugins are the first plugin type** (guards, evaluators come later)

6. **Future Marketplace Ready**
   - Plugin manifest includes `source` field (official/community/marketplace)
   - Plugin manifest includes `pluginType` field (provider/guard/evaluator/logger)
   - Designed for extensibility (community plugins deferred to post-MVP)

**New Request Flow:**
```
Client → API Server → RabbitMQ → Worker Server
                                      ↓
                          PluginRegistryService.getRegistry('provider')
                                      ↓
                          ProviderPluginRegistry.getPlugin(providerType)
                                      ↓
                          Plugin.createProvider(config)
                                      ↓
                          AIProvider.handleLLMRequest()
                                      ↓
                          Provider SDK API
```

### Scope

**In Scope:**

✅ **Generic Plugin Contract & Types**
- `IPlugin` base interface (common to all plugin types)
- `IProviderPlugin` interface (extends IPlugin)
- `PluginManifest` type (includes `pluginType` field)
- `PluginType` enum (provider/guard/evaluator/logger)
- `ProviderInstanceConfig` type
- `PluginCapabilities` definition

✅ **Generic PluginRegistryService**
- Node modules scanner (@holokai/{type}-* patterns)
- Plugin loader (dynamic import)
- Type-specific registry management
- Hot-reload with file watcher
- Generic IPluginRegistry interface

✅ **ProviderPluginRegistry (Type-Specific)**
- Provider plugin registration (in-memory registry)
- Factory method (create provider from plugin)
- Implements IPluginRegistry<IProviderPlugin>

✅ **Worker Integration**
- Update worker server to use plugin system
- Fallback to legacy providers (gradual migration)
- Database access layer updates (read provider_plugins, providers tables)

✅ **Convert OpenAI Provider to Plugin**
- Extract to @holokai/provider-openai package
- Implement IProviderPlugin interface
- Package with OpenAI SDK 6.8.1 bundled
- Peer dependency on ArkType

✅ **Integration Testing**
- Test legacy OpenAI provider
- Test plugin OpenAI provider
- Verify identical behavior (parity testing)

✅ **Documentation**
- Plugin development guide
- Contract specification
- Migration guide for remaining providers

**Out of Scope:**

❌ **Database Schema Changes**
- Create provider_plugins table (external DB project)
- Alter providers table (external DB project)
- Database migrations (coordinated with DB team)

❌ **Community Plugin Support**
- Community package discovery (holo-provider-*)
- Plugin marketplace UI
- Plugin approval/verification workflow
- Paid plugins

❌ **Multi-Version Provider Support**
- Multiple SDK versions of same provider type loaded simultaneously
- Instance-level SDK version selection
- Version routing logic

❌ **Other Provider Migrations**
- Claude, Ollama, Perplexity conversions (Phase 2)
- Only OpenAI converted in this epic

❌ **Advanced Plugin Features**
- Plugin health checks
- Plugin sandboxing/security
- Plugin dependency resolution
- Plugin versioning/upgrade management

---

## Implementation Details

### Source Tree Changes

**CREATE - Plugin System Core:**
- `src/types/plugin.types.ts` - Base plugin interfaces (IPlugin, PluginManifest, PluginType enum)
- `src/types/provider-plugin.types.ts` - Provider-specific plugin types (IProviderPlugin)
- `src/services/plugin-registry.service.ts` - Generic plugin discovery, loading, and registry management
- `src/services/provider-plugin-registry.service.ts` - Provider-specific plugin registry
- `src/utils/plugin-loader.ts` - Dynamic plugin loader utility

**MODIFY - Worker Server:**
- `src/servers/worker.server.ts` - Integrate plugin system, add fallback to legacy

**MODIFY - Database Access:**
- `src/db/plugin.db.ts` - CREATE - Access layer for plugins table (generic, all plugin types)
- `src/db/provider.db.ts` - MODIFY - Read plugin_id and provider_type fields

**MODIFY - Provider Service:**
- `src/services/provider.service.ts` - Support plugin-based provider registration

**CREATE - OpenAI Plugin Package:**
- `packages/provider-openai/` - New NPM package directory
  - `src/index.ts` - Plugin entry point, default export of plugin class
  - `src/openai.plugin.ts` - IProviderPlugin implementation
  - `src/openai.provider.ts` - MOVE from src/providers/openai/
  - `src/translators/` - MOVE from src/providers/openai/translators/
  - `src/types/` - MOVE from src/providers/openai/types/
  - `src/validators/` - MOVE from src/providers/openai/validators/
  - `package.json` - Plugin package manifest
  - `tsconfig.json` - Plugin TypeScript config

**MODIFY - Tests:**
- `tests/integration/openai-legacy.test.ts` - CREATE - Test legacy OpenAI provider
- `tests/integration/openai-plugin.test.ts` - CREATE - Test plugin OpenAI provider
- `tests/integration/plugin-parity.test.ts` - CREATE - Verify legacy vs plugin parity

**MODIFY - Configuration:**
- `package.json` - Add workspace or monorepo config for plugin packages
- `.npmignore` - Configure plugin package publishing

**NO CHANGE - Existing Providers:**
- `src/providers/claude/` - Remains unchanged (Phase 2)
- `src/providers/ollama/` - Remains unchanged (Phase 2)
- `src/providers/perplexity/` - Remains unchanged (Phase 2)
- `src/providers/holo/` - Remains unchanged (universal format)

### Technical Approach

**1. Generic Plugin Contract Definition**

Use TypeScript interfaces with ArkType validation for runtime safety. Base interfaces support all plugin types.

```typescript
// src/types/plugin.types.ts

/** Base plugin interface - ALL plugins must implement this */
export interface IPlugin {
  readonly manifest: PluginManifest;
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
}

/** Plugin manifest - metadata for all plugin types */
export interface PluginManifest {
  name: string;                    // 'openai', 'jwt-guard', 'cost-evaluator'
  version: string;                 // '6.8.1' (plugin version)
  packageName: string;             // '@holokai/provider-openai'
  pluginType: PluginType;          // 'provider' | 'guard' | 'evaluator' | 'logger'
  contractVersion: string;         // '1.0.0' (IPlugin contract version)
  source: PluginSource;            // 'official' | 'community' | 'marketplace'
  capabilities?: Record<string, any>; // Plugin-type-specific capabilities
}

/** Plugin types enum */
export enum PluginType {
  PROVIDER = 'provider',
  GUARD = 'guard',
  EVALUATOR = 'evaluator',
  LOGGER = 'logger'
}

export type PluginSource = 'official' | 'community' | 'marketplace';

/** Generic plugin registry interface - implemented by type-specific registries */
export interface IPluginRegistry<T extends IPlugin> {
  registerPlugin(plugin: T): void;
  getPlugin(name: string): T | undefined;
  listPlugins(): PluginManifest[];
  unregisterPlugin(name: string): void;
}
```

```typescript
// src/types/provider-plugin.types.ts

import { IPlugin, PluginManifest } from './plugin.types';

/** Provider-specific plugin interface */
export interface IProviderPlugin extends IPlugin {
  createProvider(
    config: AIProviderConfig,
    responseService: ResponseService,
    workerId: string
  ): AIProvider;
}

/** Provider plugin manifest (extends base manifest) */
export interface ProviderPluginManifest extends PluginManifest {
  pluginType: PluginType.PROVIDER;
  providerType: ProviderType;      // Enum value (OPENAI, CLAUDE, etc.)
  sdkVersion: string;              // '6.8.1' (underlying provider SDK version)
  capabilities: ProviderCapabilities;
}

export interface ProviderCapabilities {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  functionCalling: boolean;
}
```

**2. Generic Plugin Discovery & Loading**

Scan node_modules for all plugin types, dynamically import, validate contract, route to type-specific registries.

```typescript
// src/services/plugin-registry.service.ts

/** Generic plugin registry service - manages all plugin types */
@injectable()
export class PluginRegistryService {
  private registries: Map<PluginType, IPluginRegistry<any>> = new Map();
  private watcher: FSWatcher | null = null;

  constructor(
    private providerPluginRegistry: ProviderPluginRegistry,
    // Future: GuardPluginRegistry, EvaluatorPluginRegistry, etc.
  ) {
    // Register type-specific registries
    this.registries.set(PluginType.PROVIDER, providerPluginRegistry);
    // Future: this.registries.set(PluginType.GUARD, guardPluginRegistry);
  }

  /** Scan node_modules and register all plugin types */
  async scanAndRegisterPlugins(): Promise<void> {
    const packageDirs = await this.scanNodeModules();

    for (const pkgPath of packageDirs) {
      try {
        await this.loadAndRegisterPlugin(pkgPath);
      } catch (error) {
        logger.error(`Failed to load plugin: ${pkgPath}`, error);
        // Skip failed plugins, don't crash worker
      }
    }

    await this.syncPluginsToDatabase();
  }

  /** Scan node_modules for @holokai/{type}-* patterns */
  private async scanNodeModules(): Promise<string[]> {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const patterns = [
      '@holokai/provider-*',
      '@holokai/guard-*',
      '@holokai/evaluator-*',
      '@holokai/logger-*'
    ];

    const allPackages: string[] = [];
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, { cwd: nodeModulesPath });
      allPackages.push(...matches.map(pkg => path.join(nodeModulesPath, pkg)));
    }

    return allPackages;
  }

  /** Load plugin and route to type-specific registry */
  private async loadAndRegisterPlugin(pkgPath: string): Promise<void> {
    const pluginModule = await import(pkgPath);
    const PluginClass = pluginModule.default;

    if (!PluginClass) {
      throw new Error(`Plugin at ${pkgPath} does not export default`);
    }

    const plugin: IPlugin = new PluginClass();

    // Validate base contract
    this.validatePlugin(plugin);

    // Route to type-specific registry
    const registry = this.registries.get(plugin.manifest.pluginType);
    if (!registry) {
      throw new Error(`No registry found for plugin type: ${plugin.manifest.pluginType}`);
    }

    registry.registerPlugin(plugin);

    logger.info(`Registered ${plugin.manifest.pluginType} plugin: ${plugin.manifest.packageName}@${plugin.manifest.version}`);
  }

  /** Hot-reload watcher */
  async enableHotReload(): Promise<void> {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules/@holokai');

    this.watcher = watch(nodeModulesPath, { persistent: true });

    this.watcher.on('change', async (eventType, filename) => {
      if (filename) {
        logger.info(`Detected change in ${filename}, reloading plugins...`);
        await this.scanAndRegisterPlugins();
      }
    });
  }

  /** Get type-specific registry */
  getRegistry<T extends IPlugin>(pluginType: PluginType): IPluginRegistry<T> | undefined {
    return this.registries.get(pluginType);
  }

  /** List all plugins across all types */
  listAllPlugins(): PluginManifest[] {
    const allPlugins: PluginManifest[] = [];
    for (const registry of this.registries.values()) {
      allPlugins.push(...registry.listPlugins());
    }
    return allPlugins;
  }
}
```

```typescript
// src/services/provider-plugin-registry.service.ts

/** Provider-specific plugin registry */
@injectable()
export class ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin> {
  private plugins: Map<string, IProviderPlugin> = new Map(); // providerType -> plugin

  registerPlugin(plugin: IProviderPlugin): void {
    const manifest = plugin.manifest as ProviderPluginManifest;
    this.plugins.set(manifest.providerType, plugin);
    logger.info(`Registered provider plugin: ${manifest.name} (${manifest.providerType})`);
  }

  getPlugin(providerType: string): IProviderPlugin | undefined {
    return this.plugins.get(providerType);
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  unregisterPlugin(providerType: string): void {
    this.plugins.delete(providerType);
  }
}
```

**3. Worker Integration**

Modify worker server to use plugin system with legacy fallback.

```typescript
// src/servers/worker.server.ts

@injectable()
export class WorkerServer extends withAdmin(withDB(withStats(BaseServer))) {
  constructor(
    private pluginRegistry: PluginRegistryService,
    private providerService: ProviderService,
    // ... existing dependencies
  ) {
    super();
  }

  async initialize(): Promise<void> {
    // 1. Discover and load plugins
    await this.pluginRegistry.scanAndRegisterPlugins();
    await this.pluginRegistry.enableHotReload();

    // 2. Load provider configurations from DB
    const providerConfigs = await this.loadProviderConfigs();

    // 3. Instantiate providers (plugin-aware)
    for (const config of providerConfigs) {
      const provider = await this.createProvider(config);
      this.providerService.registerProvider(config.slug, provider);
    }

    // ... rest of initialization
  }

  private async createProvider(config: ProviderConfig): Promise<AIProvider> {
    // NEW: Try plugin system first
    if (config.plugin_id) {
      const providerRegistry = this.pluginRegistry.getRegistry<IProviderPlugin>(PluginType.PROVIDER);

      if (providerRegistry) {
        const plugin = providerRegistry.getPlugin(config.provider_type);

        if (plugin) {
          logger.info(`Using plugin for ${config.slug}: ${plugin.manifest.packageName}`);
          return plugin.createProvider(config, this.responseService, this.workerId);
        } else {
          logger.warn(`Plugin not found for ${config.provider_type}, falling back to legacy`);
        }
      }
    }

    // LEGACY: Fallback to hardcoded providers
    return this.createLegacyProvider(config);
  }

  private createLegacyProvider(config: ProviderConfig): AIProvider {
    switch(config.provider_type) {
      case ProviderType.OPENAI:
        return new OpenAIProvider(config, this.responseService, this.workerId);
      case ProviderType.CLAUDE:
        return new ClaudeProvider(config, this.responseService, this.workerId);
      case ProviderType.OLLAMA:
        return new OllamaProvider(config, this.responseService, this.workerId);
      case ProviderType.PERPLEXITY:
        return new PerplexityProvider(config, this.responseService, this.workerId);
      default:
        throw new Error(`Unknown provider type: ${config.provider_type}`);
    }
  }
}
```

**4. OpenAI Plugin Package**

Extract OpenAI provider to standalone NPM package.

```typescript
// packages/provider-openai/src/index.ts

import { IProviderPlugin, PluginManifest, ProviderType } from '@holokai/holo-types';
import { OpenAIProvider } from './openai.provider';

export default class OpenAIProviderPlugin implements IProviderPlugin {
  readonly manifest: PluginManifest = {
    name: 'openai',
    version: '6.8.1',
    sdkVersion: '6.8.1',
    providerType: ProviderType.OPENAI,
    packageName: '@holokai/provider-openai',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
      functionCalling: true
    },
    contractVersion: '1.0.0',
    source: 'official'
  };

  createProvider(config, responseService, workerId) {
    return new OpenAIProvider(config, responseService, workerId);
  }

  async initialize(): Promise<void> {
    // Optional initialization hook
  }

  async destroy(): Promise<void> {
    // Optional cleanup hook
  }
}

// Named exports for flexibility
export { OpenAIProvider } from './openai.provider';
export { OpenAITranslator } from './translators/openai.translator';
```

```json
// packages/provider-openai/package.json
{
  "name": "@holokai/provider-openai",
  "version": "6.8.1",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "openai": "6.8.1"
  },
  "peerDependencies": {
    "arktype": "^2.1.22",
    "@holokai/holo-types": "^1.0.0"
  }
}
```

**5. Database Integration**

Add access layer for new tables (schema changes owned by DB team).

```typescript
// src/db/provider-plugin.db.ts (NEW)

export interface ProviderPluginRecord {
  id: string;
  provider_type: string;
  package_name: string;
  package_version: string;
  sdk_version: string;
  installed: boolean;
  installed_at: Date;
  capabilities: PluginCapabilities;
  manifest: PluginManifest;
}

export class ProviderPluginDB {
  async findAll(): Promise<ProviderPluginRecord[]> {
    const result = await this.db.query('SELECT * FROM provider_plugins WHERE installed = true');
    return result.rows;
  }

  async upsert(plugin: Partial<ProviderPluginRecord>): Promise<void> {
    await this.db.query(`
      INSERT INTO provider_plugins (id, provider_type, package_name, package_version, sdk_version, capabilities, manifest)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (package_name, package_version) DO UPDATE
      SET installed = true, installed_at = NOW()
    `, [plugin.id, plugin.provider_type, ...]);
  }
}
```

### Existing Patterns to Follow

**Dependency Injection:**
- Use `@injectable()` decorator on PluginRegistryService
- Register in tsyringe container
- Inject into WorkerServer constructor

**Error Handling:**
- Use Winston logger for all plugin operations
- Gracefully skip failed plugins (don't crash worker)
- Emit error metrics for monitoring

**Naming Conventions:**
- camelCase for variables/functions
- PascalCase for classes/interfaces
- File names match class names (plugin-registry.service.ts)

**Code Style (from existing codebase):**
- TypeScript strict mode enabled
- Async/await for asynchronous operations
- No semicolons (existing convention)
- Single quotes for strings
- 2-space indentation

**Testing Patterns:**
- Integration tests only (no unit tests, no mocks)
- Real provider API calls
- File naming: `*.test.ts`
- Jest framework with 30-second timeout

**Translator Pattern:**
- Maintain Holo universal format as hub
- Bidirectional translation (Holo ↔ Provider)
- ArkType validators for runtime safety

### Integration Points

**RabbitMQ (No Changes):**
- Request/response queues remain unchanged
- Worker still consumes from request queue
- Plugin system is internal to worker

**PostgreSQL (New Reads):**
- Read `provider_plugins` table (installed plugins)
- Read `providers` table with new fields (provider_plugin_id, provider_type)
- Write plugin discovery results to provider_plugins table

**File System:**
- Read node_modules/@holokai/provider-* directories
- File watcher on node_modules/@holokai for hot-reload

**Configuration Service (Existing):**
- Use existing ConfigService for provider config loading
- No changes to config event system

**Response Service (No Changes):**
- Plugin providers still inject ResponseService
- Response handling flow unchanged

---

## Development Context

### Relevant Existing Code

**Base Provider Implementation:**
- `src/providers/ai.provider.ts:10-150` - Abstract AIProvider class, template methods
- `src/providers/ai.provider.ts:IProvider` - Provider interface contract

**OpenAI Provider (to be extracted):**
- `src/providers/openai/openai.provider.ts` - Full OpenAI implementation
- `src/providers/openai/translators/` - Holo ↔ OpenAI translation logic
- `src/providers/openai/types/` - TypeScript type definitions
- `src/providers/openai/validators/` - ArkType validators

**Worker Server:**
- `src/servers/worker.server.ts:50-100` - Initialization and provider setup
- `src/servers/worker.server.ts:150-200` - Request processing logic

**Provider Service:**
- `src/services/provider.service.ts` - Provider registry and lookup

### Dependencies

**Framework/Libraries:**
- **Express:** 4.21.2 (HTTP server, no changes)
- **tsyringe:** 4.10.0 (dependency injection)
- **ArkType:** 2.1.22 (runtime validation) - PEER DEPENDENCY
- **Winston:** 3.18.3 (logging)
- **OpenAI SDK:** 6.8.1 (bundled in plugin package)

**Internal Modules:**
- `@/types` - Shared type definitions
- `@/services/response.service` - Response handling
- `@/services/queue.service` - RabbitMQ integration
- `@/db/app.db` - Database connection pool
- `@/utils/logger` - Winston logger instance

### Configuration Changes

**package.json (Root):**
```json
{
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "glob": "^10.3.10"  // For node_modules scanning
  }
}
```

**tsconfig.json (No changes):**
- Existing path aliases work for plugin system

**Environment Variables (No new vars):**
- Use existing DATABASE_URL, RABBITMQ_URL, etc.

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript 5.8.3 strict mode
- No semicolons
- Single quotes
- 2-space indentation
- camelCase for variables, PascalCase for classes

**Testing Standards:**
- Jest 29.7.0
- Integration tests only (NO unit tests, NO mocks)
- Real API calls to providers
- File pattern: `*.test.ts` in `tests/integration/`
- 30-second timeout per test

**Import Style:**
- ES modules (type: "module" in package.json)
- Path aliases from tsconfig (@/services, @/types)

**Error Handling:**
- Winston structured logging
- Try/catch with context logging
- Graceful degradation (skip failed plugins)

**Documentation:**
- Inline JSDoc for public APIs
- README per plugin package
- Markdown for guides

### Test Framework & Standards

**Framework:** Jest 29.7.0

**Configuration:** `jest.config.cjs`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**Testing Approach:**
- **Integration tests ONLY** - No unit tests, no mocks
- **Real provider API calls** - Test actual SDK behavior
- **Parity testing** - Verify legacy vs plugin produce identical results

**Test Organization:**
- `tests/integration/` - All integration tests
- `openai-legacy.test.ts` - Test hardcoded OpenAI provider
- `openai-plugin.test.ts` - Test plugin OpenAI provider
- `plugin-parity.test.ts` - Compare legacy vs plugin outputs

**Test Execution:**
```bash
npm run test:integration  # Run all integration tests
```

---

## Implementation Stack

**Runtime:**
- Node.js >= 18.0.0

**Language:**
- TypeScript 5.8.3

**Framework:**
- Express 4.21.2

**Message Queue:**
- RabbitMQ (amqplib 0.10.9)

**Database:**
- PostgreSQL (pg 8.11.3)

**Dependency Injection:**
- tsyringe 4.10.0

**Validation:**
- ArkType 2.1.22 (peer dependency for plugins)

**Logging:**
- Winston 3.18.3

**Testing:**
- Jest 29.7.0

**Build:**
- TypeScript Compiler (tsc)

**Provider SDKs:**
- OpenAI 6.8.1 (bundled in plugin)
- Anthropic 0.67.0 (legacy, not converted)
- Ollama 0.6.0 (legacy, not converted)

---

## Technical Details

### Plugin Package Structure

**Directory Layout:**
```
packages/provider-openai/
├── src/
│   ├── index.ts                    # Plugin entry point, default export
│   ├── openai.plugin.ts            # IProviderPlugin implementation
│   ├── openai.provider.ts          # AIProvider implementation (moved from core)
│   ├── translators/                # Holo ↔ OpenAI translation
│   │   ├── request.translator.ts
│   │   ├── response.translator.ts
│   │   └── streaming/
│   ├── types/                      # TypeScript types
│   │   └── openai.types.ts
│   └── validators/                 # ArkType validators
│       └── openai.validators.ts
├── package.json                    # NPM manifest
├── tsconfig.json                   # TypeScript config
└── README.md                       # Plugin documentation
```

### Plugin Contract Validation

**Runtime Validation:**
```typescript
function validatePlugin(plugin: any): asserts plugin is IProviderPlugin {
  if (!plugin.manifest) {
    throw new Error('Plugin missing manifest');
  }

  if (typeof plugin.createProvider !== 'function') {
    throw new Error('Plugin missing createProvider method');
  }

  // Validate manifest structure
  const requiredFields = ['name', 'version', 'sdkVersion', 'providerType', 'packageName'];
  for (const field of requiredFields) {
    if (!(field in plugin.manifest)) {
      throw new Error(`Plugin manifest missing field: ${field}`);
    }
  }

  // Validate contractVersion compatibility
  const pluginContractVersion = semver.major(plugin.manifest.contractVersion);
  const expectedContractVersion = 1;

  if (pluginContractVersion !== expectedContractVersion) {
    throw new Error(`Plugin contract version mismatch: expected 1.x, got ${plugin.manifest.contractVersion}`);
  }
}
```

### Hot-Reload Mechanism

**File Watcher Strategy:**
- Watch `node_modules/@holokai/` directory
- Detect new directories (new plugin installed)
- Trigger plugin scan on change
- Clear Node.js module cache before re-import
- Re-register plugin in registry

**Cache Invalidation:**
```typescript
function clearModuleCache(modulePath: string): void {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];

  // Clear dependencies
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(path.dirname(resolved))) {
      delete require.cache[key];
    }
  });
}
```

### Database Sync Strategy

**After Plugin Scan:**
1. Load all discovered plugins
2. Query existing provider_plugins records
3. Upsert discovered plugins (package_name + package_version unique)
4. Mark plugins as installed=true
5. Set installed_at timestamp

**Schema Assumptions (DB team owns):**
```sql
-- provider_plugins table
CREATE TABLE provider_plugins (
  id UUID PRIMARY KEY,
  provider_type VARCHAR(50) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  package_version VARCHAR(50) NOT NULL,
  sdk_version VARCHAR(50) NOT NULL,
  installed BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT NOW(),
  capabilities JSONB,
  manifest JSONB,
  UNIQUE(package_name, package_version)
);

-- providers table (existing, add columns)
ALTER TABLE providers
  ADD COLUMN provider_plugin_id UUID REFERENCES provider_plugins(id),
  ADD COLUMN provider_type VARCHAR(50);

-- Existing columns:
-- id, slug, organization_id, name, api_key, base_url, config, enabled, created_at, updated_at
```

### Error Handling Strategy

**Plugin Load Failures:**
- Log error with full context (package name, error message, stack trace)
- Skip failed plugin, continue with others
- Worker starts successfully even if some plugins fail
- Emit metrics for monitoring

**Missing Plugin at Runtime:**
- If provider config references plugin that's not loaded
- Log warning
- Fall back to legacy provider if available
- If no fallback, return error to client

**Plugin Crash During Request:**
- Existing error handling in AIProvider.wrapWithStats() catches
- Error logged and returned to client
- Worker remains stable

### Security Considerations

**Plugin Trust Model:**
- MVP: Only official @holokai packages (controlled by core team)
- Plugins have full access to worker process (no sandboxing)
- Plugins can access all worker dependencies

**Future Security (post-MVP):**
- Plugin verification/signing
- Community plugin approval workflow
- Sandboxing/isolation (separate processes)
- Permission system (limit database/network access)

### Performance Considerations

**Plugin Load Time:**
- Plugins loaded once at worker startup
- Hot-reload triggers full re-scan (acceptable for MVP)
- Lazy loading not implemented (all plugins loaded upfront)

**Memory Usage:**
- Each plugin loaded into worker memory
- Multiple worker processes = multiple plugin copies (expected)

**Request Latency:**
- Plugin lookup is O(1) Map access (negligible)
- Provider instantiation same as legacy (no performance regression)

---

## Development Setup

**Prerequisites:**
- Node.js >= 18.0.0
- npm >= 8.0.0
- RabbitMQ running (localhost or configured URL)
- PostgreSQL running (localhost or configured URL)

**Installation:**
```bash
# Clone repository (if not already)
cd /Users/alexduan/Projects/nova/llm-proxy

# Install dependencies
npm install

# Install OpenAI plugin (after package published)
npm install @holokai/provider-openai@6.8.1
```

**Database Setup:**
- Coordinate with DB team to run migrations
- Ensure provider_plugins table exists
- Ensure providers table has new columns

**Development Servers:**
```bash
# Terminal 1: API Server
npm run api:dev

# Terminal 2: Worker Server (with plugin support)
npm run worker:dev

# Terminal 3: Audit Server
npm run audit:dev
```

**Build:**
```bash
# Compile TypeScript to JavaScript
npm run build

# Type check without building
npm run type-check
```

**Testing:**
```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- openai-plugin.test.ts
```

---

## Implementation Guide

### Setup Steps

**1. Coordinate with Database Team**
- Provide schema definitions for provider_plugins table
- Confirm providers table column additions
- Wait for migrations to complete

**2. Create Plugin Types**
- Define IProviderPlugin interface
- Define PluginManifest type
- Define supporting types (PluginCapabilities, PluginSource)
- File: `src/types/plugin.types.ts`

**3. Implement PluginRegistryService**
- Scanner for @holokai/provider-* packages
- Dynamic plugin loader
- Plugin validation
- Hot-reload with file watcher
- Database sync
- File: `src/services/plugin-registry.service.ts`

**4. Update Worker Server**
- Inject PluginRegistryService
- Add plugin initialization before provider loading
- Add plugin-aware provider factory
- Maintain legacy provider fallback
- File: `src/servers/worker.server.ts`

**5. Create OpenAI Plugin Package**
- Create `packages/provider-openai/` directory
- Move OpenAI provider code from `src/providers/openai/`
- Implement IProviderPlugin interface
- Add package.json with dependencies
- Build and test locally

**6. Add Database Access Layer**
- Create ProviderPluginDB class
- Implement findAll, upsert methods
- File: `src/db/provider-plugin.db.ts`

**7. Write Integration Tests**
- Test legacy OpenAI provider (baseline)
- Test plugin OpenAI provider
- Test parity (identical outputs)
- Files: `tests/integration/openai-*.test.ts`

**8. Documentation**
- Update README with plugin system overview
- Create plugin development guide
- Document migration process for other providers

### Implementation Steps

**Story 1: Plugin Contract & Types**
1. Create `src/types/plugin.types.ts`
   - Define IPlugin base interface
   - Define PluginManifest base type
   - Define PluginType enum (provider/guard/evaluator/logger)
   - Define PluginSource type (official/community/marketplace)
   - Define IPluginRegistry<T> generic interface
2. Create `src/types/provider-plugin.types.ts`
   - Define IProviderPlugin interface (extends IPlugin)
   - Define ProviderPluginManifest type (extends PluginManifest)
   - Define ProviderCapabilities type
3. Export from `src/types/index.ts`
4. Commit: "feat: add generic plugin contract with provider plugin types"

**Story 2: Generic Plugin Registry Services**
1. Create `src/services/plugin-registry.service.ts` (generic)
   - Implement node_modules scanner (glob patterns @holokai/{type}-*)
   - Implement dynamic plugin loader (import + validate)
   - Manage type-specific registries (Map<PluginType, IPluginRegistry>)
   - Route plugins to appropriate type-specific registry
   - Implement hot-reload with fs.watch (all plugin types)
   - Add error handling (skip failed plugins)
   - Add database sync (upsert to plugins table)
2. Create `src/services/provider-plugin-registry.service.ts` (provider-specific)
   - Implement IPluginRegistry<IProviderPlugin>
   - Provider plugin registration (Map storage by providerType)
   - getPlugin, listPlugins, unregisterPlugin methods
3. Register both services in tsyringe container
4. Commit: "feat: implement generic plugin registry with provider plugin registry"

**Story 3: Worker Integration**
1. Update `src/servers/worker.server.ts`
2. Inject PluginRegistryService in constructor
3. Call scanAndRegisterPlugins() in initialize()
4. Enable hot-reload after plugin scan
5. Update provider factory (check plugin_id field)
6. Get ProviderPluginRegistry from PluginRegistryService
7. Add plugin-based provider creation
8. Maintain legacy provider fallback
9. Add logging for plugin vs legacy routing
10. Commit: "feat: integrate plugin system into worker server"

**Story 4: OpenAI Plugin Package**
1. Create `packages/provider-openai/` directory
2. Create package.json with dependencies
   - openai: 6.8.1
   - peerDependencies: arktype, @holokai/holo-types
3. Create tsconfig.json
4. Move OpenAI provider code from `src/providers/openai/` to `packages/provider-openai/src/`
5. Create plugin entry point: `src/index.ts`
6. Implement OpenAIProviderPlugin class (IProviderPlugin)
7. Export plugin class as default
8. Build plugin package locally
9. Update root package.json with workspace config
10. Test plugin loads in worker
11. Commit: "feat: extract OpenAI provider to plugin package"

**Story 5: Testing & Validation**
1. Create `tests/integration/openai-legacy.test.ts`
   - Test hardcoded OpenAI provider
   - Real API calls (chat completion, streaming)
   - Capture baseline behavior
2. Create `tests/integration/openai-plugin.test.ts`
   - Test plugin-loaded OpenAI provider
   - Same API calls as legacy test
3. Create `tests/integration/plugin-parity.test.ts`
   - Run identical requests through legacy and plugin
   - Assert responses are identical (or equivalent)
   - Test streaming parity
4. Update database with test provider records
   - Legacy provider (provider_plugin_id = null)
   - Plugin provider (provider_plugin_id = valid UUID)
5. Run integration tests: `npm run test:integration`
6. Fix any failing tests
7. Commit: "test: add integration tests for plugin system"

### Testing Strategy

**Integration Tests Only - No Mocks**

**Test File 1: openai-legacy.test.ts**
```typescript
describe('OpenAI Legacy Provider', () => {
  it('should complete chat request', async () => {
    const provider = new OpenAIProvider(config, responseService, workerId);
    const response = await provider.handleLLMRequest(...);
    expect(response).toBeDefined();
    expect(response.content).toContain('...');
  });

  it('should stream chat response', async () => {
    // Test streaming with real API
  });
});
```

**Test File 2: openai-plugin.test.ts**
```typescript
describe('OpenAI Plugin Provider', () => {
  it('should load plugin and complete chat request', async () => {
    const plugin = await pluginRegistry.getPlugin('openai');
    const provider = plugin.createProvider(config, responseService, workerId);
    const response = await provider.handleLLMRequest(...);
    expect(response).toBeDefined();
    expect(response.content).toContain('...');
  });

  it('should stream chat response', async () => {
    // Test streaming with real API
  });
});
```

**Test File 3: plugin-parity.test.ts**
```typescript
describe('Plugin vs Legacy Parity', () => {
  it('should produce identical non-streaming responses', async () => {
    const legacyProvider = new OpenAIProvider(config, responseService, 'legacy');
    const plugin = await pluginRegistry.getPlugin('openai');
    const pluginProvider = plugin.createProvider(config, responseService, 'plugin');

    const request = { /* identical request */ };

    const legacyResponse = await legacyProvider.handleLLMRequest(...);
    const pluginResponse = await pluginProvider.handleLLMRequest(...);

    expect(pluginResponse.content).toEqual(legacyResponse.content);
    expect(pluginResponse.usage).toEqual(legacyResponse.usage);
  });

  it('should produce equivalent streaming responses', async () => {
    // Compare streaming chunks
  });
});
```

**Test Execution:**
```bash
npm run test:integration
```

**Expected Results:**
- All legacy tests pass (baseline)
- All plugin tests pass (new implementation)
- Parity tests pass (identical behavior)

### Acceptance Criteria

**Story 1 - Plugin Contract:**
- [ ] IPlugin base interface defined (manifest, initialize, destroy)
- [ ] PluginManifest base type includes all fields (name, version, packageName, pluginType, etc.)
- [ ] PluginType enum defined (provider/guard/evaluator/logger)
- [ ] PluginSource type defined (official/community/marketplace)
- [ ] IPluginRegistry<T> generic interface defined
- [ ] IProviderPlugin interface defined (extends IPlugin, adds createProvider)
- [ ] ProviderPluginManifest type defined (extends PluginManifest, adds providerType, sdkVersion)
- [ ] ProviderCapabilities type defined
- [ ] All types exported from src/types/index.ts
- [ ] TypeScript compiles without errors

**Story 2 - Generic Plugin Registry:**
- [ ] PluginRegistryService scans node_modules/@holokai/{type}-* patterns (provider, guard, evaluator, logger)
- [ ] Service dynamically imports plugin packages
- [ ] Service validates plugins against IPlugin base contract
- [ ] Service routes plugins to type-specific registries based on pluginType
- [ ] Service manages Map<PluginType, IPluginRegistry>
- [ ] Service syncs discovered plugins to plugins database table (generic)
- [ ] Service implements hot-reload with file watcher (watches all plugin types)
- [ ] Failed plugins are logged and skipped (don't crash worker)
- [ ] ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin>
- [ ] ProviderPluginRegistry stores plugins by providerType
- [ ] Both services registered in tsyringe DI container

**Story 3 - Worker Integration:**
- [ ] Worker injects PluginRegistryService
- [ ] Worker calls scanAndRegisterPlugins() at startup
- [ ] Worker enables hot-reload after plugin scan
- [ ] Worker checks plugin_id when creating providers
- [ ] Worker retrieves ProviderPluginRegistry from PluginRegistryService
- [ ] Worker uses plugin system when plugin_id is set
- [ ] Worker falls back to legacy when plugin_id is null
- [ ] Worker logs whether using plugin or legacy for each provider
- [ ] Worker starts successfully even if plugin system fails

**Story 4 - OpenAI Plugin Package:**
- [ ] packages/provider-openai/ directory created
- [ ] package.json includes openai SDK 6.8.1
- [ ] package.json defines arktype as peer dependency
- [ ] OpenAI provider code moved from src/providers/openai/
- [ ] OpenAIProviderPlugin class implements IProviderPlugin
- [ ] Plugin manifest includes pluginType = PluginType.PROVIDER
- [ ] Plugin manifest includes providerType = ProviderType.OPENAI
- [ ] Plugin manifest includes all required fields
- [ ] Plugin exports default class
- [ ] Plugin package builds successfully (npm run build)
- [ ] Plugin can be imported by worker
- [ ] Plugin creates functional OpenAIProvider instance

**Story 5 - Testing & Validation:**
- [ ] openai-legacy.test.ts tests hardcoded provider
- [ ] openai-plugin.test.ts tests plugin-loaded provider
- [ ] plugin-parity.test.ts compares legacy vs plugin outputs
- [ ] All tests use real OpenAI API (no mocks)
- [ ] Non-streaming requests tested
- [ ] Streaming requests tested
- [ ] All integration tests pass
- [ ] Legacy and plugin produce identical/equivalent results
- [ ] Test coverage documented

---

## Developer Resources

### File Paths Reference

**New Files:**
- `/src/types/plugin.types.ts` - Plugin contract interfaces
- `/src/services/plugin-registry.service.ts` - Plugin discovery and loading
- `/src/db/provider-plugin.db.ts` - Database access for provider_plugins table
- `/packages/provider-openai/src/index.ts` - OpenAI plugin entry point
- `/packages/provider-openai/src/openai.plugin.ts` - Plugin implementation
- `/packages/provider-openai/package.json` - Plugin package manifest
- `/tests/integration/openai-legacy.test.ts` - Legacy provider tests
- `/tests/integration/openai-plugin.test.ts` - Plugin provider tests
- `/tests/integration/plugin-parity.test.ts` - Parity verification

**Modified Files:**
- `/src/servers/worker.server.ts` - Add plugin system integration
- `/src/services/provider.service.ts` - Support plugin-based providers
- `/package.json` - Add workspaces configuration

**Moved Files (from core to plugin):**
- `/src/providers/openai/` → `/packages/provider-openai/src/`

### Key Code Locations

**Plugin Contract:**
- `src/types/plugin.types.ts:10` - IProviderPlugin interface
- `src/types/plugin.types.ts:25` - PluginManifest type

**Plugin Registry:**
- `src/services/plugin-registry.service.ts:20` - scanAndRegisterPlugins() method
- `src/services/plugin-registry.service.ts:45` - loadAndRegisterPlugin() method
- `src/services/plugin-registry.service.ts:80` - enableHotReload() method
- `src/services/plugin-registry.service.ts:95` - getPlugin() method

**Worker Integration:**
- `src/servers/worker.server.ts:50` - Worker initialize() method
- `src/servers/worker.server.ts:75` - createProvider() method (plugin-aware)
- `src/servers/worker.server.ts:100` - createLegacyProvider() method (fallback)

**OpenAI Plugin:**
- `packages/provider-openai/src/index.ts:1` - Plugin entry point
- `packages/provider-openai/src/openai.plugin.ts:10` - OpenAIProviderPlugin class
- `packages/provider-openai/src/openai.provider.ts` - OpenAIProvider (moved)

**Database Access:**
- `src/db/provider-plugin.db.ts:15` - ProviderPluginDB class
- `src/db/provider-plugin.db.ts:25` - findAll() method
- `src/db/provider-plugin.db.ts:35` - upsert() method

### Testing Locations

**Integration Tests:**
- `tests/integration/openai-legacy.test.ts` - Legacy provider baseline
- `tests/integration/openai-plugin.test.ts` - Plugin provider validation
- `tests/integration/plugin-parity.test.ts` - Legacy vs plugin comparison

**Test Execution:**
```bash
npm run test:integration                         # All integration tests
npm run test:integration -- openai-legacy.test.ts # Specific test file
```

### Documentation to Update

**Repository Documentation:**
- `README.md` - Add plugin system overview section
- `docs/architecture.md` - Update with plugin architecture
- `docs/development-guide.md` - Add plugin development section

**New Documentation:**
- `docs/plugin-development-guide.md` - How to create provider plugins
- `docs/plugin-migration-guide.md` - How to migrate remaining providers
- `packages/provider-openai/README.md` - OpenAI plugin usage

---

## UX/UI Considerations

**No UI/UX impact** - Backend/infrastructure change only.

This is a worker-level architectural change with no direct user-facing interface modifications. All interactions remain through existing API endpoints.

**Administrative UX (Future):**
- Admin UI for plugin management (install, enable, disable)
- Provider instance configuration UI (link to installed plugins)
- Plugin marketplace browsing (post-MVP)

---

## Testing Approach

### Test Framework

**Framework:** Jest 29.7.0

**Test Type:** Integration tests only (no unit tests, no mocks)

**Test Execution:**
```bash
npm run test:integration  # Runs all tests in tests/integration/
```

### Testing Philosophy

**Real Provider API Calls:**
- All tests use actual OpenAI API
- No mocking of SDK clients
- Verify real-world behavior

**Parity Testing:**
- Run identical requests through legacy and plugin implementations
- Compare responses for equivalence
- Ensure no behavioral regressions

**Error Scenarios:**
- Test missing plugins (graceful degradation)
- Test invalid plugin packages (skip and log)
- Test plugin crashes (worker remains stable)

### Test Strategy

**Test Suite 1: Legacy Provider (Baseline)**
- Chat completion (non-streaming)
- Chat completion (streaming)
- Tool/function calling
- Vision requests
- Error handling

**Test Suite 2: Plugin Provider (New Implementation)**
- Same tests as legacy suite
- Plugin load validation
- Provider instantiation from plugin

**Test Suite 3: Parity Verification**
- Run parallel requests through legacy and plugin
- Assert identical responses
- Compare usage metrics
- Compare streaming chunks

**Test Suite 4: Plugin System**
- Plugin scanner discovers @holokai/provider-openai
- Plugin loader validates contract
- Plugin registry stores and retrieves plugins
- Hot-reload detects new plugins

### Test Coverage

**Acceptance Criteria Coverage:**
- [ ] All Story 1 acceptance criteria tested (types compile)
- [ ] All Story 2 acceptance criteria tested (plugin registry functionality)
- [ ] All Story 3 acceptance criteria tested (worker integration)
- [ ] All Story 4 acceptance criteria tested (plugin package)
- [ ] All Story 5 acceptance criteria tested (integration tests)

**Code Coverage:**
- Integration tests validate end-to-end flows
- No unit test coverage metrics (not applicable)

---

## Deployment Strategy

### Deployment Steps

**Phase 1: Database Preparation**
1. Coordinate with DB team to deploy provider_plugins table
2. Coordinate with DB team to add columns to providers table
3. Verify schema changes in staging environment
4. Backfill existing providers with provider_type field

**Phase 2: Deploy Plugin System (Backwards Compatible)**
1. Deploy Holo platform with plugin system code (Stories 1-3)
2. Worker starts normally, no plugins installed yet
3. All providers use legacy code path (provider_plugin_id = null)
4. Verify no regressions in staging

**Phase 3: Deploy OpenAI Plugin**
1. Publish @holokai/provider-openai@6.8.1 to NPM registry
2. Install plugin in staging: `npm install @holokai/provider-openai@6.8.1`
3. Restart worker (or trigger hot-reload)
4. Verify plugin discovered and registered
5. Update ONE test provider record in database: set provider_plugin_id
6. Verify plugin-based provider works correctly
7. Monitor for errors/regressions

**Phase 4: Gradual Migration**
1. Identify production OpenAI provider instances
2. Update provider records one-by-one (set provider_plugin_id)
3. Monitor each instance for issues
4. Rollback individual instances if needed (set provider_plugin_id = null)

**Phase 5: Full Migration**
1. After all OpenAI instances verified stable
2. Remove legacy OpenAI provider import from worker (optional)
3. Document success, prepare for next provider migration

### Rollback Plan

**Rollback Scenario 1: Plugin System Regression**
1. Revert Holo platform to previous version (without plugin system)
2. All providers use legacy code path
3. No database changes needed

**Rollback Scenario 2: OpenAI Plugin Issues**
1. Update provider records: set provider_plugin_id = null
2. Worker falls back to legacy OpenAI provider
3. Uninstall plugin: `npm uninstall @holokai/provider-openai`
4. Restart worker (or wait for hot-reload)

**Rollback Scenario 3: Individual Instance Issues**
1. Update specific provider record: set provider_plugin_id = null
2. That instance uses legacy, others continue with plugin
3. Investigate issue, fix, re-enable plugin for that instance

### Monitoring Approach

**Metrics to Track:**
- Plugin load success/failure count
- Provider instantiation method (plugin vs legacy)
- Request success rate (legacy vs plugin)
- Request latency (legacy vs plugin)
- Plugin hot-reload events

**Logging:**
- Log plugin discovery results (packages found, loaded, failed)
- Log provider creation method (plugin or legacy)
- Log plugin hot-reload events
- Log errors with full context (plugin name, error message, stack trace)

**Alerts:**
- Alert on plugin load failures
- Alert on elevated error rates for plugin-based providers
- Alert on hot-reload failures

**Dashboards:**
- Plugin system health (plugins loaded, instances active)
- Legacy vs plugin usage breakdown
- Request success rate by provider method

---

## External Dependencies

### Database Schema Changes

**Owner:** External Database Project

The plugin system requires database schema modifications that are managed by a separate project. This project will provide:

**Required Tables:**

**Table: plugins (generic for all plugin types)**
```sql
CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_type VARCHAR(50) NOT NULL,           -- 'provider', 'guard', 'evaluator', 'logger'
  name VARCHAR(100) NOT NULL,                  -- 'openai', 'jwt-guard', etc.
  package_name VARCHAR(255) NOT NULL,
  package_version VARCHAR(50) NOT NULL,
  installed BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT NOW(),
  manifest JSONB NOT NULL,                     -- Full PluginManifest as JSON
  UNIQUE(package_name, package_version)
);

CREATE INDEX idx_plugins_type ON plugins(plugin_type);
CREATE INDEX idx_plugins_name ON plugins(name);
CREATE INDEX idx_plugins_installed ON plugins(installed);
```

**Table: providers (add columns)**
```sql
ALTER TABLE providers
  ADD COLUMN plugin_id UUID REFERENCES plugins(id),
  ADD COLUMN provider_type VARCHAR(50);

CREATE INDEX idx_providers_plugin_id ON providers(plugin_id);
CREATE INDEX idx_providers_type ON providers(provider_type);
```

**Notes:**
- `plugins` table is generic and stores all plugin types (provider, guard, evaluator, logger)
- `manifest` JSONB field stores full plugin manifest (type-specific fields included)
- Provider-specific fields (e.g., `sdk_version`, `provider_type`) stored in manifest JSON
- Future: guards, evaluators, loggers will reference `plugins` table similarly

**Data Migration:**
```sql
-- Backfill provider_type for existing providers
UPDATE providers SET provider_type = 'openai' WHERE /* existing logic to identify OpenAI */;
UPDATE providers SET provider_type = 'claude' WHERE /* existing logic to identify Claude */;
UPDATE providers SET provider_type = 'ollama' WHERE /* existing logic to identify Ollama */;
UPDATE providers SET provider_type = 'perplexity' WHERE /* existing logic to identify Perplexity */;

-- plugin_id remains NULL for legacy providers (fallback behavior)
```

**Implementation Coordination:**
- Provide table definitions to DB team (above)
- DB team implements migrations in their project
- DB team deploys migrations to staging/production
- Holo project waits for migrations before Phase 1 deployment

### NPM Package Registry

**Owner:** Holo Core Team (for official packages)

**Required Actions:**
1. Create @holokai NPM organization (if not exists)
2. Configure NPM access tokens for CI/CD
3. Publish @holokai/provider-openai@6.8.1
4. Set up package versioning strategy

**Package Publishing:**
```bash
cd packages/provider-openai
npm publish --access public
```

### Provider APIs

**No changes required** - External provider APIs (OpenAI, Claude, etc.) remain unchanged. Plugin system is internal to Holo.

---

## Risks & Mitigations

### Risk 1: Plugin Load Failures

**Risk:** Plugin package missing or fails to load, breaking provider functionality.

**Mitigation:**
- Graceful degradation: Skip failed plugins, log errors
- Fallback to legacy providers (during migration phase)
- Monitoring and alerts on plugin load failures

### Risk 2: Contract Version Mismatches

**Risk:** Plugin built for old contract version, incompatible with current platform.

**Mitigation:**
- Validate contractVersion in plugin manifest
- Reject plugins with major version mismatches
- Document breaking changes in contract versions
- Semantic versioning for contract (1.0.0, 2.0.0, etc.)

### Risk 3: Hot-Reload Instability

**Risk:** File watcher triggers excessive reloads, or fails to detect changes.

**Mitigation:**
- Debounce file system events (wait 1 second before reload)
- Log all reload events for debugging
- Manual reload endpoint as fallback (if needed)
- Thoroughly test hot-reload in staging

### Risk 4: Database Schema Delays

**Risk:** DB team delays schema changes, blocking plugin system deployment.

**Mitigation:**
- Early coordination with DB team
- Provide complete schema definitions upfront
- Design plugin system to work without DB sync (in-memory only) as fallback
- Staged rollout: deploy plugin system first, enable features after DB ready

### Risk 5: Performance Regression

**Risk:** Plugin system adds latency or memory overhead.

**Mitigation:**
- Plugin lookup is O(1) Map access (negligible)
- Load plugins once at startup (not per-request)
- Benchmark legacy vs plugin request latency
- Monitor memory usage in production

### Risk 6: OpenAI Plugin Package Issues

**Risk:** Bugs in extracted OpenAI plugin break functionality.

**Mitigation:**
- Comprehensive integration tests (parity testing)
- Gradual rollout (one instance at a time)
- Easy rollback (set provider_plugin_id = null)
- Keep legacy code in platform during migration

---

## Future Enhancements (Post-MVP)

**Phase 2: Migrate Remaining Providers**
- Convert Claude, Ollama, Perplexity to plugin packages
- Deprecate legacy provider code
- Remove hardcoded imports from worker

**Phase 3: Implement Other Plugin Types**
- Guard plugins (@holokai/guard-*)
- Evaluator plugins (@holokai/evaluator-*)
- Logger plugins (@holokai/logger-*)
- Type-specific registries for each (GuardPluginRegistry, etc.)

**Phase 4: Community Plugin Support**
- Discover holo-provider-*, holo-guard-*, etc. (any NPM scope)
- Plugin verification workflow (manual approval)
- Community plugin documentation

**Phase 5: Multi-Version Support**
- Load multiple versions of same provider type
- Instance-level SDK version selection
- Version routing logic

**Phase 6: Plugin Marketplace**
- Admin UI for plugin browsing
- One-click install from marketplace
- Plugin ratings and reviews
- Paid plugins support

**Phase 7: Advanced Features**
- Plugin health checks (validate on load)
- Plugin sandboxing (separate processes)
- Plugin permission system (limit access)
- Automated plugin updates

---

## Summary

**What We're Building:**
A provider plugin system that decouples provider SDK dependencies from the Holo platform core, enabling independent versioning, hot-loading, and future community extensibility.

**Why It Matters:**
- **Eliminates deployment coupling** - SDK updates no longer require platform redeployments
- **Enables version flexibility** - Future support for multiple SDK versions per provider
- **Opens ecosystem** - Foundation for community-contributed providers

**How It Works:**
1. Providers become NPM packages implementing IProviderPlugin contract
2. PluginRegistryService discovers and loads plugins at runtime
3. Worker server uses plugins to create provider instances
4. Legacy providers remain as fallback during migration
5. Hot-reload enables adding new plugins without restart

**What's In Scope:**
- Plugin contract interfaces and types
- PluginRegistryService (discovery, loading, hot-reload)
- Worker integration with legacy fallback
- Convert OpenAI to plugin package
- Integration tests (parity verification)

**What's Out of Scope:**
- Database schema changes (external DB project)
- Community plugin support
- Multi-version provider support
- Claude/Ollama/Perplexity migrations (Phase 2)

**Success Criteria:**
- OpenAI plugin produces identical results to legacy implementation
- Worker starts successfully with plugin system
- Hot-reload detects and loads new plugins
- Easy rollback to legacy if needed
- Foundation for migrating remaining providers

This is an **architectural investment** that enables future flexibility, maintainability, and ecosystem growth.
