# Sprint 1 - Common SDK Foundation

**Sprint Number:** 1
**Sprint Name:** Common SDK Foundation
**Created:** 2025-11-24
**Sprint Goal:** Establish the @holokai/common package with core plugin interfaces and validation
**Duration:** 5-7 days (estimated)
**Total Story Points:** TBD (needs estimation)

---

## Context

Following the successful completion of Sprint 0.a's foundation refinement, we begin Epic 2 implementation. This sprint establishes the Common SDK Package (@holokai/common) that will serve as the public contract layer for Holo's plugin ecosystem.

### Prerequisites Complete ✅

- Definition of Done established (7 levels)
- Git hygiene standards implemented
- Pre-review automation configured
- Documentation-as-you-go process defined
- Epic 2 technical specification created (600+ lines)

---

## Sprint Goal

**Deliver a functional @holokai/common package with:**

1. Complete package structure with namespace organization
2. All core plugin interfaces defined (IPlugin, IProviderPlugin, IGuardPlugin)
3. PluginManifest schema with metadata requirements
4. ArkType validators for runtime contract enforcement
5. Package ready for internal testing (not yet published to NPM)

**Success Criteria:**

- Package builds without errors
- All interfaces have corresponding validators
- Type exports work correctly
- Internal tests can import from package
- Documentation for each interface complete

---

## Sprint Backlog

### Story 2.1: Create Common SDK Package Structure

**Story Points:** 2
**Owner:** Senior Developer
**Status:** ready-for-dev
**DoD Level:** Normal Feature

**Description:**
Set up the @holokai/common package with proper namespace organization, build configuration, and export strategy.

**Acceptance Criteria:**

- [ ] Package structure created under packages/common/
- [ ] Namespace folders organized (/plugin, /provider, /holo, /utils)
- [ ] TypeScript configuration for clean builds
- [ ] Package.json with proper metadata and exports
- [ ] Build scripts integrated with monorepo
- [ ] README with basic documentation

---

### Story 2.2: Define Base Plugin Interfaces

**Story Points:** 3
**Owner:** Architect
**Status:** drafted
**DoD Level:** API/Backend

**Description:**
Define the IPlugin base interface with lifecycle hooks that all plugin types must implement.

**Acceptance Criteria:**

- [ ] IPlugin interface with initialize/destroy methods
- [ ] Optional lifecycle hooks defined
- [ ] Plugin context types defined
- [ ] Error handling types defined
- [ ] JSDoc documentation complete
- [ ] Usage examples in comments

---

### Story 2.3: Define Type-specific Plugin Interfaces

**Story Points:** 3
**Owner:** Architect
**Status:** drafted
**DoD Level:** API/Backend

**Description:**
Create specialized interfaces for IProviderPlugin, IGuardPlugin, and IWorkerPlugin that extend IPlugin.

**Acceptance Criteria:**

- [ ] IProviderPlugin with createProvider method
- [ ] IGuardPlugin with validation methods
- [ ] IWorkerPlugin with job processing methods
- [ ] Type-specific configuration interfaces
- [ ] Capability declaration types
- [ ] Full JSDoc documentation

---

### Story 2.4: Define PluginManifest Schema

**Story Points:** 2
**Owner:** Senior Developer
**Status:** drafted
**DoD Level:** Normal Feature

**Description:**
Create the PluginManifest schema that describes plugin metadata and requirements.

**Acceptance Criteria:**

- [ ] Manifest interface with required fields (name, version, type)
- [ ] Optional metadata fields (author, description, license)
- [ ] Dependency declaration structure
- [ ] Compatibility requirements
- [ ] Configuration schema support
- [ ] Validation rules documented

---

### Story 2.5: Implement ArkType Validators

**Story Points:** 5
**Owner:** Senior Developer
**Status:** drafted
**DoD Level:** Normal Feature

**Description:**
Implement runtime validators using ArkType for all interfaces and schemas.

