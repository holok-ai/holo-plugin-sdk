# holo - Epic Breakdown

**Author:** BMad
**Date:** 2025-11-20
**Project Level:** High Complexity (Infrastructure Platform / Developer Tooling)
**Target Scale:** Enterprise AI Infrastructure - Brownfield Refactoring

---

## Overview

This document provides the complete epic and story breakdown for holo, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This epic breakdown incorporates technical decisions from the Architecture document. It will evolve as implementation progresses.

---

## Functional Requirements Inventory

### Common SDK Package (@holokai/common) - 9 FRs
- **FR1:** Developers can install @holokai/common package via npm to access shared contracts
- **FR2:** Common SDK exports base plugin interface (IPlugin) with manifest, initialize, and destroy methods
- **FR3:** Common SDK exports plugin type enum (provider, guard, evaluator, logger, worker)
- **FR4:** Common SDK exports type-specific plugin interfaces (IProviderPlugin, IGuardPlugin, etc.)
- **FR5:** Common SDK exports PluginManifest type with required metadata fields
- **FR6:** Common SDK exports shared utility types used across Holo ecosystem
- **FR7:** Common SDK includes ArkType validators for contract enforcement
- **FR8:** Common SDK version is independently managed from core Holo platform
- **FR9:** Common SDK documentation explains all contracts and usage examples

### Plugin Discovery & Loading - 8 FRs
- **FR10:** System scans node_modules for installed plugin packages matching @holokai/{type}-* pattern
- **FR11:** System dynamically imports plugin packages at runtime
- **FR12:** System validates plugin exports match IPlugin contract structure
- **FR13:** System validates plugin manifest contains required fields (name, version, pluginType, etc.)
- **FR14:** System rejects plugins with incompatible contract versions
- **FR15:** System logs plugin load failures without crashing platform
- **FR16:** System skips failed plugins and continues with successfully loaded plugins
- **FR17:** System reports discovered plugins to central server (via configuration queue or API)

### Hot-Reload & Dynamic Updates - 6 FRs
- **FR18:** System watches node_modules/@holokai directory for changes
- **FR19:** System detects new plugin installations without platform restart
- **FR20:** System reloads modified plugins without platform restart
- **FR21:** System clears module cache before reloading plugins
- **FR22:** Workers detect plugin updates and refresh provider instances
- **FR23:** Plugin updates do not interrupt in-flight requests

### Plugin Registries (Type-Specific) - 6 FRs
- **FR24:** System maintains separate registries for each plugin type (provider, guard, worker, etc.)
- **FR25:** Generic PluginRegistryService routes plugins to type-specific registries
- **FR26:** Type-specific registries implement common IPluginRegistry interface
- **FR27:** Registries provide getPlugin, registerPlugin, unregisterPlugin, listPlugins methods
- **FR28:** Provider plugins are registered by providerType (openai, claude, etc.)
- **FR29:** Registries store plugins in memory for O(1) lookup performance

### Provider Plugin System - 8 FRs
- **FR30:** Provider plugins export default class implementing IProviderPlugin interface
- **FR31:** Provider plugins implement createProvider factory method
- **FR32:** Provider plugins bundle their own SDK dependencies (e.g., openai@6.8.1)
- **FR33:** Provider plugins declare ArkType as peer dependency (shared version)
- **FR34:** Provider plugin manifest includes providerType and sdkVersion fields
- **FR35:** Provider plugin manifest declares capabilities (streaming, tools, vision, etc.)
- **FR36:** Provider plugins can be published to NPM as independent packages
- **FR37:** Provider plugins follow naming convention @holokai/provider-{name}

### Worker Integration - 9 FRs
- **FR38:** Workers load PluginRegistryService at startup
- **FR39:** Workers scan and register all plugins before accepting requests
- **FR40:** Workers enable hot-reload after initial plugin scan
- **FR41:** Workers check provider plugin_id field when creating provider instances
- **FR42:** Workers use plugin-based provider if plugin_id is set
- **FR43:** Workers fall back to legacy hardcoded provider if plugin_id is null
- **FR44:** Workers log whether plugin or legacy provider is used for each instance
- **FR45:** Workers retrieve ProviderPluginRegistry from generic PluginRegistryService
- **FR46:** Workers start successfully even if plugin system fails to initialize

### Configuration Loading - 9 FRs
- **FR47:** Plugin configuration loaded via configuration queue (same pattern as existing Holo config)
- **FR48:** Central server provides plugin metadata (plugin_type, name, package_name, package_version)
- **FR49:** Configuration includes plugin manifest data
- **FR50:** Provider configurations reference plugin metadata via plugin_id
- **FR51:** Provider configurations include provider_type field
- **FR52:** System receives plugin configuration updates via queue without restart
- **FR53:** Legacy providers with null plugin_id continue to work (backward compatible)
- **FR54:** Configuration queue delivers both provider configs and plugin metadata
- **FR55:** Workers subscribe to configuration updates on startup

### Project Structure & Modularity - 6 FRs
- **FR56:** Provider plugins are extracted to packages/provider-{name}/ directories
- **FR57:** Core Holo types are separated from provider-specific types
- **FR58:** Plugin packages can import from @holokai/common without circular dependencies
- **FR59:** Core Holo code does not import from plugin packages
- **FR60:** Translators leverage Common SDK without depending on core Holo
- **FR61:** Clear import boundaries enforced between core, common, and plugins

### Testing & Validation - 7 FRs
- **FR62:** Integration tests verify legacy provider behavior (baseline)
- **FR63:** Integration tests verify plugin provider behavior (new implementation)
- **FR64:** Integration tests compare legacy vs plugin outputs for parity
- **FR65:** Tests use real provider APIs (no mocking)
- **FR66:** Tests verify streaming and non-streaming request parity
- **FR67:** Tests verify plugin hot-reload functionality
- **FR68:** System can detect and report plugin contract violations

### Plugin Developer Experience - 6 FRs
- **FR69:** Plugin developers can read comprehensive contract documentation
- **FR70:** Plugin developers can view official plugin examples (OpenAI reference implementation)
- **FR71:** Plugin developers can publish plugins to NPM independently
- **FR72:** Plugin developers receive clear error messages for contract violations
- **FR73:** Plugin manifest schema is documented with all required and optional fields
- **FR74:** Plugin lifecycle hooks (initialize, destroy) are documented with usage examples

### Migration & Backward Compatibility - 6 FRs
- **FR75:** Existing provider instances continue working during plugin migration (legacy fallback)
- **FR76:** System supports gradual migration (some providers plugin, some legacy simultaneously)
- **FR77:** No breaking changes to customer-facing APIs during transition
- **FR78:** Provider slugs and configurations remain unchanged
- **FR79:** Worker startup succeeds whether plugins are present or not
- **FR80:** Database schema changes are backward compatible with existing data

### IP Protection & Boundaries - 6 FRs
- **FR81:** Core Holo engine code (queue, orchestration, Holo format) remains in private repository
- **FR82:** Common SDK code is published to public NPM repository
- **FR83:** Official plugin packages are published to public NPM repository
- **FR84:** Plugin contracts expose only extension points, not core implementation
- **FR85:** Custom development can extend via plugins without accessing core codebase
- **FR86:** Outside developers can build plugins using only public Common SDK

### Future-Ready Design - 4 FRs
- **FR87:** Plugin manifest includes source field (official/community/marketplace) for future use
- **FR88:** Plugin system designed to support multiple plugin types beyond providers
- **FR89:** Database schema supports plugin versioning metadata (foundation for multi-version future)
- **FR90:** Plugin discovery pattern extensible to community packages (holo-provider-*) when ready

---

**Total:** 90 Functional Requirements across 13 capability areas

---

## Non-Functional Requirements Summary

### Performance (6 NFRs)
- **NFR1:** Plugin lookup performance must be O(1) (Map-based registry)
- **NFR2:** Plugin loading at startup must not increase worker initialization time by more than 5 seconds
- **NFR3:** Hot-reload must detect and load new plugins within 2 seconds of installation
- **NFR4:** Plugin-based provider request latency must match legacy provider latency (±5ms acceptable variance)
- **NFR5:** Memory overhead per loaded plugin must not exceed 10MB
- **NFR6:** System must support 20+ simultaneously loaded plugins without performance degradation

