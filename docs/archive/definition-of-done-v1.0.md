# Definition of Done (DoD) Rubric

**Version:** 1.0.0
**Created:** 2025-11-23
**Status:** Active
**Review Cycle:** Sprint Retrospectives

---

## Overview

This Definition of Done (DoD) establishes the quality standards that must be met before any user story, feature, or epic can be considered complete. Every team member is responsible for ensuring their work meets these criteria before marking items as "done" or submitting for review.

## The Five Categories of Done

### 1. Technical Readiness ✅

**Focus:** Code compiles, tests pass, and technical standards are met

#### Required for ALL Stories:

- [ ] **Code Compiles** - `npm run build` executes without errors
- [ ] **TypeScript Check Passes** - `npx tsc --noEmit` shows no type errors
- [ ] **Linting Passes** - `npm run lint` reports no violations
- [ ] **Tests Pass** - All existing tests pass (`npm test`)
- [ ] **New Tests Written** - New functionality includes appropriate test coverage
- [ ] **No Console Errors** - Application runs without console errors/warnings

#### Additional for API/Backend Stories:

- [ ] **API Tests Pass** - Integration tests for new/modified endpoints
- [ ] **Error Handling** - All error cases handled with appropriate responses
- [ ] **Logging Added** - Appropriate logging for debugging and monitoring

#### Additional for Complex Features:

- [ ] **Performance Validated** - No significant performance degradation
- [ ] **Memory Leaks Checked** - No memory leaks introduced
- [ ] **Security Reviewed** - No security vulnerabilities introduced

---

### 2. Functional Completeness ✅

**Focus:** All acceptance criteria met and feature works as intended

#### Required for ALL Stories:

- [ ] **All AC Met** - Every acceptance criterion is satisfied
- [ ] **Happy Path Works** - Primary use case functions correctly
- [ ] **Edge Cases Handled** - Common edge cases addressed
- [ ] **Data Validation** - Input validation implemented where needed
- [ ] **Business Logic Correct** - Implementation matches requirements

#### Additional for User-Facing Features:

- [ ] **UX Validated** - User experience matches design/requirements
- [ ] **Accessibility** - Basic accessibility requirements met
- [ ] **Cross-Browser** - Works in supported browsers (if applicable)

#### Additional for Integration Stories:

- [ ] **Integration Tested** - Works with dependent systems
- [ ] **Backward Compatible** - Doesn't break existing functionality
- [ ] **Migration Path** - Data/config migration handled if needed

---

### 3. Architectural Quality ✅

**Focus:** Code follows established patterns and maintains system integrity

#### Required for ALL Stories:

- [ ] **Design Patterns Followed** - Uses established project patterns
- [ ] **Separation of Concerns** - Proper layer separation maintained
- [ ] **DRY Principle** - No unnecessary duplication
- [ ] **SOLID Principles** - Object-oriented principles applied appropriately
- [ ] **Dependencies Managed** - No circular dependencies or version conflicts

#### Additional for New Modules/Services:

- [ ] **Module Boundaries** - Clear interfaces and contracts
- [ ] **Plugin Architecture** - Follows plugin system design (where applicable)
- [ ] **Scalability Considered** - Design supports expected growth

#### Additional for Data/State Changes:

- [ ] **Data Integrity** - Database constraints and validations in place
- [ ] **State Management** - Consistent state handling patterns
- [ ] **Transaction Boundaries** - Proper transaction management

---

### 4. Code Quality ✅

**Focus:** Code is clean, maintainable, and follows standards

#### Required for ALL Stories:

- [ ] **Naming Conventions** - Variables, functions, files follow standards
- [ ] **Code Formatted** - Prettier/formatting rules applied
- [ ] **Comments Present** - Complex logic documented
- [ ] **No Dead Code** - Unused code removed
- [ ] **File Organization** - Files in correct directories

#### Additional for New Components:

- [ ] **README Updated** - Component documentation added
- [ ] **Type Definitions** - TypeScript types properly defined
- [ ] **Error Messages** - Clear, actionable error messages

#### Additional for API Changes:

- [ ] **API Documented** - OpenAPI/Swagger specs updated
- [ ] **Breaking Changes** - Clearly marked if any
- [ ] **Deprecation Notices** - Old endpoints marked if replaced

---

### 5. Git & Documentation Hygiene ✅

**Focus:** Version control and documentation maintain project health

#### Required for ALL Stories:

- [ ] **Atomic Commits** - Each commit is a logical unit
- [ ] **Meaningful Messages** - Commit messages follow format: `type(scope): description`
- [ ] **No WIP Commits** - No work-in-progress commits in final branch
- [ ] **Branch Up-to-Date** - Rebased/merged with latest main
- [ ] **PR Description** - Clear description of changes and why

