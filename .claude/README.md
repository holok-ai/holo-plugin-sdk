# Dynamo Code Quality Platform - AI Documentation

**Purpose:** Guide AI agents to generate production-ready code with automated quality gates and self-review.

---

## System Overview

This platform enforces code quality through automated hooks that run at specific lifecycle points during code generation. Each hook validates code against project standards before proceeding.

### Directory Structure Purpose

- `hooks-node/` - Cross-platform Node.js hooks (ESM format)
- `rubric-base.json` - Quality evaluation criteria baseline
- `settings.json` - Hook configuration and stage gates
- `tooling-registry.json` - Available quality tools by language
- `schemas/` - JSON schemas for validation
- `templates/` - Configuration file templates

---

## Integration Constraints

**When integrating into a new project:**

### Prerequisites Validation
- Verify Node.js 20+ available before any operations
- Check for jq command availability (JSON parsing in shell contexts)
- Detect project directory via CLAUDE_PROJECT_DIR environment variable
- Never assume tools are installed - always check first

### Configuration Strategy
- Preserve user's existing CLAUDE.md (do not overwrite)
- Use `.claude/WORKFLOW.md` for platform-specific instructions
- Detect existing quality tools before recommending new ones
- Respect user preferences for tool selection (opt-in, not forced)

### Tool Detection Order
1. Check project's node_modules/.bin/ first
2. Fall back to .claude/node_modules/.bin/ (platform tools)
3. Check global installation last
4. If none found, recommend but do not auto-install

### Error Handling Philosophy
- Fail fast on missing prerequisites
- Provide clear error messages with remediation steps
- Never silently skip quality checks
- Block task completion if quality gates fail

---

## Hook Decision Criteria

### When to Run Format Check (PostToolUse)
**Trigger:** After every Write or Edit tool use

**Execute when:**
- File extension matches configured formatter (ts/js → prettier, py → black)
- Tool exists in project or platform directories
- File size under max threshold (default 5MB)
- Not in exempted paths (node_modules, dist, build)

**Skip when:**
- File is binary or non-text
- No formatter configured for language
- File explicitly exempted in settings
- Previous format just ran (<100ms ago, debounce)

**On failure:**
- Block and show diff of what would change
- Require manual intervention or formatter installation
- Do not proceed to next tool use

### When to Run Reflection Trigger (Stop)
**Trigger:** When AI attempts to mark task as complete

**Execute when:**
- REVIEW_REQUIRE_APPROVAL=true (default)
- At least one file was written/edited during task
- Not already reviewed in this iteration
- Review iteration count < max (default 3)

**Skip when:**
- Task only involved reading/searching (no changes)
- Already approved in previous iteration
- Max iterations exceeded (allow with warning)
- REVIEW_REQUIRE_APPROVAL=false (user override)

**On failure:**
- Block task completion
- Invoke critic subagent with changed files
- Present structured feedback
- Require fixes before re-attempting completion

### When to Run Rubric Injection (TaskCreate)
**Trigger:** When new task card is created

**Execute when:**
- Task card passes schema validation
- Task ID is filesystem-safe (no path traversal)
- Global rubric base exists
- No existing rubric for this task ID

**Skip when:**
- Rubric already exists (use existing, don't regenerate)
- Task card invalid or missing required fields
- Task ID unsafe for file paths

**Generate rubric by:**
- Loading global rubric base
- Extracting task-specific criteria from task card
- Computing dimension weights (normalize to 1.0)
- Setting pass threshold based on task priority
- Validating final rubric against schema

---

## Quality Tool Selection

### Formatter Selection Logic
**When choosing a formatter:**

1. Detect language from file extension
2. Check project's configured formatter first (package.json scripts, config files)
3. Use platform default if no project preference
4. Validate tool exists before running
5. Use tool's own config file (don't override user settings)

**JavaScript/TypeScript:**
- Prefer project's prettier if exists
- Fall back to platform prettier
- Respect .prettierrc, .prettierignore
- Never modify user's prettier config

**Python:**
- Prefer project's black or ruff format
- Check pyproject.toml for configuration
- Respect line length settings from project

