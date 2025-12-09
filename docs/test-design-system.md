# System-Level Test Design: Holo Plugin System

**Date:** 2025-11-21
**Author:** BMad
**Status:** Draft
**Mode:** System-Level Testability Review (Phase 3)

---

## Executive Summary

This document evaluates the testability of the Holo Plugin System architecture before implementation. The plugin system transforms Holo from a monolithic LLM gateway into a modular platform with hot-loadable plugins while maintaining zero downtime and backward compatibility.

**Testability Assessment:**

- **Controllability:** PASS with CONCERNS
- **Observability:** PASS
- **Reliability:** PASS

**Critical Findings:**

- ✅ Plugin system designed with clear boundaries and isolation
- ✅ Hot-reload atomic swap pattern prevents request failures
- ⚠️ Distributed hot-reload coordination needs explicit testing strategy
- ⚠️ Plugin contract validation error paths require comprehensive coverage
- ✅ Graceful degradation patterns well-defined throughout

**Test Strategy Recommendation:** Hybrid approach with 70% Integration tests (API/plugin contracts), 20% E2E tests (critical paths), 10% Unit tests (validation logic only).

---

## Testability Assessment

### Controllability: PASS with CONCERNS

**Definition:** Can we control system state for testing? (API seeding, factories, database reset, mockable dependencies)

#### PASS Criteria Met:

1. **Plugin Isolation:** Each plugin package is independently testable
   - Provider plugins have clear `IProviderPlugin` contract
   - Factory pattern (`createProvider`) enables controlled instantiation
   - Plugin manifest validation happens at boundaries (early failure)

2. **Dependency Injection:** tsyringe DI enables test doubles
   - Services injectable: `PluginLoaderService`, `PluginRegistryService`, `HotReloadService`
   - PluginContext provides mockable logger, registryService, configQueue
   - Worker initialization sequence controllable via DI

3. **Configuration Control:** Config queue integration testable
   - Plugin metadata delivered via queue messages (controllable)
   - Provider configs reference plugin_id (togglable: plugin vs legacy)
   - Configuration updates don't require platform restart

4. **State Reset:** Database-free plugin metadata (in-memory Map)
   - No PostgreSQL dependency for plugin state (NFR20)
   - Plugin cache service uses simple Map (easy to clear between tests)
   - Registry services maintain in-memory state (O(1) lookup, easy reset)

#### CONCERNS:

1. **Distributed Hot-Reload Coordination:**
   - **Issue:** Multiple workers independently reload plugins via file watchers
   - **Challenge:** Testing requires simulating npm install across worker fleet
   - **Mitigation:** Mock chokidar events + verify atomic registry swap per worker
   - **Test Complexity:** HIGH - requires multi-process orchestration tests

2. **External SDK Bundling:**
   - **Issue:** Provider plugins bundle exact SDK versions (e.g., `openai@4.73.1`)
   - **Challenge:** Testing different SDK behaviors requires multiple plugin versions
   - **Mitigation:** Use plugin versioning in tests (install v1, upgrade to v2, rollback)
   - **Test Complexity:** MEDIUM - npm install/uninstall in test fixtures

3. **Error Injection in Plugin Loading:**
   - **Issue:** Graceful degradation requires simulating plugin load failures
   - **Challenge:** Dynamic import() failures hard to mock deterministically
   - **Mitigation:** Use filesystem manipulation (corrupt package.json, remove dist/)
   - **Test Complexity:** MEDIUM - filesystem state management

**Controllability Score:** 7/10

**Recommendation:** Implement test fixtures for:
- Multi-worker hot-reload simulation (Docker Compose with shared volume)
- Plugin version management (npm install/uninstall helpers)
- Filesystem corruption helpers (malformed manifests, missing exports)

---

### Observability: PASS

**Definition:** Can we inspect system state? (logging, metrics, traces, deterministic results)

#### PASS Criteria Met:

1. **Structured Logging:**
   - Architecture mandates structured logs with context objects
   - Plugin lifecycle events logged: "[Plugin] Loaded @holokai/provider-openai v1.0.0"
   - Strategy selection logged: "[Worker] Created provider: openai via PluginProviderStrategy"
   - Error logs include context: "[HotReload] Failed to reload X: reason"

