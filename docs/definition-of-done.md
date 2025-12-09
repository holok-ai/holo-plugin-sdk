# Definition of Done (DoD) Rubric

**Version:** 1.1.0
**Created:** 2025-11-23
**Updated:** 2025-11-23
**Status:** Active
**Review Cycle:** Sprint Retrospectives

---

## Overview

This Definition of Done (DoD) establishes the quality standards that must be met before any user story, feature, or epic can be considered complete. Every team member is responsible for ensuring their work meets these criteria before marking items as "done" or submitting for review.

**"Normal+ Features"** means Normal Feature, API/Backend, Data Migration, and Major Feature story types.

## Applicability Matrix

Not all stories require the same rigor. Use this matrix to determine which categories apply:

| Story Type              | Required Categories                      | Notes                                                                         |
| ----------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Hotfix/Critical Bug** | 1 (subset), 5                            | Use Reduced DoD flow (see "Reduced DoD - Emergency & Special Cases")          |
| **Small Bug/Minor UI**  | 1, 2, 4, 5 (core items only)             | Focus on immediate fix and tests                                              |
| **Normal Feature**      | 1, 2, 3, 4, 5                            | Standard full DoD                                                             |
| **API/Backend**         | 1, 2, 3, 4, 5, 6 + API-specific          | Extra focus on contracts and integration                                      |
| **Data Migration**      | 1, 2, 3, 4, 5, 6 + migration-specific    | Rollback scripts mandatory                                                    |
| **Major Feature**       | All categories + extended items          | Full architectural review                                                     |
| **Spike/POC**           | Minimal DoD + explicit reduced checklist | Document learnings, no production deployment unless converted to normal story |

---

## The Six Categories of Done

### 1. Technical Readiness ✅

**Focus:** Code compiles, tests pass, and technical standards are met

#### Core Requirements (ALL Stories):

- [ ] **Build Passes** - Service-specific build command succeeds
  - Node.js: `npm run build`
  - Go: `go build ./...`
  - Python: `python -m py_compile`
- [ ] **Type Check Passes** - Static type checking passes for projects where enabled
  - TypeScript: `npx tsc --noEmit`
  - Python: `mypy .` or `pyright`
- [ ] **Linting Passes** - Code style checks pass
  - Node.js: `npm run lint`
  - Go: `golangci-lint run`
- [ ] **Tests Pass** - All existing tests pass
- [ ] **New Tests Written** - New functionality includes tests
  - Target unit test coverage ≥ 80% for new code; deviations must be justified in PR
  - Critical paths should approach ≥ 95% coverage; lower coverage requires explicit sign-off from Sr Dev/Architect

#### Extended Requirements (Normal+ Features):

- [ ] **No Unhandled Errors** - No uncaught exceptions in normal flows
- [ ] **Database Migrations** - Include rollback scripts for schema changes
- [ ] **Performance Baseline** - p95 latency within service-specific SLO (e.g., < 200ms unless documented otherwise)
  - Baseline vs new metrics recorded: `[baseline] → [new]`
- [ ] **Security Check** - SAST/DAST issues resolved or ticketed
  - Reviewer: ******\_\_\_\_******

#### API/Backend Specific:

- [ ] **Contract Tests** - API contracts validated
- [ ] **Integration Tests** - End-to-end flows tested
- [ ] **Error Responses** - All errors return appropriate HTTP codes
- [ ] **Logging** - Structured logs with correlation IDs

---

### 2. Functional Completeness ✅

**Focus:** All acceptance criteria met with evidence

#### Core Requirements (ALL Stories):

- [ ] **All AC Met** - Every acceptance criterion satisfied
- [ ] **AC Evidence** - Proof linked in ticket (screenshots/test results)
- [ ] **Happy Path Works** - Primary use case functions correctly
- [ ] **Edge Cases Handled** - Common edge cases addressed
- [ ] **Business Logic Verified** - PM/Owner confirms behavior
  - Evidence: comment/approval in story or PR

#### Extended Requirements (Normal+ Features):

- [ ] **User Validation** - Validated against user acceptance scenarios
- [ ] **Data Validation** - Input validation and sanitization
- [ ] **Integration Verified** - Works with dependent systems
  - Where feasible, integration/contract tests include at least one negative/error case
- [ ] **Backward Compatible** - No breaking changes (or documented)

#### User-Facing Specific:

- [ ] **UX/PM Sign-off** - Design compliance verified
  - Reviewer: ******\_\_\_\_******
- [ ] **Accessibility** - WCAG 2.1 AA basics checked
  - [ ] Keyboard navigation works
  - [ ] Focus management correct
  - [ ] Color contrast sufficient
  - [ ] ARIA labels for complex controls

---

### 3. Architectural Quality ✅

**Focus:** System design integrity and non-functional requirements

#### Core Requirements (Normal+ Features):