### Security (7 NFRs)
- **NFR7:** Plugins run in same process as worker (MVP - no sandboxing)
- **NFR8:** Plugin contracts must not expose internal Holo queue/orchestration implementation
- **NFR9:** Plugin loading must validate package signature (future - design consideration only)
- **NFR10:** Configuration queue plugin references must maintain data integrity
- **NFR11:** Plugin discovery must only scan @holokai/* scope in MVP (prevent arbitrary code execution)
- **NFR12:** Core Holo source code must remain in private repository (IP protection)
- **NFR13:** Common SDK and official plugins must be open-source (Apache 2.0 or MIT license)

### Scalability (5 NFRs)
- **NFR14:** Plugin system must support horizontal worker scaling (stateless plugin registries)
- **NFR15:** Plugin hot-reload must work consistently across multiple worker instances
- **NFR16:** Configuration queue must deliver plugin metadata efficiently for thousands of plugins
- **NFR17:** Plugin registry memory footprint must scale linearly with plugin count (O(n))
- **NFR18:** System must support 100+ provider instances referencing various plugin versions

### Integration & Compatibility (10 NFRs)
- **NFR19:** Plugin system must integrate with existing RabbitMQ queue architecture (no changes to queues)
- **NFR20:** Plugin system must integrate with existing configuration queue (no PostgreSQL dependency for plugin config)
- **NFR21:** Plugin system must work with existing tsyringe dependency injection
- **NFR22:** Provider plugins must work with existing response streaming (SSE)
- **NFR23:** Plugin system must support Node.js >= 18.0.0
- **NFR24:** Plugin packages must support TypeScript 5.x
- **NFR25:** ArkType version must be consistent across core and all plugins (peer dependency)
- **NFR26:** Customer-facing API endpoints must remain unchanged (backward compatible)
- **NFR27:** Existing provider configurations in queue must migrate to plugin system without data loss
- **NFR28:** Central server database schema changes are external dependency (not in Holo scope)

---

## Project Context

**Project Type:** Infrastructure Platform / Developer Tooling (Brownfield)

**Domain:** Enterprise AI Infrastructure

**Complexity Level:** High (production system, architectural migration, ecosystem design)

**MVP Scope (Phase 1):**
1. Common SDK (@holokai/common) - Published to NPM
2. Generic plugin system - Discovery, loading, validation, hot-reload
3. Provider plugin implementation - OpenAI as reference implementation
4. Project restructuring - Monorepo packages/ organization

**Success Gate:** OpenAI plugin works identically to legacy, hot-reload functional, Common SDK usable by external devs

**Product Differentiator:**
- Queue-based architecture with universal provider abstraction (Holo format) is core IP
- Modular platform balances open ecosystem (plugins) with protected core (proprietary engine)
- IP protection + safe extensibility + ecosystem growth = sustainable business model

**Technical Constraints:**
- Zero downtime requirement (production system)
- Backward compatibility mandatory (no breaking API changes)
- Existing infrastructure unchanged (RabbitMQ, PostgreSQL, tsyringe, Express)
- Node.js >= 18.0.0, TypeScript 5.x, ArkType validators
- Graceful degradation for production resilience

---

## Epic Structure Summary

This plugin system transformation is organized into **8 epics** that deliver incremental value to plugin developers, Holo operators, and the business:

### Epic 1: Foundation & Monorepo Setup
**Value:** Establishes project structure with clear IP boundaries (private core vs public plugins)
**Scope:** Monorepo organization, build tooling, workspace configuration, IP protection boundaries

### Epic 2: Common SDK Package (@holokai/common)
**Value:** Plugin developers can install and use shared contracts to build plugins
**Scope:** Plugin contracts, types, validators, subpath exports, NPM publishing

### Epic 3: Core Plugin Infrastructure
**Value:** System can discover, load, validate, and register plugins dynamically
**Scope:** Plugin discovery, loading, validation, type-specific registries, future-ready design

### Epic 4: Provider Plugin Framework
**Value:** Developers can create provider plugins with config queue integration
**Scope:** IProviderPlugin interface, createProvider factory, config queue plugin metadata, validation

### Epic 5: Hot-Reload System
**Value:** Operators can update plugins without downtime or service interruption
**Scope:** Distributed hot-reload, chokidar file watching, atomic registry swap, graceful degradation

### Epic 6: OpenAI Reference Plugin
**Value:** First working plugin demonstrates pattern, proves parity with legacy
**Scope:** Extract OpenAI to plugin package, integration tests, parity verification, reference implementation

### Epic 7: Worker Integration & Legacy Coexistence
**Value:** Production system uses plugins while maintaining stability and backward compatibility
**Scope:** Strategy pattern, worker startup integration, legacy fallback, gradual migration

### Epic 8: Developer Documentation & Experience
**Value:** External developers can build, test, and publish plugins independently
**Scope:** Comprehensive docs, examples, error messages, developer guides

**Why This Structure Works:**
- Each epic delivers value to plugin developers, operators, or the business
- Sequential dependencies flow naturally (Foundation → SDK → Core → Framework → Implementation)
- Enables incremental delivery and testing at each stage
- Epic 1 establishes foundation (acceptable for infrastructure projects)
- Epics 2-8 each enable new capabilities that users can immediately benefit from
- No technical layer anti-patterns (no "database epic" or "API epic")

---

## FR Coverage Map

| Epic | FRs Covered | Count |
|------|-------------|-------|
| **Epic 1: Foundation & Monorepo Setup** | FR56-61 (Project Structure), FR81-86 (IP Protection) | 12 FRs |
| **Epic 2: Common SDK Package** | FR1-9 (Common SDK) | 9 FRs |
| **Epic 3: Core Plugin Infrastructure** | FR10-17 (Discovery & Loading), FR24-29 (Registries), FR87-90 (Future-Ready) | 18 FRs |
| **Epic 4: Provider Plugin Framework** | FR30-37 (Provider Plugins), FR47-55 (Configuration) | 17 FRs |
| **Epic 5: Hot-Reload System** | FR18-23 (Hot-Reload) | 6 FRs |
| **Epic 6: OpenAI Reference Plugin** | FR62-68 (Testing & Validation) | 7 FRs |
| **Epic 7: Worker Integration & Legacy Coexistence** | FR38-46 (Worker Integration), FR75-80 (Migration) | 15 FRs |
| **Epic 8: Developer Documentation & Experience** | FR69-74 (Developer Experience) | 6 FRs |
| **TOTAL** | | **90 FRs** ✅ |

**Coverage Validation:** All 90 functional requirements are mapped to epics. No FRs are missing or unmapped.

---

## Epic 1: Foundation & Monorepo Setup

**Goal:** Establish monorepo structure with clear IP boundaries, enabling separate packaging and publishing of private core vs public plugins.

**Value Delivered:** Project foundation with packages/ organization allows independent development, building, and publishing of Common SDK and plugin packages while keeping core Holo proprietary.

**FRs Covered:** FR56-61 (Project Structure), FR81-86 (IP Protection)

---

### Story 1.1: Create Monorepo Workspace Structure

As a **platform architect**,
I want **to organize the codebase into a monorepo with packages/ directory**,
So that **Common SDK and plugins can be developed, built, and published independently from core Holo**.

**Acceptance Criteria:**

**Given** the existing llm-proxy codebase
**When** I create the monorepo structure
**Then** a packages/ directory exists at the project root
**And** npm workspaces is configured in root package.json
**And** the workspace includes "packages/*" pattern
**And** existing src/ directory remains unchanged (private core)
**And** .gitignore excludes packages/*/dist and packages/*/node_modules

**Prerequisites:** None (first story)

**Technical Notes:**
- Use npm workspaces (not yarn/pnpm for MVP)
- Root package.json: `"workspaces": ["packages/*"]`
- Enables `npm install` at root to install all workspace dependencies
- Enables cross-package references (e.g., @holokai/provider-openai depends on @holokai/common)
- Clear separation: src/ (private) vs packages/ (public/publishable)
- Architecture doc specifies top-level packages/ organization (not nested)

---

### Story 1.2: Configure TypeScript for Monorepo

As a **platform architect**,
I want **TypeScript configured for monorepo with composite projects**,
So that **workspace packages can reference each other with proper type-checking and incremental builds**.

**Acceptance Criteria:**

**Given** the monorepo workspace structure exists
**When** I configure TypeScript
**Then** root tsconfig.json includes composite: true and references: []
**And** each workspace package has its own tsconfig.json extending root config
**And** TypeScript path aliases are NOT used (rely on workspace resolution)
**And** packages can import from other packages using package names (e.g., @holokai/common/plugin)
**And** `npm run build` at root compiles all workspaces in dependency order
**And** IDE shows type errors across workspace boundaries

**Prerequisites:** Story 1.1 (workspace structure)

**Technical Notes:**
- Root tsconfig.json: `"composite": true, "references": [{ "path": "./packages/common" }, ...]`
- Each package tsconfig.json: `"extends": "../../tsconfig.json", "compilerOptions": { "outDir": "./dist", "rootDir": "./src" }`
- No path aliases - use subpath exports instead (Architecture ADR-001)
- Incremental builds via `--build` flag
- Strict mode enabled across all packages
- Existing src/ TypeScript config remains separate

---

### Story 1.3: Setup Build Scripts and Tooling

As a **platform architect**,
I want **consistent build, test, and clean scripts across all workspace packages**,
So that **developers can build/test individual packages or the entire monorepo reliably**.

**Acceptance Criteria:**

**Given** TypeScript is configured for monorepo
**When** I add build tooling
**Then** root package.json has scripts: "build", "test", "clean", "build:packages"
**And** each workspace package has scripts: "build", "test", "clean", "prepublishOnly"
**And** `npm run build` at root builds src/ (core) then packages/ (plugins)
**And** `npm run build:packages` builds only workspace packages
**And** `npm run test` runs tests for core and all packages
**And** `npm run clean` removes all dist/ directories
**And** prepublishOnly runs build automatically before npm publish
**And** build outputs are in each package's dist/ directory

**Prerequisites:** Story 1.2 (TypeScript config)

**Technical Notes:**
- Root scripts use `npm run build --workspaces` for parallel builds
- Individual package scripts: `"build": "tsc"`, `"clean": "rm -rf dist"`
- prepublishOnly ensures published packages include fresh builds
- Existing src/ build scripts remain unchanged (core Holo)
- Use `tsc --build` for incremental compilation
- Jest config updated to handle workspace packages

---

### Story 1.4: Configure Package Publishing Metadata

As a **platform architect**,
I want **workspace packages configured with correct NPM publishing metadata**,
So that **Common SDK and plugins can be published to public NPM with proper licensing and package info**.

**Acceptance Criteria:**

**Given** workspace packages exist with build tooling
**When** I configure publishing metadata
**Then** each workspace package.json includes name, version, description, author
**And** Common SDK package.json has name "@holokai/common"
**And** all packages have license "MIT" or "Apache-2.0" (open-source requirement)
**And** all packages have publishConfig: { access: "public" }
**And** all packages have repository, bugs, and homepage URLs pointing to public repo
**And** all packages have engines: { node: ">=18.0.0" }
**And** all packages have main, types, and exports fields correctly configured
**And** src/ (core Holo) package.json does NOT have publishConfig (private)

**Prerequisites:** Story 1.3 (build scripts)

**Technical Notes:**
- Follow Architecture ADR-001 for subpath exports in @holokai/common
- exports field: `{ "./plugin": "./dist/plugin/index.js", "./provider": "./dist/provider/index.js", ... }`
- types field: `{ "./plugin": "./dist/plugin/index.d.ts", ... }`
- Semantic versioning: Start with 0.1.0 for pre-release, 1.0.0 for stable
- Core Holo remains "private": true (unpublished)
- NFR13: Open-source license for plugins, proprietary for core

---

### Story 1.5: Establish Import Boundaries and Validation

As a **platform architect**,
I want **import boundaries enforced to prevent core Holo from importing plugin packages**,
So that **IP protection is maintained (plugins are public, core is private)**.

**Acceptance Criteria:**

**Given** monorepo structure is complete
**When** I establish import boundaries
**Then** packages/common/ can import NOTHING from src/ (core)
**And** packages/provider-*/ can import from @holokai/common only
**And** src/ (core) can import from @holokai/common if needed (one-way dependency)
**And** ESLint rules enforce no-restricted-imports for packages/
**And** attempted violations fail CI build
**And** documentation clearly states: "Core imports common (if needed), plugins import common, common imports nothing"

**Prerequisites:** Story 1.4 (publishing metadata)

