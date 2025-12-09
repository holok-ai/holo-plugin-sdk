# Story 1.2: Configure TypeScript for Monorepo

Status: ready-for-dev

## Story

As a **platform architect**,
I want **TypeScript configured for monorepo with composite projects**,
So that **workspace packages can reference each other with proper type-checking and incremental builds**.

## Acceptance Criteria

**Given** the monorepo workspace structure exists
**When** I configure TypeScript
**Then**:

1. Root tsconfig.json includes composite: true and references: []
2. Each workspace package has its own tsconfig.json extending root config
3. TypeScript path aliases are NOT used (rely on workspace resolution)
4. Packages can import from other packages using package names (e.g., @holokai/common/plugin)
5. `npm run build` at root compiles all workspaces in dependency order
6. IDE shows type errors across workspace boundaries

## Tasks / Subtasks

- [ ] **Task 1: Configure root tsconfig.json for composite projects** (AC: #1, #5)
  - [ ] Read current root tsconfig.json
  - [ ] Add `"composite": true` to compilerOptions
  - [ ] Add `"references": []` array to root config (empty initially, will add packages later)
  - [ ] Add `"declaration": true` and `"declarationMap": true` for type declarations
  - [ ] Update `"exclude"` to exclude packages/ directory
  - [ ] Verify tsconfig.json is valid by running `tsc --showConfig`

- [ ] **Task 2: Create package-level tsconfig.json template** (AC: #2)
  - [ ] Create example tsconfig.json structure for workspace packages
  - [ ] Configure `"extends": "../../tsconfig.json"` to inherit root config
  - [ ] Set `"composite": true` for incremental builds
  - [ ] Configure `"outDir": "./dist"` and `"rootDir": "./src"`
  - [ ] Add `"include": ["src/**/*"]` pattern
  - [ ] Document template in Epic 1 tech spec or dev notes

- [ ] **Task 3: Verify no path aliases used** (AC: #3)
  - [ ] Check root tsconfig.json for `paths` configuration
  - [ ] If paths exist, verify they don't conflict with workspace resolution
  - [ ] Document decision: workspace resolution preferred over path aliases
  - [ ] Add note to dev notes explaining rationale (Architecture ADR-001)

- [ ] **Task 4: Test workspace package imports** (AC: #4, #6)
  - [ ] Create test workspace package in packages/test-common/
  - [ ] Add minimal package.json with name "@holokai/test-common"
  - [ ] Create src/index.ts with exported interface
  - [ ] Add package tsconfig.json using template from Task 2
  - [ ] Update root tsconfig.json references to include test package
  - [ ] Create second test package that imports from first package
  - [ ] Run `tsc --build` to verify cross-package type checking works
  - [ ] Verify IDE (VSCode) shows type errors across packages
  - [ ] Remove test packages after verification

- [ ] **Task 5: Verify build order and incremental compilation** (AC: #5)
  - [ ] Run `npm run build` and verify TypeScript compiles successfully
  - [ ] Verify `--build` flag enables incremental compilation
  - [ ] Test that changing one file only rebuilds affected packages
  - [ ] Document build performance (initial vs incremental)
  - [ ] Verify dist/ directories created with .d.ts files

## Dev Notes

### Technical Context

This story establishes the TypeScript foundation for the monorepo by configuring composite projects. Composite projects enable:
- **Incremental builds**: Only recompile changed packages
- **Project references**: Type-check across package boundaries
- **Declaration maps**: Source map support for .d.ts files
- **Build ordering**: Automatic dependency-based compilation

**From Tech Spec (tech-spec-epic-1.md):**
- Root tsconfig.json must have `composite: true` and `references` array
- Each package tsconfig.json extends root config
- No path aliases - use workspace resolution (Architecture ADR-001)
- TypeScript 5.x with strict mode enabled
- Declaration files required for cross-package imports

### Learnings from Previous Story

**From Story 1-1-create-monorepo-workspace-structure (Status: done)**

- **Workspace Structure Created**: npm workspaces configured in package.json with `"workspaces": ["packages/*"]` pattern
- **Private Flag Set**: Root package.json has `"private": true` to prevent accidental publishing
- **Gitignore Updated**: Workspace artifacts (packages/*/dist, packages/*/node_modules) are ignored
- **Build Verified**: Existing TypeScript build (`npm run build`) works correctly with workspace configuration
- **Test Framework Intact**: Jest test framework confirmed working (tests require TEST_AUTH_TOKEN as expected)
- **Implementation Quality**: Senior Developer Review approved with zero findings - excellent baseline for this story

[Source: docs/sprint-artifacts/1-1-create-monorepo-workspace-structure.md#Dev-Agent-Record]

### Project Structure Notes

**Current Structure (After Story 1.1):**
```
llm-proxy/
├── packages/              # NEW: Workspace packages directory
│   └── .gitkeep          # Placeholder for git tracking
├── src/                   # Existing private core (unchanged)
├── dist/                  # Existing build output (unchanged)
├── package.json           # Modified: workspaces + private added
├── tsconfig.json          # Will be modified in this story
└── .gitignore             # Modified: workspace patterns added
```

**After This Story:**
```
llm-proxy/
├── packages/              # Workspace packages directory
│   └── .gitkeep          # (will have test packages during validation)
├── src/                   # Existing private core (unchanged)
├── dist/                  # Core build output
├── package.json           # Workspace config (from Story 1.1)
├── tsconfig.json          # Modified: composite + references
└── .gitignore             # Workspace patterns (from Story 1.1)
```

**Files to Modify:**
- `/tsconfig.json` - Add composite configuration and references array

**No New Files** - This story only modifies existing TypeScript configuration

### Implementation Notes

**TypeScript Composite Projects:**
- Composite flag enables project references feature
- References array lists dependent packages: `[{ "path": "./packages/common" }]`
- Each package must have `composite: true` in its tsconfig.json
- Declaration files (.d.ts) automatically generated for cross-package imports

**Build Performance:**
- Initial build: Full compilation of all packages
- Incremental build: Only recompile changed packages and dependents
- Use `tsc --build` flag for incremental compilation
- Expected performance: <5 seconds for incremental builds (NFR-EPIC1-1)

**Common Pitfalls:**
- Must enable `declaration: true` for composite projects
- Missing `declarationMap: true` breaks source maps
- Path aliases conflict with workspace resolution - avoid them
- References must match actual package dependencies (circular deps fail)

**Testing Strategy:**
- Create temporary test packages to verify configuration
- Test cross-package imports and type checking
- Verify IDE integration (VSCode TypeScript language server)
- Confirm incremental builds work correctly
- Remove test packages after validation

### References

- [Tech Spec: Epic 1 - Foundation & Monorepo Setup](./tech-spec-epic-1.md#detailed-design)
- [Tech Spec: Root tsconfig.json Structure](./tech-spec-epic-1.md#data-models-and-contracts)
- [Tech Spec: Package-level tsconfig.json Template](./tech-spec-epic-1.md#data-models-and-contracts)
- [PRD: FR57 - Core types separated from provider types](../prd.md#project-structure--modularity)
- [Architecture: TypeScript Composite Projects](../architecture.md#recommendations-for-clean-architecture)
- [Architecture ADR-001: No path aliases, use subpath exports](../architecture.md)
- [Epics: Epic 1 Story 1.2](../epics.md#story-12-configure-typescript-for-monorepo)

### Constraints and Warnings

**Critical Constraints:**
- MUST enable `composite: true` in root and package tsconfig files
- MUST add `declaration: true` and `declarationMap: true` for type generation
- MUST NOT use TypeScript path aliases (conflicts with workspace resolution)
- MUST exclude packages/ from root tsconfig to avoid double compilation

**Warnings:**
- Composite projects require TypeScript 3.0+ (using 5.8.3, so compatible)
- Circular package dependencies will cause build failures
- IDE restart may be needed for TypeScript language server to recognize changes
- Package-lock.json may change if tsconfig affects module resolution

**NFRs from Tech Spec:**
- NFR-EPIC1-1: Build performance < 30 seconds initial, < 5 seconds incremental
- NFR-EPIC1-2: IDE type errors shown within 2 seconds of code change
- NFR-EPIC1-5: All existing integration tests must pass after changes

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-2-configure-typescript-for-monorepo.context.xml)

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent during implementation_

### Completion Notes List

_To be filled by dev agent:_
- Configuration changes made
- Any deviations from plan
- Issues encountered and resolutions
- Recommendations for next story

### File List

_To be filled by dev agent:_
```
NEW:
(none expected)

MODIFIED:
- /tsconfig.json (added composite config and references)
```

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-20 | BMad (AI) | Initial story creation from epics breakdown |
