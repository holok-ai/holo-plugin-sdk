# Story 3.1: Implement Plugin Discovery Service

**Epic:** 3 - Core Plugin Infrastructure
**Story Number:** 3.1
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **system operator**,
I want **the system to automatically discover installed plugin packages**,
So that **plugins are available without manual configuration**.

## Acceptance Criteria

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

## Tasks / Subtasks

### Create Discovery Service Class
- [ ] Create src/services/plugin/discovery.service.ts (AC: And 6)
  - [ ] Implement PluginDiscoveryService class
  - [ ] Add @injectable() decorator for DI
  - [ ] Inject logger dependency

### Implement Node Modules Scanning
- [ ] Implement scanForPlugins() method (AC: Then)
  - [ ] Use fs.readdir() to scan node_modules/@holokai/
  - [ ] Handle directory not found gracefully
  - [ ] Return empty array if no plugins found

### Implement Package.json Parsing
- [ ] Parse package.json for each discovered package (AC: And 1)
  - [ ] Read package.json file
  - [ ] Extract name field
  - [ ] Extract version field
  - [ ] Extract main field (entry point)
  - [ ] Handle malformed JSON gracefully

### Implement Plugin Type Detection
- [ ] Detect plugin type from package name (AC: And 2)
  - [ ] Pattern match: provider-* → type: "provider"
  - [ ] Pattern match: guard-* → type: "guard"
  - [ ] Pattern match: evaluator-* → type: "evaluator"
  - [ ] Pattern match: logger-* → type: "logger"
  - [ ] Pattern match: worker-* → type: "worker"

### Implement Discovery Result Logging
- [ ] Add logging (AC: And 4)
  - [ ] Log: "Found N plugins: package1, package2, ..."
  - [ ] Log warnings for malformed packages
  - [ ] Use injected logger

### Create Return Type
- [ ] Define DiscoveredPlugin interface (AC: And 3)
  - [ ] packageName: string
  - [ ] version: string
  - [ ] entryPoint: string
  - [ ] pluginType: PluginType

### Add Error Handling
- [ ] Implement graceful degradation (AC: And 5)
  - [ ] Handle missing node_modules directory
  - [ ] Handle missing @holokai directory
  - [ ] Handle malformed package.json
  - [ ] Log warnings, continue discovery

---

## Dev Notes

### Architecture Alignment
- FR10: Scan node_modules for @holokai/{type}-* pattern
- Hybrid discovery: Static package.json parsing (startup) + chokidar watch (hot-reload)
- Architecture specifies hybrid approach for fast startup + hot-reload capability

### Implementation Pattern
```typescript
@injectable()
export class PluginDiscoveryService {
  constructor(private logger: Logger) {}

  async scanForPlugins(): Promise<DiscoveredPlugin[]> {
    // Scan node_modules/@holokai/*
    // Parse package.json
    // Return discovered plugins
  }
}
```

### Testing Standards
- Test with plugins installed
- Test with no plugins
- Test with malformed package.json
- Test plugin type detection

### Dependencies
- **Prerequisites:** Epic 2 complete (Common SDK published)
- **Blocks:** Story 3.2 (loader needs discovery results)
- **Related FRs:** FR10 (scan node_modules), FR17 (report discovered plugins)

### References
- [Source: docs/epics.md#Story-3.1]
- [FR10: Plugin Discovery]

---

## Dev Agent Record

### Context Reference
docs/sprint-artifacts/3-1-implement-plugin-discovery-service.context.xml

### Completion Notes

✅ Story completed successfully - all acceptance criteria met:

**Implementation Summary:**
- Created PluginDiscoveryService with @injectable() decorator for tsyringe DI (AC-3.1.8)
- Implemented file system scanning of node_modules/@holokai/* (AC-3.1.1)
- Package.json parsing extracting name, version, and main entry point (AC-3.1.2)
- Plugin type inference from package name patterns (@holokai/{type}-*) (AC-3.1.3)
- Returns DiscoveredPlugin[] with complete metadata (AC-3.1.4)
- Comprehensive logging of discovery results (AC-3.1.5)
- Graceful degradation - returns empty array on failures (AC-3.1.6)
- Implemented in correct location src/services/plugin/discovery.service.ts (AC-3.1.7)

**Testing:**
- Created comprehensive test suite with 26 passing tests
- All acceptance criteria validated with unit tests
- Tests cover: discovery scanning, package.json parsing, type inference, graceful error handling, logging
- Edge cases tested: malformed JSON, missing fields, invalid package names, non-directory entries

**Technical Notes:**
- Used simple ConsoleLogger instead of ClassLogger (ClassLogger doesn't exist yet in this codebase)
- Implemented Logger interface for testability and future winston integration
- All methods return Promise<DiscoveredPlugin[]> or null for graceful degradation
- Plugin type detection supports: provider, guard, evaluator, logger, worker

**Deviations from Original Plan:**
- Replaced ClassLogger with inline ConsoleLogger implementation (ClassLogger not yet implemented in codebase)
- Used relative import for PluginType from packages/common instead of @holokai/common/plugin (TypeScript resolution issues in tests)

### File List

**Created:**
- src/services/plugin/discovery.service.ts (237 lines) - PluginDiscoveryService implementation
- tests/unit/services/plugin/discovery.service.test.ts (479 lines) - Comprehensive test suite

**Modified:**
- jest.config.cjs - Added moduleNameMapper for @holokai/common subpath exports

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