**Technical Notes:**
- ESLint plugin: @typescript-eslint/no-restricted-imports
- Rule in packages/*/eslintrc: `"no-restricted-imports": ["error", { "patterns": ["**/src/**"] }]`
- Architecture specifies unidirectional dependency: server → api → core (FR59, FR61)
- Core can optionally use common for shared types, but NOT plugin implementations
- This enforces IP boundary: plugins expose only contracts, not core logic (FR84)
- CI validation: `npm run lint` must pass before merge

---

### Story 1.6: Create README and Monorepo Documentation

As a **platform architect**,
I want **clear documentation explaining monorepo organization and development workflow**,
So that **team members and external contributors understand how to work with workspace packages**.

**Acceptance Criteria:**

**Given** monorepo structure and tooling are complete
**When** I create documentation
**Then** root README.md explains monorepo organization
**And** README includes section "Project Structure" with packages/ explanation
**And** README includes section "Development Workflow" with build/test commands
**And** README includes section "Publishing Packages" with npm publish steps
**And** packages/common/README.md explains Common SDK usage
**And** each plugin package has README with installation and usage examples
**And** documentation clarifies: src/ is private, packages/ are public

**Prerequisites:** Story 1.5 (import boundaries)

**Technical Notes:**
- Root README: High-level overview, link to detailed docs
- Common SDK README: API documentation, contract examples
- Plugin README template: Installation, usage, development, publishing
- Include commands: `npm install`, `npm run build`, `npm test`, `npm publish`
- Link to Architecture doc for design decisions
- Include IP protection explanation (why src/ vs packages/ separation)
- FR69: Comprehensive contract documentation for plugin developers

---

## Epic 2: Common SDK Package (@holokai/common)

**Goal:** Create and publish @holokai/common package with plugin contracts, types, and validators that external developers can use to build plugins.

**Value Delivered:** Plugin developers can install @holokai/common from NPM and use well-defined contracts to create provider plugins, guard plugins, and other extensions without accessing core Holo code.

**FRs Covered:** FR1-9 (Common SDK Package)

---

### Story 2.1: Create Common SDK Package Structure

As a **plugin developer**,
I want **@holokai/common package with organized namespaces**,
So that **I can import specific plugin contracts without loading unnecessary code**.

**Acceptance Criteria:**

**Given** monorepo foundation is established
**When** I create @holokai/common package
**Then** packages/common/ directory exists with src/ subdirectory
**And** src/ contains namespaced folders: plugin/, provider/, holo/, utils/
**And** each namespace has index.ts barrel export
**And** package.json includes subpath exports: /plugin, /provider, /holo, /utils
**And** package.json name is "@holokai/common"
**And** package.json version starts at "0.1.0" (pre-release)
**And** package.json has peerDependencies: arktype ^2.0.0
**And** TypeScript compiles successfully with composite: true
**And** developers can import: `from '@holokai/common/plugin'`

**Prerequisites:** Epic 1 complete (Story 1.6)

**Technical Notes:**
- Follow Architecture ADR-001: Subpath exports for tree-shaking
- package.json exports field: `{ "./plugin": { "import": "./dist/plugin/index.js", "types": "./dist/plugin/index.d.ts" }, ... }`
- Each namespace is independently importable (no barrel at root)
- Architecture specifies 4 namespaces: /plugin, /provider, /holo, /utils
- Prevents internal imports - only subpaths are public API
- FR1: Installable via npm

---

### Story 2.2: Define Base Plugin Interfaces

As a **plugin developer**,
I want **base plugin interfaces (IPlugin) with lifecycle hooks**,
So that **I can implement plugins that integrate with Holo's plugin system**.

**Acceptance Criteria:**

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

**Prerequisites:** Story 2.1 (SDK structure)

**Technical Notes:**
- IPlugin is the base contract ALL plugins must implement (FR2)
- initialize(context) provides DI for logger, registry access (Architecture decision)
- destroy() for cleanup (close connections, clear timers) - idempotent
- Optional hooks (onConfigUpdate, healthCheck) for advanced plugins
- PluginType enum matches Architecture: provider | guard | evaluator | logger | worker (FR3)
- JSDoc examples showing implementation patterns
- Per CLAUDE.md: No comments unless code is not self-explanatory (interfaces need docs)

---

### Story 2.3: Define Type-Specific Plugin Interfaces

As a **plugin developer**,
I want **type-specific plugin interfaces (IProviderPlugin, IGuardPlugin, etc.)**,
So that **I know exactly what methods to implement for each plugin type**.

**Acceptance Criteria:**

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

**Prerequisites:** Story 2.2 (base interfaces)

**Technical Notes:**
- IProviderPlugin is critical for MVP (FR4, FR30-31)
- createProvider(config): AIProvider - returns provider instance
- validateConfig(config): boolean - validates provider config
- getCapabilities(): ProviderCapabilities - declares streaming, tools, vision support
- IGuardPlugin and IWorkerPlugin are future-ready (Phase 2+) but defined now (FR88)
- Discriminated unions via extends IPlugin (manifest.pluginType narrows type)
- Architecture specifies type-specific registries need specialized interfaces

---

### Story 2.4: Define PluginManifest Schema

As a **plugin developer**,
I want **clear PluginManifest schema with required and optional fields**,
So that **I know what metadata to include in my plugin**.

**Acceptance Criteria:**

**Given** plugin interfaces are defined
**When** I define PluginManifest schema
**Then** src/plugin/types.ts exports PluginManifest interface
**And** PluginManifest required fields: name, version, pluginType, commonSdkVersion
**And** PluginManifest provider-specific fields: providerType?, sdkVersion?, capabilities?
**And** PluginManifest optional fields: author?, description?, source?, holoVersion?
**And** source field is 'official' | 'community' | 'marketplace' (FR87 - future-ready)
**And** JSDoc documents all fields with examples
**And** TypeScript strict mode enforces required vs optional
**And** Example manifest shown in documentation

**Prerequisites:** Story 2.3 (type-specific interfaces)

**Technical Notes:**
- PluginManifest is central metadata structure (FR5, FR34, FR73)
- Architecture specifies rich manifest with marketplace-ready fields
- name: string (full package name, e.g., "@holokai/provider-openai")
- version: string (semver, e.g., "1.0.0")
- pluginType: PluginType (provider | guard | evaluator | logger | worker)
- commonSdkVersion: string (semver range, e.g., "^1.0.0")
- providerType: string (lowercase, e.g., "openai") - required for provider plugins
- sdkVersion: string (format: "openai@4.73.1") - provider SDK version
- capabilities: ProviderCapabilities (streaming, tools, vision, etc.)
- source: Future-ready for marketplace (FR87)

---

### Story 2.5: Implement ArkType Validators for Contracts

As a **plugin system developer**,
I want **ArkType validators for all plugin contracts**,
So that **the system can validate plugin exports at runtime and provide clear error messages**.

**Acceptance Criteria:**

**Given** PluginManifest and interfaces are defined
**When** I implement ArkType validators
**Then** src/plugin/validators.ts exports pluginManifestValidator
**And** validator uses ArkType type() syntax with satisfies Type<PluginManifest>
**And** validator enforces required fields (name, version, pluginType, commonSdkVersion)
**And** validator validates semver format for version and commonSdkVersion
**And** validator validates PluginType enum values
**And** validation returns type.errors for invalid input
**And** error messages are clear and actionable (FR72)
**And** all validators follow CLAUDE.md rule: satisfies Type<T>, NEVER use any
**And** validators compile without TypeScript errors

**Prerequisites:** Story 2.4 (PluginManifest schema)

**Technical Notes:**
- Follow CLAUDE.md ArkType rule: `const validator = type({...}).satisfies<Type<PluginManifest>>()`
- FR7: ArkType validators for contract enforcement
- NFR25: ArkType version consistent (peer dependency)
- Architecture specifies validator-first approach (fail fast at boundaries)
- Example error message: "Plugin manifest validation failed: 'version' must be valid semver, got '1.0'"
- Validators used by PluginLoaderService to validate plugin exports (FR12-14)
- Per CLAUDE.md: NEVER use Record<string, unknown> as shortcut - create proper validators

---

### Story 2.6: Define Provider-Specific Types

As a **plugin developer**,
I want **provider-specific types (ProviderConfig, ProviderCapabilities) in /provider namespace**,
So that **I can implement provider plugins with correct configuration structure**.

**Acceptance Criteria:**

**Given** Common SDK structure exists
**When** I define provider types
**Then** src/provider/types.ts exports ProviderConfig interface
**And** ProviderConfig includes: id, provider_type, api_key, model, plugin_id
**And** src/provider/types.ts exports ProviderCapabilities interface
**And** ProviderCapabilities includes: streaming, tools, vision, functionCalling, maxTokens
**And** src/provider/validators.ts exports providerConfigValidator (ArkType)
**And** validators use satisfies Type<ProviderConfig> pattern
**And** /provider subpath export includes both types and validators
**And** JSDoc explains plugin_id: string | null (null = legacy fallback)

**Prerequisites:** Story 2.5 (validators)

**Technical Notes:**
- ProviderConfig aligns with existing Holo provider configuration (FR50-51)
- plugin_id: string | null - NEW field for plugin vs legacy selection (FR41-43)
- ProviderCapabilities declares what provider supports (FR35)
- streaming: boolean - supports SSE streaming responses
- tools: boolean - supports function/tool calling
- vision: boolean - supports image inputs
- functionCalling: boolean - explicit function calling support
- maxTokens: number - maximum context window
- Architecture specifies /provider namespace for provider-specific contracts

---

### Story 2.7: Define Holo Universal Format Types

As a **plugin developer**,
I want **Holo universal format types in /holo namespace**,
So that **I can translate between provider formats and Holo's canonical format**.

**Acceptance Criteria:**

**Given** Common SDK structure exists
**When** I define Holo format types
**Then** src/holo/types.ts exports HoloRequest interface
**And** HoloRequest includes: messages, model, temperature, maxTokens, stream, tools
**And** src/holo/types.ts exports HoloResponse interface
**And** HoloResponse includes: id, model, choices, usage, created
**And** src/holo/types.ts exports HoloMessage interface
**And** HoloMessage includes: role, content, name?, toolCalls?, toolCallId?
**And** src/holo/validators.ts exports ArkType validators for Holo types
**And** /holo subpath export includes types and validators
**And** JSDoc explains Holo format is universal translation hub

**Prerequisites:** Story 2.6 (provider types)

**Technical Notes:**
- Holo format is the universal translation hub (Architecture: hub-and-spoke pattern)
- Prevents N² translations (openai ↔ claude) - only N translations (each ↔ holo)
- HoloRequest/HoloResponse mirror OpenAI API structure (industry standard)
- These types enable translators to convert provider ↔ holo (FR60)
- Core IP (translation logic) stays in private src/, but types are public
- Plugin developers need these types to implement bidirectional translators
- Architecture: Translators leverage Common SDK without depending on core Holo (FR60)

---

### Story 2.8: Define Shared Utility Types

As a **plugin developer**,
I want **shared utility types in /utils namespace**,
So that **I have consistent patterns for logging, error handling, and common operations**.

**Acceptance Criteria:**

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

**Prerequisites:** Story 2.7 (Holo types)

**Technical Notes:**
- Logger interface aligns with Winston (used by core Holo)
- PluginContext.logger follows this interface (injected during initialize)
- ErrorResponse for standardized error handling (FR72 - clear error messages)
- HealthStatus for optional healthCheck() hook
- FR6: Shared utility types used across Holo ecosystem
- Keep utilities minimal in MVP - expand based on plugin developer feedback
- Architecture: Logger abstraction prevents direct Winston dependency in plugins

---

### Story 2.9: Publish Common SDK to NPM

As a **plugin developer**,
I want **@holokai/common published to public NPM**,
So that **I can install it and start building plugins**.

**Acceptance Criteria:**

**Given** all Common SDK types, interfaces, and validators are complete
**When** I publish the package
**Then** `npm publish --access public` succeeds from packages/common/
**And** @holokai/common is visible on npmjs.com
**And** package README is displayed on NPM page
**And** all subpath exports (/plugin, /provider, /holo, /utils) are accessible
**And** developers can install: `npm install @holokai/common`
**And** developers can import: `import { IProviderPlugin } from '@holokai/common/plugin'`
**And** TypeScript types are included (.d.ts files)
**And** package.json specifies license: "MIT" or "Apache-2.0"
**And** package version is 0.1.0 or 1.0.0 (stable release)

**Prerequisites:** Story 2.8 (utility types)

**Technical Notes:**
- FR1: Developers can install @holokai/common via npm
- FR8: Common SDK version independently managed from core Holo
- NFR13: Open-source license (MIT or Apache-2.0)
- prepublishOnly script runs `npm run build` automatically
- Verify subpath exports work: `npm pack` and test imports locally first
- Tag release in git: `git tag @holokai/common@1.0.0`
- Document publishing process for future plugin packages
- This is the foundation - all subsequent plugins depend on this package

---

## Epic 3: Core Plugin Infrastructure

**Goal:** Build the core plugin system that discovers, loads, validates, and registers plugins dynamically at runtime.

**Value Delivered:** System can scan node_modules for plugins, dynamically load them, validate contracts, register in type-specific registries, and provide graceful degradation when plugins fail to load.

**FRs Covered:** FR10-17 (Discovery & Loading), FR24-29 (Registries), FR87-90 (Future-Ready)

---

### Story 3.1: Implement Plugin Discovery Service

As a **system operator**,
I want **the system to automatically discover installed plugin packages**,
So that **plugins are available without manual configuration**.

**Acceptance Criteria:**

**Given** Common SDK is published and plugin packages can be installed
**When** PluginDiscoveryService scans for plugins
**Then** service scans node_modules/@holokai/* directories
**And** service parses each package.json to extract name, version, main entry point
**And** service identifies plugin type from package name pattern (provider-*, guard-*, etc.)
**And** service returns list of discovered plugins with package metadata
**And** service logs discovery results: "Found 3 plugins: @holokai/provider-openai, ..."
**And** service handles missing node_modules gracefully (returns empty list)
**And** service is implemented in src/services/plugin/discovery.service.ts
**And** service uses @injectable() decorator for tsyringe DI

**Prerequisites:** Epic 2 complete (Common SDK published)

**Technical Notes:**
- FR10: Scan node_modules for @holokai/{type}-* pattern
- Hybrid discovery: Static package.json parsing (startup) + chokidar watch (hot-reload)
- Architecture specifies hybrid approach for fast startup + hot-reload capability
- Use Node.js fs.readdir() to scan node_modules/@holokai/
- Parse package.json with JSON.parse() - validate structure
- Extract: name, version, main (entry point), type (from naming convention)
- Example: @holokai/provider-openai → type: "provider", name: "provider-openai"
- Returns: DiscoveredPlugin[] = { packageName, version, entryPoint, pluginType }
- Graceful degradation: Log warning if package.json is malformed, skip plugin

---

### Story 3.2: Implement Plugin Loader Service

As a **system operator**,
I want **plugins dynamically imported and validated at runtime**,
So that **only valid plugins are registered and invalid ones are skipped gracefully**.

**Acceptance Criteria:**

**Given** plugins are discovered
**When** PluginLoaderService loads plugins
**Then** service uses dynamic import() for each discovered plugin
**And** service validates plugin default export is an object
**And** service validates plugin has manifest property
**And** service validates manifest using pluginManifestValidator (ArkType)
**And** service rejects plugins with incompatible commonSdkVersion
**And** service logs load success: "[Plugin] Loaded @holokai/provider-openai v1.0.0"
**And** service logs load failure without throwing: "[Plugin] Failed to load X: reason"
**And** service skips failed plugins and continues with remaining (graceful degradation)
**And** service emits 'plugin:loaded' event for successful loads
**And** service emits 'plugin:failed' event with error details

**Prerequisites:** Story 3.1 (discovery service)

**Technical Notes:**
- FR11-16: Dynamic import, validation, graceful degradation
- Use Node.js dynamic import: `const module = await import(packageName)`
- Expect default export: `const plugin: IPlugin = module.default`
- Validate with ArkType: `pluginManifestValidator(plugin.manifest)`
- Check commonSdkVersion compatibility (semver range matching)
- FR15-16: Log failures, skip broken plugins, continue loading others
- Architecture ADR-005: Graceful degradation for production resilience
- EventEmitter for plugin lifecycle events (decoupled monitoring)
- FR46: Worker starts successfully even if plugins fail
- Error handling: Try/catch per plugin, never throw to caller

---

### Story 3.3: Implement Generic Plugin Registry Service

As a **plugin system developer**,
I want **a generic registry that routes plugins to type-specific registries**,
So that **plugins are organized by type and lookup is fast**.

**Acceptance Criteria:**

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

**Prerequisites:** Story 3.2 (loader service)

**Technical Notes:**
- FR25: Generic registry routes to type-specific registries
- Architecture ADR-006: Type-specific registries for type safety
- Generic router pattern: Map<PluginType, IPluginRegistry>
- Calls plugin.initialize(context) with injected dependencies (logger, registry, config)
- PluginContext construction: { logger, registryService, configQueue }
- Routing logic: switch(plugin.manifest.pluginType) → route to specific registry
- Returns typed registry: getRegistry<IProviderPlugin>('provider')
- Architecture specifies generic registry as orchestrator, not storage
- Type-specific registries do actual storage and specialized lookup

---

### Story 3.4: Implement Provider Plugin Registry

As a **worker process**,
I want **provider plugins registered by providerType for O(1) lookup**,
So that **I can quickly retrieve the correct plugin when creating providers**.

**Acceptance Criteria:**

**Given** generic registry routes provider plugins
**When** ProviderPluginRegistry receives plugin
**Then** registry stores plugin in Map keyed by providerType (not package name)
**And** registry implements IPluginRegistry<IProviderPlugin> interface
**And** registry provides registerPlugin(plugin: IProviderPlugin)
**And** registry provides getByProviderType(type: string): IProviderPlugin | null
**And** registry provides unregisterPlugin(providerType: string)
**And** registry provides listPlugins(): IProviderPlugin[]
**And** registry provides atomicReplace(type, newPlugin) for hot-reload
**And** getByProviderType returns null for not found (not throw)
**And** O(1) lookup performance via Map (NFR1)

**Prerequisites:** Story 3.3 (generic registry)

**Technical Notes:**
- FR28-29: Provider plugins registered by providerType, O(1) lookup
- NFR1: Map-based storage for O(1) performance
- Key difference: Map key is providerType (e.g., "openai"), not package name
- This enables worker lookup: registry.getByProviderType(config.provider_type)
- Architecture: Type-specific registries provide specialized methods
- atomicReplace() for hot-reload (Architecture: Distributed Hot-Reload pattern)
- Old plugin continues serving until new plugin is initialized and swapped
- Return null (not throw) for "not found" - follows Architecture consistency rules
- IPluginRegistry<T> generic interface enforced by FR26

---

### Story 3.5: Implement Future-Ready Plugin Registries

As a **platform architect**,
I want **guard and worker plugin registries implemented**,
So that **the plugin system is ready for Phase 2+ expansion**.

**Acceptance Criteria:**

**Given** provider registry is implemented
**When** I create guard and worker registries
**Then** GuardPluginRegistry implements IPluginRegistry<IGuardPlugin>
**And** GuardPluginRegistry stores plugins by guard name
**And** GuardPluginRegistry provides getByName(name: string): IGuardPlugin | null
**And** WorkerPluginRegistry implements IPluginRegistry<IWorkerPlugin>
**And** WorkerPluginRegistry stores plugins by worker type
**And** WorkerPluginRegistry provides getByType(type: string): IWorkerPlugin | null
**And** all registries share common IPluginRegistry interface
**And** generic registry routes guard/worker plugins to correct registries
**And** registries are implemented but unused in MVP (Phase 2+)

**Prerequisites:** Story 3.4 (provider registry)

**Technical Notes:**
- FR88: Plugin system designed to support multiple plugin types beyond providers
- Future-ready design: Implement registries now, use in Phase 2+
- Prevents architectural rework when adding guard/worker plugins
- IGuardPlugin and IWorkerPlugin defined in Common SDK (Story 2.3)
- Each registry type has specialized lookup method (getByProviderType, getByName, getByType)
- Architecture: Prevents generic IPlugin returns, enforces type-specific returns
- MVP only uses ProviderPluginRegistry, but infrastructure supports all types
- FR87-90: Future-ready design decisions

---

### Story 3.6: Implement Plugin Cache Service

As a **worker process**,
I want **plugin metadata cached in memory from configuration queue**,
So that **I can reference plugin metadata without database queries**.

**Acceptance Criteria:**

**Given** configuration queue delivers plugin metadata messages
**When** PluginCacheService receives metadata
**Then** service stores plugin metadata in Map<string, PluginMetadata>
**And** service provides set(name: string, metadata: PluginMetadata)
**And** service provides get(name: string): PluginMetadata | undefined
**And** service provides has(name: string): boolean
**And** service provides clear() for testing
**And** PluginMetadata includes: name, version, pluginType, providerType, capabilities
**And** cache is in-memory only (no persistence in MVP)
**And** service is injectable via tsyringe

**Prerequisites:** Story 3.3 (generic registry)

**Technical Notes:**
- FR47-49: Plugin configuration from queue, metadata included
- Architecture: Reference-based config queue integration (ADR-004)
- Central server sends plugin_metadata messages separately from provider configs
- Workers cache plugin metadata for reference by provider configs
- No PostgreSQL storage in MVP (NFR20, NFR28)
- Simple Map<string, PluginMetadata> - no TTL, no eviction
- Future: Database schema for plugin versioning (FR89)
- This enables provider configs to reference: { plugin_id: "abc123" } → lookup cached metadata
- Cache populated on worker startup and config updates

---

### Story 3.7: Implement Plugin Lifecycle Events

As a **monitoring system**,
I want **plugin lifecycle events emitted for all state changes**,
So that **I can monitor plugin health and track failures**.

**Acceptance Criteria:**

**Given** plugin loader and registries are implemented
**When** plugin state changes occur
**Then** PluginLoaderService extends EventEmitter
**And** service emits 'plugin:loaded' with plugin object after successful load
**And** service emits 'plugin:failed' with packageName and error after load failure
**And** service emits 'plugin:initializing' with plugin before initialize()
**And** service emits 'plugin:initialized' with plugin after initialize() succeeds
**And** PluginRegistryService emits 'registry:updated' after plugin registration
**And** events include typed parameters: EventEmitter<PluginLifecycleEvents>
**And** event handlers MUST NOT throw (fire-and-forget pattern)
**And** Architecture consistency rules for event naming: {domain}:{action}

**Prerequisites:** Story 3.2 (loader service)

**Technical Notes:**
- Architecture specifies typed event emitter for plugin lifecycle
- Events enable decoupled monitoring, metrics, alerting
- Event naming convention: plugin:loaded, plugin:failed, plugin:initializing, plugin:initialized, registry:updated
- TypeScript typed events: `interface PluginLifecycleEvents { 'plugin:loaded': (plugin: IPlugin) => void }`
- Subscribers can listen without coupling to loader/registry internals
- Example subscriber: PluginMonitoringService tracks metrics (plugins.loaded counter)
- Event handlers must catch errors internally (Architecture: Event Handler Safety)
- FR17: System reports discovered plugins (via events + logging)
- Events used for hot-reload coordination in Epic 5

---

## Epic 4: Provider Plugin Framework

**Goal:** Enable developers to create provider plugins with configuration queue integration and validation.

**Value Delivered:** Plugin developers can implement IProviderPlugin, bundle provider SDKs, validate configurations, and integrate with Holo's configuration queue system.

**FRs Covered:** FR30-37 (Provider Plugin System), FR47-55 (Configuration Loading)

---

### Story 4.1: Define Provider Plugin Package Template

As a **plugin developer**,
I want **a standard provider plugin package structure**,
So that **I know how to organize my plugin code for consistency**.

**Acceptance Criteria:**

**Given** Common SDK is available
**When** I create a provider plugin package
**Then** packages/provider-{name}/ directory structure is documented
**And** structure includes: src/index.ts (default export), src/plugin.ts, src/provider.ts, src/translator.ts
**And** structure includes: package.json, tsconfig.json, README.md
**And** structure includes: tests/integration/ (primary), tests/unit/ (limited)
**And** package.json follows naming convention: @holokai/provider-{name}
**And** package.json includes peerDependencies: @holokai/common, arktype
**And** package.json includes dependencies: {provider-sdk} with EXACT version
**And** package.json includes engines: node >= 18.0.0
**And** template documented in Common SDK README or Architecture doc

**Prerequisites:** Epic 3 complete (core infrastructure)

**Technical Notes:**
- FR37: Naming convention @holokai/provider-{name}
- FR32: Provider plugins bundle their own SDK dependencies (exact version)
- FR33: ArkType as peer dependency (shared version)
- Architecture ADR-007: Hybrid testing (limited unit, focus integration)
- src/index.ts must export plugin as default: `export default plugin`
- src/plugin.ts implements IProviderPlugin class
- src/provider.ts contains provider SDK wrapper
- src/translator.ts handles Holo format translation
- Example: @holokai/provider-openai with openai@4.73.1

---

### Story 4.2: Implement IProviderPlugin Contract Methods

As a **plugin developer**,
I want **clear implementation guidance for IProviderPlugin methods**,
So that **my plugin integrates correctly with Holo's worker system**.

**Acceptance Criteria:**

**Given** IProviderPlugin interface is defined in Common SDK
**When** I implement the contract
**Then** plugin class implements manifest property with PluginManifest
**And** plugin implements initialize(context: PluginContext): Promise<void>
**And** plugin implements destroy(): Promise<void>
**And** plugin implements createProvider(config: ProviderConfig): AIProvider (FR31)
**And** plugin implements validateConfig(config: unknown): boolean
**And** plugin implements getCapabilities(): ProviderCapabilities
**And** initialize() is idempotent (safe to call multiple times)
**And** destroy() cleans up resources (connections, timers, listeners)
**And** createProvider() returns AIProvider instance (existing Holo interface)
**And** documentation includes JSDoc examples for each method

**Prerequisites:** Story 4.1 (package template)

**Technical Notes:**
- FR30-31: Export default class implementing IProviderPlugin, createProvider factory
- Architecture: Initialization Patterns - idempotent initialize, no side effects in constructor
- manifest: PluginManifest = { name, version, pluginType: 'provider', providerType, sdkVersion, ... }
- initialize(context): Store logger, registryService for use in other methods
- destroy(): Close connections, clear caches, remove event listeners
- createProvider(config): Returns new provider instance (NOT singleton)
- validateConfig(config): Use ArkType validator, return boolean
- getCapabilities(): Return cached ProviderCapabilities (streaming, tools, vision, etc.)
- FR35: Manifest declares capabilities

---

### Story 4.3: Implement Configuration Queue Integration

As a **worker process**,
I want **to receive plugin metadata and provider configs from configuration queue**,
So that **plugins are configured dynamically without hardcoding**.

**Acceptance Criteria:**

**Given** configuration queue is operational (existing Holo infrastructure)
**When** worker subscribes to config queue
**Then** worker subscribes to 'plugin_metadata' message type
**And** worker receives PluginMetadataMessage with plugins array
**And** worker caches each plugin metadata via PluginCacheService
**And** worker subscribes to 'provider_config' message type (existing)
**And** ProviderConfig includes plugin_id field (string | null)
**And** plugin_id references cached plugin metadata
**And** null plugin_id indicates legacy provider (backward compatibility)
**And** worker handles config updates without restart (FR52)
**And** existing queue infrastructure unchanged (NFR19)

**Prerequisites:** Story 3.6 (plugin cache service)

**Technical Notes:**
- FR47-55: Plugin configuration loaded via configuration queue
- FR50-51: Provider configs reference plugin metadata via plugin_id, include provider_type
- FR53: Legacy providers with null plugin_id continue to work
- Architecture ADR-004: Reference-based config queue integration
- Message format: `{ type: 'plugin_metadata', plugins: PluginMetadata[] }`
- No duplication: Plugin metadata sent once, many providers reference it
- No PostgreSQL dependency for plugin config (NFR20)
- Configuration queue uses existing RabbitMQ (NFR19)
- Workers already subscribe to config queue - extend with new message type

---

### Story 4.4: Implement Provider Config Validation

As a **plugin developer**,
I want **my plugin to validate provider configurations**,
So that **invalid configs are rejected early with clear error messages**.

**Acceptance Criteria:**

**Given** IProviderPlugin.validateConfig() method is implemented
**When** worker receives provider config
**Then** worker looks up plugin via plugin_id
**And** worker calls plugin.validateConfig(config) before creating provider
**And** validateConfig() uses ArkType validators (satisfies Type<ProviderConfig>)
**And** validation checks required fields: api_key, model, provider_type
**And** validation returns false for invalid configs (does not throw)
**And** worker logs validation failure: "[Plugin] Config validation failed for openai: reason"
**And** worker skips invalid config gracefully (does not crash)
**And** validation error messages are actionable (FR72)
**And** CLAUDE.md rule: NEVER use any type, use satisfies Type<T>

**Prerequisites:** Story 4.2 (IProviderPlugin methods)

**Technical Notes:**
- FR12-14: Validate plugin exports match contract, validate manifest
- FR72: Clear error messages for contract violations
- Architecture: Validation Patterns - fail fast at boundaries
- validateConfig() returns boolean, logs errors internally
- Example error: "Missing required field 'api_key'"
- ArkType validator: `const providerConfigValidator = type({...}).satisfies<Type<ProviderConfig>>()`
- Per CLAUDE.md: NEVER use Record<string, unknown> as shortcut
- Validation happens before createProvider() call
- Invalid config → log error, skip provider, continue with others (graceful degradation)

---

### Story 4.5: Implement Provider Capabilities Declaration

As a **plugin developer**,
I want **to declare my provider's capabilities in the manifest**,
So that **Holo knows what features my provider supports**.

**Acceptance Criteria:**

**Given** ProviderCapabilities type is defined in Common SDK
**When** plugin implements getCapabilities()
**Then** method returns ProviderCapabilities interface
**And** capabilities include: streaming (boolean)
**And** capabilities include: tools (boolean) - function/tool calling support
**And** capabilities include: vision (boolean) - image input support
**And** capabilities include: functionCalling (boolean) - explicit function calling
**And** capabilities include: maxTokens (number) - max context window
**And** manifest includes capabilities field with same data
**And** capabilities are cached (computed once, not on every call)
**And** worker can query capabilities before routing requests

**Prerequisites:** Story 4.2 (IProviderPlugin methods)

**Technical Notes:**
- FR34-35: Manifest includes providerType, sdkVersion, capabilities
- ProviderCapabilities defined in Common SDK (Story 2.6)
- streaming: boolean - supports SSE streaming responses (NFR22)
- tools: boolean - supports tool/function calling (OpenAI tools, Claude tools)
- vision: boolean - supports image inputs (GPT-4V, Claude 3)
- functionCalling: boolean - explicit function calling mode
- maxTokens: number - maximum context window (e.g., 128000 for GPT-4)
- Cache pattern: private capabilitiesCache?: ProviderCapabilities
- getCapabilities() checks cache first, computes if missing
- Architecture: Caching Strategy pattern

---

### Story 4.6: Implement Plugin Metadata Reporting

As a **system operator**,
I want **workers to report discovered plugins to central server**,
So that **I can track which plugins are installed on each worker**.

**Acceptance Criteria:**

**Given** plugins are discovered and loaded
**When** worker startup completes
**Then** worker reports discovered plugins via configuration queue or API
**And** report includes: plugin name, version, providerType, capabilities
**And** report includes: worker ID, timestamp
**And** report is sent once on startup (not repeatedly)
**And** reporting failure does not crash worker (graceful degradation)
**And** central server can aggregate plugin inventory across workers
**And** reporting mechanism is configurable (queue vs API)

**Prerequisites:** Story 3.7 (lifecycle events)

**Technical Notes:**
- FR17: System reports discovered plugins to central server
- Two options: (1) Configuration queue message, (2) HTTP API call
- Queue option: Send plugin_inventory message with discovered plugins
- API option: POST /api/plugins/inventory with plugin list
- Include worker metadata: worker_id, hostname, timestamp
- Central server can track: which workers have which plugins
- Future use: Marketplace verification, plugin health monitoring
- Failure handling: Try to report, log error if fails, continue worker startup
- Architecture: Events can trigger reporting (listen to plugin:loaded)

---

## Epic 5: Hot-Reload System

**Goal:** Enable zero-downtime plugin updates through distributed hot-reload without coordination services.

**Value Delivered:** Operators can update plugins via npm install, and all worker instances automatically detect and reload plugins within 2 seconds without dropping in-flight requests.

**FRs Covered:** FR18-23 (Hot-Reload & Dynamic Updates)

---

### Story 5.1: Implement File Watcher Service with Chokidar

As a **system operator**,
I want **the system to detect plugin package changes automatically**,
So that **updated plugins are reloaded without manual intervention**.

**Acceptance Criteria:**

**Given** chokidar is installed as dependency
**When** HotReloadService starts watching
**Then** service watches node_modules/@holokai/*/package.json files
**And** service uses chokidar.watch() with awaitWriteFinish option
**And** awaitWriteFinish.stabilityThreshold is 1000ms (waits for npm install)
**And** service emits 'change' event when package.json is modified
**And** service emits 'add' event when new package.json is added
**And** service ignores initial file scan (ignoreInitial: true)
**And** service detects changes within 2 seconds (NFR3)
**And** service is cross-platform compatible (Linux, macOS, Windows dev)
**And** service is implemented in src/services/plugin/hot-reload.service.ts