**Go:**
- Use gofmt (always available with Go)
- No configuration needed

**Java:**
- Prefer google-java-format if available
- Fall back to no formatting if not present

### Linter Selection Logic
**When choosing a linter:**

1. Detect language from file extension
2. Check for project's linter config files
3. Use project's linter if exists
4. Recommend installation if missing
5. Never auto-fix without user confirmation

**JavaScript/TypeScript:**
- Look for .eslintrc, eslint.config.js
- Use project's eslint with project's rules
- Do not modify user's ESLint configuration
- Report errors but don't auto-fix (preserve intent)

**Python:**
- Check for ruff, flake8, pylint in order
- Use pyproject.toml config if exists
- Respect ignore patterns from project

---

## Task Management Constraints

### Task ID Generation
**When generating task IDs:**
- Use timestamp-based format: `ts-YYYYMMDDHHMMSS-<hash>`
- Hash must be first 8 chars of SHA-256(timestamp + random)
- Total length must be ≤64 characters (Windows path limit)
- Only alphanumeric, dash, underscore allowed (no dots)
- Always validate with validateTaskId() before file operations

**Why this format:**
- Natural chronological ordering
- Negligible collision probability
- Filesystem-safe by construction
- No shared state required

### Task State Transitions
**Valid transitions:**
- pending → in_progress → done
- pending → blocked → in_progress
- in_progress → blocked → in_progress
- Any state → cancelled

**Invalid transitions:**
- done → any other state (immutable)
- cancelled → any other state (immutable)
- pending → done (must go through in_progress)

**On state change:**
- Validate transition is legal
- Write atomically (temp file + rename)
- Update modification timestamp
- Emit state change event

### Concurrent Modification Protection
**When modifying tasks:**
- Acquire lock file before write
- Lock filename: `.task-<task_id>.lock`
- Lock timeout: 200ms with 25ms retry interval
- Remove stale locks older than 2 seconds
- Clean up locks on process exit (SIGINT, SIGTERM)

**On lock failure:**
- Retry with exponential backoff
- Fail after timeout with clear error
- Never proceed without lock

---

## Rubric Evaluation Strategy

### Dimension Scoring
**When evaluating code quality:**

Each dimension scored 0-5:
- 5: Exceeds expectations, exemplary
- 4: Meets all requirements, production-ready
- 3: Acceptable with minor issues
- 2: Significant issues, needs revision
- 1: Major problems, does not meet standards
- 0: Complete failure or not addressed

**Correctness (weight 0.35):**
- All requirements implemented correctly
- Handles edge cases appropriately
- No logic errors or bugs
- Test coverage for critical paths

**Completeness (weight 0.25):**
- All task criteria satisfied
- No missing features or partial implementations
- Documentation complete
- Tests cover all scenarios

**Clarity (weight 0.15):**
- Code is readable and self-documenting
- Clear naming conventions
- Appropriate comments for non-obvious logic
- Consistent style throughout

**Quality (weight 0.15):**
- Follows project conventions
- Maintainable and extensible
- Proper error handling
- **Tested with FUNCTIONAL tests (no mocks)**

**Safety (weight 0.10):**
- No security vulnerabilities
- Input validation present
- Proper error handling
- No hardcoded secrets

### Pass/Fail Determination
**Task passes when:**
- Weighted score ≥ pass_threshold (default 4.0)
- All must-pass checks satisfied
- No critical issues present
- No mock tests detected

**Task fails when:**
- Weighted score < pass_threshold
- Any must-pass check fails
- Critical issue found (security, spec_mismatch, mock_tests_detected)
- Code contains mock-based tests

### Iteration Strategy
**On failed review:**
1. Present structured feedback with line numbers
2. Identify highest-impact issues first
3. Fix critical issues before minor ones
4. Re-run review after fixes
5. Maximum 3 iterations before manual intervention

**On max iterations:**
- Present summary of remaining issues
- Allow user to override and proceed
- Log warning about unresolved issues

---

## File System Operations

### Atomic Write Pattern
**When persisting data:**

