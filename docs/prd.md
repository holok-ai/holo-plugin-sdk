# Product Requirements Document: Holo Modularization & Plugin Architecture

**Project:** Holo - LLM Gateway
**Author:** John (Product Manager)
**Date:** 2025-11-20
**Status:** Draft
**Track:** BMad Method - Brownfield

---

## Executive Summary

**The Opportunity:**

Holo is a production LLM gateway serving enterprise customers with a powerful queue-based architecture and universal provider abstraction (the "Holo format"). However, the current monolithic design creates three critical business risks:

1. **IP Exposure Risk** - Custom development requires modifying core Holo code, exposing proprietary architecture to outside developers
2. **Stability Risk** - Provider SDK updates (frequent in fast-moving AI space) require full platform redeployments, risking production stability
3. **Ecosystem Limitation** - No mechanism for community contributions or custom extensions without core code access

**The Strategic Response:**

Transform Holo from a monolithic gateway into a **modular platform with a protected core and an open plugin ecosystem**. This enables:

- **IP Protection**: Core Holo engine (queue architecture, universal format, orchestration) remains proprietary
- **Safe Extensibility**: Providers, Guards, Evaluators, and Workers become hot-loadable plugins
- **Ecosystem Growth**: Open source plugin system + contracts enables community contributions without exposing core IP
- **Deployment Decoupling**: Plugin updates don't require platform redeployments

**Why This Matters:**

