# Epic Technical Specification: Foundation & Monorepo Setup

Date: 2025-11-20
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational monorepo structure for the Holo Plugin System Modularization initiative. This epic transforms the existing monolithic llm-proxy codebase into a modular architecture with clear IP boundaries between the proprietary core engine and the public plugin ecosystem. The monorepo organization enables independent development, building, and publishing of the Common SDK (@holokai/common) and plugin packages while keeping the core Holo queue architecture and Holo format translation engine private.

This foundational work directly addresses the primary business objective of IP protection by establishing physical code separation (src/ for private core vs packages/ for public plugins), while enabling the technical capability for plugin-based extensibility that will be built in subsequent epics.

## Objectives and Scope

### In Scope

**Primary Objectives:**
- Create monorepo workspace structure using npm workspaces
- Configure TypeScript composite projects for cross-package type checking
- Establish build, test, and clean scripts for monorepo management
- Configure NPM publishing metadata for public packages
- Enforce import boundaries to prevent IP leakage
- Document monorepo organization and development workflow

**Deliverables:**
- packages/ directory at project root with workspace configuration
- TypeScript configuration supporting incremental builds and project references
- Root and package-level build scripts
- Publishing metadata in package.json files with open-source licenses
- ESLint rules enforcing import boundaries
- README documentation explaining structure and workflows

**Success Criteria:**
- Workspace structure allows independent package builds and publishing
- TypeScript compilation works across package boundaries with type checking
- Import boundaries prevent packages/ from accessing src/ code
- Documentation enables team members to work with monorepo structure

### Out of Scope

- Actual plugin packages (created in Epic 2+)
- Migration of existing src/ code (Epic 6+)
- Plugin system implementation (Epic 3-5)
- Changes to existing core Holo functionality
- Database schema changes
- Queue infrastructure modifications

## System Architecture Alignment

This epic aligns with the Architecture document's separation of concerns:

**Core (/src) - Private Proprietary:**
- Queue-based orchestration (RabbitMQ)
- Holo universal format (translation hub)
- Worker coordination and streaming
- Existing provider implementations (temporary, until migration)

**Packages (/packages) - Public Ecosystem:**
- @holokai/common - Plugin contracts and types (Epic 2)
- @holokai/provider-* - Provider plugin packages (Epic 6+)
- Future plugin types (guards, evaluators, workers)

**Architectural Principles:**
- Unidirectional dependency: server → api → core → nothing
- Plugins depend on @holokai/common only (not core)
- Clear import boundaries enforced at compile time (ESLint)
- Physical code separation matches logical IP boundaries

**Technology Stack:**
- npm workspaces (not yarn/pnpm for MVP simplicity)
- TypeScript composite projects for incremental builds
- ESLint with no-restricted-imports for boundary enforcement
- Standard npm scripts for build/test/clean consistency

## Detailed Design

### Services and Modules

