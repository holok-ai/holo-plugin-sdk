# Epic Technical Specification: Common SDK Package (@holokai/common)

Date: 2025-11-24
Author: BMad
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the foundation for Holo's plugin ecosystem by creating and publishing the @holokai/common package to NPM. This SDK provides well-defined contracts, interfaces, types, and validators that enable external developers to build provider plugins, guard plugins, and other extensions without accessing core Holo code. The SDK enforces a clean IP boundary where plugins import from the public SDK while the proprietary core remains private, establishing the architectural separation necessary for both IP protection and ecosystem growth.

## Objectives and Scope

### In Scope:

- Create @holokai/common package structure with namespaced organization (/plugin, /provider, /holo, /utils)
- Define base IPlugin interface with lifecycle hooks (initialize, destroy, optional hooks)
- Define type-specific interfaces (IProviderPlugin, IGuardPlugin, IWorkerPlugin)
- Define PluginManifest schema with required and optional metadata fields
- Implement ArkType validators for all contracts with clear error messages
- Define provider-specific types (ProviderConfig, ProviderCapabilities)
- Define Holo universal format types (HoloRequest, HoloResponse, HoloMessage)
- Define shared utility types (Logger, ErrorResponse, HealthStatus)
- Publish package to NPM with open-source license (MIT/Apache-2.0)

### Out of Scope:

- Core plugin infrastructure implementation (Epic 3)
- Actual plugin implementations (Epic 6)
- Worker integration (Epic 7)
- Hot-reload system (Epic 5)
- Legacy provider migration logic

## System Architecture Alignment

The Common SDK aligns with the approved plugin system architecture by implementing the namespace + subpath exports pattern (ADR-001). The SDK provides the contract layer that enables the Strategy pattern for provider selection, supports type-specific registries with specialized interfaces, and establishes the Holo universal format as the translation hub preventing N² provider-to-provider translations. The SDK maintains compatibility with existing Holo infrastructure (tsyringe DI, Winston logging) through interface abstraction while enforcing the critical IP boundary where packages/common/ cannot import from src/ core.

### Architecture Overview

```
┌──────────────────────┐     ┌──────────────────────┐
│  Plugin Developers   │────▶│  @holokai/common     │
│  (External)          │     │  (Public SDK)        │
└──────────────────────┘     └──────────────────────┘
                                        │
                                        ▼
                            ┌──────────────────────┐
                            │    NPM Registry      │
                            │  (Public Package)    │
                            └──────────────────────┘
                                        ▲
                                        │
┌──────────────────────┐     ┌──────────────────────┐
│    Holo Core         │────▶│  Plugin System       │
│  (Private src/)      │     │  (Uses SDK Types)    │
└──────────────────────┘     └──────────────────────┘

IP Boundary: packages/common/ ←X→ src/ (no imports allowed)
```

## Detailed Design

### Services and Modules

| Module                    | Responsibility              | Inputs         | Outputs                                           | Owner       |
| ------------------------- | --------------------------- | -------------- | ------------------------------------------------- | ----------- |
| packages/common/plugin/   | Plugin system contracts     | N/A            | IPlugin, IProviderPlugin, IGuardPlugin interfaces | Plugin Team |
| packages/common/provider/ | Provider-specific types     | N/A            | ProviderConfig, ProviderCapabilities types        | Plugin Team |
| packages/common/holo/     | Universal format types      | N/A            | HoloRequest, HoloResponse types                   | Plugin Team |
| packages/common/utils/    | Shared utilities            | N/A            | Logger, ErrorResponse interfaces                  | Plugin Team |
| Plugin Validators         | Runtime contract validation | Plugin exports | Validation results with errors                    | Plugin Team |

### Data Models and Contracts

#### Core Plugin Types