2. **Event System:**
   - Plugin lifecycle events emitted via EventEmitter
   - Events: `plugin:loaded`, `plugin:failed`, `plugin:reloading`, `plugin:reloaded`, `registry:updated`
   - Event handlers decoupled (monitoring/metrics can subscribe)
   - Typed events prevent runtime errors (`PluginLifecycleEvents` interface)

3. **Test Observability:**
   - Plugin registry provides `listPlugins()` for inspection
   - ProviderPluginRegistry exposes `getByProviderType()` for verification
   - Hot-reload service emits events (test assertions on event counts)
   - Integration tests can verify plugin state via registry queries

4. **Deterministic Behavior:**
   - Plugin discovery scans predictable paths (`node_modules/@holokai/*`)
   - Plugin loading order deterministic (alphabetical)
   - Atomic registry swap prevents race conditions (Map.set is atomic)
   - No background threads or setTimeout - all async is Promise-based

5. **Health Check Integration:**
   - Plugin system integrates with existing `/api/health` endpoint
   - Workers report discovered plugins to central server (FR17)
   - Plugin metadata visible via configuration queue

**Observability Score:** 9/10

**Recommendation:** Add observability helpers for tests:
- `PluginRegistryInspector` utility: snapshot registry state for assertions
- Event capture fixture: `capturePluginEvents()` returns event log
- Logging assertion helpers: `expectLogContains('[Plugin] Loaded')`

---

### Reliability: PASS

**Definition:** Are tests isolated? Can we reproduce failures? Are components loosely coupled?

#### PASS Criteria Met:

1. **Test Isolation:**
   - Plugin packages independent (separate node_modules dependencies)
   - In-memory registries reset per test (no database state)
   - Plugin cache service uses Map (easy teardown)
   - Fixtures can delete plugins from registry between tests

2. **Reproducible Failures:**
   - Plugin contract validation via ArkType (deterministic errors)
   - Graceful degradation paths well-defined (FR15-16: skip broken plugins)
   - Error messages actionable (FR72): "Plugin manifest validation failed: 'version' must be valid semver"
   - Hot-reload failure paths explicit: old plugin continues serving