| Module | Location | Responsibility | Dependencies |
|--------|----------|----------------|--------------|
| Root Workspace | /package.json | Aggregate workspace management | npm workspaces |
| Root TypeScript Config | /tsconfig.json | Base TS configuration with composite references | None |
| Package Workspace | /packages/* | Individual publishable packages | @holokai/common (future) |
| Build System | Root + package scripts | Compile all workspaces in dependency order | TypeScript, tsc --build |
| Publishing System | package.json configs | NPM publishing with access control | None |
| Import Boundary Enforcement | ESLint config | Prevent packages → src imports | @typescript-eslint |
| Documentation | README files | Developer guidance | None |

### Data Models and Contracts

**Root package.json Structure:**
```json
{
  "name": "holo-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build:core && npm run build:packages",
    "build:core": "tsc --project ./tsconfig.json",
    "build:packages": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "clean": "npm run clean --workspaces --if-present && rm -rf dist"
  }
}
```

**Root tsconfig.json Structure:**
```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"]
  },
  "references": [
    { "path": "./packages/common" }
  ],
  "exclude": ["node_modules", "dist", "packages"]
}
```

**Package-level package.json Template:**
```json
{
  "name": "@holokai/example-package",
  "version": "0.1.0",
  "description": "Package description",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./subpath": {
      "import": "./dist/subpath/index.js",
      "types": "./dist/subpath/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
```

**Package-level tsconfig.json Template:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": []
}
```

**ESLint Import Boundary Rules:**
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": ["**/src/**"]
      }
    ]
  }
}
```

### APIs and Interfaces

This epic does not introduce new runtime APIs or interfaces. It establishes build-time and development-time interfaces:

**Build Interface:**
- `npm run build` - Compiles all packages
- `npm run build:packages` - Compiles workspace packages only
- `npm run test` - Runs all tests
- `npm run clean` - Removes all build artifacts

**Development Interface:**
- `npm install` at root - Installs all workspace dependencies
- `npm run build --workspace=packages/common` - Build specific package
- `npm run test --workspace=packages/common` - Test specific package

**Publishing Interface:**
- `npm publish --access public` from package directory
- prepublishOnly hook ensures fresh build before publish

### Workflows and Sequencing

**Developer Workflow - Initial Setup:**
1. Clone repository
2. Run `npm install` at root (installs all workspace dependencies)
3. Run `npm run build` (builds core, then packages in order)
4. Verify TypeScript compilation succeeds
5. Verify tests pass

**Developer Workflow - Adding New Package:**
1. Create `packages/new-package/` directory
2. Add package.json with name, version, scripts
3. Add tsconfig.json extending root config
4. Add src/index.ts with exports
5. Update root tsconfig.json references array
6. Run `npm install` to link workspace
7. Run `npm run build` to verify compilation

**Developer Workflow - Publishing Package:**
1. Update package version in package.json
2. Run `npm run build` to ensure fresh build
3. Run `npm run test` to ensure tests pass
4. Run `npm publish --access public` from package directory
5. prepublishOnly hook runs build automatically
6. Verify package appears on npmjs.com

**CI/CD Workflow:**
1. Install dependencies: `npm ci`
2. Lint: `npm run lint`
3. Build all: `npm run build`
4. Test all: `npm run test`
5. Publish (on release): `npm publish --workspace=packages/common`

## Non-Functional Requirements

### Performance

**NFR-EPIC1-1: Build Performance**
- Initial monorepo build must complete in < 30 seconds on standard dev machine
- Incremental builds (after changes to one package) must complete in < 5 seconds
- TypeScript compilation leverages `--build` flag for incremental compilation
- **Measurement**: Time `npm run build` on clean checkout and after single-file change

**NFR-EPIC1-2: Development Experience**
- IDE (VSCode) must show cross-package type errors within 2 seconds of code change
- Package workspace resolution must not increase npm install time by more than 10%
- **Measurement**: VSCode TypeScript language server response time, npm install timing comparison

### Security

**NFR-EPIC1-3: Import Boundary Enforcement**
- ESLint must prevent any imports from packages/ to src/ at build time
- CI build must fail if import boundary violations detected
- No runtime checks needed (enforced at build time)
- **Measurement**: ESLint passes with no-restricted-imports rule active

**NFR-EPIC1-4: IP Protection**
- Core Holo code (src/) must remain private: true in package.json
- Only packages/ code can be published to NPM
- Accidental publish of core code must fail
- **Measurement**: Attempt `npm publish` from root - should fail with error

### Reliability/Availability

**NFR-EPIC1-5: Existing Functionality Preservation**
- All existing src/ code must continue to work unchanged
- Existing build scripts for core Holo must continue to function
- No breaking changes to dev/test/deploy workflows for core
- **Measurement**: Run existing integration tests - all must pass

**NFR-EPIC1-6: Build System Stability**
- Workspace dependency resolution must not introduce circular dependencies
- Package builds must succeed in any order (proper dependency declaration)
- Failed package build must not block core Holo compilation
- **Measurement**: Build packages in random order - all should succeed

### Observability

**NFR-EPIC1-7: Build Visibility**
- Build scripts must output clear progress indicators for each package
- Build errors must clearly identify which package failed and why
- TypeScript errors must show full file paths (not relative)
- **Measurement**: Introduce intentional error - error message must be actionable

**NFR-EPIC1-8: Documentation Completeness**
- README must explain monorepo structure (< 5 minutes to understand)
- README must include examples of common workflows
- README must link to external docs where appropriate
- **Measurement**: New team member can execute all workflows from README

## Dependencies and Integrations

### External Dependencies

**Build-Time Dependencies:**
- **TypeScript 5.x**: TypeScript compiler with composite project support
  - Used for: Cross-package type checking and incremental builds
  - Version: ^5.0.0 (existing dependency)
  - Impact: Core build system dependency

- **npm 9.x+**: Package manager with workspaces support
  - Used for: Workspace dependency management and linking
  - Version: >= 9.0.0 (bundled with Node.js 18+)
  - Impact: Required for workspace resolution

- **ESLint 8.x**: Linter with TypeScript support
  - Used for: Import boundary enforcement
  - Version: ^8.0.0 (existing dependency)
  - Plugins: @typescript-eslint/eslint-plugin
  - Impact: Build-time validation

**Runtime Dependencies (None):**
- This epic introduces no new runtime dependencies
- Existing Node.js >= 18.0.0 requirement unchanged
- Existing infrastructure (RabbitMQ, PostgreSQL) unchanged

### Internal Integration Points

**Integration with Existing Build System:**
- Root build script must execute core build first, then packages
- Existing src/ tsconfig.json remains unchanged
- Existing dist/ output directory preserved for core code
- Package builds output to packages/*/dist/ directories

