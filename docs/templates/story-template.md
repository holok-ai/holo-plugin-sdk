# Story [STORY-ID]: [Story Title]

**Epic:** [Epic Number and Name]
**Story Type (DoD Level):** [Hotfix/Critical | Small Bug/Minor UI | Normal Feature | API/Backend | Data Migration | Major Feature | Spike/POC]
**Story Points:** [Points]
**Owner:** [Role/Name]
**Status:** [drafted | ready-for-dev | in-progress | review | done]
**Created:** [Date]
**Updated:** [Date]

---

## Description

[Clear description of what needs to be built and why. Link to any relevant design docs, ADRs, or tickets.]

---

## Acceptance Criteria

- [ ] [First acceptance criterion]
- [ ] [Second acceptance criterion]
- [ ] [Third acceptance criterion]
- [ ] [Add more as needed]

> ACs should be testable and unambiguous. These are the source of truth for
> "Functional Completeness".

---

## Technical Approach

[Brief description of how this will be implemented. This is not a full design doc, but should show the expected approach.]

### Key Considerations

- [Important technical consideration]
- [Architecture decision or pattern to follow]
- [Integration points or dependencies]
- [Performance, security, or data concerns]

> For major decisions, link or reference an ADR: `ADR-XXX: Title`.

---

## Definition of Done Checklist (Story-Level)

> This is a **story-specific view** of the DoD. For full details, see
> [`definition-of-done.md`](../definition-of-done.md).

### 1. Technical Readiness ✅

- [ ] Build passes (service-specific command, e.g. `npm run build`)
- [ ] Type checking passes (e.g. `npx tsc --noEmit` / `mypy` / `pyright` where enabled)
- [ ] Linting passes (`npm run lint` or equivalent)
- [ ] All existing tests pass
- [ ] New tests added for new/changed functionality
  - Coverage target for new/changed code ≥ 80% (deviations justified in PR)
- [ ] No known unhandled errors in normal flows

### 2. Functional Completeness ✅

- [ ] All acceptance criteria met
- [ ] Happy path works correctly
- [ ] Common edge cases handled
- [ ] Data validation implemented and sanitized where needed
- [ ] Business logic verified with PM/Owner (sign-off planned)
- [ ] Evidence planned (screenshots, test results, logs, etc.)

### 3. Architectural Quality ✅

- [ ] Established design patterns followed
- [ ] Separation of concerns maintained
- [ ] No unnecessary duplication (DRY)
- [ ] SOLID principles applied where appropriate
- [ ] No circular dependencies introduced
- [ ] Observability needs identified (logs/metrics/traces) for major features

### 4. Code Quality ✅

- [ ] Naming is clear and consistent
- [ ] Code auto-formatted (Prettier or equivalent)
- [ ] Complex logic commented (the **why**, not the what)
- [ ] No dead code or commented-out blocks
- [ ] Files placed in correct modules/packages
- [ ] TODOs include ticket IDs: `TODO[JIRA-XXXX]: ...`

### 5. Git & Documentation ✅

- [ ] Branch naming follows standard (`feature/JIRA-XXX-description`, etc.)
- [ ] Commits planned as small, atomic units
- [ ] Final squash commit will follow `type(scope): subject`
- [ ] PR will use the standard PR template
- [ ] Documentation triggers identified (see section below)
- [ ] Required documentation updates planned/linked
- [ ] Code comments added for complex or non-obvious logic

### 6. Environment & Deployment ✅

- [ ] Target environments defined (local / staging / preview / prod)
- [ ] Plan to validate in at least one non-prod environment for Normal+/API/Data Migration/Major stories
- [ ] Rollback strategy considered (especially for schema / data changes)
- [ ] Feature flags / config strategy identified (if applicable)

---

## Documentation Requirements

> Use together with the [Documentation Update Checklist](../documentation-checklist.md) and
> [Documentation Standards](../documentation-standards.md).

### Documentation Triggers (for this story)

Check which apply:

- [ ] **New Feature** → Update README, add examples
- [ ] **API Change** → Update API docs, migration guide if breaking
- [ ] **Config Change** → Update configuration docs, `.env.example`
- [ ] **Breaking Change** → Migration guide, `CHANGELOG` entry
- [ ] **Architecture Decision** → Create/update ADR
- [ ] **Bug Fix (user-visible)** → `CHANGELOG` entry
- [ ] **Complex Logic** → Inline code comments / JSDoc
- [ ] **Performance Improvement** → Document impact and metrics
- [ ] **Setup/Tooling Change** → Update `CONTRIBUTING` / setup docs

### Required Documentation Updates (to be completed before "done")

Based on triggers above:

- [ ] `README.md` updated
- [ ] API documentation updated (`/docs/api/*`)
- [ ] Configuration guide updated (`/docs/configuration.md`)
- [ ] Migration guide created/updated
- [ ] `CHANGELOG.md` updated
- [ ] Package-level docs updated (`/packages/*/README.md`)
- [ ] Code comments / JSDoc added or updated
- [ ] Examples/tutorials/snippets updated
- [ ] ADR created/updated (if architectural)

---

## Test Plan

Describe how this story will be verified. Link to specific test files where possible.

### Unit Tests

- [ ] [Unit test scenario 1]
- [ ] [Unit test scenario 2]
- [ ] [Additional scenarios as needed]

### Integration / E2E Tests

- [ ] [Integration/E2E test scenario]
- [ ] [Cross-service or external system scenarios]

### Manual Testing

- [ ] [Manual test scenario 1]
- [ ] [Manual test scenario 2]
- [ ] [Edge case validation checklist]

> For user-facing stories, include explicit manual steps (who will test, in which environment).

---

## Dependencies

- **Depends On:** [Other stories, services, or external dependencies]
- **Blocks:** [Stories that depend on this one]

> Call out sequencing concerns here so planning can handle ordering correctly.

---

## Notes

[Any additional context, links to Slack threads, experiments, spike notes, trade-offs considered but not fully ADR-worthy, etc.]

---

## Review Notes

[Space for review feedback and discussion. Capture key review decisions and follow-ups.]

---

## Implementation Log

### [Date] – Status Change: drafted → ready-for-dev

- Story reviewed and approved by SM/PO
- DoD category/Story Type selected
- Dependencies identified

### [Date] – Status Change: ready-for-dev → in-progress

- Development started by [Developer]
- Branch created: `feature/[story-id]-description`

### [Date] – Status Change: in-progress → review

- Implementation complete
- PR created: #[PR-number]
- DoD self-assessment completed in PR

### [Date] – Status Change: review → done

- Code review passed
- All applicable DoD criteria verified
- Documentation updates merged
- Changes deployed to target environment(s) as planned

---

## Retrospective Notes

[What went well, what could be improved, lessons learned, follow-up stories or tech debt created.]