**Acceptance Criteria:**

- [ ] Validators for all plugin interfaces
- [ ] Manifest schema validator
- [ ] Configuration validators
- [ ] Clear error messages for validation failures
- [ ] Type inference working correctly
- [ ] Unit tests for validators

---

## Out of Scope (Sprint 2)

The following stories will be addressed in Sprint 2:

- Story 2.6: Define Provider-specific Types
- Story 2.7: Define Holo Universal Format Types
- Story 2.8: Define Shared Utility Types
- Story 2.9: Publish Common SDK to NPM

---

## Technical Considerations

### Architecture Alignment

- Follow namespace + subpath exports pattern (ADR-001)
- Maintain strict IP boundary (no imports from src/)
- Use type-only imports where possible
- Ensure tree-shaking compatibility

### Quality Requirements

- 80% test coverage minimum for new code
- All exports must have JSDoc documentation
- Type definitions must be strict (no any)
- Build must produce clean .d.ts files

### Dependencies

- ArkType for validation (already in project)
- No runtime dependencies on core Holo
- Development dependencies only for testing

---

## Risk Assessment

### Technical Risks

1. **ArkType Complexity**
   - Risk: Validators may be difficult to maintain
   - Mitigation: Start simple, add complexity gradually
   - Owner: Senior Developer

2. **Type Export Issues**
   - Risk: Complex types may not export cleanly
   - Mitigation: Test imports in separate project
   - Owner: Architect

3. **Breaking Changes**
   - Risk: Interface changes after publish would break plugins
   - Mitigation: Thorough review before Sprint 2 publish
   - Owner: Team

### Schedule Risks

1. **Underestimated Complexity**
   - Risk: Stories take longer than estimated
   - Mitigation: Daily standups to identify blockers early
   - Owner: Scrum Master

---

## Team Capacity

Based on Sprint 0.a velocity (3.67 points/day), Sprint 1 capacity:

- **15 story points** over 5 days
- Buffer for review and refinement
- Accounts for Epic 2 being new territory

**Story Point Total:** 15 points (matches capacity)

---

## Daily Standup Focus

### Day 1-2: Foundation

- Story 2.1: Package structure setup
- Review Epic 2 technical specification
- Validate build configuration

### Day 3-4: Interfaces

- Story 2.2: Base plugin interfaces
- Story 2.3: Type-specific interfaces
- Story 2.4: PluginManifest schema

### Day 5-6: Validation

- Story 2.5: ArkType validators
- Integration testing
- Documentation review

### Day 7: Wrap-up

- Code review completion
- Documentation updates
- Sprint retrospective

---

## Definition of Done Reminder

All stories must meet the appropriate DoD level:

- **Normal Feature** (Stories 2.1, 2.4, 2.5)
  - Build passes, tests pass, documented
  - 80% coverage for new code
  - PR template complete

- **API/Backend** (Stories 2.2, 2.3)
  - All Normal Feature requirements
  - Contract tests
  - Error responses defined
  - Performance validated

---

## Success Metrics

Sprint 1 will be successful if:

1. ✅ All 5 stories completed to DoD standards
2. ✅ Package builds and tests pass
3. ✅ Documentation complete for all interfaces
4. ✅ Team can build a proof-of-concept plugin
5. ✅ No critical design issues identified

---

## Notes

- This is our first Epic 2 sprint - expect learning curve
- Emphasis on getting interfaces right (hard to change later)
- Regular architecture review checkpoints
- Consider creating example plugin in parallel for validation

---

## Sprint Commitment

**Team commits to delivering Stories 2.1-2.5 (15 points) with full DoD compliance.**

Signed off by:

- Product Owner: **\_\_\_**
- Scrum Master: **\_\_\_**
- Development Team: **\_\_\_**

Date: November 24, 2025

---

_Sprint 1 begins November 25, 2025_
_Target completion: November 30, 2025_