**Integration with Existing Tests:**
- Jest config must support testing workspace packages
- Existing integration tests continue to run against src/ code
- Package-level tests isolated in packages/*/tests/
- Root `npm test` runs both core and package tests

**Integration with CI/CD:**
- Existing CI scripts require minimal changes (add `npm run build:packages`)
- Existing deployment pipeline unchanged (deploys dist/ from src/)
- Future: Add publish step for packages (Epic 2+)

**Integration with Development Tools:**
- VSCode must recognize workspace packages for IntelliSense
- TypeScript language server must follow project references
- ESLint must process both src/ and packages/ directories
- Git must track packages/ directory (remove from .gitignore if present)

### Dependency Management Contracts

**Workspace Dependency Rules:**
- Packages may depend on other packages via workspace: protocol
- Example: packages/provider-openai depends on `"@holokai/common": "workspace:*"`
- Core src/ may optionally import from @holokai/common (unidirectional)
- Packages NEVER import from src/ (enforced by ESLint)

**Version Management:**
- Root package.json is private (version: "1.0.0" is placeholder)
- Each workspace package has independent semantic versioning
- Common SDK starts at 0.1.0 (pre-release), bumps to 1.0.0 for stable
- Plugin packages follow independent versioning based on provider SDK compatibility

## Acceptance Criteria (Authoritative)

### AC1: Monorepo Structure Created
**Given** the existing llm-proxy repository
**When** Epic 1 is complete
**Then**:
- packages/ directory exists at project root
- packages/ contains .gitkeep or README
- root package.json includes `"workspaces": ["packages/*"]`
- root package.json has `"private": true`

### AC2: TypeScript Composite Configuration
**Given** the monorepo structure exists
**When** TypeScript is configured
**Then**:
- root tsconfig.json includes `"composite": true` and `"references": []`
- Future package tsconfigs extend root config
- TypeScript compiles successfully with no errors
- IDE shows type errors across package boundaries

### AC3: Build Scripts Functional
**Given** TypeScript is configured
**When** build scripts are executed
**Then**:
- `npm run build` compiles src/ and packages/ successfully
- `npm run build:packages` compiles only workspace packages
- `npm run test` runs all tests (core and packages)
- `npm run clean` removes all dist/ directories
- prepublishOnly hook exists in package template

### AC4: Publishing Metadata Configured
**Given** workspace packages exist (or templates documented)
**When** publishing metadata is configured
**Then**:
- Package template includes name, version, description, author
- Package template includes `publishConfig: { access: "public" }`
- Package template includes `license: "MIT"` or `"Apache-2.0"`
- Package template includes `engines: { node: ">=18.0.0" }`
- Package template includes main, types, and exports fields
- Root package.json remains `"private": true`

### AC5: Import Boundaries Enforced
**Given** monorepo structure and ESLint are configured
**When** import boundary rules are applied
**Then**:
- ESLint config includes no-restricted-imports rule for packages/
- Rule pattern blocks `**/src/**` imports
- `npm run lint` fails if package imports from src/
- CI build fails on import boundary violations
- Documentation explains import boundary rules

### AC6: Documentation Complete
**Given** monorepo structure is implemented
**When** documentation is written
**Then**:
- Root README explains monorepo organization
- README includes "Project Structure" section
- README includes "Development Workflow" section with commands
- README includes "Publishing Packages" section
- README explains src/ is private, packages/ are public
- Package README template exists for future packages

## Traceability Mapping

| AC | Spec Section | Component | Test Idea |
|----|--------------|-----------|-----------|
| AC1 | Data Models - Root package.json | packages/ directory, root package.json | Verify workspace pattern in package.json, verify packages/ exists |
| AC2 | Data Models - Root tsconfig.json | TypeScript config, tsconfig.json | Run `tsc --build`, verify no errors, verify references array exists |
| AC3 | APIs - Build Interface | Build scripts in package.json | Execute each script, verify exit code 0, verify outputs in dist/ |
| AC4 | Data Models - Package package.json | NPM publishing metadata | Validate package.json against template, check all required fields |
| AC5 | Data Models - ESLint Rules | ESLint configuration | Create test import from package to src/, verify lint fails |
| AC6 | Workflows - Developer Workflow | README files | New developer follows README, completes workflows successfully |

**FR Coverage (Epic 1 FRs):**
- **FR56**: Provider plugins extracted to packages/ directories → AC1 (structure established)
- **FR57**: Core types separated from provider types → AC5 (import boundaries)
- **FR58**: Plugin packages import from @holokai/common only → AC5 (ESLint rules)
- **FR59**: Core doesn't import from plugin packages → AC5 (enforced)
- **FR60**: Translators leverage Common SDK → AC2 (TypeScript refs enable future)
- **FR61**: Clear import boundaries enforced → AC5 (ESLint + documentation)
- **FR81**: Core engine remains in private repo → AC4 (root private: true)
- **FR82**: Common SDK published to public NPM → AC4 (publishConfig access)
- **FR83**: Official plugins published to public NPM → AC4 (package metadata)
- **FR84**: Plugin contracts expose only extension points → AC5 (boundary enforcement)
- **FR85**: Custom dev extends via plugins without core access → AC5 (import rules)
- **FR86**: Outside devs build with Common SDK only → AC6 (documented workflow)

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Workspace Resolution Conflicts**
- **Description**: npm workspaces may conflict with existing package-lock.json
- **Likelihood**: Medium
- **Impact**: Medium (blocks development)
- **Mitigation**: Delete node_modules and package-lock.json, run fresh npm install, commit new lock file
- **Fallback**: Use npm 10.x which has improved workspace resolution

**RISK-2: TypeScript Composite Build Complexity**
- **Description**: Composite projects may introduce build errors or slow compilation
- **Likelihood**: Medium
- **Impact**: Low (can fall back to non-composite)
- **Mitigation**: Start with simple composite config, test incrementally, use --build flag for performance
- **Fallback**: Remove composite: true if problems arise (lose incremental build benefit)

**RISK-3: Import Boundary Enforcement Gaps**
- **Description**: ESLint rules may not catch all import patterns (dynamic imports, require())
- **Likelihood**: Low
- **Impact**: Medium (IP exposure risk)
- **Mitigation**: Test multiple import patterns, use code review checklist, add CI validation
- **Fallback**: Manual code review for src/ imports during package development

**RISK-4: Existing Build Scripts Break**
- **Description**: Adding workspaces may interfere with existing src/ build process
- **Likelihood**: Low
- **Impact**: High (blocks core development)
- **Mitigation**: Test existing build scripts after workspace config, keep separate build:core script
- **Fallback**: Modify workspace config to exclude src/ if conflicts arise

### Assumptions

**ASSUMPTION-1**: npm workspaces is sufficient for monorepo management
- **Validation**: npm workspaces supports package linking, dependency resolution, and script execution
- **Risk if wrong**: May need to migrate to yarn/pnpm/nx later (significant effort)
- **Note**: npm is simpler for MVP, can migrate later if needed

**ASSUMPTION-2**: Team is familiar with TypeScript composite projects
- **Validation**: Team has TypeScript experience, composite projects are well-documented
- **Risk if wrong**: Slower development due to learning curve
- **Mitigation**: Provide documentation and examples, pair programming for first packages

**ASSUMPTION-3**: ESLint is sufficient for import boundary enforcement
- **Validation**: ESLint no-restricted-imports rule is well-tested and reliable
- **Risk if wrong**: May need additional tooling (Nx boundary rules, custom scripts)
- **Note**: ESLint is standard and widely used for import rules

**ASSUMPTION-4**: Open-source license (MIT/Apache-2.0) is approved
- **Validation**: PRD specifies open-source plugins, MIT/Apache-2.0 are standard choices
- **Risk if wrong**: Legal review may require different license
- **Mitigation**: Confirm with legal/business team before publishing

### Open Questions

**QUESTION-1**: Should root workspace include shared devDependencies?
- **Context**: ESLint, TypeScript, Jest could be shared or per-package
- **Impact**: DRY principle vs package independence
- **Decision needed**: Before Story 1.3 (Build Scripts and Tooling)
- **Recommended approach**: Shared devDependencies in root, packages inherit

**QUESTION-2**: Should packages/ use subpath exports or flat exports?
- **Context**: Common SDK will have /plugin, /provider, /holo, /utils subpaths (per Architecture)
- **Impact**: Developer experience and bundle size (tree-shaking)
- **Decision needed**: Before Epic 2 (Common SDK Package)
- **Recommended approach**: Subpath exports per Architecture ADR-001

**QUESTION-3**: How to handle package interdependencies?
- **Context**: If packages/provider-openai depends on packages/common
- **Impact**: Build order, version management, circular dependency risk
- **Decision needed**: Before Epic 6 (OpenAI Plugin)
- **Recommended approach**: Use workspace:* protocol, ensure acyclic dependency graph

**QUESTION-4**: Should .gitignore include packages/*/dist/?
- **Context**: Should compiled package outputs be committed to git?
- **Impact**: Repository size vs reproducibility
- **Decision needed**: Before Story 1.1 (Monorepo Structure)
- **Recommended approach**: Yes, ignore dist/ directories, rely on prepublishOnly for builds

