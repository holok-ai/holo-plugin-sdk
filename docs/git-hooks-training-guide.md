# Git Hooks Training Guide

**Version:** 1.0.1
**Created:** 2025-11-24
**Audience:** All Development Team Members

---

## Overview

This guide provides hands-on training for our automated git hooks system. These
hooks help maintain code quality by catching issues as early as possible, before
code review and CI.

Hooks are designed to be **fast locally** (lint/format and lightweight checks),
with **full validation enforced in CI** (full tests, build, integration, etc.).

---

## Prerequisites

1. Git is configured on your machine.
2. Node.js ≥ 18.0.0 installed.
3. Familiarity with our [Git Hygiene Standards](git-hygiene-standards.md).
4. Understanding of our [Definition of Done](definition-of-done.md).

---

## Initial Setup

### 1. Install Dependencies

After cloning the repository, hooks are installed automatically via `prepare`:

```bash
npm install
# Husky hooks are installed via the prepare script
```

### 2. Verify Installation

Check that hooks are present:

```bash
ls -la .husky/
# Should show at least pre-commit and commit-msg files
```

### 3. Configure Commit Template (Recommended)

```bash
git config commit.template .gitmessage
```

This ensures you get the commit message scaffold every time you commit.

---

## Training Exercises

### Exercise 1: Understanding Pre-commit Checks

**Objective:** See what the pre-commit hook validates.

> Note: By default, pre-commit runs lint/format and other fast checks.
> Full builds and full test suites are handled in CI.

1. Create a test file with lint/type issues:

```typescript
// test.ts
const num: number = 'string'; // Type error
const unused = 42; // Lint warning (unused variable)
```

2. Try to commit:

```bash
git add test.ts
git commit -m "test: intentional errors"
```

3. Observe the hook output and which checks fail.

4. Fix the issues:

```typescript
const num: number = 42;
console.log(num);
```

5. Commit successfully:

```bash
git add test.ts
git commit -m "test: fix training example"
```

**Takeaway:** Pre-commit hooks catch basic type/lint issues early, so you
don't send obviously broken code to review.

---

### Exercise 2: Commit Message Validation

**Objective:** Learn the required commit message format.

1. Try invalid commit messages:

```bash
# Missing type
git commit -m "added new feature"

# Invalid type
git commit -m "update: fixed bug"

# Too long subject line
git commit -m "feat: this is a very long commit message that exceeds the \
72 character limit for the subject line"
```

You should see commitlint reject these with clear error messages.

2. Use valid formats:

```bash
git commit -m "feat(common): add plugin discovery service"
git commit -m "fix: resolve memory leak in worker"
git commit -m "docs: update README with setup steps"
```

**Takeaway:** Commit messages must follow the Conventional Commits format and
our project rules (type, optional scope, subject ≤ 72 chars).

---

### Exercise 3: Using the Commit Template

**Objective:** Practice writing detailed commit messages using `.gitmessage`.