```typescript
interface PluginManifest {
  // Required fields
  name: string; // Full package name (e.g., "@holokai/provider-openai")
  version: string; // Semver (e.g., "1.0.0")
  pluginType: PluginType; // "provider" | "guard" | "evaluator" | "logger" | "worker"
  commonSdkVersion: string; // Semver range (e.g., "^1.0.0")

  // Provider-specific (required for provider plugins)
  providerType?: string; // Lowercase (e.g., "openai")
  sdkVersion?: string; // Format: "openai@4.73.1"
  capabilities?: ProviderCapabilities;

  // Optional metadata (marketplace-ready)
  author?: string;
  description?: string;
  source?: 'official' | 'community' | 'marketplace';
  holoVersion?: string; // Compatible Holo version
}

// Error handling structure (Story 2.8)
interface PluginError {
  code: string; // Structured code (e.g., "PLUGIN_MANIFEST_INVALID_001")
  message: string; // Human-readable message
  severity: 'critical' | 'warning' | 'info';
  details?: unknown; // Additional structured data
  recovery?: string; // How to fix the issue
  documentation?: string; // Link to relevant docs
}

interface ProviderConfig {
  id: string;
  provider_type: string;
  api_key?: string;
  model?: string;
  plugin_id: string | null; // null = legacy fallback
  // Additional provider-specific fields
}

interface HoloRequest {
  messages: HoloMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
}

interface HoloResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage?: Usage;
  created: number;
}
```

### APIs and Interfaces

#### Base Plugin Interface

```typescript
interface IPlugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;

  // Optional lifecycle hooks
  onConfigUpdate?(config: any): Promise<void>;
  healthCheck?(): Promise<HealthStatus>;
}
```

#### Provider Plugin Interface

```typescript
interface IProviderPlugin extends IPlugin {
  createProvider(config: ProviderConfig): AIProvider;
  validateConfig(config: ProviderConfig): boolean;
  getCapabilities(): ProviderCapabilities;
}
```

#### Plugin Context (injected during initialization)

```typescript
interface PluginContext {
  logger: Logger; // Winston-compatible logger
  registryService: IRegistryService;
  configQueue: IConfigQueue;
}
```

#### Subpath Exports

- `@holokai/common/plugin` - Plugin contracts and validators
- `@holokai/common/provider` - Provider types and validators
- `@holokai/common/holo` - Holo format types and validators
- `@holokai/common/utils` - Utilities and helpers
- `@holokai/common/errors` - Error types and factory functions

### Workflows and Sequencing

#### Package Installation and Usage Flow

```
1. Developer installs SDK
   → npm install @holokai/common

2. Developer imports specific namespace
   → import { IProviderPlugin } from '@holokai/common/plugin'
   → import { ProviderConfig } from '@holokai/common/provider'

3. Developer implements plugin
   → class OpenAIPlugin implements IProviderPlugin
   → Implements all required methods

4. TypeScript validates at compile time
   → Enforces interface contracts
   → Catches missing/incorrect implementations

5. Runtime validation via ArkType
   → Plugin system validates manifest
   → Clear error messages for contract violations
```

#### Validator Usage Pattern

```
1. Plugin exports manifest
   → export default { manifest, initialize, ... }

2. Plugin system loads plugin
   → Reads plugin exports

3. Validates manifest with ArkType
   → pluginManifestValidator(manifest)
   → Returns type.errors if invalid

4. Provides actionable error messages
   → "manifest.version must be valid semver, got '1.0'"
   → "manifest.pluginType must be one of: provider, guard, ..."
```

## Non-Functional Requirements

### Performance

- **Package Size**:
  - Core SDK (interfaces only): < 100KB minified
  - With all validators: < 200KB minified
  - Individual namespaces: < 50KB each via tree-shaking
- **Load Time**: Import latency < 100ms for individual namespaces
- **Validation Speed**: ArkType validators must complete in < 10ms per manifest
- **Type Checking**: TypeScript compilation < 5s for plugin projects importing SDK
- **Memory**: Zero memory leaks from SDK usage (stateless interfaces)

### Security

- **No Internal Exposure**: Subpath exports prevent access to internal implementation details
- **Input Validation**: All validators sanitize inputs preventing injection attacks
- **No Core Dependencies**: SDK cannot import from src/ maintaining IP boundary
- **Secure Defaults**: Provider configurations default to secure settings
- **Type Safety**: TypeScript strict mode prevents runtime type errors

### Reliability/Availability