- [ ] **Design Patterns** - Established patterns followed
- [ ] **Separation of Concerns** - Proper layer boundaries
- [ ] **SOLID Principles** - Applied where appropriate
- [ ] **No Circular Dependencies** - Dependency graph clean

#### Extended Requirements (Major Features):

- [ ] **Observability**
  - [ ] Structured logs with correlation IDs
  - [ ] Metrics for critical paths
  - [ ] Tracing for distributed calls
- [ ] **Resilience** (applies to external/cross-service calls)
  - [ ] Timeouts configured according to service guidelines (e.g., ≤ 30s for most HTTP calls, stricter where possible)
  - [ ] Retry logic with exponential backoff
  - [ ] Circuit breakers for external calls
  - [ ] Degraded mode defined
- [ ] **Scalability**
  - [ ] No obvious bottlenecks (N+1 queries, unbounded loops)
  - [ ] Expected load documented
  - [ ] Resource limits defined

---

### 4. Code Quality ✅

**Focus:** Clean, maintainable code

#### Core Requirements (ALL Stories):

- [ ] **Naming Standards** - Clear, consistent naming
- [ ] **Formatted** - Auto-formatting applied
- [ ] **No Dead Code** - Unused code removed
- [ ] **File Organization** - Correct directory structure

#### Extended Requirements (Normal+ Features):

- [ ] **Documentation of Non-Obvious Logic** - Complex parts explained (document the "why", not the "what")
- [ ] **No Naked TODOs** - All TODOs include a ticket ID (e.g., `TODO[JIRA-1234]: ...`) or are removed before merge
- [ ] **Type Definitions** - Public interfaces fully typed
- [ ] **Error Messages** - User-friendly and actionable

---

### 5. Git & Documentation ✅

**Focus:** Version control and documentation hygiene

#### Core Requirements (ALL Stories):

- [ ] **Atomic Commits** - Final squash commit to main must be logically atomic and follow format
- [ ] **Commit Format** - `type(scope): description`
- [ ] **PR Description** - Clear summary of what and why
- [ ] **Branch Updated** - Branch rebased or merged with latest main before final approval (no red "out of date" PR)
- [ ] **No Debug Artifacts** - No leftover debug code

#### Documentation (When Applicable):

- [ ] **Documentation Triggers Identified** - Per [Documentation Standards](documentation-standards.md)
  - [ ] New feature → README + examples
  - [ ] API change → API docs + migration if breaking
  - [ ] Config change → Configuration guide + .env.example
  - [ ] Breaking change → Migration guide + CHANGELOG
  - [ ] Architecture decision → ADR created
- [ ] **Code Comments** - Complex logic, workarounds, and non-obvious business rules explained
- [ ] **API Docs** - Updated for new/changed endpoints with examples
- [ ] **README** - Updated if setup/config/usage changed
- [ ] **CHANGELOG** - Updated for user-visible changes
- [ ] **Examples** - Working code examples tested and included

---

### 6. Environment & Deployment ✅

**Focus:** Validated in target environment

#### Core Requirements (Normal+ Features):

- [ ] **Environment Testing** - Feature validated in at least one non-production environment (staging, QA, preview)
- [ ] **Smoke Tests Pass** - Basic flows verified in environment
- [ ] **Rollback Plan** - For changes not trivially reverted (e.g., schema/data changes), rollback steps documented

#### Extended Requirements (Major Features):

- [ ] **Feature Flags** - Configured correctly
  - [ ] Default state correct
  - [ ] Removal plan documented
- [ ] **Performance Testing** - Load tested if applicable
- [ ] **Monitoring** - Alerts configured for new services

---

## RACI Matrix - Who's Responsible?

| Category                    | Dev | Sr Dev | QA/TEA | PM  | Architect | SM  |
| --------------------------- | --- | ------ | ------ | --- | --------- | --- |
| **Technical Readiness**     | R   | A      | C      | -   | C         | I   |
| **Functional Completeness** | R   | C      | A      | A   | C         | I   |
| **Architectural Quality**   | C   | R      | I      | -   | A         | I   |
| **Code Quality**            | R   | A      | C      | -   | C         | I   |
| **Documentation**           | R   | C      | I      | C   | C         | A   |
| **Environment**             | R   | A      | R      | I   | C         | I   |

**R** = Responsible (does the work)
**A** = Accountable (approves/signs off)
**C** = Consulted (provides input)
**I** = Informed (kept in loop)

**Note on Environment:** Developers are responsible for deployment configuration/scripts; QA is responsible for validating behavior in the target environment.

---

## Reduced DoD - Emergency & Special Cases

### When Reduced DoD is Allowed:

- **Emergency Hotfixes** - Production issues requiring immediate fix
- **Spikes/POCs** - Exploratory work not intended for production
- **Technical Debt Items** - With explicit acceptance of reduced criteria

### Reduced DoD Requirements:

