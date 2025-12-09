## Description

Brief description of changes and why they're needed.

Fixes #(issue)

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🧹 Refactor (no functional changes)
- [ ] 🚀 Performance improvement
- [ ] 🧪 Test update
- [ ] 🔧 Configuration change

## Story Type & DoD Level

Select which applies (see [full DoD rubric](../definition-of-done.md#applicability-matrix)):

- [ ] Hotfix/Critical (Reduced DoD)
- [ ] Small Bug/Minor UI (Core DoD)
- [ ] Normal Feature (Standard DoD)
- [ ] API/Backend (Standard + API-specific)
- [ ] Data Migration (Standard + migration-specific)
- [ ] Major Feature (All categories)
- [ ] Spike/POC (Minimal DoD – no prod deploy unless converted)

## Pre-Submit Checklist

### ✅ Technical Readiness

- [ ] Code builds without errors (`npm run build` or service-specific equivalent)
- [ ] Type checking passes (`npx tsc --noEmit` / `mypy` / `pyright` where enabled)
- [ ] Linting passes (`npm run lint` or equivalent)
- [ ] All existing tests pass
- [ ] New tests added for new functionality
  - Coverage target for new/changed code: ≥80% (deviations explained below)

### ✅ Functional Completeness

- [ ] All acceptance criteria met
- [ ] Evidence linked (screenshots/test results): ******\_******
- [ ] Edge cases handled
- [ ] PM/Owner sign-off (if user-facing): @****\_\_\_****

### ✅ Code Quality

- [ ] Clear naming and organization
- [ ] Complex logic documented (the **why**, not the what)
- [ ] No dead code or debug artifacts
- [ ] TODOs reference tickets: `TODO[JIRA-XXXX]`

### ✅ Git & Documentation

- [ ] Final squash commit to `main` will be logically atomic
- [ ] Commit messages follow `type(scope): description` for the final merge commit
- [ ] Branch is up-to-date with `main`
- [ ] Documentation triggers reviewed per [standards](../documentation-standards.md)
- [ ] Required documentation updated (check all that apply, if applicable):
  - [ ] README (features/setup/config)
  - [ ] API docs (endpoints/contracts)
  - [ ] Config docs (new settings)
  - [ ] Migration guide (breaking changes)
  - [ ] CHANGELOG (user-visible changes)
  - [ ] Code comments (complex logic)

## Environment Testing

- [ ] Tested in (mark all that apply): [ ] local [ ] staging [ ] preview
  - (Normal+/API/Data Migration/Major features should include at least staging or preview; Spike/POC may be local-only if not deployed to prod.)
- [ ] Smoke tests pass in target environment

## For API/Backend Changes (if applicable)

- [ ] Contract tests updated
- [ ] Error responses return appropriate codes
- [ ] Structured logs with correlation IDs added

## For Breaking Changes (if applicable)

- [ ] Migration guide documented
- [ ] Rollback plan defined: ******\_******
- [ ] Backward compatibility verified or exceptions documented

## Performance Impact

_For performance-sensitive changes:_

- Baseline: ****\_**** ms
- New: ****\_**** ms
- Within SLO? [ ] Yes [ ] No (justify below)

## Security Considerations

- [ ] No secrets in code
- [ ] Input validation added/updated
- [ ] SAST/DAST issues addressed or ticketed

---

## Reduced DoD (Emergency/POC Only)

**⚠️ Only fill if using Reduced DoD (see rubric). Reduced DoD cannot be applied silently.**

- [ ] Story tagged: `reduced-dod`
- **Reason for Reduced DoD:**
- **Items skipped (reference DoD sections):**
- **Follow-up ticket(s):**
- **Risk assessment:**
- **Approved by:** @****\_\_\_**** (Tech Lead / Architect / PO / On-call as applicable)

---

## Notes for Reviewers

Any additional context, areas of concern, or specific feedback requested:

---

## Review Signoffs

- [ ] Code Review (Sr Dev/Peer)
- [ ] Functional Review (QA/PM) – if applicable
- [ ] Architecture Review (Architect) – if major changes

---

📋 **Full DoD Reference:** [Definition of Done](../definition-of-done.md)
🚀 **Ready for review when all applicable boxes are checked!**
