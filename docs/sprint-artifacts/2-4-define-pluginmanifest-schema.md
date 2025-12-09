# Story 2.4: Define PluginManifest Schema

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.4
**Status:** drafted
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **clear PluginManifest schema with required and optional fields**,
So that **I know what metadata to include in my plugin**.

## Acceptance Criteria

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

## Tasks / Subtasks

### Define PluginManifest Interface
- [ ] Create PluginManifest interface in src/plugin/types.ts (AC: Then)
  - [ ] Add required field: name (string)
  - [ ] Add required field: version (string - semver)
  - [ ] Add required field: pluginType (PluginType enum)
  - [ ] Add required field: commonSdkVersion (string - semver range)
- [ ] Add provider-specific optional fields (AC: And 2)
  - [ ] Add optional field: providerType? (string)
  - [ ] Add optional field: sdkVersion? (string - format: "sdk@version")
  - [ ] Add optional field: capabilities? (ProviderCapabilities)
- [ ] Add general optional fields (AC: And 3)
  - [ ] Add optional field: author? (string)
  - [ ] Add optional field: description? (string)
  - [ ] Add optional field: source? (PluginSource)
  - [ ] Add optional field: holoVersion? (string - semver range)

### Define Supporting Types
- [ ] Create PluginSource type (AC: And 4)
  - [ ] Define as: 'official' | 'community' | 'marketplace'
  - [ ] Add JSDoc explaining future marketplace use
- [ ] Reference ProviderCapabilities
  - [ ] Import from provider namespace (placeholder if needed)
  - [ ] Will be fully defined in Story 2.6

### Add Comprehensive JSDoc Documentation
- [ ] Document PluginManifest interface (AC: And 5)
  - [ ] Explain purpose and usage
  - [ ] Show complete example manifest
- [ ] Document each field (AC: And 5)
  - [ ] name: Full package name (e.g., "@holokai/provider-openai")
  - [ ] version: Plugin version (semver)
  - [ ] pluginType: Type of plugin
  - [ ] commonSdkVersion: Compatible SDK version range
  - [ ] providerType: Lowercase provider identifier (e.g., "openai")
  - [ ] sdkVersion: Provider SDK version (e.g., "openai@4.73.1")
  - [ ] capabilities: What the provider supports
  - [ ] author: Plugin author name/org
  - [ ] description: Brief plugin description
  - [ ] source: Where plugin comes from (official/community/marketplace)
  - [ ] holoVersion: Compatible Holo platform version

### Create Example Manifests
- [ ] Create OpenAI example manifest (AC: And 7)
  - [ ] Show all required fields populated
  - [ ] Show provider-specific fields
  - [ ] Include in JSDoc comment
- [ ] Create minimal example manifest
  - [ ] Show only required fields
  - [ ] Demonstrate minimal valid manifest

### Update Barrel Exports
- [ ] Export from src/plugin/index.ts
  - [ ] Export PluginManifest interface
  - [ ] Export PluginSource type

### Verify TypeScript Compilation
- [ ] Test required vs optional enforcement (AC: And 6)
  - [ ] Create test object with only required fields
  - [ ] Verify TypeScript accepts it
  - [ ] Create test object missing required field
  - [ ] Verify TypeScript rejects it
- [ ] Test type narrowing
  - [ ] Verify pluginType discriminates union types
  - [ ] Test conditional fields based on pluginType

---

## Dev Notes

### Architecture Alignment
- PluginManifest is central metadata structure (FR5, FR34, FR73)
- Architecture specifies rich manifest with marketplace-ready fields
- Future-ready: source field for marketplace (FR87)
- Provider-specific fields only required when pluginType === 'provider'

### Field Formats and Examples
```typescript
interface PluginManifest {
  // Required fields
  name: string;                    // "@holokai/provider-openai"
  version: string;                 // "1.0.0" (semver)
  pluginType: PluginType;          // "provider"
  commonSdkVersion: string;        // "^1.0.0" (semver range)

  // Provider-specific (required for provider plugins)
  providerType?: string;           // "openai"
  sdkVersion?: string;             // "openai@4.73.1"
  capabilities?: ProviderCapabilities;

  // Optional metadata
  author?: string;                 // "HoloAI Team"
  description?: string;            // "OpenAI provider plugin"
  source?: PluginSource;           // "official"
  holoVersion?: string;            // ">=2.0.0" (semver range)
}

type PluginSource = 'official' | 'community' | 'marketplace';
```

### Testing Standards
- Create valid manifest examples
- Test TypeScript type enforcement
- Verify discriminated unions work

### Dependencies
- **Prerequisites:** Story 2.3 (type-specific interfaces)
- **Blocks:** Story 2.5 (validators need manifest schema)
- **Related FRs:** FR5 (PluginManifest type), FR34 (provider manifest fields), FR73 (manifest documentation), FR87 (future-ready source field)

### References
- [Source: docs/epics.md#Story-2.4]
- [FR5: PluginManifest Schema]
- [FR34: Provider Manifest Fields]
- [FR87: Future-Ready Source Field]

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
- Plugin metadata schema definition