**Prerequisites:** Epic 4 complete (provider framework)

**Technical Notes:**
- FR18-19: Watch node_modules/@holokai directory, detect new plugin installations
- Architecture ADR-003: Chokidar for cross-platform reliability
- NFR3: Hot-reload detection < 2 seconds
- chokidar config: `{ ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 } }`
- Watches package.json changes (version updates indicate new plugin)
- npm install triggers: delete + add + change events (debounce needed)
- Service extends EventEmitter for plugin reload events
- Architecture: Distributed Hot-Reload pattern (no coordination service needed)

---

### Story 5.2: Implement Version-Based Change Detection

As a **system operator**,
I want **hot-reload to trigger only on actual version changes**,
So that **file system noise doesn't cause unnecessary reloads**.

**Acceptance Criteria:**

**Given** file watcher detects package.json change
**When** HotReloadService processes change
**Then** service reads new package.json to extract version
**And** service compares new version with current plugin version in registry
**And** service triggers reload only if versions differ
**And** service skips reload if version is unchanged (file touch, no update)
**And** service logs: "[HotReload] Version change detected: openai 1.0.0 → 1.1.0"
**And** service logs: "[HotReload] Version unchanged, skipping reload"
**And** service debounces per package (multiple events = one reload)
**And** debounce timeout is 500ms

