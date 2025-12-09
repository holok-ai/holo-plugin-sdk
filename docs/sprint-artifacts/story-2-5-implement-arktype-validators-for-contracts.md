# Story 2.5: Implement ArkType Validators for Contracts

**Epic:** Epic 2 - Common SDK Package (@holokai/common)
**Story Type (DoD Level):** API/Backend
**Story Points:** 3
**Owner:** Architect
**Status:** done
**Created:** 2025-11-22
**Updated:** 2025-11-24
**Started:** 2025-11-24
**Completed:** 2025-11-24
**Sprint:** 1

---

## Story

As a **plugin system developer**,
I want **ArkType validators for all plugin contracts**,
So that **the system can validate plugin exports at runtime and provide clear error messages**.

## Acceptance Criteria

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

## Tasks / Subtasks

### Implement PluginManifest Validator

- [ ] Create pluginManifestValidator in src/plugin/validators.ts (AC: Then)
  - [ ] Import type from arktype
  - [ ] Define validator with type() syntax
  - [ ] Add satisfies Type<PluginManifest> constraint
- [ ] Validate required fields (AC: And 2)
  - [ ] Validate name field (string, non-empty)
  - [ ] Validate version field (string, semver format)
  - [ ] Validate pluginType field (PluginType enum values)
  - [ ] Validate commonSdkVersion field (string, semver range)
- [ ] Validate optional fields (AC: And 2)
  - [ ] Validate providerType? (string if present)
  - [ ] Validate sdkVersion? (string format: "sdk@version")
  - [ ] Validate capabilities? (object if present)
  - [ ] Validate author? (string if present)
  - [ ] Validate description? (string if present)
  - [ ] Validate source? (enum: official/community/marketplace)

### Implement Semver Validation

- [ ] Create semver regex pattern (AC: And 3)
  - [ ] Pattern for exact semver: \d+\.\d+\.\d+
  - [ ] Pattern for semver range: ^\^?\d+\.\d+\.\d+$
- [ ] Validate version field format
  - [ ] Must match exact semver pattern
  - [ ] Reject invalid formats with clear message
- [ ] Validate commonSdkVersion field format
  - [ ] Must match semver range pattern (allows ^)
  - [ ] Reject invalid formats with clear message

### Implement PluginType Enum Validation

- [ ] Create enum validator (AC: And 4)
  - [ ] Accept: "provider" | "guard" | "evaluator" | "logger" | "worker"
  - [ ] Reject any other string values
  - [ ] Provide clear error for invalid types

### Implement Error Handling

- [ ] Format validation errors (AC: And 5, 6)
  - [ ] Extract type.errors from ArkType result
  - [ ] Format errors as actionable messages
  - [ ] Include field name, expected format, actual value
  - [ ] Add fix suggestions
- [ ] Test error messages (AC: And 6)
  - [ ] Verify clarity and actionability
  - [ ] Ensure developer can fix issue in <30 seconds

### Follow CLAUDE.md Rules

- [ ] Use satisfies Type<T> pattern (AC: And 7)
  - [ ] NEVER use any type
  - [ ] NEVER use Record<string, unknown> shortcut
  - [ ] Always create proper validators
- [ ] Look up actual type definitions
  - [ ] Check PluginManifest actual structure
  - [ ] Copy exact field types
  - [ ] Don't guess or assume

### Update Barrel Exports

- [ ] Export from src/plugin/index.ts
  - [ ] Export pluginManifestValidator

### Test Validators

- [ ] Create test cases (AC: And 8)
  - [ ] Valid manifest → validation passes
  - [ ] Missing required field → validation fails with clear error
  - [ ] Invalid semver → validation fails with clear error
  - [ ] Invalid pluginType → validation fails with clear error
  - [ ] Verify TypeScript compilation succeeds

---

## Dev Notes

### Architecture Alignment

- FR7: ArkType validators for contract enforcement
- NFR25: ArkType version consistent (peer dependency)
- Architecture specifies validator-first approach (fail fast at boundaries)
- Validators used by PluginLoaderService to validate plugin exports (FR12-14)

### ArkType Validator Pattern

```typescript
import { type } from 'arktype';
import type { Type } from 'arktype';
import type { PluginManifest } from './types';

export const pluginManifestValidator = type({
  name: 'string',
  version: 'string', // TODO: Add semver regex
  pluginType: '"provider"|"guard"|"evaluator"|"logger"|"worker"',
  commonSdkVersion: 'string', // TODO: Add semver range regex
  'providerType?': 'string',
  'sdkVersion?': 'string',
  'capabilities?': 'object',
  'author?': 'string',
  'description?': 'string',
  'source?': '"official"|"community"|"marketplace"',
}).satisfies<Type<PluginManifest>>();
```

### Error Message Examples

- Good: "Plugin manifest validation failed: 'version' must be valid semver (e.g., '1.0.0'), got '1.0'"
- Good: "Plugin manifest validation failed: 'pluginType' must be one of [provider, guard, evaluator, logger, worker], got 'custom'"
- Bad: "Validation error" (not actionable)

### CLAUDE.md Compliance

- ALWAYS use satisfies Type<T> on validators
- NEVER use any or flexible types
- NEVER use Record<string, unknown> as shortcut
- Start with basic types first, build to complex
- Look at ACTUAL type definitions in code
- Copy exact structure from types
- Fix validator to match type, never change to any

### Testing Standards

- Test valid inputs pass
- Test invalid inputs fail with clear messages
- Test edge cases (empty strings, wrong types, etc.)
- Verify TypeScript type safety

### Dependencies

- **Prerequisites:** Story 2.4 (PluginManifest schema)
- **Blocks:** Epic 3 stories (validators used for plugin loading)
- **Related FRs:** FR7 (ArkType validators), FR72 (clear error messages), NFR25 (ArkType peer dependency)

### References

- [Source: docs/epics.md#Story-2.5]
- [Source: CLAUDE.md#ArkType-Validator-Implementation-Rules]
- [FR7: ArkType Validators]
- [FR72: Clear Error Messages]

---

## Dev Agent Record

### Context Reference

<!-- Story context XML path will be added here by context workflow -->

### Completion Notes

Implemented ArkType validators for all plugin contracts:

- Created comprehensive validators for PluginManifest with all required and optional fields
- Added semver validation for version strings (exact and range)
- Created validators for all plugin types (provider, guard, evaluator)
- Added helper functions (validateManifest, isValidManifest, validateCapabilities)
- Exported all validators from plugin index for easy consumption
- Compilation successful with ArkType v2.1.27

### File List

- packages/common/src/plugin/validators.ts - Main validators for plugin manifest
- packages/common/src/plugin/validators/index.ts - Central export point for all validators
- packages/common/src/plugin/validators/provider.ts - Provider-specific validators
- packages/common/src/plugin/validators/evaluator.ts - Evaluator-specific validators
- packages/common/src/plugin/validators/guard.ts - Guard-specific validators
- packages/common/src/plugin/index.ts - Updated to export validators

---

## Change Log

### Version 1.0 - 2025-11-22

- Initial story creation from epics.md
- Contract validation with ArkType