- **NPM Availability**: Published to public NPM with 99.9% availability SLA
- **Version Stability**: Semantic versioning with no breaking changes in minor/patch
- **Backward Compatibility**: Plugins using older SDK versions continue to work
- **Peer Dependency**: ArkType as peer dependency prevents version conflicts
- **Graceful Degradation**: Missing optional fields don't break validation

### Observability

- **Clear Error Messages**: Validators provide actionable error messages with recovery guidance
- **Version Tracking**: SDK version included in plugin manifests for debugging
- **Type Documentation**: All interfaces include JSDoc comments with examples
- **Debug Support**: Source maps included for easier debugging
- **Usage Analytics**: Privacy-first telemetry approach (future scope):
  - Opt-in only
  - No PII collected
  - Only aggregate metrics
  - 30-day data retention
  - Deferred to Epic 2.5

## Dependencies and Integrations

### Direct Dependencies

- **TypeScript** (^5.8.3): Compilation and type checking
- **Node.js** (>=18.0.0): Runtime requirement

### Peer Dependencies

- **ArkType** (^2.1.22): Runtime validation library (shared with core)
  - Must be consistent version across core and all plugins
  - Prevents duplicate instances and version conflicts

### Build Dependencies

- **npm workspaces**: Monorepo package management
- **tsc**: TypeScript compiler for build process

### Integration Points

#### With Epic 1 (Foundation & Monorepo)

- Requires packages/ directory structure from Story 1.1
- Requires TypeScript composite configuration from Story 1.2
- Requires build scripts from Story 1.3
- Requires publishing metadata configuration from Story 1.4
- Must respect import boundaries from Story 1.5

#### With Core Holo

- **No direct imports**: SDK cannot import from src/ (enforced by ESLint)
- **Interface compatibility**: Logger interface matches Winston (used by core)
- **Type alignment**: ProviderConfig matches existing provider configuration
- **DI pattern**: PluginContext aligns with tsyringe dependency injection

#### With Future Epics

- **Epic 3**: Plugin infrastructure will consume these contracts
- **Epic 4**: Provider framework will extend IProviderPlugin
- **Epic 5**: Hot-reload will use PluginManifest for version detection
- **Epic 6**: OpenAI plugin will be first implementation of interfaces
- **Epic 7**: Worker integration will use SDK for plugin instantiation

## Acceptance Criteria (Authoritative)

1. **AC-2.1**: @holokai/common package exists in packages/common/ with proper structure
2. **AC-2.2**: Package contains four namespaced folders (/plugin, /provider, /holo, /utils) with barrel exports
3. **AC-2.3**: Subpath exports configured in package.json allowing namespace-specific imports
4. **AC-2.4**: IPlugin interface defined with manifest, initialize(), and destroy() methods
5. **AC-2.5**: Type-specific interfaces (IProviderPlugin, IGuardPlugin, IWorkerPlugin) extend IPlugin
6. **AC-2.6**: PluginManifest schema includes all required fields (name, version, pluginType, commonSdkVersion)
7. **AC-2.7**: ArkType validators implement type-safe validation with satisfies Type<T> pattern
8. **AC-2.8**: ProviderConfig and ProviderCapabilities types defined with plugin_id field
9. **AC-2.9**: Holo universal format types (HoloRequest, HoloResponse) support translation pattern
10. **AC-2.10**: Utility types (Logger, ErrorResponse, HealthStatus) provide common interfaces
11. **AC-2.11**: All validators provide clear, actionable error messages with recovery hints
12. **AC-2.12**: Error types and factory functions in @holokai/common/errors namespace
13. **AC-2.13**: Package published to NPM as @holokai/common with public access
14. **AC-2.14**: TypeScript compilation succeeds with strict mode enabled
15. **AC-2.15**: Developers can import specific namespaces without loading entire SDK
16. **AC-2.16**: Package includes open-source license (MIT or Apache-2.0)

## Traceability Mapping