**Prerequisites:** Story 5.1 (file watcher)

**Technical Notes:**
- Architecture: Version-Based detection prevents reload storms
- Compare: newVersion (from package.json) vs currentVersion (from plugin.manifest.version)
- Debounce per package: Map<packageName, NodeJS.Timeout>
- npm install can trigger multiple fs events - debounce consolidates
- Version comparison: Simple string equality (semver parsing not needed)
- Only version changes indicate actual plugin updates
- File touches (metadata changes without version bump) are ignored
- This prevents unnecessary cache clearing and module reloading

---

### Story 5.3: Implement Module Cache Clearing

As a **plugin system developer**,
I want **Node.js module cache cleared before reloading plugins**,
So that **the new plugin code is actually loaded (not cached old code)**.

**Acceptance Criteria:**

**Given** version change is detected
**When** HotReloadService reloads plugin
**Then** service clears require.cache for plugin package
**And** service clears require.cache recursively for plugin dependencies
**And** service uses cache-busting query parameter for dynamic import
**And** import uses: `import('@holokai/plugin?t=' + Date.now())`
**And** service handles module cache clearing errors gracefully
**And** service does NOT clear core Holo module cache (only plugin cache)
**And** cache clearing is logged: "[HotReload] Cleared cache for @holokai/provider-openai"

**Prerequisites:** Story 5.2 (version detection)