## Test Strategy Summary

### Test Levels

**Unit Tests (Story-Level)**
- Test ESLint configuration with sample import violations
- Test TypeScript compilation with sample package structure
- Test build scripts with mocked packages
- **Framework**: Jest with ts-jest
- **Coverage Target**: N/A (infrastructure changes, not code logic)

**Integration Tests (Epic-Level)**
- Verify end-to-end build process (npm install → build → test)
- Verify workspace dependency resolution
- Verify import boundary enforcement with real code examples
- Verify publishing workflow (dry-run mode)
- **Framework**: Shell scripts with assertions
- **Coverage Target**: All workflows in README must be testable

**Validation Tests (Acceptance Criteria)**
- AC1: Verify packages/ directory exists and workspace config is valid
- AC2: Verify TypeScript composite build succeeds
- AC3: Verify all build scripts execute successfully
- AC4: Validate package.json metadata against template
- AC5: Verify ESLint catches import boundary violations
- AC6: Verify README is complete with all required sections
- **Framework**: Manual checklist + automated scripts
- **Coverage Target**: 100% of acceptance criteria

### Test Strategy by Component

**Monorepo Structure (AC1):**
- **Given**: Clean checkout of repository
- **When**: Run `npm install`
- **Then**: Verify packages/ directory created, workspaces config present
- **Automation**: CI script checks directory structure

