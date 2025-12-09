# Git Hooks Training Guide

**Version:** 1.0.0
**Created:** 2025-11-24
**Audience:** All Development Team Members

---

## Overview

This guide provides hands-on training for our automated git hooks system. These hooks help maintain code quality by catching issues before they reach code review.

---

## Prerequisites

1. Complete git setup on your machine
2. Node.js ≥ 18.0.0 installed
3. Familiarity with our [Git Hygiene Standards](git-hygiene-standards.md)
4. Understanding of our [Definition of Done](definition-of-done.md)

---

## Initial Setup

### 1. Install Dependencies

After cloning the repository, hooks are automatically installed:

```bash
npm install
# Hooks are installed via the prepare script
```

### 2. Verify Installation

Check that hooks are properly installed:

```bash
ls -la .husky/
# Should show pre-commit and commit-msg files
```

### 3. Configure Commit Template (Recommended)

```bash
git config commit.template .gitmessage
```

---

## Training Exercises

### Exercise 1: Understanding Pre-commit Checks

**Objective:** Learn what the pre-commit hook validates

1. Create a test file with TypeScript errors:

```typescript
// test.ts
const num: number = 'string'; // Type error
const unused = 42; // Lint warning
```

2. Try to commit:

```bash
git add test.ts
git commit -m "test: intentional errors"
```

3. Observe the error messages and fix suggestions

4. Fix the issues:

```typescript
const num: number = 42;
console.log(num);
```

5. Commit successfully

**Takeaway:** Pre-commit hooks catch type errors, lint issues, and test failures early.

### Exercise 2: Commit Message Validation

**Objective:** Learn the commit message format

1. Try invalid commit messages:

```bash
# Missing type
git commit -m "added new feature"

# Invalid type
git commit -m "update: fixed bug"

# Too long subject
git commit -m "feat: this is a very long commit message that exceeds the 72 character limit for the subject line"
```

2. Use valid formats:

```bash
# Valid examples
git commit -m "feat(common): add plugin discovery service"
git commit -m "fix: resolve memory leak in worker"
git commit -m "docs: update README with setup steps"
```

**Takeaway:** Commit messages must follow Conventional Commits format.

### Exercise 3: Using the Commit Template

**Objective:** Learn to write detailed commit messages

1. Configure the template:

```bash
git config commit.template .gitmessage
```

2. Stage changes and commit without -m:

```bash
git add .
git commit
# Editor opens with template
```

3. Fill out the template:

```
feat(auth): add OAuth2 provider support

Implements GitHub and Google OAuth providers with automatic
token refresh. Includes rate limiting and error recovery.

- Add OAuth2Provider base class
- Implement GitHub and Google providers
- Add token refresh middleware
- Include integration tests

Closes #123
```

**Takeaway:** The template guides you to write comprehensive commit messages.

### Exercise 4: Emergency Override

**Objective:** Learn when and how to bypass hooks

1. Understand when override is acceptable:
   - Production incident requiring immediate fix
   - CI/CD pipeline issues blocking deployment
   - Critical security patch

2. Use the bypass flag:

```bash
git commit --no-verify -m "fix(core): emergency patch for production

EMERGENCY: Servers experiencing OOM crashes.
Bypassing checks due to incident INC-2345.
Follow-up cleanup in JIRA-678.

Refs INC-2345"
```

3. Note the requirements:
   - Must document reason
   - Must reference incident
   - Must create follow-up task

**Takeaway:** Bypassing is available but requires justification and follow-up.

### Exercise 5: Handling Hook Failures

**Objective:** Learn to troubleshoot common issues

1. **Lint errors:**

```bash
# Auto-fix many issues
npm run lint:fix
```

2. **Type errors:**

```bash
# Check types without emitting
npm run type-check
```

3. **Test failures:**

```bash
# Run tests locally
npm test

# Run specific test
npm test -- path/to/test.spec.ts
```

4. **Commit message issues:**

```bash
# View the standards
cat docs/git-hygiene-standards.md

# Use the template
git config commit.template .gitmessage
```

**Takeaway:** Each error provides guidance on how to fix it.

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

### Scenario 2: Bug Fix

```bash
# 1. Create fix branch
git checkout -b fix/JIRA-456-memory-leak

# 2. Fix and commit
git add src/workers/
git commit -m "fix(workers): resolve memory leak in queue processor

The worker was not properly releasing message references after
processing, causing memory to grow unbounded.

Fixes #456"

# 3. Push for review
git push origin fix/JIRA-456-memory-leak
```

### Scenario 3: Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/hotfix-critical-error

# 2. Make minimal fix
git add .
git commit --no-verify -m "fix: emergency patch for production crash

EMERGENCY: API returning 500 errors for all requests.
Bypassing hooks for immediate deployment.
Full fix and tests to follow in JIRA-789.

Refs INC-123"

# 3. Fast-track deployment
git push origin fix/hotfix-critical-error
```

---

## Best Practices

### DO ✅

- Run tests locally before committing
- Use `npm run lint:fix` to auto-fix issues
- Write meaningful commit messages
- Use the commit template for complex changes
- Keep commits focused and atomic
- Test hooks regularly with small commits

### DON'T ❌

- Bypass hooks without valid reason
- Commit broken code "to fix later"
- Mix multiple changes in one commit
- Ignore hook error messages
- Disable hooks locally
- Commit large binary files

---

## Quick Reference

### Hook Commands

```bash
# Install/reinstall hooks
npx husky install

# Run checks manually
npm run lint        # Check linting
npm run type-check  # Check types
npm test            # Run tests

# Fix issues
npm run lint:fix    # Auto-fix lint issues

# Emergency bypass
git commit --no-verify -m "fix: emergency"
```

### Valid Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Maintenance
- `revert`: Revert commit
- `wip`: Work in progress (feature branches only)

### Commit Format

```
type(scope): subject (max 72 chars)

body (explain what and why, wrap at 72)

footer (issues, breaking changes)
```

---

## Troubleshooting

### Problem: Hooks not running

```bash
# Reinstall
npx husky install

# Check git config
git config core.hooksPath
# Should show .husky
```

### Problem: Slow pre-commit

- Only stage necessary files
- Run tests before committing
- Consider splitting large changes

### Problem: Can't commit anything

1. Check error messages carefully
2. Run `npm run lint:fix`
3. Fix type errors shown
4. Ensure tests pass
5. Use valid commit message format

---

## Team Support

- **Hook Issues:** QA Engineer or Senior Developer
- **Git Problems:** Senior Developer
- **Process Questions:** Scrum Master
- **Emergency Situations:** Tech Lead/On-call Engineer

---

## Certification Checklist

Before considering yourself trained:

- [ ] Successfully commit with passing hooks
- [ ] Fix a lint error using the auto-fix command
- [ ] Write a commit using the template
- [ ] Demonstrate understanding of commit message format
- [ ] Know when and how to use emergency bypass
- [ ] Can troubleshoot common hook failures

---

## Additional Resources

- [Git Hygiene Standards](git-hygiene-standards.md)
- [Definition of Done](definition-of-done.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Hook Technical Details](.husky/README.md)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Feedback

If you encounter issues or have suggestions for improving the hooks:

1. Document the issue clearly
2. Discuss with the team
3. Create a story for hook improvements
4. Test changes thoroughly before implementing

Remember: These hooks are here to help, not hinder. They catch issues early, saving time in review and preventing production problems.