1. **Must Have:**
   - [ ] Code compiles
   - [ ] Critical fix verified
   - [ ] Rollback plan defined
   - [ ] PR describes emergency/exception

2. **Documentation:**
   - [ ] Story tagged: `reduced-dod`
   - [ ] List which DoD items skipped
   - [ ] Follow-up ticket created for skipped items
   - [ ] Risk assessment documented
   - [ ] **Cannot be applied silently** - must be explicitly indicated in story/PR

3. **Approval:**
   - Emergency fixes: Tech Lead or On-call Lead
   - POCs: Architect or Tech Lead
   - Tech debt: Product Owner + Tech Lead

**Example Reduced DoD Documentation:**

```
REDUCED DOD - Emergency Fix
Skipped: Full test coverage, performance validation
Reason: Production outage affecting 10K users
Follow-up: JIRA-1234 for comprehensive tests
Risk: Potential edge cases not covered
Approved by: @techlead
```

---

## Enforcement & Automation

### Automated Checks (CI/CD):

- Build and compilation
- Type checking
- Linting
- Test execution and coverage
- Security scanning (SAST/DAST)
- Performance benchmarks (where configured)

### Manual Reviews:

- Code review by peers
- Functional review by QA/PM
- Architecture review for major changes
- Final DoD checklist verification

### Git Hooks (Pre-commit):

```bash
# .husky/pre-commit (suggested lightweight pattern)
npm run lint
npm run test:unit:fast   # or a fast subset

# Full build and integration tests are enforced in CI
```

### Merge Requirements:

- All CI checks green
- Required reviews approved
- DoD checklist completed in PR
- No unresolved comments

---

## Quick Reference Checklist

**Before Creating PR:**
✅ Does it build and pass tests?
✅ Are all ACs met with evidence?
✅ Following our patterns?
✅ Code clean and documented?

**Before Requesting Review:**
✅ Commits atomic and well-messaged?
✅ PR description complete?
✅ DoD checklist filled out?
✅ Deployed to test environment?

**Before Merging:**
✅ Reviews approved?
✅ Feedback addressed?
✅ Branch up-to-date?
✅ No debug artifacts?

---

## Continuous Improvement

### Metrics We Track:

- Stories rejected for DoD non-compliance
- Most common DoD failures
- Average time from "done" to "actually done"
- Escaped defects that DoD should have caught

### Review Schedule:

- **Sprint Retrospectives** - Discuss DoD effectiveness
- **Monthly** - SM reviews metrics and trends
- **Quarterly** - Team updates rubric based on learnings

### How to Propose Changes:

1. Raise in retrospective with specific examples
2. Document the problem and proposed solution
3. Team discusses and votes
4. Update version and changelog

---

## Appendix A: Commit Message Format

### Format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no logic change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Test changes only
- `chore`: Build/tool changes
- `revert`: Reverting previous commit

### Examples:

```
feat(auth): add OAuth2 integration

Implements GitHub and Google OAuth providers with
automatic token refresh. Includes rate limiting
and error recovery.

Closes #123
```

```
fix(payment): handle declined cards gracefully

Returns proper error message instead of 500 when
payment processor declines card. Added retry logic
for transient failures.

Fixes #456
```

### Merge Strategy:

- Squash and merge recommended for feature branches
- Final commit to main must follow format
- WIP commits in feature branches don't need strict format

---

## Appendix B: Evidence Examples

### AC Evidence Types:

- **Screenshots** - UI changes, error messages
- **Test Results** - Jest/Mocha/pytest output
- **API Responses** - Postman/curl results
- **Logs** - Showing successful flows
- **Metrics** - Performance comparisons
- **Sign-offs** - Comments from PM/UX

### Where to Put Evidence:

1. Linked in ticket comments
2. PR description
3. Test reports in CI
4. Shared team drive/wiki

---

## Changelog

### v1.1.0 (2025-11-23)

- Added applicability matrix for different story types
- Made technical requirements tool-agnostic with service-specific examples
- Changed coverage requirements to targets with justification for deviations
- Added evidence-based validation requirements with explicit sign-off tracking
- Introduced Environment & Deployment category with flexibility for different deployment flows
- Added RACI matrix with clarification on Environment dual-responsibility
- Formalized reduced-DoD procedures with "cannot be silent" requirement
- Added observability and resilience requirements scoped to external calls
- Made performance baselines service-specific with SLO approach
- Clarified documentation requirements with "why not what" guidance
- Updated TODO format to be searchable (TODO[JIRA-XXXX])
- Lightened pre-commit hooks, moved heavy checks to CI
- Clarified atomic commits apply to final squash merge

### v1.0.0 (2025-11-23)

- Initial DoD rubric with 5 categories
- Role-specific focus areas
- Basic enforcement guidelines

---

**Document Status:** This document is now in effect for all development work.
**Questions?** Reach out to SM or review in next retrospective.
