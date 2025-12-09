# Story 2.1: Create Common SDK Package Structure

**Epic:** 2 - Common SDK Package (@holokai/common)
**Story Number:** 2.1
**Status:** ready-for-dev
**Created:** 2025-11-22
**Updated:** 2025-11-22
**Developer:** TBD

---

## Story

As a **plugin developer**,
I want **@holokai/common package with organized namespaces**,
So that **I can import specific plugin contracts without loading unnecessary code**.

## Acceptance Criteria

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

## Tasks / Subtasks

### Create Package Directory Structure
- [ ] Create packages/common/ directory (AC: Then 1)
  - [ ] Create src/ subdirectory
  - [ ] Create tests/ subdirectory for future tests
  - [ ] Create dist/ directory in .gitignore

### Create Namespace Folders
- [ ] Create src/plugin/ namespace (AC: And 1)
  - [ ] Create src/plugin/index.ts barrel export
  - [ ] Create src/plugin/interfaces.ts placeholder
  - [ ] Create src/plugin/types.ts placeholder
- [ ] Create src/provider/ namespace (AC: And 1)
  - [ ] Create src/provider/index.ts barrel export
  - [ ] Create src/provider/types.ts placeholder
  - [ ] Create src/provider/validators.ts placeholder
- [ ] Create src/holo/ namespace (AC: And 1)
  - [ ] Create src/holo/index.ts barrel export
  - [ ] Create src/holo/types.ts placeholder
  - [ ] Create src/holo/validators.ts placeholder
- [ ] Create src/utils/ namespace (AC: And 1)
  - [ ] Create src/utils/index.ts barrel export
  - [ ] Create src/utils/types.ts placeholder

### Configure Package Metadata
- [ ] Create package.json (AC: And 2-5)
  - [ ] Set name to "@holokai/common"
  - [ ] Set version to "0.1.0"
  - [ ] Add description field
  - [ ] Add author and license fields
  - [ ] Configure peerDependencies: { "arktype": "^2.0.0" }
- [ ] Configure subpath exports (AC: And 2)
  - [ ] Add exports field with /plugin subpath
  - [ ] Add exports field with /provider subpath
  - [ ] Add exports field with /holo subpath
  - [ ] Add exports field with /utils subpath
  - [ ] Configure both import and types for each subpath
- [ ] Configure TypeScript settings (AC: And 6)
  - [ ] Set main field pointing to dist/
  - [ ] Set types field for TypeScript definitions
  - [ ] Add publishConfig with access: "public"

### Setup TypeScript Configuration
- [ ] Create tsconfig.json (AC: And 6)
  - [ ] Extend root tsconfig.json
  - [ ] Set composite: true
  - [ ] Configure outDir: "./dist"
  - [ ] Configure rootDir: "./src"
  - [ ] Enable declaration files generation

### Verify Build and Import
- [ ] Test TypeScript compilation (AC: And 6)
  - [ ] Run tsc to compile package
  - [ ] Verify dist/ directory created
  - [ ] Verify .d.ts files generated
  - [ ] Check for compilation errors
- [ ] Test subpath imports (AC: And 7)
  - [ ] Create test script importing from @holokai/common/plugin
  - [ ] Verify TypeScript can resolve import
  - [ ] Test all four subpaths work

---

## Dev Notes

### Architecture Alignment
- Follow Architecture ADR-001: Subpath exports for tree-shaking
- Architecture specifies 4 namespaces: /plugin, /provider, /holo, /utils
- Each namespace is independently importable (no barrel at root)
- Prevents internal imports - only subpaths are public API

### Package.json Exports Configuration
```json
{
  "exports": {
    "./plugin": {
      "import": "./dist/plugin/index.js",
      "types": "./dist/plugin/index.d.ts"
    },
    "./provider": {
      "import": "./dist/provider/index.js",
      "types": "./dist/provider/index.d.ts"
    },
    "./holo": {
      "import": "./dist/holo/index.js",
      "types": "./dist/holo/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  }
}
```

### Testing Standards
- No unit tests needed for structure setup
- Import verification tests ensure subpaths work
- Future stories will add actual implementations to test

### Dependencies
- **Prerequisites:** Epic 1 complete (Story 1.6)
- **Blocks:** Story 2.2 (needs package structure)
- **Related FRs:** FR1 (installable via npm)

### References
- [Source: docs/epics.md#Story-2.1]
- [Source: docs/architecture.md#ADR-001-Subpath-Exports]
- [FR1: Common SDK Package]

---

## Dev Agent Record

### Context Reference
- docs/sprint-artifacts/2-1-create-common-sdk-package-structure.context.xml

### Completion Notes
<!-- To be filled by dev agent during implementation -->

### File List
<!-- To be filled by dev agent during implementation -->

---

## Change Log

### Version 1.0 - 2025-11-22
- Initial story creation from epics.md
- Structured for Common SDK foundation