This isn't refactoring - it's establishing a **sustainable business model** where:
- Custom dev happens in plugins (clients can't access core IP)
- Community builds on published contracts (controlled extension points)
- Future marketplace monetizes the ecosystem (while protecting the engine)

This is an **infrastructure modularization initiative** for an existing production system. It combines aspects of:

- **Developer Platform** (providing plugin contracts and SDKs)
- **Architecture Migration** (monolith → modular platform)
- **Business Model Evolution** (closed → open ecosystem with protected core)

**What makes this special:**

Holo's **queue-based architecture with universal provider abstraction** (the "Holo format") is the core IP. By protecting this engine while opening the extension points, we create a unique positioning:

- **For enterprises**: Proven, stable core with custom extensibility
- **For developers**: Clear contracts to build against without core access
- **For the business**: IP protection + ecosystem growth + future marketplace monetization

The differentiator is the **balance**: open enough to enable an ecosystem, closed enough to protect competitive advantage.

---

## Project Context

**Project Type:** Infrastructure Platform / Developer Tooling

**Domain:** Enterprise AI Infrastructure

**Complexity Level:** High (production system, architectural migration, ecosystem design)

**Field Type:** Brownfield (existing production LLM gateway)

**Product Brief:** N/A (strategic initiative)

**Research Documents:** docs/tech-spec-provider-plugins-DRAFT.md (superseded by this PRD)

**Brownfield Documentation:** docs/index.md (comprehensive project scan)

---

## Vision & Strategic Intent

**Strategic Vision:**

Transform Holo from a monolithic LLM gateway into a **modular platform with protected core IP and an open plugin ecosystem**.

**Core IP (Proprietary):**
- Queue-based architecture (RabbitMQ orchestration)
- Holo universal format (translation hub)
- Worker coordination and scheduling
- Audit/analysis infrastructure
- Response streaming coordination

**Extension Points (Open Ecosystem):**
- Provider integrations (hot-loadable plugins)
- Guards (auth, rate limiting, validation plugins)
- Evaluators (quality scoring, cost tracking plugins)
- Custom workers (specialized processing plugins)
- Common SDK (shared contracts and utilities)

**Business Model:**
- Custom development happens in plugins (clients can't access core IP)
- Outside developers build plugins (safe, isolated contributions)
- Open source plugin system + official plugins (community growth)
- Future marketplace monetization (while protecting engine)

---

## Success Criteria

**Primary Success Metrics:**

1. **IP Protection Achieved**
   - Custom development work completed without modifying core Holo codebase
   - Outside developers can build plugins without accessing proprietary queue/orchestration code
   - Core engine remains closed-source while plugin system is open-sourced

2. **Deployment Decoupling Realized**
   - Provider SDK updates deployable as plugin updates (no platform redeployment)
   - Zero platform downtime for plugin installations/updates
   - Hot-reload capability working in production

3. **Ecosystem Foundation Established**
   - Common SDK published and usable by plugin developers
   - At least 3 plugin types operational (Providers, Guards, one other)
   - Official plugin packages published to NPM
   - Plugin developer documentation complete

4. **Stability Maintained**
   - Zero regression in existing functionality during migration
   - Production uptime maintained throughout transition
   - Customer-facing APIs unchanged (backward compatible)

**Secondary Success Indicators:**

- First community-contributed plugin accepted
- Custom client development completed without IP exposure
- Provider SDK update cycle time reduced from days to hours
- Plugin marketplace design validated (even if not built)

**Business Impact Metrics:**

- **Risk Reduction:** IP exposure incidents = 0 (vs current unlimited access risk)
- **Agility Improvement:** Provider update deployment time: Hours (vs days currently)
- **Ecosystem Growth:** Community plugin contributions (target: 3+ within 6 months post-launch)
- **Revenue Enablement:** Custom dev contracts completable without IP sharing
- **Platform Stability:** Production incidents related to SDK updates: 0 (vs current risk)

---

## Scope Definition

### MVP Scope
**Phase 1: Foundation (MVP)**

1. **Common SDK (@holokai/common)**
   - Shared TypeScript types and interfaces
   - Base plugin contracts (IPlugin, IProviderPlugin, etc.)
   - Plugin manifest structure
   - ArkType validators for contracts
   - Plugin lifecycle hooks (initialize, destroy)
   - Published to NPM as public package

2. **Generic Plugin System**
   - Plugin discovery (scan node_modules/@holokai/*)
   - Plugin loading and validation
   - Type-specific plugin registries
   - Hot-reload capability
   - Database schema for plugin tracking

3. **Provider Plugin Implementation**
   - Convert OpenAI provider to plugin package
   - Provider plugin registry
   - Worker integration with legacy fallback
   - Integration tests (parity verification)
   - Plugin developer documentation

4. **Project Restructuring**
   - Extract providers to packages/ directory
   - Separate core types from provider types
   - Establish clear import boundaries

**Success Gate:** OpenAI plugin works identically to legacy, hot-reload functional, Common SDK usable by external devs

### Growth Features (Post-MVP)
**Phase 2: Provider Ecosystem**

- Migrate remaining providers to plugins (Claude, Ollama, Perplexity)
- Deprecate legacy provider code
- Publish official provider plugin packages
- Provider plugin developer guide

**Phase 3: Guards System**

- Guard plugin contract (IGuardPlugin)
- Guard plugin registry
- Convert existing guards to plugins
- API/Worker integration for guard plugins
- Auth guard examples (JWT, API key, custom)

**Phase 4: Worker Framework**

- Worker plugin contract (IWorkerPlugin)
- Worker plugin registry
- Evaluator plugins (leverage worker framework)
- Custom processing plugins
- Worker orchestration for plugins

### Vision Features (Future)
**Phase 5: Ecosystem Maturity (Future)**

- Community plugin verification workflow
- Plugin marketplace design (UI, discovery, ratings)
- Paid plugin support infrastructure
- Plugin health monitoring and analytics
- Multi-version plugin support (multiple SDK versions simultaneously)
- Plugin sandboxing/security isolation
- Automated plugin testing framework

**Explicitly Out of Scope (This Initiative):**

- Marketplace implementation (design only)
- Community plugin approval workflow (design only)
- Multi-version provider support (future)
- Plugin revenue sharing (future)
- Non-provider plugin types in MVP (Guards/Workers deferred to Phase 2+)

---

## Functional Requirements

### Common SDK Package (@holokai/common)

**FR1:** Developers can install @holokai/common package via npm to access shared contracts
**FR2:** Common SDK exports base plugin interface (IPlugin) with manifest, initialize, and destroy methods
**FR3:** Common SDK exports plugin type enum (provider, guard, evaluator, logger, worker)
**FR4:** Common SDK exports type-specific plugin interfaces (IProviderPlugin, IGuardPlugin, etc.)
**FR5:** Common SDK exports PluginManifest type with required metadata fields
**FR6:** Common SDK exports shared utility types used across Holo ecosystem
**FR7:** Common SDK includes ArkType validators for contract enforcement
**FR8:** Common SDK version is independently managed from core Holo platform
**FR9:** Common SDK documentation explains all contracts and usage examples

### Plugin Discovery & Loading

**FR10:** System scans node_modules for installed plugin packages matching @holokai/{type}-* pattern
**FR11:** System dynamically imports plugin packages at runtime
**FR12:** System validates plugin exports match IPlugin contract structure
**FR13:** System validates plugin manifest contains required fields (name, version, pluginType, etc.)
**FR14:** System rejects plugins with incompatible contract versions
**FR15:** System logs plugin load failures without crashing platform
**FR16:** System skips failed plugins and continues with successfully loaded plugins
**FR17:** System reports discovered plugins to central server (via configuration queue or API)

### Hot-Reload & Dynamic Updates

**FR18:** System watches node_modules/@holokai directory for changes
**FR19:** System detects new plugin installations without platform restart
**FR20:** System reloads modified plugins without platform restart
**FR21:** System clears module cache before reloading plugins
**FR22:** Workers detect plugin updates and refresh provider instances
**FR23:** Plugin updates do not interrupt in-flight requests

### Plugin Registries (Type-Specific)

**FR24:** System maintains separate registries for each plugin type (provider, guard, worker, etc.)
**FR25:** Generic PluginRegistryService routes plugins to type-specific registries
**FR26:** Type-specific registries implement common IPluginRegistry interface
**FR27:** Registries provide getPlugin, registerPlugin, unregisterPlugin, listPlugins methods
**FR28:** Provider plugins are registered by providerType (openai, claude, etc.)
**FR29:** Registries store plugins in memory for O(1) lookup performance

### Provider Plugin System

**FR30:** Provider plugins export default class implementing IProviderPlugin interface
**FR31:** Provider plugins implement createProvider factory method
**FR32:** Provider plugins bundle their own SDK dependencies (e.g., openai@6.8.1)
**FR33:** Provider plugins declare ArkType as peer dependency (shared version)
**FR34:** Provider plugin manifest includes providerType and sdkVersion fields
**FR35:** Provider plugin manifest declares capabilities (streaming, tools, vision, etc.)
**FR36:** Provider plugins can be published to NPM as independent packages
**FR37:** Provider plugins follow naming convention @holokai/provider-{name}

### Worker Integration

**FR38:** Workers load PluginRegistryService at startup
**FR39:** Workers scan and register all plugins before accepting requests
**FR40:** Workers enable hot-reload after initial plugin scan
**FR41:** Workers check provider plugin_id field when creating provider instances
**FR42:** Workers use plugin-based provider if plugin_id is set
**FR43:** Workers fall back to legacy hardcoded provider if plugin_id is null
**FR44:** Workers log whether plugin or legacy provider is used for each instance
**FR45:** Workers retrieve ProviderPluginRegistry from generic PluginRegistryService
**FR46:** Workers start successfully even if plugin system fails to initialize

### Configuration Loading

**FR47:** Plugin configuration loaded via configuration queue (same pattern as existing Holo config)
**FR48:** Central server provides plugin metadata (plugin_type, name, package_name, package_version)
**FR49:** Configuration includes plugin manifest data
**FR50:** Provider configurations reference plugin metadata via plugin_id
**FR51:** Provider configurations include provider_type field
**FR52:** System receives plugin configuration updates via queue without restart
**FR53:** Legacy providers with null plugin_id continue to work (backward compatible)
**FR54:** Configuration queue delivers both provider configs and plugin metadata
**FR55:** Workers subscribe to configuration updates on startup

### Project Structure & Modularity

**FR56:** Provider plugins are extracted to packages/provider-{name}/ directories
**FR57:** Core Holo types are separated from provider-specific types
**FR58:** Plugin packages can import from @holokai/common without circular dependencies
**FR59:** Core Holo code does not import from plugin packages
**FR60:** Translators leverage Common SDK without depending on core Holo
**FR61:** Clear import boundaries enforced between core, common, and plugins

### Testing & Validation

**FR62:** Integration tests verify legacy provider behavior (baseline)
**FR63:** Integration tests verify plugin provider behavior (new implementation)
**FR64:** Integration tests compare legacy vs plugin outputs for parity
**FR65:** Tests use real provider APIs (no mocking)
**FR66:** Tests verify streaming and non-streaming request parity
**FR67:** Tests verify plugin hot-reload functionality
**FR68:** System can detect and report plugin contract violations

### Plugin Developer Experience

**FR69:** Plugin developers can read comprehensive contract documentation
**FR70:** Plugin developers can view official plugin examples (OpenAI reference implementation)
**FR71:** Plugin developers can publish plugins to NPM independently
**FR72:** Plugin developers receive clear error messages for contract violations
**FR73:** Plugin manifest schema is documented with all required and optional fields
**FR74:** Plugin lifecycle hooks (initialize, destroy) are documented with usage examples

### Migration & Backward Compatibility

**FR75:** Existing provider instances continue working during plugin migration (legacy fallback)
**FR76:** System supports gradual migration (some providers plugin, some legacy simultaneously)
**FR77:** No breaking changes to customer-facing APIs during transition
**FR78:** Provider slugs and configurations remain unchanged
**FR79:** Worker startup succeeds whether plugins are present or not
**FR80:** Database schema changes are backward compatible with existing data

### IP Protection & Boundaries

**FR81:** Core Holo engine code (queue, orchestration, Holo format) remains in private repository
**FR82:** Common SDK code is published to public NPM repository
**FR83:** Official plugin packages are published to public NPM repository
**FR84:** Plugin contracts expose only extension points, not core implementation
**FR85:** Custom development can extend via plugins without accessing core codebase
**FR86:** Outside developers can build plugins using only public Common SDK

### Future-Ready Design

**FR87:** Plugin manifest includes source field (official/community/marketplace) for future use
**FR88:** Plugin system designed to support multiple plugin types beyond providers
**FR89:** Database schema supports plugin versioning metadata (foundation for multi-version future)
**FR90:** Plugin discovery pattern extensible to community packages (holo-provider-*) when ready

---

**Total:** 90 Functional Requirements across 13 capability areas

---

## Non-Functional Requirements

### Performance

**NFR1:** Plugin lookup performance must be O(1) (Map-based registry)
**NFR2:** Plugin loading at startup must not increase worker initialization time by more than 5 seconds
**NFR3:** Hot-reload must detect and load new plugins within 2 seconds of installation
**NFR4:** Plugin-based provider request latency must match legacy provider latency (±5ms acceptable variance)
**NFR5:** Memory overhead per loaded plugin must not exceed 10MB
**NFR6:** System must support 20+ simultaneously loaded plugins without performance degradation

### Security

**NFR7:** Plugins run in same process as worker (MVP - no sandboxing)
**NFR8:** Plugin contracts must not expose internal Holo queue/orchestration implementation
**NFR9:** Plugin loading must validate package signature (future - design consideration only)
**NFR10:** Configuration queue plugin references must maintain data integrity
**NFR11:** Plugin discovery must only scan @holokai/* scope in MVP (prevent arbitrary code execution)
**NFR12:** Core Holo source code must remain in private repository (IP protection)
**NFR13:** Common SDK and official plugins must be open-source (Apache 2.0 or MIT license)

### Scalability

**NFR14:** Plugin system must support horizontal worker scaling (stateless plugin registries)
**NFR15:** Plugin hot-reload must work consistently across multiple worker instances
**NFR16:** Configuration queue must deliver plugin metadata efficiently for thousands of plugins
**NFR17:** Plugin registry memory footprint must scale linearly with plugin count (O(n))
**NFR18:** System must support 100+ provider instances referencing various plugin versions

### Integration & Compatibility

**NFR19:** Plugin system must integrate with existing RabbitMQ queue architecture (no changes to queues)
**NFR20:** Plugin system must integrate with existing configuration queue (no PostgreSQL dependency for plugin config)
**NFR21:** Plugin system must work with existing tsyringe dependency injection
**NFR22:** Provider plugins must work with existing response streaming (SSE)
**NFR23:** Plugin system must support Node.js >= 18.0.0
**NFR24:** Plugin packages must support TypeScript 5.x
**NFR25:** ArkType version must be consistent across core and all plugins (peer dependency)
**NFR26:** Customer-facing API endpoints must remain unchanged (backward compatible)
**NFR27:** Existing provider configurations in queue must migrate to plugin system without data loss
**NFR28:** Central server database schema changes are external dependency (not in Holo scope)

---

## Project-Specific Requirements

**Infrastructure Platform Considerations:**

This is a **developer platform** transformation, not an end-user feature. Requirements must address:

1. **Developer Experience:** Plugin developers are the primary "users"
   - Clear contracts, documentation, and examples are critical
   - Error messages must be actionable
   - Development workflow must be frictionless (npm install, code, test, publish)

2. **Migration Safety:** Production system undergoing architectural change
   - Zero downtime requirement
   - Gradual rollout capability (feature flags, legacy fallback)
   - Comprehensive testing before each migration step

3. **Ecosystem Enablement:** Foundation for future growth
   - Design decisions must support marketplace (even if not built)
   - Plugin contracts must be stable (breaking changes are ecosystem-breaking)
   - Versioning strategy must be considered upfront

### API Specification

The plugin system itself does not introduce new customer-facing API endpoints. All existing Holo endpoints remain unchanged:

**Existing Endpoints (Unchanged):**
- OpenAI endpoints: `/api/openai/v1/*`
- Claude endpoints: `/api/claude/v1/*`
- Ollama endpoints: `/api/*`
- Custom application routes: `/api/custom/:provider/:appSlug/*`

**Internal Plugin System (Not Exposed):**
- Plugin discovery and loading happens within workers (internal)
- Configuration queue delivers plugin metadata (existing infrastructure)
- No new REST endpoints for plugin management in MVP

The plugin system is transparent to API users - requests and responses remain identical.

### Authentication & Authorization

Authentication and authorization for the plugin system leverage existing Holo mechanisms:

**No Changes to Customer Authentication:**
- JWT-based authentication remains unchanged
- Organization-based access control unchanged
- Application-level guards unchanged
- Provider-specific permissions unchanged

**Plugin System Security (Internal):**
- Plugins run in worker process context (same security boundary as legacy providers)
- Plugin packages must be installed via npm (trusted installation method)
- Plugin discovery limited to `@holokai/*` scope (prevents arbitrary code execution)
- Configuration queue authenticated via existing RabbitMQ credentials
- Plugin metadata validated using ArkType contracts

No new authentication mechanisms required for MVP. Plugin system operates within existing security model.

### Platform Support

**Runtime Environment:**
- Node.js >= 18.0.0 (existing requirement)
- TypeScript 5.x (existing requirement)
- Works on all platforms supported by Holo (Linux, macOS, Windows for dev)

**Package Manager:**
- npm for plugin installation (standard Node.js ecosystem)
- Yarn and pnpm compatibility not guaranteed in MVP

**Infrastructure Requirements:**
- No new infrastructure dependencies
- Leverages existing RabbitMQ for configuration delivery
- Leverages existing PostgreSQL for plugin metadata storage (future)
- Compatible with existing Docker/Kubernetes deployment

**Deployment Compatibility:**
- Works with existing Docker images (no container changes)
- Compatible with existing Kubernetes scaling (workers remain stateless)
- Hot-reload works across horizontally scaled workers
- No changes to load balancer or API server requirements

---

## Summary

This PRD defines Holo's transformation from monolithic gateway to modular platform with protected core IP.

**Delivered Capabilities:**
- **90 Functional Requirements** across plugin system, Common SDK, provider plugins, testing, and IP protection
- **28 Non-Functional Requirements** for performance, security, scalability, and integration
- **5-Phase Roadmap** from MVP (Common SDK + Provider plugins) to future marketplace

**Critical Success Factors:**
1. Common SDK as foundation (must be published first)
2. OpenAI plugin parity with legacy (proves the pattern works)
3. Hot-reload without downtime (enables agility)
4. Clear IP boundaries (protects business model)

**Next Steps:**
- Architecture workflow to define technical implementation
- Epic breakdown to create implementable work units
- Dev workflow to execute Phase 1 (MVP)

**Value Proposition:**

Holo's modularization establishes a sustainable business model where the core engine (proprietary IP) is protected while extension points (plugins) enable ecosystem growth. This balances three strategic imperatives:

1. **IP Protection** - Custom development without core access
2. **Agility** - SDK updates without platform redeployments
3. **Ecosystem Growth** - Community contributions without IP exposure

The result: Holo becomes a **platform** (not just a gateway), positioning for marketplace monetization while maintaining competitive advantage.

---

---

**Document Status:** Complete
**Generated:** 2025-11-20
**Approver:** BMad
**Next Workflow:** Architecture (create-architecture) → Epics & Stories (create-epics-and-stories) → Implementation

---

_This PRD establishes Holo's strategic foundation for IP-protected ecosystem growth._