1. Generate unique temp filename: `<target>.tmp.<random>`
2. Write full content to temp file
3. Flush to disk (fsync if available)
4. Rename temp to target (atomic operation)
5. Clean up temp file only after success

**Why this pattern:**
- Prevents partial writes on crash
- Prevents corruption from concurrent writes
- Maintains data integrity
- Standard POSIX pattern

**Error handling:**
- If write fails, temp file remains for inspection
- If rename fails, original file unchanged
- Always log error with path and reason

### Path Traversal Prevention
**When constructing file paths:**
- Validate all IDs before path construction
- Reject paths containing: `..`, `/`, `\`
- Use allowlist validation: `/^[a-zA-Z0-9_-]+$/`
- Always use path.resolve() to normalize
- Verify resolved path is within expected directory

**Never:**
- Concatenate user input directly into paths
- Trust task IDs without validation
- Use eval() or similar with paths

---

## Security Constraints

### Input Validation
**Always validate before processing:**
- Task IDs: Alphanumeric, dash, underscore only
- File paths: No traversal sequences, within project
- Tool names: Alphanumeric, dash, underscore only
- JSON payloads: Schema validation before parsing
- Environment variables: Sanitize before use

### PowerShell Script Execution
**When running PowerShell on Windows:**
- Escape all paths with single quotes
- Use `-NoProfile -ExecutionPolicy Bypass` flags
- Validate script paths before execution
- Never construct commands with string interpolation
- Use spawn with args array, not shell string

### Lock File Security
**When managing locks:**
- Set restrictive permissions (0600) on lock files
- Clean up locks on exit (SIGINT, SIGTERM, exit)
- Log failures to clean up locks (except ENOENT)
- Remove stale locks older than 10× timeout
- Never ignore lock cleanup errors silently

---

## Performance Considerations

### File Size Limits
**Default thresholds:**
- Format check: 5MB per file
- Lint check: 10MB per file
- Review JSON: 200KB per evaluation
- Task list: 1000 active tasks

**When exceeded:**
- Skip operation with warning
- Log size and threshold
- Do not block workflow
- Suggest breaking into smaller files

### Debouncing Strategy
**When to debounce:**
- Format checks: 100ms minimum between same-file checks
- Lock retries: 25ms between attempts
- Tool detection: Cache results for session

**Cache invalidation:**
- Clear tool cache on directory change
- Clear on explicit configuration reload
- TTL of 5 minutes for tool locations

---

## Error Message Guidelines

**When reporting errors:**
- State what failed clearly
- Explain why it failed
- Provide actionable remediation steps
- Include relevant context (file path, line number)
- Never expose sensitive data in errors

---

## Testing Requirements

**When writing tests:**
- Must verify actual behavior with real inputs/outputs
- Must use real filesystem, real I/O, real dependencies
- Must verify security properties (path traversal, injection)
- Must test edge cases with actual data
- **Never use mocks** - they test nothing

---

## Configuration Priority

**Settings resolution order:**
1. Environment variables (highest priority)
2. Project .claude/settings.json
3. Platform defaults (lowest priority)

**Common environment overrides:**
- `CLAUDE_PROJECT_DIR` - Project root directory
- `REVIEW_REQUIRE_APPROVAL` - Enable/disable mandatory review
- `REVIEW_MAX_ITERATIONS` - Max review cycles (1-10)
- `REVIEW_MIN_SCORE` - Minimum passing score (0-100)
- `LOG_LEVEL` - Verbosity (ERROR, WARN, INFO, DEBUG)

---

## Summary

This platform automates code quality through:
1. **Tool detection** - Finds and uses existing quality tools
2. **Automated checks** - Format, lint, type-check on every edit
3. **Mandatory review** - Critic evaluates before completion
4. **Atomic operations** - All writes are crash-safe
5. **Security by default** - Input validation, path safety
6. **Functional testing** - Real behavior, no mocks

**Key principles:**
- Fail fast with clear errors
- Respect user configuration
- Never silently skip checks
- Validate all inputs
- Test actual behavior
