# Git Hygiene Standards

**Version:** 1.0.0
**Created:** 2025-11-23
**Status:** Active
**Owner:** Senior Developer

---

## Overview

This document establishes git hygiene standards for the llm-proxy project. These standards ensure clean version history, enable effective rollbacks, and support collaborative development. All team members must follow these practices.

**Key Principle:** Every commit should tell a story about what changed and why.

---

## Commit Message Standards

### Format

We follow the Conventional Commits specification with our specific extensions:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types (Required)

- `feat`: New feature or capability
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Formatting, whitespace, missing semicolons, etc. (no semantic code changes)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Updating build tasks, package manager configs, etc
- `revert`: Reverting a previous commit
- `wip`: Work in progress (allowed only on feature branches; must not appear in final squash commit message)

### Scope (Optional but Recommended)

Scope indicates what part of the codebase is affected:

- Package names: `(core)`, `(openai-plugin)`, `(common)`
- Feature areas: `(auth)`, `(providers)`, `(workers)`
- Cross-cutting: `(deps)`, `(config)`, `(build)`

### Subject Line Rules

1. **Length:** Max 72 characters (GitHub's limit for subject display)
2. **Tense:** Use imperative mood ("add" not "adds" or "added")
3. **Case:** Start with lowercase (unless referencing a class/component name)
4. **Punctuation:** No period at the end
5. **Content:** Complete the sentence "If applied, this commit will..."

### Body Guidelines

- **When to include:** For any non-trivial change
- **Content:** Explain WHAT and WHY, not HOW (the code shows how)
- **Format:** Wrap at 72 characters
- **Bullets:** Use `-` or `*` for lists
- **References:** Link to issues, stories, or discussions

### Footer Guidelines

- **Issue references:** `Fixes #123`, `Closes #456`, `Refs JIRA-789`
- **Breaking changes:** `BREAKING CHANGE: description`
- **Co-authors:** `Co-authored-by: Name <email>`
- **Sign-offs:** `Signed-off-by: Name <email>`

### Examples

#### Simple Fix

```
fix(workers): handle null provider config gracefully

Fixes #234
```

#### Feature with Context

```
feat(openai-plugin): add streaming response support

Implements SSE-based streaming for chat completions to reduce
time-to-first-token. Includes backpressure handling and
automatic fallback to non-streaming for unsupported models.

- Add StreamHandler class for SSE parsing
- Implement chunked response aggregation
- Add streaming option to provider config
- Include integration tests for streaming flow

Closes #567
```

#### Breaking Change

```
refactor(api)!: rename endpoint from /chat to /completions

BREAKING CHANGE: The /chat endpoint has been renamed to
/completions to align with OpenAI's API structure. Update
all client code to use the new endpoint.

Migration:
- Old: POST /api/chat
- New: POST /api/completions
```

---

## Branch Naming Standards

### Format

```
type/story-id-brief-description
```

### Examples

- `feature/JIRA-123-common-sdk-structure`
- `fix/hotfix-memory-leak`
- `chore/update-dependencies`
- `docs/improve-readme`

### Rules

1. Always include story ID if working on a story (e.g., JIRA-123, TASK-45)
2. Use kebab-case for descriptions
3. Keep under 50 characters total
4. Delete branches after merging

---

## Git Workflow

### 1. Feature Development Flow

```bash
# 1. Start from updated main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/story-id-description

# 3. Make changes and commit regularly
git add .
git commit -m "feat(scope): add initial implementation"

# 4. Keep branch updated (preferred: rebase)
git fetch origin
git rebase origin/main

# 5. Push to remote
git push origin feature/story-id-description

# 6. Create PR when ready
# PR will be squash-merged to main
```

### 2. Commit Practices

#### During Development

- **Commit frequently:** Small, logical units of work
- **WIP commits allowed:** Use `wip:` prefix in feature branches
- **Clean before PR:** Interactive rebase to organize history

#### Before PR

```bash
# Clean up commit history
git rebase -i origin/main

# Options:
# - squash: combine commits
# - reword: improve commit messages
# - drop: remove unnecessary commits
```

**Note:** Interactive rebase is for your feature branch before it's merged. Never rewrite history on main or other shared protected branches.

#### Final Merge

- **Squash and merge:** Default for feature branches
- **Preserve commits:** Only for special cases (multiple authors, complex history)
- **Final commit message:** Must follow standards exactly and must not use `wip` type

### 3. Emergency Hotfix Flow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/hotfix-critical-issue

# 2. Make minimal fix
git add .
git commit -m "fix(area): emergency fix for production issue

HOTFIX: Brief description of critical issue
Impact: Who/what was affected
Fix: What was changed

Fixes #INCIDENT-123"

# 3. Fast-track review and merge
# Can bypass some DoD requirements with documentation
```

---

## Rollback Procedures

> **Note:** When rollbacks affect production, ensure the associated story/incident follows the [Reduced DoD documentation requirements](definition-of-done.md#reduced-dod---emergency--special-cases) (reason, impact, follow-up tickets).

### 1. Reverting a Merge Commit

```bash
# Find the merge commit
git log --oneline --graph

# Revert the merge (creates new commit)
git revert -m 1 <merge-commit-sha>
git push origin main
```

### 2. Reverting Multiple Commits

```bash
# Revert a range (creates multiple revert commits)
git revert --no-commit HEAD~3..HEAD
git commit -m "revert: undo last 3 commits due to regression"
git push origin main
```

### 3. Emergency Reset (Requires Force Push)

⚠️ **DANGER:** Only with team coordination and approval

```bash
# Reset to known good state
git fetch origin
git reset --hard <good-commit-sha>

# Force push (requires admin permissions)
git push --force-with-lease origin main
```

### 4. Cherry-Pick Recovery

```bash
# Salvage good commits from bad branch
git checkout main
git cherry-pick <good-commit-1-sha>
git cherry-pick <good-commit-2-sha>
git push origin main
```

### 5. Rollback Decision Tree

```
Production Issue Detected
├── Is it in the last commit?
│   └── Yes: Use simple revert
│   └── No: Continue ↓
├── Is it in the last few commits?
│   └── Yes: Use range revert
│   └── No: Continue ↓
├── Is the history complex/tangled?
│   └── Yes: Cherry-pick good commits to new branch
│   └── No: Continue ↓
└── Complete reset needed?
    └── Yes: Emergency reset with team coordination
    └── No: Investigate further
```

---

## Commit Hooks

### Pre-commit Hook

Automatically installed via husky. By default it:

1. Lints staged files (and formats with Prettier)
2. Optionally runs fast tests/type checks (project-configurable)

> **Note:** Full builds, integration tests, and extended checks are enforced in CI.

### Commit Message Hook

Validates commit message format:

```bash
# .gitmessage will be used as template
# commitlint will validate the format
```

> **Note:** The `.gitmessage` template and commitlint configuration are aligned with the Conventional Commits rules and the DoD Appendix A commit format.

### Bypassing Hooks (Emergency Only)

```bash
# Use with caution and document why
git commit --no-verify -m "fix: emergency hotfix"
```

> **Important:** Bypasses must be justified in the commit body or linked incident.

---

## Best Practices

### DO ✅

- **Write meaningful commit messages** that explain the why
- **Keep commits atomic** - one logical change per commit
- **Test before committing** - ensure each commit is functional
- **Review your own diff** before pushing
- **Update branch frequently** to avoid conflicts
- **Use fixup commits** during review, then squash before merge:
  ```bash
  git commit --fixup <sha>
  git rebase -i --autosquash origin/main
  ```
- **Sign commits** if GPG is configured

### DON'T ❌

- **Don't commit commented-out code** - use version control to recover old code
- **Don't commit debugging artifacts** - console.logs, debugger statements
- **Don't commit large files** - use Git LFS or external storage
- **Don't rewrite public history** - never force push to main
- **Don't commit secrets** - use environment variables
- **Don't mix refactoring with features** - separate commits or PRs
- **Don't commit broken code** to main - feature branches can have WIP

---

## Tools and Configuration

### Install Global Commit Template

```bash
# Copy the template to your home directory
cp .gitmessage ~/.gitmessage

# Configure git to use it
git config --global commit.template ~/.gitmessage
```

### Install Commit Linting

```bash
# Project already includes these, just install
npm install

# Tools included:
# - husky: Git hooks management
# - commitlint: Commit message validation
# - lint-staged: Run linting on staged files
```

### Configure Git Aliases

```bash
# Useful aliases for common operations
git config --global alias.cm 'commit -m'
git config --global alias.ca 'commit --amend'
git config --global alias.st 'status -sb'
git config --global alias.ll 'log --oneline --graph -10'
git config --global alias.undo 'reset HEAD~1'
git config --global alias.cleanup 'rebase -i origin/main'
```

---

## Training Checklist

Before marking this story complete, each team member must demonstrate:

- [ ] Write a properly formatted commit message
- [ ] Perform an interactive rebase to clean history
- [ ] Execute a rollback using revert
- [ ] Create and push a feature branch
- [ ] Use the .gitmessage template
- [ ] Bypass hooks with documentation (emergency scenario)

---

## Quick Reference Card

### Commit Types

```
feat     - New feature
fix      - Bug fix
docs     - Documentation
style    - Formatting
refactor - Code restructuring
perf     - Performance
test     - Testing
chore    - Maintenance
revert   - Revert commit
```

### Common Commands

```bash
# Start feature
git checkout -b feature/story-id-desc

# Commit with message
git commit -m "type(scope): subject"

# Update branch
git rebase origin/main

# Clean history
git rebase -i origin/main

# Rollback last commit
git revert HEAD

# Emergency escape
git reset --hard origin/main
```

### Message Template

```
type(scope): imperative subject line

Explain what and why, not how. Include:
- Motivation for change
- Contrast with previous behavior
- Side effects or consequences

Fixes #issue
```

---

## Metrics and Compliance

We track:

- Percentage of commits following standards
- Periodic sampling of commit messages for quality (clarity and adherence to format)
- Rollback success rate
- Time to recover from bad commits

Target: 95% compliance after 2-week adoption period

---

## Document History

### v1.0.0 (2025-11-23)

- Initial git hygiene standards
- Aligned with DoD v1.1 requirements
- Comprehensive rollback procedures
- Training requirements defined