#### Documentation Requirements:

- [ ] **Code Comments** - Inline documentation for complex logic
- [ ] **README Updates** - Project README reflects new features/changes
- [ ] **API Docs** - API documentation updated if endpoints changed
- [ ] **Config Docs** - New configuration options documented
- [ ] **Migration Guide** - Breaking changes documented with upgrade path

#### Additional for Major Features:

- [ ] **Architecture Docs** - Design decisions documented
- [ ] **User Guide** - End-user documentation created/updated
- [ ] **Runbook Updates** - Operational procedures updated

---

## Role-Specific Focus Areas

### Scrum Master (SM)

**Primary Focus:** Process & Coordination

- Ensure all team members understand DoD
- Validate story completeness before marking done
- Track and improve DoD compliance metrics
- Facilitate DoD reviews in retrospectives
- **Special Attention:** Stories meet business value and AC

### Senior Developer

**Primary Focus:** Technical Excellence & Architecture

- Code review for architectural compliance
- Validate design patterns and best practices
- Ensure scalability and performance
- Mentor on technical standards
- **Special Attention:** System design, integration points, technical debt

### QA Engineer (TEA)

**Primary Focus:** Quality & Testing

- Validate test coverage and quality
- Verify edge cases and error scenarios
- Check regression impact
- Ensure testability of new features
- **Special Attention:** Test automation, coverage metrics, bug prevention

### Junior Developer

**Primary Focus:** Learning & Implementation

- Follow coding standards precisely
- Write clear, simple code
- Document learning and decisions
- Ask questions when uncertain
- **Special Attention:** Code clarity, proper use of patterns, documentation

### Product Manager (PM)

**Primary Focus:** Business Value & Requirements

- Validate functional completeness
- Ensure user needs are met
- Check business logic accuracy
- Approve UX/workflow changes
- **Special Attention:** User impact, business value, requirement alignment

### Architect

**Primary Focus:** System Design & Integration

- Review architectural decisions
- Validate system boundaries
- Ensure pattern compliance
- Check performance implications
- **Special Attention:** Long-term maintainability, system coherence

---

## Using This Rubric

### For Developers:

1. **Before Starting:** Review relevant sections for your story type
2. **During Development:** Use as a checklist while coding
3. **Before Review:** Complete self-assessment against all criteria
4. **After Review:** Address any gaps identified

### For Reviewers:

1. **Code Review:** Validate technical and code quality categories
2. **Functional Review:** Verify functional completeness
3. **Final Review:** Ensure all categories are satisfied
4. **Sign-off:** Only approve when all applicable criteria are met

### For Stories:

- Each story should include a DoD checklist in its description
- Copy relevant sections from this rubric
- Check off items as completed
- Reviewer validates all checks

---

## Enforcement & Exceptions

### Automation:

- Pre-commit hooks validate: compilation, linting, tests
- CI/CD pipeline enforces: build, test, quality gates
- PR checks require: all automated checks passing

### Manual Review:

- Code review validates: architecture, code quality, documentation
- QA review validates: functional completeness, test coverage
- SM review validates: DoD compliance, business value

### Exceptions:

- **Emergency Fixes:** May bypass with documented justification
- **Technical Debt:** May defer with backlog item created
- **Prototype/POC:** May use reduced DoD with clear marking

### Escalation:

1. Developer self-certifies DoD compliance
2. Reviewer validates compliance
3. Disputes escalated to SM/Architect
4. Team reviews in retrospective

---

## Continuous Improvement

This DoD is a living document that should evolve based on:

- Sprint retrospective feedback
- Quality metrics and trends
- New technical requirements
- Team capability growth

### Review Schedule:

- Sprint Retrospectives: Discuss DoD effectiveness
- Monthly: SM reviews compliance metrics
- Quarterly: Team reviews and updates rubric

### Metrics to Track:

- Stories rejected for DoD non-compliance
- Most common DoD failures
- Time spent on DoD activities
- Quality improvements from DoD

---

## Quick Reference Checklist

For every story, ask:

1. ✅ Does it compile and pass all tests?
2. ✅ Does it meet all acceptance criteria?
3. ✅ Does it follow our architecture patterns?
4. ✅ Is the code clean and maintainable?
5. ✅ Are commits atomic with clear messages?
6. ✅ Is documentation updated?

If you can answer YES to all applicable questions, your story is DONE!

---

## Appendix: Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Example:**

```
feat(plugin-system): add hot-reload capability

Implements file watching and automatic plugin reloading
when source files change. Includes error handling and
rollback on failed reload attempts.

Closes #123
```

---

**Document Status:** This document is now in effect for all development work.
