# Documentation Update Checklist

**Story/PR:** ******\_******
**Date:** ******\_******
**Developer:** ******\_******

> Use this checklist for **meaningful changes** (features, API changes,
> configuration, breaking changes, architecture decisions). For very small
> internal-only changes, treat this as a reference, not a hard requirement.

---

## Step 1: Identify Documentation Triggers

What type of change is this? (Check all that apply)

### Required Documentation Triggers

- [ ] **New Feature** – User-visible functionality added
- [ ] **API Change** – Endpoints, parameters, or responses modified
- [ ] **Configuration Change** – New or modified config options
- [ ] **Breaking Change** – Requires user action to maintain functionality
- [ ] **Architecture Decision** – Significant technical decision made

### Recommended Documentation Triggers

- [ ] **Performance Improvement** – Measurable optimization
- [ ] **User-Visible Bug Fix** – Affects UX / behavior
- [ ] **Development Setup Change** – Dependencies or tools changed
- [ ] **Complex Business Logic** – Non-obvious implementation or rules

### Optional Documentation Triggers

- [ ] **Internal Refactoring** – Code structure changed, behavior same
- [ ] **Test Improvements** – Strategy / coverage meaningfully changed
- [ ] **Minor Updates** – Small UI/UX tweaks, text changes

> If you check **any required triggers**, you should expect to update at least
> one user/developer doc plus inline comments where relevant.

---

## Step 2: Documentation Updates Required

Based on your triggers, complete the relevant sections below.

### For New Features

- [ ] `README.md` updated with feature description
- [ ] Usage examples provided or updated
- [ ] Configuration options documented (if any)
- [ ] API documentation updated (if feature is API-exposed)

### For API Changes

- [ ] API documentation updated (endpoint, params, responses, status codes)
- [ ] Request/response examples updated
- [ ] Migration guide written (if breaking or behavior-changing)
- [ ] Postman/OpenAPI spec updated

### For Configuration Changes

- [ ] Configuration guide updated
- [ ] Default values and constraints documented
- [ ] Environment variables documented
- [ ] `.env.example` updated

### For Breaking Changes

- [ ] Migration guide written
- [ ] `CHANGELOG.md` updated with clear notes
- [ ] Deprecation timeline documented (if applicable)
- [ ] Compatibility matrix updated (if you maintain one)

### For Architecture Decisions

- [ ] ADR (Architecture Decision Record) created
- [ ] Architecture diagrams updated
- [ ] `README` / architecture section updated or linked to ADR

---

## Step 3: Code Documentation

### Required Code Comments

- [ ] Complex algorithms explained (the **why**, not the what)
- [ ] Non-obvious business rules / edge cases documented
- [ ] Workarounds/hacks marked with `TODO[JIRA-XXXX]` + explanation
- [ ] Regular expressions explained (purpose and assumptions)
- [ ] Performance trade-offs or constraints noted

### JSDoc / Comments Added For (where applicable)

- [ ] Public API functions
- [ ] Complex internal functions
- [ ] Class/interface definitions
- [ ] Configuration objects
- [ ] Shared type definitions

---

## Step 4: Quality Checks

### Content Quality

- [ ] Examples are complete and runnable (where applicable)
- [ ] Version or feature flags clearly indicated
- [ ] Cross-references added (link to related docs, ADRs)
- [ ] Technical terms defined or linked
- [ ] Screenshots updated (if there are UI changes)

### Technical Accuracy

- [ ] All code examples tested
- [ ] Configuration values verified
- [ ] API endpoints tested (including examples)
- [ ] Links verified (no 404s)
- [ ] Commands copy–pasteable and executable

### Maintenance

- [ ] Old/outdated content removed or clearly marked as legacy
- [ ] Related docs updated (not just one file)
- [ ] `CHANGELOG.md` entry added (if user-visible)
- [ ] Version / feature flags updated
- [ ] Deprecation notices added where needed

---

## Step 5: Documentation Locations

Confirm updates in appropriate locations:

### User Documentation

- [ ] `/README.md` (project overview & key features)
- [ ] `/docs/api/*.md`
- [ ] `/docs/configuration.md`
- [ ] `/docs/deployment.md`

### Developer Documentation

- [ ] `/CONTRIBUTING.md`
- [ ] `/packages/*/README.md`
- [ ] `/docs/architecture/*.md`
- [ ] Inline code comments / JSDoc

### Process / Operations Documentation

- [ ] `CHANGELOG.md`
- [ ] `/docs/troubleshooting.md`
- [ ] `.env.example`
- [ ] `package.json` (if scripts or commands changed)
- [ ] Runbooks / operational docs (if behavior or monitoring changed)

---

## Step 6: Final Review

### Documentation Is:

- [ ] **Accurate** – Matches current implementation and behavior
- [ ] **Complete** – All important aspects covered
- [ ] **Clear** – Understandable by intended audience
- [ ] **Findable** – Located where users/devs expect it
- [ ] **Maintainable** – Structured so it's easy to update later

### PR Checklist Items:

- [ ] Documentation updated for this change (and PR checkbox ticked)
- [ ] Examples tested and working
- [ ] Links verified
- [ ] Documentation reviewed by a teammate (for significant changes)
- [ ] Approved by tech lead/architect (for major or breaking changes)

---

## Sign-off

**Developer:** I confirm documentation is complete and accurate.

- Name: ******\_******
- Date: ******\_******

**Reviewer:** I have reviewed the documentation updates.

- Name: ******\_******
- Date: ******\_******

---

## Notes

Additional documentation notes or follow-up items:

```text
[Space for notes]
```

---

## Quick Reference

### Documentation Triggers:

- **New Feature** → README + examples + config (if needed)
- **API Change** → API docs + examples + migration (if breaking)
- **Config Change** → Config guide + .env.example
- **Breaking Change** → Migration guide + CHANGELOG + deprecation notes
- **Architecture Decision** → ADR + diagrams + architecture docs

### Key Locations:

- **User Guide:** /README.md
- **API Docs:** /docs/api/
- **Configuration:** /docs/configuration.md
- **Architecture:** /docs/architecture/
- **Package Docs:** /packages/\*/README.md

### Help:

- **Standards:** [Documentation Standards](../documentation-standards.md)
- **Templates:** [Documentation Templates](../templates/)
- **Examples:** [Good Documentation Examples](../examples/)
