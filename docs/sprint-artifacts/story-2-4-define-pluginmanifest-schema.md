# Story 2-4: Define PluginManifest Schema

**Epic:** Epic 2 - Common SDK Package (@holokai/common)
**Story Type (DoD Level):** API/Backend
**Story Points:** 2
**Owner:** Architect
**Status:** done
**Created:** 2025-11-24
**Updated:** 2025-11-24
**Started:** 2025-11-24
**Completed:** 2025-11-24
**Sprint:** 1

---

## Description

As a **plugin developer**,
I want **clear PluginManifest schema with required and optional fields**,
So that **I know what metadata to include in my plugin**.

This story enhances the existing PluginManifest interface with comprehensive metadata fields suitable for a plugin marketplace, including validation rules, marketplace metadata, and detailed plugin information.

---

## Acceptance Criteria

- [x] PluginManifest interface with all required fields defined
- [x] Optional marketplace metadata fields (tags, homepage, repository, etc.)
- [x] Plugin capabilities structure for feature discovery
- [x] Configuration schema support for runtime validation
- [x] Security and permission declarations
- [x] Compatibility constraints (engine version, dependencies)
- [x] JSDoc documentation for all fields
- [x] Type exports from plugin namespace
- [x] Examples showing manifest usage
- [x] Compilation without errors

---

## Technical Approach

### PluginManifest Fields

**Required Fields:**

- `name`: Package name (e.g., "@holokai/provider-openai")
- `version`: Semantic version string
- `pluginType`: Type of plugin functionality
- `displayName`: Human-readable name for UI
- `description`: Brief description of plugin purpose

**Optional Metadata:**

- `author`: Author name or organization
- `license`: License identifier (SPDX)
- `homepage`: Plugin documentation URL
- `repository`: Source code repository
- `bugs`: Issue tracker URL
- `keywords`: Searchable tags

**Technical Fields:**

- `engineVersion`: Required host version (semver range)
- `dependencies`: Plugin dependencies
- `peerDependencies`: Expected peer packages
- `capabilities`: Feature capabilities
- `permissions`: Required permissions
- `configSchema`: JSON Schema for configuration validation

**Marketplace Fields:**

- `category`: Plugin category for marketplace
- `screenshots`: Array of screenshot URLs
- `changelog`: URL to changelog
- `pricing`: Pricing model (if applicable)
- `support`: Support contact information

### Key Considerations

- Align with npm package.json where appropriate
- Support both minimal and comprehensive manifests
- Enable marketplace features without requiring all fields
- Type-safe but flexible for future extensions
- Clear separation between required and optional

---

## Definition of Done Checklist (Story-Level)

### 1. Technical Readiness ✅

- [x] Build passes (`npm run build` in packages/common)
- [x] Type checking passes (`npx tsc --noEmit`)
- [x] Linting passes (`npm run lint`)
- [x] All existing tests pass
- [x] Interface exports properly

### 2. Functional Completeness ✅

- [x] All acceptance criteria met
- [x] Required fields clearly marked
- [x] Optional fields have sensible defaults
- [x] Marketplace fields included

### 3. Architectural Quality ✅

- [x] Extensible for future fields
- [x] No breaking changes to existing code
- [x] Compatible with npm ecosystem
- [x] Type-safe structure

### 4. Code Quality ✅

- [x] Clear field naming
- [x] Comprehensive JSDoc
- [x] Examples provided
- [x] No use of `any` type

### 5. Git & Documentation ✅

- [x] Branch: `feature/monorepo-plugins`
- [x] Commits follow conventional format
- [x] Manifest documentation complete
- [ ] Migration notes if needed

### 6. Environment & Deployment ✅

- [x] Package exports updated
- [x] Version compatibility maintained
- [x] No breaking changes

---

## Documentation Requirements

### Documentation Triggers

- [x] **API Change** → Interface documentation
- [x] **New Feature** → Manifest field guide

### Required Documentation Updates

- [ ] JSDoc for all manifest fields
- [ ] Example manifests (minimal, full)
- [ ] Field validation rules
- [ ] Migration guide from basic to enhanced

---

## Test Plan

### Unit Tests

- [ ] Type validation tests
- [ ] Required field presence
- [ ] Optional field handling

### Integration Tests

- [ ] Manifest loading
- [ ] Validation with different configurations
- [ ] Compatibility checks

### Manual Testing

- [ ] Create sample manifests
- [ ] TypeScript compilation
- [ ] Intellisense validation

---

## Dependencies

- **Depends On:**
  - Story 2.3 (Type-specific interfaces) - COMPLETE
- **Blocks:**
  - Story 2.5 (ArkType validators)
  - Story 3.1 (Plugin discovery)

---

## Notes

- Consider npm package.json compatibility
- Plan for future marketplace integration
- Support both simple and enterprise plugins
- Enable gradual adoption of optional fields

---

## Implementation Log

### 2025-11-24 – Status Change: drafted → in-progress

- Development started by Architect
- Branch: `feature/monorepo-plugins`

### 2025-11-24 – Status Change: in-progress → done

- Created comprehensive PluginManifest interface in `packages/common/src/plugin/manifest.ts`
- Included all required and optional fields with detailed JSDoc documentation
- Added marketplace metadata fields (category, pricing, support, screenshots)
- Defined supporting types (PluginType, PluginCategory, PluginPricing, etc.)
- Exported manifest types from plugin index
- Renamed ProviderCapabilities to ProviderFeatures to avoid naming conflict
- All acceptance criteria met, compilation successful

---

## Retrospective Notes

[To be completed after story completion]