1. Configure the template (if you haven't already):

```bash
git config commit.template .gitmessage
```

2. Stage changes and commit without -m:

```bash
git add .
git commit
# Your editor opens with the template
```

3. Fill out the template, for example:

```
feat(auth): add OAuth2 provider support

Implements GitHub and Google OAuth providers with automatic
token refresh. Includes rate limiting and error recovery.

- add OAuth2Provider base class
- implement GitHub and Google providers
- add token refresh middleware
- include integration tests

Closes #123
```

**Takeaway:** The template guides you to write clear, complete commit messages
that explain what changed and why.

---

### Exercise 4: Emergency Override

**Objective:** Learn when and how to bypass hooks (Reduced DoD scenarios).

1. **Understand when override is acceptable:**
   - Active production incident requiring immediate fix.
   - CI/CD issues blocking a critical deployment.
   - Critical security patch that cannot wait.

2. **Use the bypass flag with full justification:**

```bash
git commit --no-verify -m "fix(core): emergency patch for production

EMERGENCY: Servers experiencing OOM crashes.
Bypassing hooks due to incident INC-2345.
Follow-up cleanup in JIRA-678.

Refs INC-2345"
```

3. **Requirements when bypassing:**
   - Document the reason for bypassing.
   - Reference the incident/issue.
   - Create follow-up tickets for any skipped checks or cleanup.
   - Use the Reduced DoD section in the PR template.

**Takeaway:** `--no-verify` is allowed only in exceptional cases and always
requires documentation and follow-up.

---

### Exercise 5: Handling Hook Failures

**Objective:** Learn to troubleshoot common hook failures.

1. **Lint errors:**

```bash
# Auto-fix many issues
npm run lint:fix
```

2. **Type errors:**

```bash
npm run type-check
```

3. **Test failures** (if configured in hooks or discovered locally):

```bash
npm test

# Run a specific test
npm test -- path/to/test.spec.ts
```

4. **Commit message issues:**

```bash
# Review standards
cat docs/git-hygiene-standards.md

# Ensure template is configured
git config commit.template .gitmessage
```

**Takeaway:** Hook error messages point you to the right fix; use the project
scripts instead of fighting the hooks.

---

## Common Scenarios

### Scenario 1: Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/JIRA-123-add-auth

# 2. Make changes and commit regularly
git add src/auth/
git commit -m "feat(auth): add OAuth2 base class"

# 3. Push to remote
git push origin feature/JIRA-123-add-auth
```

Hooks will run on each commit to keep changes clean and consistent.

---

### Scenario 2: Bug Fix

```bash
# 1. Create fix branch
git checkout -b fix/JIRA-456-memory-leak

# 2. Fix and commit
git add src/workers/
git commit -m "fix(workers): resolve memory leak in queue processor

The worker was not properly releasing message references after
processing, causing memory usage to grow unbounded.

Fixes #456"

# 3. Push for review
git push origin fix/JIRA-456-memory-leak
```

---

### Scenario 3: Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/hotfix-critical-error

# 2. Make minimal fix
git add .
git commit --no-verify -m "fix(core): emergency patch for production crash

EMERGENCY: API returning 500 errors for all requests.
Bypassing hooks for immediate deployment.
Full fix and tests to follow in JIRA-789.

Refs INC-123"

# 3. Fast-track deployment and PR
git push origin fix/hotfix-critical-error
```

Follow the Reduced DoD process in the PR and document all skipped items.

---

## Best Practices

### DO ✅

- Run tests locally before committing (at least unit tests).
- Use `npm run lint:fix` to auto-fix many lint issues.
- Write meaningful, template-based commit messages.
- Keep commits focused and atomic.
- Use fixup commits during review and squash before merge.
- Let hooks run; treat failures as helpful feedback.

### DON'T ❌

- Bypass hooks without a valid, documented reason.
- Commit broken code with the intent to "fix later".
- Mix unrelated changes in one commit.
- Ignore hook error messages.
- Disable hooks locally.
- Commit large binary files or secrets.

---

## Quick Reference

### Hook Commands

```bash
# Install/reinstall hooks
npx husky install

# Run checks manually
npm run lint         # Lint
npm run type-check   # Type check
npm test             # Tests

# Fix issues
npm run lint:fix     # Auto-fix lint issues

# Emergency bypass
git commit --no-verify -m "fix(core): emergency"
```

### Valid Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no semantic change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Maintenance / config
- `revert`: Revert commit
- `wip`: Work in progress (feature branches only; must not appear in final squash commit)

### Commit Format

```
type(scope): subject (max 72 chars)

body (explain what and why, wrap at 72)

footer (issues, breaking changes, co-authors)
```

---

## Troubleshooting

### Problem: Hooks not running

```bash
# Reinstall Husky hooks
npx husky install

# Verify hooks path
git config core.hooksPath
# Should output .husky
```

### Problem: Pre-commit feels slow

- Only stage the files you intend to commit.
- Run tests proactively before committing.
- Split very large changes into smaller commits/PRs.

### Problem: "I can't commit anything"

1. Read the hook error message carefully.
2. Run `npm run lint:fix`.
3. Fix any remaining type errors with `npm run type-check`.
4. Ensure tests pass (`npm test`).
5. Use a valid commit message format.

If you are still blocked, ask a Senior Developer for help before using
`--no-verify`.

---

## Team Support

- **Hook issues:** QA Engineer or Senior Developer
- **Git problems:** Senior Developer
- **Process questions:** Scrum Master
- **Emergency situations:** Tech Lead / On-call Engineer

---

## Certification Checklist

Before considering yourself "trained" on hooks, you should be able to:

- [ ] Successfully commit with passing hooks.
- [ ] Fix a lint error using `npm run lint:fix`.
- [ ] Write a commit using the `.gitmessage` template.
- [ ] Explain the commit message format and valid types.
- [ ] Describe when and how to use `--no-verify`.
- [ ] Troubleshoot and resolve a typical hook failure.

---

## Additional Resources

- [Git Hygiene Standards](git-hygiene-standards.md)
- [Definition of Done](definition-of-done.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Hook Technical Details](.husky/README.md) (if present)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Feedback

If you encounter issues or have suggestions for improving the hooks:

1. Document the issue clearly (what you did, expected vs actual, logs).
2. Discuss with the team (standup, channel, or thread).
3. Create a story for hook improvements if needed.
4. Test hook changes thoroughly before rollout.

Hooks are here to help, not hinder. They catch issues early, save review time,
and reduce the risk of production problems.