**TypeScript Configuration (AC2):**
- **Given**: Monorepo structure exists
- **When**: Run `npm run build`
- **Then**: Verify compilation succeeds, dist/ directories created
- **Automation**: CI script runs build and checks for errors

**Build Scripts (AC3):**
- **Given**: TypeScript is configured
- **When**: Run each build script individually
- **Then**: Verify exit codes, verify expected outputs
- **Automation**: Shell script tests each npm script

**Publishing Metadata (AC4):**
- **Given**: Package template documented
- **When**: Create sample package with template
- **Then**: Verify all metadata fields present and valid
- **Automation**: JSON schema validation script

**Import Boundaries (AC5):**
- **Given**: ESLint configured with boundary rules
- **When**: Create test file importing from src/
- **Then**: Verify lint fails with clear error message
- **Automation**: Test file with intentional violation in test suite

**Documentation (AC6):**
- **Given**: Epic 1 complete
- **When**: New developer reads README
- **Then**: Developer can execute all workflows successfully
- **Manual Test**: Onboarding checklist for new team member

### Edge Cases and Error Scenarios

**Edge Case 1: Circular Dependencies**
- **Scenario**: Package A depends on Package B, Package B depends on Package A
- **Expected**: Build fails with clear error
- **Test**: Create circular dependency, verify error message