**Technical Notes:**
- FR21: Clear module cache before reloading plugins
- Node.js caches modules in require.cache
- Dynamic import also uses cache unless cache-busted
- Recursive cache clearing: Delete plugin + all its require() dependencies
- Example: Delete require.cache keys matching /node_modules\/@holokai\/provider-openai/
- Cache-bust query: `?t=${Date.now()}` ensures fresh import
- Do NOT clear core Holo cache (src/*) - only plugin packages
- Error handling: If cache clear fails, log warning and attempt reload anyway
- Architecture: clearModuleCacheRecursive(packageName) helper function

---

### Story 5.4: Implement Atomic Registry Swap

As a **system operator**,
I want **plugin hot-reload to be atomic with zero dropped requests**,
So that **in-flight requests complete successfully during reload**.

**Acceptance Criteria:**

**Given** new plugin is loaded and initialized
**When** HotReloadService swaps plugins
**Then** old plugin continues serving requests until new plugin is ready
**And** new plugin is initialized via plugin.initialize(context) before swap
**And** registry.atomicReplace(providerType, newPlugin) is used
**And** atomicReplace() updates Map in single operation (atomic)
**And** old plugin destroy() is called AFTER swap completes
**And** in-flight requests using old plugin complete successfully
**And** new requests immediately use new plugin after swap
**And** FR23: Plugin updates do not interrupt in-flight requests

**Prerequisites:** Story 3.4 (provider registry atomicReplace)

**Technical Notes:**
- FR22-23: Workers detect updates and refresh, no interruption to in-flight requests
- Architecture: Novel Distributed Hot-Reload pattern
- Atomic swap sequence: 1) Load new plugin, 2) Initialize new plugin, 3) Swap in registry (atomic), 4) Destroy old plugin
- Old plugin continues serving until step 3 completes
- Map.set() is atomic in JavaScript (single operation)
- In-flight requests hold reference to old plugin instance until completion
- New requests get new plugin instance immediately after swap
- destroy() cleanup happens after swap to ensure no disruption
- If new plugin initialization fails, old plugin remains (graceful degradation)

---

### Story 5.5: Implement Distributed Hot-Reload Coordination

As a **system operator**,
I want **all worker instances to hot-reload plugins simultaneously**,
So that **the fleet stays consistent without manual coordination**.

**Acceptance Criteria:**

**Given** multiple worker instances are running
**When** operator runs npm install to update a plugin
**Then** each worker independently detects package.json change via file watcher
**And** each worker independently checks version difference
**And** each worker independently reloads plugin if version changed
**And** no coordination service (Redis, database) is needed
**And** workers reload within seconds of each other (file system is source of truth)
**And** workers do not communicate with each other about reload
**And** NFR15: Hot-reload works consistently across multiple worker instances

**Prerequisites:** Story 5.4 (atomic swap)

**Technical Notes:**
- NFR15: Hot-reload works consistently across multiple workers
- Architecture: Distributed Hot-Reload pattern (no central coordination)
- Each worker has independent file watcher → detects changes independently
- File system is shared source of truth (NFS, EFS, or shared volume)
- npm install updates package.json → all watchers detect change
- Each worker independently: detect → reload → swap
- No inter-worker communication needed
- Workers may reload at slightly different times (seconds apart) - acceptable
- Eventual consistency: All workers converge to new version within ~5 seconds
- This pattern scales horizontally without coordination overhead

---

### Story 5.6: Implement Hot-Reload Error Handling and Rollback

As a **system operator**,
I want **hot-reload to keep the old plugin if reload fails**,
So that **production stability is maintained even with bad plugin updates**.

**Acceptance Criteria:**

**Given** hot-reload attempts to load new plugin version
**When** reload fails (import error, validation error, initialize error)
**Then** service logs error: "[HotReload] Failed to reload X: reason"
**And** service emits 'plugin:failed' event with error details
**And** old plugin remains in registry (no swap occurs)
**And** old plugin continues serving requests (graceful degradation)
**And** service does not retry reload automatically (manual fix required)
**And** operator can fix plugin and retry npm install
**And** service reports reload failure to monitoring system (if configured)

**Prerequisites:** Story 5.5 (distributed coordination)

**Technical Notes:**
- Architecture ADR-005: Graceful degradation for production resilience
- Error scenarios: Module import fails, ArkType validation fails, initialize() throws
- Try/catch around entire reload sequence
- On error: Log, emit event, keep old plugin, continue operations
- Do NOT crash worker or remove old plugin on reload failure
- Operator workflow: 1) npm install fails → 2) check logs → 3) fix plugin → 4) npm install again
- Monitoring integration: Events can trigger alerts (plugin:failed)
- This ensures bad plugin updates don't take down production
- Old plugin serves requests until successful reload

---

## Epic 6: OpenAI Reference Plugin

**Goal:** Create the first working provider plugin (OpenAI) that proves the pattern, achieves parity with legacy, and serves as reference implementation.

**Value Delivered:** Developers have a working OpenAI plugin that matches legacy behavior exactly, demonstrates best practices, and can be used as a template for creating other provider plugins.

**FRs Covered:** FR62-68 (Testing & Validation)

---

### Story 6.1: Extract OpenAI Provider to Plugin Package

As a **plugin developer**,
I want **existing OpenAI provider code extracted to a plugin package**,
So that **it can be built, tested, and published independently**.

**Acceptance Criteria:**

**Given** monorepo is set up with Common SDK published
**When** I extract OpenAI provider
**Then** packages/provider-openai/ directory exists
**And** src/index.ts exports OpenAIProviderPlugin as default
**And** src/plugin.ts implements IProviderPlugin interface
**And** src/provider.ts contains OpenAI SDK wrapper (extracted from src/providers/openai/)
**And** src/translator.ts contains Holo format translator (extracted from src/providers/openai/)
**And** package.json name is "@holokai/provider-openai"
**And** package.json includes dependency: openai@4.73.1 (EXACT version, FR32)
**And** package.json includes peerDependencies: @holokai/common, arktype
**And** TypeScript compiles without errors
**And** Legacy OpenAI code in src/providers/openai/ remains (coexistence during migration)

**Prerequisites:** Epic 5 complete (hot-reload system)

**Technical Notes:**
- FR36: Provider plugins can be published to NPM independently
- FR56: Provider plugins extracted to packages/provider-{name}/ directories
- FR75-76: Existing provider instances continue working, gradual migration
- Extract files from src/providers/openai/ to packages/provider-openai/src/
- Keep legacy code in src/providers/openai/ for now (remove in Epic 7 after verification)
- OpenAI SDK exact version: openai@4.73.1 (bundled with plugin)
- Translator logic: Bidirectional Holo ↔ OpenAI format conversion
- Provider wrapper: OpenAI SDK client instantiation, API calls
- Plugin manifest: name, version, pluginType: 'provider', providerType: 'openai', sdkVersion: 'openai@4.73.1', capabilities

---

### Story 6.2: Implement OpenAI Plugin Manifest and Lifecycle

As a **plugin developer**,
I want **OpenAI plugin manifest and lifecycle hooks implemented**,
So that **the plugin integrates with Holo's plugin system**.

**Acceptance Criteria:**

**Given** OpenAI code is extracted to plugin package
**When** I implement the plugin class
**Then** OpenAIProviderPlugin class implements IProviderPlugin
**And** manifest property is defined with all required fields
**And** manifest.name is "@holokai/provider-openai"
**And** manifest.pluginType is "provider"
**And** manifest.providerType is "openai"
**And** manifest.sdkVersion is "openai@4.73.1"
**And** manifest.capabilities declares: streaming: true, tools: true, vision: true, functionCalling: true, maxTokens: 128000
**And** initialize(context) stores logger and registryService
**And** destroy() is implemented (cleanup if needed)
**And** initialize() is idempotent (safe to call multiple times)

**Prerequisites:** Story 6.1 (extract OpenAI)

**Technical Notes:**
- FR30: Provider plugins export default class implementing IProviderPlugin
- FR34-35: Manifest includes providerType, sdkVersion, capabilities
- Capabilities for OpenAI: streaming (SSE), tools (function calling), vision (GPT-4V), functionCalling, maxTokens (128K for GPT-4)
- initialize(context): this.logger = context.logger, this.registryService = context.registryService
- destroy(): No special cleanup needed for OpenAI (stateless), but implement for contract
- Architecture: Initialization Patterns - idempotent, no constructor side effects

---

### Story 6.3: Implement OpenAI createProvider and Validation

As a **plugin developer**,
I want **createProvider factory and config validation methods**,
So that **the plugin can instantiate OpenAI providers from configurations**.

**Acceptance Criteria:**

**Given** OpenAI plugin class exists
**When** I implement provider factory
**Then** createProvider(config: ProviderConfig): AIProvider returns OpenAI provider instance
**And** createProvider uses config.api_key to instantiate OpenAI SDK client
**And** createProvider uses config.model for API requests
**And** returned provider implements existing AIProvider interface (src/providers/ai.provider.ts)
**And** validateConfig(config: unknown): boolean validates config structure
**And** validateConfig checks required fields: api_key, model, provider_type
**And** validateConfig uses ArkType validator with satisfies Type<ProviderConfig>
**And** getCapabilities() returns cached ProviderCapabilities
**And** plugin compiles and builds successfully

**Prerequisites:** Story 6.2 (manifest and lifecycle)

**Technical Notes:**
- FR31: Provider plugins implement createProvider factory method
- createProvider returns instance of existing AIProvider interface (backward compatibility)
- OpenAI SDK instantiation: `new OpenAI({ apiKey: config.api_key })`
- Provider instance handles API calls (chat.completions.create, etc.)
- validateConfig: ArkType validator checks config.api_key (string), config.model (string), config.provider_type === 'openai'
- getCapabilities: Return cached capabilities from manifest
- Architecture: createProvider returns NEW instance (not singleton)

---

### Story 6.4: Create Integration Tests for Legacy Provider

As a **QA engineer**,
I want **integration tests that verify legacy OpenAI provider behavior**,
So that **I have a baseline for comparing plugin implementation**.

**Acceptance Criteria:**

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

**Prerequisites:** Story 6.3 (createProvider implementation)

**Technical Notes:**
- FR62, FR65: Integration tests verify legacy behavior using real APIs
- Architecture ADR-007: Hybrid testing strategy (focus on integration, not mocking)
- Existing integration tests in tests/integration/openai.test.ts
- Test cases: chat completion, streaming, function calling, vision
- Real API calls require OPENAI_API_KEY environment variable
- Capture baseline: response format, token counts, timing data
- These baselines used in Story 6.5 for parity verification
- FR66: Tests verify streaming and non-streaming parity

---

### Story 6.5: Create Integration Tests for Plugin Provider Parity

As a **QA engineer**,
I want **integration tests that compare plugin vs legacy outputs**,
So that **I can verify the plugin achieves exact parity**.

**Acceptance Criteria:**

**Given** OpenAI plugin is implemented and legacy baseline exists
**When** I run parity tests
**Then** tests execute identical requests through both legacy and plugin providers
**And** tests compare response structures (same fields, same types)
**And** tests compare response content (same model outputs)
**And** tests verify streaming chunks match between legacy and plugin
**And** tests verify tool calling responses match
**And** tests verify vision responses match
**And** tests verify token counts are identical (±1 token acceptable)
**And** tests verify timing is comparable (plugin latency ≤ legacy + 5ms, NFR4)
**And** all parity tests pass (FR64: legacy vs plugin outputs match)

**Prerequisites:** Story 6.4 (legacy baseline tests)

**Technical Notes:**
- FR63-64: Integration tests verify plugin behavior and compare with legacy for parity
- NFR4: Plugin latency must match legacy ±5ms
- Parity test structure: Run same request through legacy, run through plugin, compare results
- Use same test inputs (prompts, messages, tools) for both paths
- Response comparison: Deep equality on structure, fuzzy match on content (LLM outputs vary)
- Streaming comparison: Chunk count, chunk timing, final assembled response
- Token count comparison: usage.prompt_tokens, usage.completion_tokens (±1 acceptable due to SDK differences)
- This proves: FR64 (legacy vs plugin parity) + Success Gate (OpenAI plugin works identically to legacy)

---

### Story 6.6: Implement Hot-Reload Test for OpenAI Plugin

As a **QA engineer**,
I want **tests that verify OpenAI plugin hot-reload works correctly**,
So that **I can confirm zero-downtime updates function as designed**.

**Acceptance Criteria:**

**Given** OpenAI plugin is installed and loaded
**When** hot-reload test simulates plugin update
**Then** test simulates package.json version change
**And** test verifies HotReloadService detects change within 2 seconds
**And** test verifies new plugin is loaded and initialized
**And** test verifies old plugin continues serving in-flight requests
**And** test verifies new requests use new plugin after swap
**And** test verifies no requests fail during reload
**And** test verifies old plugin destroy() is called after swap
**And** FR67: Plugin hot-reload functionality verified

**Prerequisites:** Story 6.5 (parity tests)

**Technical Notes:**
- FR67: Tests verify plugin hot-reload functionality
- Test approach: Simulate file system changes (update package.json), verify reload sequence
- Test in-flight requests: Start request with old plugin, trigger reload mid-request, verify request completes
- Test new requests: After reload completes, verify new requests use new plugin instance
- Verify events: plugin:reloading, plugin:reloaded emitted
- Verify atomic swap: Old plugin serves until new plugin ready
- NFR3: Hot-reload detection < 2 seconds (verify in test)
- This proves FR19-23 (hot-reload) work end-to-end

---

### Story 6.7: Publish OpenAI Plugin to NPM

As a **plugin developer**,
I want **@holokai/provider-openai published to public NPM**,
So that **users can install it and other developers can reference it**.

**Acceptance Criteria:**

**Given** all tests pass (parity verified, hot-reload verified)
**When** I publish the plugin
**Then** `npm publish --access public` succeeds from packages/provider-openai/
**And** @holokai/provider-openai is visible on npmjs.com
**And** plugin README is displayed on NPM page with usage examples
**And** developers can install: `npm install @holokai/provider-openai`
**And** TypeScript types are included (.d.ts files)
**And** package.json license is "MIT" or "Apache-2.0"
**And** package version is 1.0.0 (stable release)
**And** FR36: Provider plugins can be published to NPM independently

**Prerequisites:** Story 6.6 (hot-reload test)

**Technical Notes:**
- FR36: Provider plugins published to NPM as independent packages
- FR83: Official plugin packages published to public NPM
- Success Gate: OpenAI plugin works identically to legacy, hot-reload functional, Common SDK usable by external devs
- Tag release: `git tag @holokai/provider-openai@1.0.0`
- README includes: Installation, usage, configuration examples
- This is the reference implementation (FR70) for other plugin developers
- Proves the entire plugin system works end-to-end

---

## Epic 7: Worker Integration & Legacy Coexistence

**Goal:** Integrate plugin system into worker startup, implement strategy pattern for plugin vs legacy selection, and enable gradual migration.

**Value Delivered:** Production workers use plugin-based providers when plugin_id is set, fall back to legacy providers when null, and start successfully regardless of plugin system state.

**FRs Covered:** FR38-46 (Worker Integration), FR75-80 (Migration & Backward Compatibility)

---

### Story 7.1: Implement Provider Selection Strategy Pattern

As a **worker developer**,
I want **a strategy pattern that selects plugin or legacy provider**,
So that **provider creation is clean and easy to maintain during migration**.

**Acceptance Criteria:**

**Given** both plugin and legacy providers exist
**When** I implement provider selection
**Then** IProviderStrategy interface is defined with canHandle(config) and createProvider(config)
**And** PluginProviderStrategy implements IProviderStrategy
**And** PluginProviderStrategy.canHandle() returns true if config.plugin_id != null
**And** PluginProviderStrategy.createProvider() uses ProviderPluginRegistry to get plugin
**And** LegacyProviderStrategy implements IProviderStrategy
**And** LegacyProviderStrategy.canHandle() returns true if config.plugin_id == null
**And** LegacyProviderStrategy.createProvider() uses existing hardcoded provider logic
**And** ProviderFactory uses strategies array to select appropriate strategy
**And** ProviderFactory is injectable via tsyringe

**Prerequisites:** Epic 6 complete (OpenAI plugin published)

**Technical Notes:**
- FR41-43: Workers check plugin_id, use plugin if set, fall back to legacy if null
- Architecture ADR-002: Strategy pattern for clean plugin/legacy separation
- Strategy pattern enables easy removal of legacy code post-migration
- canHandle(config): boolean - determines if strategy can handle config
- createProvider(config): AIProvider - returns provider instance
- ProviderFactory.createProvider(): Iterate strategies, find first that canHandle(), delegate
- Strategies registered in DI container: [PluginProviderStrategy, LegacyProviderStrategy]
- Order matters: Check plugin first, legacy second (default fallback)
- Clean separation: No if/else in factory, strategies are independent

---

### Story 7.2: Integrate Plugin System into Worker Startup

As a **worker developer**,
I want **plugin system initialized during worker startup**,
So that **plugins are loaded before worker accepts requests**.

**Acceptance Criteria:**

**Given** worker startup sequence exists
**When** worker initializes
**Then** worker resolves PluginLoaderService from DI container
**And** worker calls pluginLoader.loadAllPlugins() before accepting requests
**And** loadAllPlugins() discovers, loads, validates, and registers all plugins
**And** worker resolves HotReloadService from DI container
**And** worker calls hotReload.startWatching() after plugin loading completes
**And** worker resolves PluginCacheService from DI container
**And** worker subscribes to 'plugin_metadata' config queue messages
**And** worker startup completes even if plugin loading fails (FR46)
**And** worker logs: "[Worker] Plugin system initialized: 3 plugins loaded"

**Prerequisites:** Story 7.1 (strategy pattern)

**Technical Notes:**
- FR38-40: Workers load PluginRegistryService, scan and register plugins, enable hot-reload
- FR46: Workers start successfully even if plugin system fails to initialize
- Startup sequence: 1) Load plugins, 2) Register plugins, 3) Start hot-reload, 4) Subscribe to config queue, 5) Accept requests
- Graceful degradation: Try/catch around plugin loading, log errors, continue startup
- If all plugins fail to load, worker still starts (legacy providers work)
- Architecture specifies worker initialization order for proper plugin system bootstrap
- PluginLoaderService emits events during loading (plugin:loaded, plugin:failed)

---

### Story 7.3: Implement Plugin-Based Provider Creation in Workers

As a **worker process**,
I want **to use plugin-based providers when plugin_id is set**,
So that **new provider configurations use plugins instead of legacy code**.

**Acceptance Criteria:**

**Given** worker receives provider config from queue
**When** config.plugin_id is not null
**Then** worker uses PluginProviderStrategy to create provider
**And** strategy retrieves plugin from ProviderPluginRegistry
**And** strategy calls plugin.validateConfig(config) before creating provider
**And** strategy calls plugin.createProvider(config) to get provider instance
**And** provider instance implements existing AIProvider interface
**And** worker uses plugin-based provider for all requests to that provider
**And** worker logs: "[Worker] Using plugin provider: openai (plugin: @holokai/provider-openai@1.0.0)"
**And** FR42: Workers use plugin-based provider if plugin_id is set

**Prerequisites:** Story 7.2 (worker startup integration)

**Technical Notes:**
- FR42, FR45: Workers use plugin-based provider if plugin_id set, retrieve from ProviderPluginRegistry
- Config format: `{ id, provider_type: 'openai', plugin_id: 'abc123', api_key, model, ... }`
- Lookup: plugin_id → PluginCacheService.get(plugin_id) → get metadata → get providerType → ProviderPluginRegistry.getByProviderType(providerType)
- Alternative: plugin_id could directly store providerType (simpler lookup)
- Validation: plugin.validateConfig(config) returns true before createProvider()
- Provider instance: Same AIProvider interface as legacy (backward compatible)
- Logging includes plugin name and version for observability

---

### Story 7.4: Implement Legacy Provider Fallback

As a **worker process**,
I want **to use legacy providers when plugin_id is null**,
So that **existing configurations continue working during migration**.

**Acceptance Criteria:**

**Given** worker receives provider config from queue
**When** config.plugin_id is null
**Then** worker uses LegacyProviderStrategy to create provider
**And** strategy uses existing hardcoded provider logic (src/providers/openai/, etc.)
**And** provider instance implements existing AIProvider interface
**And** worker uses legacy provider for all requests to that provider
**And** worker logs: "[Worker] Using legacy provider: openai"
**And** FR43, FR53: Workers fall back to legacy if plugin_id is null, legacy providers continue to work
**And** FR75-76: Existing provider instances continue working, gradual migration supported

**Prerequisites:** Story 7.3 (plugin-based creation)

**Technical Notes:**
- FR43, FR53: Workers fall back to legacy hardcoded provider if plugin_id is null
- FR75-76: Existing instances continue working, system supports gradual migration
- Legacy strategy: Routes to existing provider code in src/providers/
- Config format: `{ id, provider_type: 'openai', plugin_id: null, api_key, model, ... }`
- No changes to legacy provider code (src/providers/openai/ remains as-is)
- Backward compatibility: Old configs without plugin_id field default to null
- This enables gradual rollout: Migrate one provider at a time, toggle via plugin_id
- NFR26: Customer-facing API endpoints remain unchanged

---

### Story 7.5: Implement Provider Strategy Logging and Observability

As a **system operator**,
I want **clear logging of which strategy is used for each provider**,
So that **I can monitor plugin vs legacy usage during migration**.

**Acceptance Criteria:**

**Given** workers create providers using strategies
**When** provider is created
**Then** worker logs which strategy was used
**And** log includes: provider type, strategy (plugin/legacy), plugin version (if plugin)
**And** log format: "[Worker] Created provider: openai via PluginProviderStrategy (@holokai/provider-openai@1.0.0)"
**And** log format: "[Worker] Created provider: claude via LegacyProviderStrategy"
**And** logs are structured (JSON) for easy parsing
**And** metrics are collected: provider.created counter with labels (provider_type, strategy)
**And** FR44: Workers log whether plugin or legacy provider is used for each instance

**Prerequisites:** Story 7.4 (legacy fallback)

**Technical Notes:**
- FR44: Workers log whether plugin or legacy provider is used
- Structured logging: `logger.info('Created provider', { provider_type: 'openai', strategy: 'plugin', plugin_name: '@holokai/provider-openai', plugin_version: '1.0.0' })`
- Metrics: Increment counter with labels for monitoring dashboards
- Observability enables: Tracking migration progress, identifying plugin vs legacy usage, debugging configuration issues
- Example queries: "How many providers are using plugins?", "Which workers still use legacy OpenAI?"
- Architecture: Structured logs with context object, NEVER template strings with sensitive data

---

### Story 7.6: Verify Backward Compatibility and Zero Breaking Changes

As a **QA engineer**,
I want **to verify that the plugin system introduces no breaking changes**,
So that **existing customer APIs and configurations work unchanged**.

**Acceptance Criteria:**

**Given** plugin system is integrated into workers
**When** I run backward compatibility tests
**Then** existing API endpoints work unchanged (FR77)
**And** existing provider configurations (plugin_id: null) work unchanged
**And** existing authentication and authorization work unchanged
**And** existing response streaming (SSE) works with plugin providers (NFR22)
**And** existing RabbitMQ queue infrastructure works unchanged (NFR19)
**And** workers start successfully with no plugins installed (FR79)
**And** workers start successfully with only legacy providers configured
**And** FR77-78: No breaking changes to customer APIs, provider slugs unchanged

**Prerequisites:** Story 7.5 (logging and observability)

**Technical Notes:**
- FR77-80: No breaking API changes, provider slugs unchanged, worker startup succeeds regardless, database schema backward compatible
- NFR19, NFR22, NFR26: Existing infrastructure unchanged (queues, streaming, API endpoints)
- Test cases: Legacy config (plugin_id: null) → verify provider works, API calls succeed, responses correct
- Test cases: No plugins installed → worker starts, legacy providers work
- Test cases: Plugin installed but not configured → worker starts, plugin ignored
- Endpoint verification: /api/openai/v1/chat/completions works identically with plugin and legacy
- This proves complete backward compatibility during migration

---

## Epic 8: Developer Documentation & Experience

**Goal:** Create comprehensive documentation, examples, and error messages that enable external developers to build, test, and publish plugins independently.

**Value Delivered:** Plugin developers have everything they need to create high-quality plugins: contract docs, reference examples, error messages, development guides, and publishing instructions.

**FRs Covered:** FR69-74 (Plugin Developer Experience)

---

### Story 8.1: Document Plugin Contracts and Interfaces

As a **plugin developer**,
I want **comprehensive contract documentation with examples**,
So that **I understand exactly how to implement each interface**.

**Acceptance Criteria:**

**Given** Common SDK is published
**When** I read contract documentation
**Then** documentation explains IPlugin interface with all methods
**And** documentation explains IProviderPlugin interface with all methods
**And** documentation explains PluginManifest schema with all fields
**And** documentation includes JSDoc comments on all interfaces
**And** documentation includes example implementations for each method
**And** documentation explains PluginContext and what it provides
**And** documentation explains plugin lifecycle: discovery → load → validate → initialize → register → use → destroy
**And** FR69, FR73-74: Comprehensive contract documentation, manifest schema documented, lifecycle hooks documented

**Prerequisites:** Epic 7 complete (worker integration)

**Technical Notes:**
- FR69: Plugin developers can read comprehensive contract documentation
- FR73: Plugin manifest schema documented with required and optional fields
- FR74: Plugin lifecycle hooks documented with usage examples
- Documentation location: packages/common/README.md or docs/plugin-development-guide.md
- Include: Interface definitions, method signatures, parameter types, return types
- Include: JSDoc examples showing implementation patterns
- Example: IProviderPlugin.createProvider() - "Returns a new AIProvider instance. Do not return singleton."
- Link to Architecture doc for design decisions and patterns

---

### Story 8.2: Create OpenAI Plugin as Reference Example

As a **plugin developer**,
I want **OpenAI plugin documented as reference implementation**,
So that **I can follow its structure when creating my own plugins**.

**Acceptance Criteria:**

**Given** OpenAI plugin is published
**When** I read reference documentation
**Then** OpenAI plugin is explicitly labeled as "Official Reference Implementation"
**And** packages/provider-openai/README.md explains package structure
**And** README includes: Installation, usage, configuration examples
**And** README includes: "This plugin serves as a reference - copy this structure for your plugin"
**And** Code includes inline comments explaining key patterns
**And** manifest example shows all required and optional fields
**And** FR70: Plugin developers can view official plugin examples (OpenAI reference)

**Prerequisites:** Story 8.1 (contract documentation)

**Technical Notes:**
- FR70: Plugin developers can view official plugin examples
- OpenAI plugin serves as template for community plugins
- README sections: Installation, Configuration, Usage, Development, Testing, Publishing
- Code comments: Explain patterns (idempotent initialize, atomic swap support, etc.)
- Manifest example: Show complete manifest with all fields populated
- Link to: Contract docs, Architecture doc, development guide
- This is the "golden path" - copy this structure for success

---

### Story 8.3: Implement Clear Error Messages for Contract Violations

As a **plugin developer**,
I want **actionable error messages when my plugin violates contracts**,
So that **I can quickly fix issues without guessing**.

**Acceptance Criteria:**

**Given** plugin system validates plugin exports
**When** validation fails
**Then** error message clearly states what is wrong
**And** error message includes field name, expected type, actual value
**And** error message suggests how to fix the issue
**And** ArkType validation errors are formatted clearly
**And** example error: "Plugin manifest validation failed: 'version' must be valid semver (e.g., '1.0.0'), got '1.0'"
**And** example error: "Plugin export validation failed: Expected default export to be object, got undefined. Ensure: export default plugin"
**And** example error: "Plugin initialize() failed: Cannot read property 'logger' of undefined. Ensure PluginContext is passed."
**And** FR72: Plugin developers receive clear error messages for contract violations

**Prerequisites:** Story 8.2 (reference example)

**Technical Notes:**
- FR72: Clear error messages for contract violations
- Architecture: Validation Patterns - fail fast at boundaries with actionable messages
- ArkType validation: Extract type.errors.summary, format for readability
- Error message pattern: "[Context] Violation: Expected X, got Y. Fix: Z"
- Include: Field path (manifest.version), expected format, actual value, fix suggestion
- Log to plugin developer console (not just internal logs)
- Error messages should guide developer to solution in < 30 seconds

---

### Story 8.4: Create Plugin Development Guide

As a **plugin developer**,
I want **a step-by-step guide for building plugins**,
So that **I can go from zero to published plugin efficiently**.

**Acceptance Criteria:**

**Given** contracts and examples are documented
**When** I read development guide
**Then** guide includes: "Prerequisites" (Node.js, TypeScript, npm)
**And** guide includes: "Setup" (clone, npm install, create package)
**And** guide includes: "Implement" (copy reference, modify for provider)
**And** guide includes: "Test" (write integration tests, run parity tests)
**And** guide includes: "Build" (npm run build, verify outputs)
**And** guide includes: "Publish" (npm publish, version management)
**And** guide includes: "Troubleshooting" (common errors and fixes)
**And** guide links to: Contract docs, reference example, Architecture doc
**And** guide is published at docs/plugin-development-guide.md or Common SDK README

**Prerequisites:** Story 8.3 (error messages)

**Technical Notes:**
- Comprehensive "Getting Started" for plugin developers
- Target audience: External developers with TypeScript experience
- Walkthrough: Create @holokai/provider-claude from scratch
- Include: Code snippets, commands, expected outputs
- Troubleshooting section: Common errors from Story 8.3 with solutions
- Include: How to test locally before publishing (npm link, local testing)
- Include: Versioning strategy (semver), when to bump major/minor/patch
- This enables FR71: Plugin developers can publish plugins independently

---

### Story 8.5: Document Publishing Process and NPM Workflow

As a **plugin developer**,
I want **clear instructions for publishing plugins to NPM**,
So that **I can make my plugin available to the community**.

**Acceptance Criteria:**

**Given** plugin is built and tested
**When** I read publishing documentation
**Then** docs explain: npm account setup (if needed)
**And** docs explain: package.json configuration for publishing
**And** docs explain: `npm publish --access public` command
**And** docs explain: version management (semver, npm version commands)
**And** docs explain: release tagging (git tag, changelog)
**And** docs explain: verification (install from npm, test)
**And** docs include: Publishing checklist (tests pass, docs updated, version bumped, etc.)
**And** docs include: Naming conventions (@holokai/provider-*, community: *-holo-provider-*)
**And** FR71: Plugin developers can publish plugins to NPM independently

**Prerequisites:** Story 8.4 (development guide)

**Technical Notes:**
- FR71: Plugin developers can publish plugins independently
- FR90: Plugin discovery pattern extensible to community packages (naming convention)
- Official plugins: @holokai/provider-* (requires org access)
- Community plugins: *-holo-provider-* (future, when community discovery enabled)
- Publishing checklist: 1) Tests pass, 2) Build succeeds, 3) Version bumped, 4) Changelog updated, 5) npm publish
- Include: How to handle publish failures, version conflicts, authentication issues
- Include: Beta releases (npm publish --tag beta)
- This completes the developer journey: Learn → Build → Test → Publish

---

### Story 8.6: Create Plugin Developer FAQ and Troubleshooting Guide

As a **plugin developer**,
I want **answers to common questions and solutions to common problems**,
So that **I can resolve issues quickly without external support**.

**Acceptance Criteria:**

**Given** plugin system is documented
**When** I encounter an issue
**Then** FAQ includes: "How do I debug my plugin?"
**And** FAQ includes: "Why isn't my plugin loading?"
**And** FAQ includes: "How do I test my plugin locally?"
**And** FAQ includes: "How do I handle breaking changes in provider SDKs?"
**And** FAQ includes: "How do I implement streaming?"
**And** FAQ includes: "What's the difference between initialize() and constructor?"
**And** Troubleshooting guide includes: Common errors with root causes and solutions
**And** Troubleshooting guide includes: Debugging techniques (logging, breakpoints, inspect)
**And** FAQ is published in Common SDK README or development guide

**Prerequisites:** Story 8.5 (publishing docs)

**Technical Notes:**
- Anticipate common developer questions based on architecture complexity
- Common issues: Plugin not discovered (naming convention), Plugin not loading (manifest validation), createProvider fails (config validation)
- Debugging guide: How to inspect plugin registry, how to view lifecycle events, how to test hot-reload locally
- Streaming implementation: Point to OpenAI reference, explain SSE handling
- SDK updates: How to bump SDK version, test for breaking changes, maintain backward compatibility
- Link to: GitHub issues for unsolved problems, community discussion forum (if exists)

---

## FR Coverage Matrix

This matrix shows how each functional requirement maps to specific epics and stories for complete traceability.

| FR # | Description | Epic | Story |
|------|-------------|------|-------|
| FR1 | Install @holokai/common via npm | Epic 2 | 2.1, 2.9 |
| FR2 | Common SDK exports IPlugin interface | Epic 2 | 2.2 |
| FR3 | Common SDK exports PluginType enum | Epic 2 | 2.2 |
| FR4 | Common SDK exports type-specific interfaces | Epic 2 | 2.3 |
| FR5 | Common SDK exports PluginManifest type | Epic 2 | 2.4 |
| FR6 | Common SDK exports shared utility types | Epic 2 | 2.8 |
| FR7 | Common SDK includes ArkType validators | Epic 2 | 2.5 |
| FR8 | Common SDK version independently managed | Epic 2 | 2.9 |
| FR9 | Common SDK documentation complete | Epic 2 | 2.9, Epic 8 |
| FR10 | System scans node_modules for plugins | Epic 3 | 3.1 |
| FR11 | System dynamically imports plugins | Epic 3 | 3.2 |
| FR12 | System validates plugin exports | Epic 3 | 3.2 |
| FR13 | System validates plugin manifest | Epic 3 | 3.2 |
| FR14 | System rejects incompatible plugins | Epic 3 | 3.2 |
| FR15 | System logs plugin load failures | Epic 3 | 3.2 |
| FR16 | System skips failed plugins | Epic 3 | 3.2 |
| FR17 | System reports discovered plugins | Epic 3 | 3.7, Epic 4: 4.6 |
| FR18 | System watches node_modules directory | Epic 5 | 5.1 |
| FR19 | System detects new plugin installations | Epic 5 | 5.1, 5.2 |
| FR20 | System reloads modified plugins | Epic 5 | 5.2, 5.4 |
| FR21 | System clears module cache | Epic 5 | 5.3 |
| FR22 | Workers detect plugin updates | Epic 5 | 5.4, 5.5 |
| FR23 | Plugin updates don't interrupt requests | Epic 5 | 5.4 |
| FR24 | System maintains type-specific registries | Epic 3 | 3.3, 3.4, 3.5 |
| FR25 | Generic registry routes to type-specific | Epic 3 | 3.3 |
| FR26 | Type-specific registries implement interface | Epic 3 | 3.4 |
| FR27 | Registries provide standard methods | Epic 3 | 3.4 |
| FR28 | Provider plugins registered by providerType | Epic 3 | 3.4 |
| FR29 | Registries use O(1) lookup | Epic 3 | 3.4 |
| FR30 | Provider plugins export IProviderPlugin | Epic 4 | 4.2, Epic 6: 6.2 |
| FR31 | Provider plugins implement createProvider | Epic 4 | 4.2, Epic 6: 6.3 |
| FR32 | Provider plugins bundle own SDK | Epic 4 | 4.1, Epic 6: 6.1 |
| FR33 | Provider plugins declare ArkType peer dep | Epic 4 | 4.1 |
| FR34 | Provider manifest includes providerType | Epic 4 | 4.5, Epic 6: 6.2 |
| FR35 | Provider manifest declares capabilities | Epic 4 | 4.5, Epic 6: 6.2 |
| FR36 | Provider plugins publishable to NPM | Epic 4, Epic 6 | 6.1, 6.7 |
| FR37 | Provider plugins follow naming convention | Epic 4 | 4.1, Epic 6: 6.1 |
| FR38 | Workers load PluginRegistryService | Epic 7 | 7.2 |
| FR39 | Workers scan and register plugins | Epic 7 | 7.2 |
| FR40 | Workers enable hot-reload | Epic 7 | 7.2 |
| FR41 | Workers check plugin_id field | Epic 7 | 7.1, 7.3 |
| FR42 | Workers use plugin if plugin_id set | Epic 7 | 7.3 |
| FR43 | Workers fall back to legacy if null | Epic 7 | 7.4 |
| FR44 | Workers log plugin vs legacy usage | Epic 7 | 7.5 |
| FR45 | Workers retrieve ProviderPluginRegistry | Epic 7 | 7.3 |
| FR46 | Workers start even if plugins fail | Epic 7 | 7.2 |
| FR47 | Plugin config via configuration queue | Epic 4 | 4.3 |
| FR48 | Central server provides plugin metadata | Epic 4 | 4.3 |
| FR49 | Configuration includes manifest data | Epic 4 | 4.3 |
| FR50 | Provider configs reference plugin_id | Epic 4 | 4.3, Epic 7: 7.3 |
| FR51 | Provider configs include provider_type | Epic 4 | 4.3 |
| FR52 | System receives config updates | Epic 4 | 4.3 |
| FR53 | Legacy providers with null plugin_id work | Epic 4 | 4.3, Epic 7: 7.4 |
| FR54 | Config queue delivers both types | Epic 4 | 4.3 |
| FR55 | Workers subscribe to config updates | Epic 4 | 4.3, Epic 7: 7.2 |
| FR56 | Provider plugins in packages/ directories | Epic 1 | 1.1, Epic 6: 6.1 |
| FR57 | Core types separated from provider types | Epic 1 | 1.5, Epic 2: 2.6 |
| FR58 | Plugin packages import Common SDK | Epic 1 | 1.5 |
| FR59 | Core doesn't import plugin packages | Epic 1 | 1.5 |
| FR60 | Translators leverage Common SDK | Epic 2 | 2.7, Epic 6: 6.1 |
| FR61 | Clear import boundaries enforced | Epic 1 | 1.5 |
| FR62 | Integration tests verify legacy behavior | Epic 6 | 6.4 |
| FR63 | Integration tests verify plugin behavior | Epic 6 | 6.5 |
| FR64 | Integration tests compare outputs | Epic 6 | 6.5 |
| FR65 | Tests use real provider APIs | Epic 6 | 6.4, 6.5 |
| FR66 | Tests verify streaming parity | Epic 6 | 6.4, 6.5 |
| FR67 | Tests verify hot-reload functionality | Epic 6 | 6.6 |
| FR68 | System detects contract violations | Epic 3 | 3.2, Epic 8: 8.3 |
| FR69 | Comprehensive contract documentation | Epic 8 | 8.1 |
| FR70 | Official plugin examples available | Epic 8 | 8.2 |
| FR71 | Plugin developers can publish independently | Epic 8 | 8.4, 8.5 |
| FR72 | Clear error messages for violations | Epic 8 | 8.3 |
| FR73 | Plugin manifest schema documented | Epic 8 | 8.1 |
| FR74 | Plugin lifecycle hooks documented | Epic 8 | 8.1 |
| FR75 | Existing providers continue working | Epic 7 | 7.4, 7.6 |
| FR76 | System supports gradual migration | Epic 7 | 7.1, 7.4 |
| FR77 | No breaking API changes | Epic 7 | 7.6 |
| FR78 | Provider slugs unchanged | Epic 7 | 7.6 |
| FR79 | Worker startup succeeds regardless | Epic 7 | 7.2, 7.6 |
| FR80 | Database schema backward compatible | Epic 7 | 7.6 |
| FR81 | Core engine remains private | Epic 1 | 1.4, 1.5 |
| FR82 | Common SDK published to public NPM | Epic 2 | 2.9 |
| FR83 | Official plugins published to public NPM | Epic 6 | 6.7 |
| FR84 | Plugin contracts expose only extension points | Epic 1 | 1.5, Epic 2: 2.1-2.8 |
| FR85 | Custom dev extends via plugins | Epic 1 | 1.5 |
| FR86 | Outside devs build with Common SDK only | Epic 2 | 2.9, Epic 8 |
| FR87 | Plugin manifest includes source field | Epic 3 | 3.5 (future-ready) |
| FR88 | Plugin system supports multiple types | Epic 3 | 3.5 |
| FR89 | Database supports plugin versioning | Epic 3 | 3.6 (foundation) |
| FR90 | Discovery extensible to community packages | Epic 8 | 8.5 |

**Total FRs Covered:** 90/90 ✅

**Coverage Validation:** All 90 functional requirements are mapped to specific stories across 8 epics. No requirements are missing.

---

## Summary

**Epic Breakdown Complete for Holo Plugin System Modularization**

### 8 Epics | 50 Stories | 90 FRs

**Epic 1: Foundation & Monorepo Setup** (6 stories)
- Establishes project structure with clear IP boundaries

**Epic 2: Common SDK Package** (9 stories)
- Creates @holokai/common with contracts, types, validators

**Epic 3: Core Plugin Infrastructure** (7 stories)
- Builds discovery, loading, validation, and registry systems

**Epic 4: Provider Plugin Framework** (6 stories)
- Enables provider plugins with config queue integration

**Epic 5: Hot-Reload System** (6 stories)
- Implements zero-downtime plugin updates

**Epic 6: OpenAI Reference Plugin** (7 stories)
- Creates first working plugin with parity verification

**Epic 7: Worker Integration & Legacy Coexistence** (6 stories)
- Integrates plugin system into workers with strategy pattern

**Epic 8: Developer Documentation & Experience** (6 stories)
- Delivers comprehensive docs, examples, and error messages

### Value Delivered

Each epic delivers incremental value to plugin developers, operators, and the business:

1. **Foundation** → Project structure enables independent publishing
2. **Common SDK** → Developers can build plugins using published contracts
3. **Core Infrastructure** → System can discover, load, and manage plugins
4. **Provider Framework** → Developers can create working provider plugins
5. **Hot-Reload** → Operators can update plugins without downtime
6. **OpenAI Plugin** → First working plugin proves the pattern
7. **Worker Integration** → Production system uses plugins with stability
8. **Documentation** → External developers can contribute independently

### Success Criteria Met

✅ **OpenAI plugin works identically to legacy** (Epic 6 parity tests)
✅ **Hot-reload functional** (Epic 5 distributed hot-reload)
✅ **Common SDK usable by external devs** (Epic 2 published, Epic 8 documented)
✅ **Zero breaking changes** (Epic 7 backward compatibility)
✅ **IP protection maintained** (Epic 1 boundaries, private core vs public plugins)

### Next Steps

**For Implementation:**
1. Run Sprint Planning workflow to create sprint tracking file
2. Execute stories sequentially (Epic 1 → Epic 2 → ... → Epic 8)
3. Run Implementation Readiness workflow before Phase 4

**For Migration (Post-MVP):**
- Phase 2: Migrate Claude, Ollama, Perplexity to plugins
- Phase 3: Implement Guard plugin system
- Phase 4: Implement Worker plugin framework
- Phase 5: Marketplace design and community plugin verification

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document incorporates technical decisions from the Architecture document and will guide Phase 4 implementation._