| Acceptance Criteria              | Spec Section         | Component/API                     | Test Approach                          |
| -------------------------------- | -------------------- | --------------------------------- | -------------------------------------- |
| AC-2.1: Package structure        | Services and Modules | packages/common/ directory        | Verify directory structure exists      |
| AC-2.2: Namespaced folders       | Data Models          | /plugin, /provider, /holo, /utils | Check barrel exports in each namespace |
| AC-2.3: Subpath exports          | APIs and Interfaces  | package.json exports field        | Test imports from each subpath         |
| AC-2.4: IPlugin interface        | APIs and Interfaces  | src/plugin/interfaces.ts          | TypeScript compilation test            |
| AC-2.5: Type-specific interfaces | APIs and Interfaces  | IProviderPlugin, IGuardPlugin     | Interface extension validation         |
| AC-2.6: PluginManifest schema    | Data Models          | src/plugin/types.ts               | Validate required vs optional fields   |
| AC-2.7: ArkType validators       | Workflows            | src/\*/validators.ts              | Runtime validation tests               |
| AC-2.8: Provider types           | Data Models          | src/provider/types.ts             | Type checking with plugin_id           |
| AC-2.9: Holo format types        | Data Models          | src/holo/types.ts                 | Translation compatibility test         |
| AC-2.10: Utility types           | APIs and Interfaces  | src/utils/types.ts                | Logger interface tests                 |
| AC-2.11: Error messages          | Observability        | Validator outputs                 | Error message clarity tests            |
| AC-2.12: Error types             | Data Models          | src/errors/types.ts               | Error factory and structure tests      |
| AC-2.13: NPM publishing          | Dependencies         | npm registry                      | Verify package availability            |
| AC-2.14: TypeScript strict       | Build Process        | tsconfig.json                     | Compilation with strict: true          |
| AC-2.15: Tree-shaking            | Performance          | Subpath imports                   | Bundle size analysis                   |
| AC-2.16: Open-source license     | Legal/Compliance     | package.json license field        | License file verification              |

## Risks, Assumptions, Open Questions

### Risks

- **Risk**: Breaking changes to SDK interfaces after publishing → **Mitigation**: Strict semantic versioning, deprecation policy, beta period
- **Risk**: ArkType version conflicts between core and plugins → **Mitigation**: Peer dependency pattern, version range compatibility
- **Risk**: Subpath exports not supported by older bundlers → **Mitigation**: Document minimum tool versions, provide fallback imports
- **Risk**: Package grows too large affecting load times → **Mitigation**: Tree-shaking via subpath exports, monitor bundle size

### Assumptions

- **Assumption**: Developers familiar with TypeScript interfaces and npm packages
- **Assumption**: Plugin developers will install ArkType as peer dependency
- **Assumption**: Monorepo structure from Epic 1 is complete and functional
- **Assumption**: TypeScript 5.x adoption is standard in target developer community

### Open Questions

- **Question**: Should we provide a CLI tool for plugin scaffolding? → **Next Step**: Gather feedback after initial SDK release
- **Question**: How to handle breaking changes post-1.0? → **Next Step**: Define deprecation policy before stable release
- **Question**: Should SDK include helper functions or just interfaces? → **Next Step**: Start minimal, expand based on plugin developer needs
- **Question**: Telemetry opt-in mechanism for usage tracking? → **Next Step**: Design privacy-preserving analytics for v2

## Test Strategy Summary

### Test Levels

1. **Type-Level Testing**
   - TypeScript strict mode compilation tests
   - Interface implementation verification
   - Type compatibility checks between versions

2. **Validator Testing**
   - Valid manifest acceptance tests
   - Invalid manifest rejection with clear errors
   - Edge case handling (missing optional fields, extra fields)
   - Performance benchmarks (< 10ms validation)

3. **Integration Testing**
   - Subpath export functionality
   - Tree-shaking verification
   - Cross-package import resolution
   - Peer dependency resolution

4. **Documentation Testing**
   - Example code compilation
   - JSDoc completeness verification
   - README accuracy checks

### Test Coverage Focus

- **Validators**: 100% coverage (critical for runtime safety)
- **Type Definitions**: Compilation tests for all interfaces
- **Exports**: Each subpath tested independently
- **Error Messages**: Clarity and actionability validated

### Test Execution

```bash
# Type checking
npm run type-check

# Validator tests
npm test packages/common/src/*/validators.test.ts

# Integration tests
npm test packages/common/tests/integration/

# Bundle size analysis
npm run analyze:bundle
```