**Edge Case 2: Missing Workspace Package**
- **Scenario**: root tsconfig.json references non-existent package
- **Expected**: TypeScript build fails with clear error
- **Test**: Add invalid reference, verify error message

**Edge Case 3: Import from src/ via Dynamic Import**
- **Scenario**: Package uses `import('../../src/...')` to bypass ESLint
- **Expected**: TypeScript compilation fails (path not resolvable)
- **Test**: Create dynamic import, verify build fails

**Edge Case 4: Publishing Root Package**
- **Scenario**: Developer attempts `npm publish` from root directory
- **Expected**: Fails with "private: true" error
- **Test**: Run `npm publish --dry-run` from root, verify error

**Error Scenario 1: Conflicting Dependency Versions**
- **Scenario**: Core depends on arktype@2.0.0, package depends on arktype@3.0.0
- **Expected**: npm warns about peer dependency mismatch
- **Test**: Create version conflict, verify warning in npm install

**Error Scenario 2: Invalid package.json in Workspace**
- **Scenario**: Package has syntax error in package.json
- **Expected**: npm install fails with parse error
- **Test**: Introduce JSON syntax error, verify clear error message

### Regression Prevention

**Existing Functionality:**
- All integration tests for core Holo functionality must pass after Epic 1
- Existing build scripts must continue to work
- Existing development workflow unchanged (npm run dev, npm run build for core)
- No changes to runtime behavior (API, workers, queues)

**Automated Regression Tests:**
- CI must run full test suite (core + packages)
- CI must verify existing endpoints respond correctly
- CI must verify worker processes start successfully
- CI must build Docker image successfully (no workspace issues)

---

**Document Status:** Draft
**Epic:** 1 - Foundation & Monorepo Setup
**Stories:** 1.1 through 1.6 (6 stories total)
**Estimated Complexity:** Foundation epic (acceptable for infrastructure projects)
**Next Steps:** Mark epic as "contexted" in sprint-status.yaml, begin Story 1.1 drafting