3. **Loose Coupling:**
   - Strategy pattern decouples plugin from legacy (clean removal later)
   - Plugin interfaces prevent circular dependencies (FR58-59: core doesn't import plugins)
   - Type-specific registries enforce boundaries (ProviderPluginRegistry separate from GuardPluginRegistry)
   - Architecture ADR-001 subpath exports prevent internal imports

4. **Atomic Operations:**
   - Hot-reload atomic swap: old plugin serves until new plugin ready (FR23)
   - Registry `atomicReplace()` uses single Map.set() operation
   - In-flight requests complete with old plugin, new requests use new plugin
   - No race conditions in plugin loading (sequential per worker)

5. **Cleanup Discipline:**
   - Plugin destroy() lifecycle hook for cleanup
   - Module cache clearing before reload (FR21)
   - Event listeners removable (unsubscribe pattern)
   - Fixtures provide auto-cleanup for created plugins

**Reliability Score:** 9/10

**Recommendation:** Document failure reproduction scenarios:
- Hot-reload failure: corrupt package.json mid-test, verify old plugin continues
- Plugin load failure: remove dist/ directory, verify graceful skip
- Contract violation: provide invalid manifest, verify actionable error message

---

## Architecturally Significant Requirements (ASRs)

ASRs are quality requirements that drive architecture decisions and pose testability challenges. Scored using probability × impact matrix.

### ASR-001: Zero-Downtime Plugin Updates (NFR3, FR19-23)

**Requirement:** Hot-reload must detect and load new plugins within 2 seconds without interrupting in-flight requests.

**Architecture Impact:**
- Chokidar file watcher for cross-platform detection
- Atomic registry swap pattern (old plugin serves until new ready)
- Distributed coordination without Redis/database

**Testability Challenge:**
- Multi-worker simulation requires Docker Compose or process management
- Timing assertions (< 2s detection) require controlled filesystem events
- In-flight request preservation needs concurrent request testing

**Risk Score:** Probability: 2 (file watcher tested, atomic swap proven), Impact: 3 (downtime breaks production) = **Score: 6 (HIGH)**

**Test Approach:**
- **Integration:** Simulate package.json update, verify < 2s detection, assert old plugin serves during reload
- **E2E:** Start request with old plugin, trigger reload mid-request, verify request completes successfully
- **Load Testing:** k6 test with plugin reload under load (verify 0% error rate during swap)

---

### ASR-002: Plugin Contract Validation (FR12-14, FR68)

**Requirement:** System validates plugin exports match IPlugin contract and provides clear error messages for violations.

**Architecture Impact:**
- ArkType validators enforce contract compliance
- Fail-fast at boundaries (plugin loading, manifest validation)
- Graceful degradation (skip broken plugins, continue with others)

**Testability Challenge:**
- Exhaustive negative testing (invalid manifests, missing exports)
- Error message actionability verification
- Edge cases (malformed JSON, missing required fields)

**Risk Score:** Probability: 3 (complex validation, many edge cases), Impact: 2 (broken plugin skipped) = **Score: 6 (HIGH)**

**Test Approach:**
- **Unit:** ArkType validator tests with invalid inputs (missing fields, wrong types, invalid semver)
- **Integration:** PluginLoaderService tests with malformed plugins (corrupt exports, invalid manifests)
- **Contract Testing:** Pact-style tests for plugin contract compliance

---

### ASR-003: Graceful Degradation (FR15-16, FR46)

**Requirement:** Workers start successfully even if plugin system fails to initialize, skipping broken plugins.

**Architecture Impact:**
- Try/catch around plugin loading (log errors, continue)
- Worker startup proceeds regardless of plugin state
- Legacy providers remain functional as fallback

**Testability Challenge:**
- Simulate partial plugin failures (some load, some fail)
- Verify worker continues with reduced functionality
- Test legacy fallback when all plugins fail

**Risk Score:** Probability: 2 (well-designed error handling), Impact: 3 (worker failure blocks production) = **Score: 6 (HIGH)**

**Test Approach:**
- **Integration:** Load worker with mix of valid/invalid plugins, verify worker starts
- **E2E:** Test legacy provider when plugin_id = null, verify fallback works
- **Chaos Engineering:** Kill plugin loading randomly, verify no worker crashes

---

### ASR-004: Backward Compatibility (FR75-80, NFR26)

**Requirement:** No breaking changes to customer-facing APIs, existing providers continue working during migration.

**Architecture Impact:**
- Strategy pattern enables plugin/legacy coexistence
- plugin_id field toggles plugin vs legacy (null = legacy)
- Customer APIs unchanged (/api/openai/v1/*)

**Testability Challenge:**
- Regression testing across both paths (plugin and legacy)
- Parity verification (plugin behaves identically to legacy)
- API contract stability validation

**Risk Score:** Probability: 2 (clear strategy pattern), Impact: 3 (breaking changes lose customers) = **Score: 6 (HIGH)**

**Test Approach:**
- **Integration:** Compare plugin vs legacy responses for identical inputs
- **E2E:** Run existing OpenAI integration tests against both implementations
- **Contract Testing:** Validate API responses unchanged (schema, status codes)

---

### ASR-005: O(1) Plugin Lookup Performance (NFR1, NFR4)

**Requirement:** Plugin registry must provide O(1) lookup, plugin latency must match legacy ±5ms.

**Architecture Impact:**
- Map-based registry keyed by providerType
- Type-specific registries (ProviderPluginRegistry, GuardPluginRegistry)
- No database queries for plugin resolution

**Testability Challenge:**
- Performance regression detection (±5ms variance)
- Load testing under high throughput
- Memory profiling (10MB per plugin limit)

**Risk Score:** Probability: 1 (Map is O(1), proven pattern), Impact: 2 (performance degradation) = **Score: 2 (LOW)**

**Test Approach:**
- **Integration:** Benchmark plugin lookup vs legacy (assert < 5ms difference)
- **Load Testing:** k6 tests with 100 concurrent requests, verify p95 latency
- **Memory Profiling:** Monitor plugin memory footprint, assert < 10MB per plugin

---

### ASR-006: IP Protection Boundaries (FR81-86, NFR12-13)

**Requirement:** Core Holo engine remains private, Common SDK and plugins are open-source.

**Architecture Impact:**
- Monorepo packages/ structure (public) vs src/ (private)
- Import boundaries enforced via ESLint (FR59: core doesn't import plugins)
- Subpath exports prevent internal imports (ADR-001)

**Testability Challenge:**
- Verify no circular dependencies
- Validate ESLint rules prevent violations
- Ensure plugins buildable without core access

**Risk Score:** Probability: 1 (ESLint enforced, clear boundaries), Impact: 3 (IP exposure) = **Score: 3 (MEDIUM)**

**Test Approach:**
- **Unit:** ESLint tests validate import restrictions
- **Integration:** Build plugins independently (no core imports)
- **CI:** Dependency graph analysis (no plugin → core edges)

---

## Test Levels Strategy

Based on architecture (microservices-style plugin system with RabbitMQ queue, Express API, tsyringe DI):

### Recommended Split: 70% Integration / 20% E2E / 10% Unit

**Rationale:**
- Plugin system is integration-heavy (contract validation, registry interactions, worker coordination)
- E2E tests focus on critical paths (hot-reload, parity verification, backward compatibility)
- Unit tests limited to validation logic (ArkType validators, pure functions)

### Unit Tests (10% - Validation Logic Only)

**What to test:**
- ArkType validators for plugin contracts (`pluginManifestValidator`, `providerConfigValidator`)
- Risk scoring functions (`calculateRiskScore`, `requiresMitigation`)
- Pure utility functions (semver parsing, naming convention validation)

**Why minimal unit testing:**
- Plugin system behavior is defined by integration (loading, registration, hot-reload)
- Contract validation is best tested with real plugin packages
- Architecture ADR-007: "VERY LIMITED unit tests, PRIMARY FOCUS on integration"

**Example test:**
```typescript
// tests/unit/validators/plugin-manifest.test.ts
import { pluginManifestValidator } from '@holokai/common/plugin';

describe('pluginManifestValidator', () => {
  it('should accept valid manifest', () => {
    const valid = {
      name: '@holokai/provider-openai',
      version: '1.0.0',
      pluginType: 'provider',
      commonSdkVersion: '^1.0.0',
    };

    const result = pluginManifestValidator(valid);
    expect(result).not.toBeInstanceOf(type.errors);
  });

  it('should reject invalid semver version', () => {
    const invalid = {
      name: '@holokai/provider-openai',
      version: '1.0', // Invalid semver
      pluginType: 'provider',
      commonSdkVersion: '^1.0.0',
    };

    const result = pluginManifestValidator(invalid);
    expect(result).toBeInstanceOf(type.errors);
    expect(result.summary).toContain('version must be valid semver');
  });
});
```

---

### Integration Tests (70% - Primary Focus)

**What to test:**
- Plugin discovery and loading (PluginDiscoveryService, PluginLoaderService)
- Registry operations (ProviderPluginRegistry, type-specific lookups)
- Worker integration (strategy pattern, plugin vs legacy selection)
- Configuration queue integration (plugin metadata, provider configs)
- Hot-reload mechanics (file watching, module cache clearing, atomic swap)
- Plugin parity (OpenAI plugin vs legacy provider)

**Why integration-heavy:**
- Plugin behavior defined by contract compliance and registry interactions
- Real API calls validate actual provider SDK integration (no mocking)
- Architecture specifies hybrid testing (limited unit, focus integration)

**Example test:**
```typescript
// tests/integration/plugin-loader.test.ts
import { PluginLoaderService } from '@/services/plugin/loader.service';
import { PluginRegistryService } from '@/services/plugin/registry.service';

describe('PluginLoaderService Integration', () => {
  let loader: PluginLoaderService;
  let registry: PluginRegistryService;

  beforeEach(() => {
    loader = new PluginLoaderService();
    registry = new PluginRegistryService();
  });

  it('should load valid plugin and register', async () => {
    // Arrange: Install test plugin
    await installTestPlugin('@holokai/provider-openai');

    // Act: Load plugins
    const plugins = await loader.loadAllPlugins();

    // Assert: Plugin loaded and registered
    expect(plugins).toHaveLength(1);
    expect(plugins[0].manifest.name).toBe('@holokai/provider-openai');

    const providerRegistry = registry.getRegistry('provider');
    const plugin = providerRegistry.getByProviderType('openai');
    expect(plugin).toBeDefined();
    expect(plugin.manifest.version).toBe('1.0.0');
  });

  it('should skip broken plugin and log error', async () => {
    // Arrange: Install valid + broken plugins
    await installTestPlugin('@holokai/provider-openai'); // Valid
    await installBrokenPlugin('@holokai/provider-broken'); // Invalid manifest

    // Act: Load plugins
    const plugins = await loader.loadAllPlugins();

    // Assert: Only valid plugin loaded
    expect(plugins).toHaveLength(1);
    expect(plugins[0].manifest.name).toBe('@holokai/provider-openai');

    // Verify error logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[Plugin] Failed to load @holokai/provider-broken')
    );
  });
});
```

---

### E2E Tests (20% - Critical Paths)

**What to test:**
- Complete plugin hot-reload workflow (npm install → detection → swap → verification)
- OpenAI plugin parity with legacy provider (FR64: legacy vs plugin outputs match)
- Backward compatibility (existing APIs unchanged, legacy fallback works)
- Multi-worker hot-reload coordination (distributed file watching)
- Production resilience (plugin failure doesn't crash worker)

**Why E2E focus on critical paths:**
- Hot-reload is complex end-to-end flow (file watch → load → swap)
- Parity verification requires real API calls to OpenAI (no mocking)
- Backward compatibility needs full request/response validation
- Architecture mandates real API tests (FR65: no mocking)

**Example test:**
```typescript
// tests/e2e/hot-reload.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Plugin Hot-Reload E2E', () => {
  test('should reload plugin without dropping requests', async ({ page, request }) => {
    // Arrange: Install v1.0.0 of OpenAI plugin
    await installPlugin('@holokai/provider-openai', '1.0.0');
    await startWorker();

    // Start long-running request with old plugin
    const requestPromise = request.post('/api/openai/v1/chat/completions', {
      data: { model: 'gpt-4', messages: [{ role: 'user', content: 'test' }] }
    });

    // Act: Trigger hot-reload mid-request (upgrade to v1.1.0)
    await installPlugin('@holokai/provider-openai', '1.1.0');

    // Assert: In-flight request completes successfully (old plugin)
    const response = await requestPromise;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.choices).toHaveLength(1);

    // Verify new requests use new plugin
    const newResponse = await request.post('/api/openai/v1/chat/completions', {
      data: { model: 'gpt-4', messages: [{ role: 'user', content: 'test2' }] }
    });
    expect(newResponse.status()).toBe(200);

    // Verify hot-reload logged
    const logs = await getWorkerLogs();
    expect(logs).toContain('[HotReload] Successfully reloaded @holokai/provider-openai v1.1.0');
  });
});
```

---

## NFR Testing Approach

Non-functional requirements validation using appropriate tools per NFR category.

### Security (Playwright E2E + Security Tools)

**NFRs:** NFR7-13 (plugins run in same process, contracts don't expose core, IP protection)

**Test Approach:**
- **E2E Tests:** Verify plugins cannot access core Holo code
  - Attempt to import src/ from plugin package → Build fails
  - ESLint validates no-restricted-imports rules
  - Verify Common SDK exports only public API

- **Security Audit:** npm audit for plugin packages
  - No critical/high vulnerabilities in plugin dependencies
  - Provider SDKs (openai@4.73.1) vulnerability scan
  - Dependency graph analysis (no core → plugin edges)

**Tools:**
- Playwright (E2E import boundary validation)
- ESLint (static analysis of import restrictions)
- npm audit (vulnerability scanning)
- Snyk (continuous dependency monitoring)

**Pass Criteria:**
- ✅ Plugins cannot import core Holo code (build fails)
- ✅ No critical/high vulnerabilities in npm audit
- ✅ ESLint rules prevent restricted imports

---

### Performance (k6 Load Testing)

**NFRs:** NFR1-6 (O(1) lookup, <5s startup, <2s hot-reload, ±5ms latency, <10MB memory, 20+ plugins)

**Test Approach:**
- **Load Testing:** k6 tests with plugin-based providers
  - SLO: p95 request duration < 500ms (NFR4: ±5ms from legacy)
  - SLO: Error rate < 1% during hot-reload
  - Throughput: 100 concurrent users, sustained load

- **Startup Performance:** Measure worker initialization time
  - Baseline: Worker startup without plugins
  - With plugins: Worker startup with 20 plugins loaded
  - Assertion: Increase < 5 seconds (NFR2)

- **Hot-Reload Performance:** Measure plugin reload detection
  - Simulate package.json update
  - Measure time from file change to plugin swapped
  - Assertion: Detection < 2 seconds (NFR3)

- **Memory Profiling:** Monitor plugin memory footprint
  - Load 20 plugins concurrently
  - Measure heap size per plugin
  - Assertion: < 10MB per plugin (NFR5)

**Tools:**
- k6 (load testing, SLO validation)
- Node.js process.memoryUsage() (memory profiling)
- Artillery (alternative load testing tool)

**Pass Criteria:**
- ✅ p95 latency < 500ms under load
- ✅ Worker startup increase < 5s with 20 plugins
- ✅ Hot-reload detection < 2s
- ✅ Memory overhead < 10MB per plugin

---

### Reliability (Playwright E2E + API Tests)

**NFRs:** NFR14-15 (horizontal scaling, hot-reload works across workers)

**Test Approach:**
- **Distributed Hot-Reload:** Multi-worker simulation
  - Docker Compose: 3 workers with shared volume
  - npm install plugin → verify all workers reload
  - Assertion: All workers detect change within 5s

- **Error Handling:** Graceful degradation validation
  - Corrupt plugin mid-reload → old plugin continues serving
  - Missing plugin dependency → skip plugin, worker starts
  - Invalid manifest → log error, skip plugin

- **Atomic Swap Verification:** In-flight request preservation
  - Start 100 concurrent requests with old plugin
  - Trigger hot-reload mid-requests
  - Assertion: 0% error rate during swap

**Tools:**
- Docker Compose (multi-worker simulation)
- Playwright (E2E request validation)
- API tests (contract verification)

**Pass Criteria:**
- ✅ Multi-worker hot-reload coordination works
- ✅ 0% error rate during plugin swap
- ✅ Worker starts even if plugins fail to load

---

### Maintainability (CI Tools + Observability)

**NFRs:** Test coverage ≥80%, code duplication <5%, no critical vulnerabilities

**Test Approach:**
- **Coverage:** Jest/Vitest coverage reports
  - Unit tests: Validation logic coverage
  - Integration tests: Plugin system coverage
  - E2E tests: Critical path coverage
  - Assertion: ≥80% line coverage

- **Duplication:** jscpd analysis
  - Scan src/ and packages/ directories
  - Assertion: < 5% duplication

- **Vulnerability Scan:** npm audit in CI
  - Run on every PR
  - Block merge if critical/high vulnerabilities

- **Observability:** Playwright validates telemetry
  - Verify structured logs emitted
  - Verify plugin events fired
  - Verify health check includes plugin status

**Tools:**
- Jest/Vitest (coverage reports)
- jscpd (duplication detection)
- npm audit (vulnerability scanning)
- Playwright (observability validation)

**Pass Criteria:**
- ✅ Test coverage ≥80%
- ✅ Code duplication < 5%
- ✅ No critical/high vulnerabilities
- ✅ Structured logging validated

---

## Test Environment Requirements

Based on plugin system deployment architecture.

### Local Development Environment

**Infrastructure:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- RabbitMQ (Docker container for config queue)
- PostgreSQL (Docker container for existing Holo DB)

**Plugin Testing:**
- Install @holokai/provider-openai locally via npm
- Mock config queue messages (plugin_metadata)
- In-memory plugin cache (no database)

**Hot-Reload Testing:**
- chokidar file watcher functional on macOS/Linux
- Simulate npm install with filesystem manipulation
- Mock plugin package.json updates

---

### CI/CD Environment

**Infrastructure:**
- GitHub Actions runners (ubuntu-latest)
- Docker Compose for multi-worker tests
- Shared volume for hot-reload simulation

**Test Stages:**
1. **Unit Tests:** Fast feedback (< 30s)
   - Run validator tests, pure function tests
   - No external dependencies

2. **Integration Tests:** API contract validation (< 5 min)
   - Start RabbitMQ container
   - Load plugins from test fixtures
   - Verify plugin loading, registry operations

3. **E2E Tests:** Critical path validation (< 10 min)
   - Docker Compose: 3 workers + shared volume
   - Hot-reload tests, parity tests, backward compatibility
   - Real OpenAI API calls (with test API key)

4. **Load Tests:** Performance validation (< 5 min)
   - k6 tests with 100 concurrent users
   - Verify p95 latency < 500ms
   - Verify 0% error rate during hot-reload

**Artifact Outputs:**
- Test results (JUnit XML)
- Coverage reports (Cobertura XML)
- k6 performance summary (JSON)
- Playwright traces (for failed tests)

---

### Staging Environment

**Infrastructure:**
- Production-like: 5 workers, RabbitMQ cluster, PostgreSQL
- Kubernetes deployment (horizontal scaling)
- Shared persistent volume for plugins (NFS/EFS)

**Deployment Testing:**
- Blue-green deployment with plugin updates
- Rolling worker restarts with hot-reload
- Canary testing (1 worker with new plugin, 4 with old)

**Monitoring:**
- Plugin load events (Datadog/CloudWatch)
- Hot-reload metrics (detection time, swap success rate)
- Error rate during plugin updates (alert if > 0.1%)

---

## Testability Concerns (if any)

### CONCERN-001: Distributed Hot-Reload Complexity (Medium)

**Issue:** Testing multi-worker hot-reload requires complex orchestration (Docker Compose, shared volumes, timing assertions).

**Impact:** High test maintenance overhead, flaky timing tests possible.

**Mitigation:**
- Use Docker Compose fixtures with controlled environment
- Mock chokidar events for deterministic timing
- Add retry logic for timing assertions (await up to 5s, not fixed 2s)
- Document hot-reload test patterns in knowledge base

**Owner:** QA Lead
**Timeline:** Sprint 0 (before Epic 5 implementation)

---

### CONCERN-002: Plugin SDK Version Management (Low)

**Issue:** Testing different provider SDK versions requires npm install/uninstall in test fixtures.

**Impact:** Slower test execution, potential npm install failures in CI.

**Mitigation:**
- Pre-build test plugin packages in CI cache
- Use npm pack for offline installs (no network calls)
- Fixture helpers: `installTestPlugin(name, version)` with caching

**Owner:** Dev Lead
**Timeline:** Sprint 0 (before Epic 6 implementation)

---

### CONCERN-003: OpenAI API Test Costs (Low)

**Issue:** E2E parity tests use real OpenAI API calls, incurring costs.

**Impact:** Test budget constraints, slow feedback loops.

**Mitigation:**
- Use minimal prompts ("test") for parity verification
- Rate limit E2E tests (run nightly, not on every commit)
- Cache OpenAI responses for regression tests (HAR capture)
- Use mocking for error scenarios (429, 500), real API for happy paths

**Owner:** QA Lead
**Timeline:** Sprint 0 (before Epic 6 implementation)

---

## Recommendations for Sprint 0

Sprint 0 focuses on test infrastructure setup before Phase 4 implementation (Epic 1-8 execution).

### Recommendation 1: Implement Test Framework (framework workflow)

**Actions:**
- Configure Playwright for E2E tests
- Configure Jest for unit/integration tests
- Configure k6 for load/performance tests
- Set up test fixtures for plugin management

**Deliverables:**
- `playwright.config.ts` with test environment setup
- `jest.config.cjs` with coverage thresholds
- `tests/fixtures/` directory with plugin helpers
- `tests/k6/` directory with performance tests

**Timeline:** Sprint 0, Week 1

---

### Recommendation 2: Create Plugin Test Fixtures

**Actions:**
- Implement `installTestPlugin(name, version)` helper
- Implement `installBrokenPlugin(name)` for error testing
- Implement `corruptPluginManifest(name)` for validation testing
- Implement `capturePluginEvents()` for observability testing

**Deliverables:**
- `tests/fixtures/plugin-installer.ts`
- `tests/fixtures/plugin-corruptor.ts`
- `tests/fixtures/event-capturer.ts`

**Timeline:** Sprint 0, Week 1

---

### Recommendation 3: Set Up Multi-Worker Test Environment

**Actions:**
- Create Docker Compose configuration (3 workers + RabbitMQ + shared volume)
- Implement hot-reload orchestration helpers
- Configure Playwright to interact with multi-worker setup

**Deliverables:**
- `docker-compose.test.yml` with worker configuration
- `tests/e2e/hot-reload-multi-worker.spec.ts` skeleton
- Documentation: "Multi-Worker Testing Guide"

**Timeline:** Sprint 0, Week 2

---

### Recommendation 4: Configure CI Pipeline

**Actions:**
- GitHub Actions workflow with test stages (unit → integration → e2e → load)
- Cache npm dependencies and test plugin packages
- Artifact uploads (coverage, traces, k6 results)
- Quality gates: ≥80% coverage, no critical vulnerabilities

**Deliverables:**
- `.github/workflows/test.yml`
- `.github/workflows/load-test.yml`
- CI documentation: "Running Tests in CI"

**Timeline:** Sprint 0, Week 2

---

## Quality Gate Criteria

Before proceeding to implementation-readiness gate check:

### Test Infrastructure Gate:

- [ ] Playwright configured with E2E test scaffolding
- [ ] Jest configured with unit/integration test scaffolding
- [ ] k6 configured with performance test scaffolding
- [ ] Plugin test fixtures implemented
- [ ] Multi-worker Docker Compose environment functional
- [ ] CI pipeline stages configured

### Coverage Targets:

- [ ] Unit tests: Validation logic coverage ≥80%
- [ ] Integration tests: Plugin system coverage ≥80%
- [ ] E2E tests: Critical paths covered (hot-reload, parity, backward compat)
- [ ] Performance tests: SLO validation (p95 < 500ms, error rate < 1%)

### Testability Criteria:

- [ ] Controllability: PASS (concerns mitigated)
- [ ] Observability: PASS (event capture implemented)
- [ ] Reliability: PASS (isolation verified)

---

## Approval

**System-Level Test Design Approved By:**

- [ ] Product Manager: __________ Date: __________
- [ ] Tech Lead: __________ Date: __________
- [ ] QA Lead: __________ Date: __________

**Comments:**

---

## Appendix

### Knowledge Base References

- `nfr-criteria.md` - NFR validation approach (security, performance, reliability, maintainability)
- `test-levels-framework.md` - Test level selection guidance (unit, integration, E2E)
- `risk-governance.md` - Risk classification and scoring
- `test-quality.md` - Quality standards and Definition of Done

### Related Documents

- PRD: `/Users/alexduan/Projects/nova/llm-proxy/docs/prd.md` (90 FRs, 28 NFRs)
- Architecture: `/Users/alexduan/Projects/nova/llm-proxy/docs/plugin-system-architecture.md` (Technical decisions)
- Epics: `/Users/alexduan/Projects/nova/llm-proxy/docs/epics.md` (8 epics, 50 stories)

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `.bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: System-Level Testability Review
