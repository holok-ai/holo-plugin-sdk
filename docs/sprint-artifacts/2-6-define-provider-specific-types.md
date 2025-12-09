# Story 2.6: Define Provider-Specific Types

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.6
**Status:** ready-for-dev
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **provider-specific types (ProviderConfig, ProviderCapabilities) in /provider namespace**,
So that **I can implement provider plugins with correct configuration structure**.

## Acceptance Criteria

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

## Tasks / Subtasks

### Define ProviderConfig Interface

- [ ] Create ProviderConfig interface in src/provider/types.ts (AC: Then, And 1)
  - [ ] Add id field (string)
  - [ ] Add provider_type field (string)
  - [ ] Add api_key field (string)
  - [ ] Add model field (string)
  - [ ] Add plugin_id field (string | null) - NEW field
  - [ ] Add optional fields (base_url?, max_tokens?, temperature?, etc.)
- [ ] Add JSDoc documentation (AC: And 7)
  - [ ] Explain ProviderConfig structure
  - [ ] Document plugin_id field purpose
  - [ ] Explain null = legacy fallback
  - [ ] Show example configuration

### Define ProviderCapabilities Interface

- [ ] Create ProviderCapabilities interface in src/provider/types.ts (AC: And 2, 3)
  - [ ] Add streaming field (boolean) - SSE streaming support
  - [ ] Add tools field (boolean) - tool/function calling
  - [ ] Add vision field (boolean) - image inputs
  - [ ] Add functionCalling field (boolean) - explicit function calling
  - [ ] Add maxTokens field (number) - max context window
- [ ] Add JSDoc documentation (AC: And 7)
  - [ ] Explain each capability
  - [ ] Show example capabilities object

### Implement ProviderConfig Validator

- [ ] Create providerConfigValidator in src/provider/validators.ts (AC: And 4, 5)
  - [ ] Import type from arktype
  - [ ] Define validator with type() syntax
  - [ ] Add satisfies Type<ProviderConfig> constraint
- [ ] Validate required fields
  - [ ] Validate id (string, non-empty)
  - [ ] Validate provider_type (string, non-empty)
  - [ ] Validate api_key (string, non-empty)
  - [ ] Validate model (string, non-empty)
  - [ ] Validate plugin_id (string | null)
- [ ] Validate optional fields
  - [ ] Validate base_url? (string URL format)
  - [ ] Validate max_tokens? (number, positive)
  - [ ] Validate temperature? (number, 0-2 range)

### Update Barrel Exports

- [ ] Export from src/provider/index.ts (AC: And 6)
  - [ ] Export ProviderConfig interface
  - [ ] Export ProviderCapabilities interface
  - [ ] Export providerConfigValidator

### Test Validators and Types

- [ ] Create test cases
  - [ ] Valid ProviderConfig → validation passes
  - [ ] Missing required field → validation fails
  - [ ] Invalid plugin_id type → validation fails
  - [ ] Verify TypeScript compilation succeeds

---

## Dev Notes

### Architecture Alignment

- ProviderConfig aligns with existing Holo provider configuration (FR50-51)
- plugin_id: string | null - NEW field for plugin vs legacy selection (FR41-43)
- ProviderCapabilities declares what provider supports (FR35)
- Architecture specifies /provider namespace for provider-specific contracts

### ProviderConfig Structure

```typescript
interface ProviderConfig {
  // Core identifiers
  id: string;
  provider_type: string; // "openai", "claude", etc.
  plugin_id: string | null; // Plugin ID or null for legacy

  // Authentication
  api_key: string;

  // Model configuration
  model: string;

  // Optional configuration
  base_url?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  // ... other provider-specific options
}
```

### ProviderCapabilities Structure

```typescript
interface ProviderCapabilities {
  streaming: boolean; // SSE streaming responses
  tools: boolean; // Function/tool calling support
  vision: boolean; // Image input support
  functionCalling: boolean; // Explicit function calling
  maxTokens: number; // Maximum context window
}
```

### plugin_id Field Explanation

- **string:** References plugin metadata, use plugin-based provider
- **null:** Legacy fallback, use hardcoded provider
- Enables gradual migration (FR75-76)
- Backward compatible with existing configs (FR77-78)

### Testing Standards

- Test valid configs pass validation
- Test invalid configs fail with clear messages
- Verify TypeScript type enforcement
- Follow CLAUDE.md ArkType rules

### Dependencies

- **Prerequisites:** Story 2.5 (validators pattern)
- **Blocks:** Story 2.7 (Holo types may reference provider types)
- **Related FRs:** FR35 (capabilities declaration), FR50-51 (provider config structure), FR41-43 (plugin_id field)

### References

- [Source: docs/epics.md#Story-2.6]
- [FR35: Provider Capabilities]
- [FR50-51: Provider Config Structure]
- [FR41-43: Plugin Selection via plugin_id]

---

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/2-6-define-provider-specific-types.context.xml

### Completion Notes

✅ Story completed successfully:
- Created ProviderConfig interface with all required fields including plugin_id
- Created ProviderCapabilities interface with streaming, tools, vision, functionCalling, maxTokens
- Implemented comprehensive validators with business rule validation
- Added helper validation functions with detailed error messages
- Used snake_case naming to match industry standards
- Exported through /provider namespace as specified

### File List

- packages/common/src/provider/types.ts - Type definitions (created)
- packages/common/src/provider/validators.ts - Validators with business rules (created)
- packages/common/src/provider/index.ts - Barrel exports (created)

---

## Change Log

### Version 1.0 - 2025-11-22

- Initial story creation from epics.md
- Provider-specific type definitions
