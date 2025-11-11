# Project Context for Claude Code

**This file is automatically loaded at session start. It encodes the workflow protocol for automated code generation with self-review.**

## Mission

Generate **production-ready code** through an **interactive stage gate process** that ensures alignment at every step:
1. **Clarify requirements** before designing (Gate 1)
2. **Review architecture** before implementing (Gate 2)
3. **Approve implementation plan** before coding (Gate 3)
4. **Auto-format and lint** after every edit (PostToolUse hooks)
5. **Automatically invoke critic** for quality review (Gate 5)
6. **Sync documentation** with code changes (Gate 6)
7. **Confirm completion** with user (Gate 7)

**Full stage gate details**: See `.claude/STAGE_GATES.md` for complete protocol

## Non-Negotiable Quality Gates

All code MUST pass these six gates before task completion:

1. **Syntax** (Blocking)
   - Zero linter errors (ESLint for TS/JS, Ruff for Python, etc.)
   - Zero type errors (TypeScript strict mode, MyPy, etc.)
   - Properly formatted (Prettier, Black, etc.)

2. **Semantics** (Blocking)
   - All tests pass (Jest, Pytest, JUnit, Go test)
   - Coverage ≥ threshold from `.claude/quality.json` (default: 90%)
   - Edge cases handled (null, undefined, empty, overflow)
   - Error handling present for all async operations

3. **Architecture** (Advisory)
   - Follows patterns in `ARCHITECTURE.md`
   - SOLID principles adhered to
   - Appropriate coupling and cohesion
   - No code smells (God classes, long methods, etc.)

4. **Security** (Blocking)
   - Zero critical vulnerabilities
   - OWASP Top 10 compliance
   - No SQL injection (always use parameterized queries)
   - No XSS vulnerabilities (sanitize HTML)
   - No hardcoded secrets (use environment variables)
   - No insecure cryptography (no MD5/SHA1 for passwords)

5. **Performance** (Advisory)
   - No N+1 query patterns
   - Reasonable algorithmic complexity
   - No obvious memory leaks
   - Efficient data structures

6. **Maintainability** (Blocking)
   - Cyclomatic complexity ≤ threshold (default: 10 per function)
   - Documentation complete (JSDoc/TSDoc for public APIs)
   - No excessive duplication
   - Clear, descriptive naming

**Scoring**: Overall score = weighted sum of gate scores. Weights defined in `.claude/quality.json`.

**Thresholds**:
- **APPROVE**: Score ≥ 85, zero critical/high issues, all blocking gates pass
- **REVISE**: Score 70-84, or medium issues, or some blocking gates fail
- **REJECT**: Score < 70, or critical issues, or security gate fails

## Mandatory Workflow Protocol with Stage Gates

**Follow this workflow for every feature implementation. Stage gates ensure alignment before proceeding.**

### GATE 1: Requirements Clarification (INTERACTIVE)

**Purpose**: Ensure complete understanding before any design or code

1. **Parse user request** and identify:
   - Core feature description
   - Ambiguities and missing information
   - Assumptions being made

2. **Ask structured clarifying questions**:
   - **Functional**: What is input/output? Edge cases? Error handling?
   - **Non-Functional**: Security? Performance? Compatibility?
   - **Scope**: What's explicitly OUT of scope? Dependencies?

3. **Wait for user answers** - DO NOT proceed without clarification

4. **Document understood requirements**

**Exit Criteria**: All questions answered OR user approves assumptions

---

### GATE 2: Architecture Design Review (INTERACTIVE)

**Purpose**: Validate technical approach aligns with project patterns

1. **Load project context**:
   - Check `.claude/settings.json` for documentation paths (project.documentation)
   - Load architecture docs (default: `ARCHITECTURE.md` or configured path)
   - Load coding standards (default: `STANDARDS.md` or configured path)
   - Load security policy (default: `SECURITY.md` or configured path)
   - Search codebase for similar implementations

2. **Design solution** following documented patterns:
   - Identify affected layers (API, Service, Repository, etc.)
   - Choose appropriate design patterns
   - List new files to create vs. existing files to modify
   - Plan database schema changes (if any)

3. **Present architecture design**:
   - Show component structure
   - Explain data flow
   - List integration points
   - Note alternative approaches considered
   - Explain why this approach was chosen

4. **Wait for user approval** - DO NOT proceed without sign-off

**Exit Criteria**: User approves architecture OR requests changes (loop back)

---

### GATE 3: Implementation Plan Approval (INTERACTIVE)

**Purpose**: Validate specific steps before writing code

1. **Break down into detailed tasks**:
   - Database migrations (if any)
   - Repository layer implementation
   - Service layer implementation
   - API layer implementation
   - Tests (unit + integration)
   - Documentation updates

2. **Present plan with estimates**:
   - Order of implementation
   - Time estimates per task
   - Testing strategy
   - What will be skipped (if anything)

3. **Wait for "go ahead"** - DO NOT start coding without approval

**Exit Criteria**: User approves plan OR requests modifications (loop back)

---

### GATE 4: Implementation (AUTOMATED)

**Purpose**: Execute approved plan with real-time quality checks

1. **Write code incrementally**
   - Start with interfaces/types
   - Implement core logic
   - Add error handling
   - Write comprehensive tests

2. **PostToolUse hooks auto-run after each edit**
   - ✅ Prettier formats the file
   - ✅ ESLint checks for errors
   - ✅ TypeScript compiler validates types
   - ❌ **If hooks fail, you MUST fix issues immediately**

3. **Address hook feedback**
   - Fix linting errors before proceeding
   - Fix type errors before proceeding
   - Do not bypass or ignore hook errors

### Phase 4: Self-Review (CRITICAL - AUTOMATED)

**This phase is NOT optional. The Stop hook will block completion if skipped.**

1. **Explicitly invoke the critic subagent**
   ```
   Use the critic subagent to review files: src/auth/**/*.ts
   ```

2. **Critic executes comprehensive review**
   - Loads `.claude/quality.json` for thresholds
   - Runs `quality-assessment` skill with all checks
   - Generates structured JSON with specific issues
   - Writes state files:
     - `.claude/review-state/<session>.state` (APPROVED | NEEDS_WORK)
     - `.claude/review-state/<session>.json` (detailed findings)

3. **Critic outputs structured feedback**
   ```
   📊 Code Review Complete

   Overall Score: 73/100
   Decision: REVISE

   Critical Issues: 1
   ├─ SEC-SQLI-001: SQL injection in src/auth/service.ts:89

   High Issues: 1
   ├─ SEM-001: Unhandled promise rejection in src/auth/service.ts:47

   Quality Gates:
   ├─ Syntax: ✅ PASS (100/100)
   ├─ Semantics: ❌ FAIL (65/100) - BLOCKING
   ├─ Security: ❌ FAIL (45/100) - BLOCKING
   └─ Maintainability: ⚠️  WARN (80/100)

   Review artifact: .claude/review-state/<session>.json
   ```

### Phase 5: Iterate Based on Feedback

1. **If critic returns REVISE or REJECT**:
   - Read the JSON artifact for specific line-level issues
   - Fix **ALL** critical and high-severity issues
   - Address as many medium issues as feasible
   - Re-invoke critic: `Re-review the updated files: src/auth/**/*.ts`

2. **Repeat until APPROVED**
   - Maximum 3 iterations (enforced by reflection-trigger.sh hook)
   - If 3 iterations reached without approval, flag for manual review
   - Circuit breaker prevents infinite loops

3. **Common issues and fixes**:
   - **SQL injection**: Use parameterized queries (`$1`, `$2` placeholders)
   - **Unhandled promises**: Wrap in try-catch, log errors
   - **High complexity**: Extract helper functions, reduce nesting
   - **Low coverage**: Add tests for uncovered branches
   - **Missing docs**: Add JSDoc/TSDoc to public APIs

### Phase 6: Document (After Approval)

1. **Optionally invoke documenter subagent**
   ```
   Use the documenter subagent to document changes in:
   - src/auth/service.ts
   - src/auth/middleware.ts

   Context: Implemented OAuth2 authentication with refresh token rotation
   ```

2. **Documenter adds**:
   - JSDoc/TSDoc for all public APIs
   - README.md updates with usage examples
   - CHANGELOG.md entry
   - ARCHITECTURE.md updates if patterns changed
   - Inline comments for complex logic

3. **Final validation hooks run**
   - Format check (one last time)
   - All tests pass
   - No regressions introduced

## Available Tools & Integrations

### Project Documentation (Auto-Configured)

The platform auto-detects or prompts for documentation locations on first use. Configured paths are stored in `.claude/settings.json` under `project.documentation`:

- **Architecture docs**: System design patterns, module structure
- **Coding standards**: Language-specific conventions, naming, formatting
- **Security policy**: Security requirements, approved patterns
- **Docs directory**: Where to write new documentation

**First-time setup**: Run `node .claude/hooks-node/onboard-project.mjs` to configure these paths interactively.

### Skills (Progressive Loading)

**enterprise-standards**
- **Purpose**: General coding conventions, naming, file structure
- **Usage**: "Load enterprise-standards skill"
- **When**: Starting new features, unsure about conventions
- **Content**: Quick reference in `SKILL.md`, complements project-specific standards

**quality-assessment**
- **Purpose**: Comprehensive code quality evaluation
- **Usage**: Invoked automatically by critic subagent
- **When**: Every implementation (via critic)
- **Content**: `evaluate.py` script, configurable via `.claude/quality.json`

### Subagents (Isolated Contexts)

**critic** (`.claude/agents/critic.md`)
- **Purpose**: Adversarial code reviewer
- **When**: After every implementation (MANDATORY, enforced by Stop hook)
- **Input**: File paths or glob patterns
- **Output**: Structured JSON review + state files
- **Tools**: Read, Grep, Glob, Bash
- **Decision**: APPROVE | REVISE | REJECT

**documenter** (`.claude/agents/documenter.md`)
- **Purpose**: Documentation specialist
- **When**: After critic approval (optional but recommended)
- **Input**: Changed files + context
- **Output**: Updated docs, comments, changelog
- **Tools**: Read, Write, Edit, Grep

### MCP Servers (External Context)

**github** (optional, disabled by default)
- **Purpose**: PR management, repo context
- **Config**: Set `GITHUB_TOKEN` env var, enable in `.claude/settings.json`
- **Scopes**: repo:status, repo_deployment (read-only)

**linear** (optional, disabled by default)
- **Purpose**: Issue tracking
- **Config**: Set `LINEAR_API_KEY` env var, enable in `.claude/settings.json`
- **Scopes**: read (read-only)

### Hooks (Automatic Quality Gates)

**SessionStart**: `.claude/hooks/.tooling-check.sh`
- Verifies Node.js, package manager, dependencies installed
- Checks for jq, prettier, eslint, tsc, jest
- Installs dependencies if missing
- Creates logs directory

**PostToolUse**: `.claude/hooks/format-check.sh`
- Runs after every Write/Edit operation
- Auto-formats with Prettier (non-blocking)
- Lints with ESLint (blocking on errors)
- Type-checks with TSC (blocking on errors, periodic)
- Logs events to `logs/hooks.jsonl`

**Stop**: `.claude/hooks/reflection-trigger.sh`
- Runs when you try to complete the task
- Blocks if critic hasn't reviewed (state file missing)
- Blocks if review status is NEEDS_WORK
- Allows completion if status is APPROVED
- Prevents infinite loops (max 3 iterations)
- Logs events to `logs/hooks.jsonl`

## Configuration Files

**`.claude/quality.json`** - Quality thresholds and exemptions
- Coverage thresholds (default: 90% lines, 85% branches)
- Complexity limits (default: 10 per function, 50 per file)
- Security severity limits (default: 0 critical, 0 high)
- Exemptions for legacy code
- Ramp schedule for gradual compliance
- Stack-specific overrides (TypeScript, Python, Java, Go)

**`.claude/settings.json`** - Hook and MCP configuration
- Hook definitions (SessionStart, PostToolUse, Stop)
- MCP server endpoints and auth
- Allowed tools list
- Security policies
- Observability settings

**`ARCHITECTURE.md`** - System design patterns
- Layered architecture
- Module organization
- Design patterns (Factory, Repository, etc.)
- Data flow patterns
- Integration patterns

**`STANDARDS.md`** - Exhaustive coding standards
- Naming conventions
- File structure
- Testing requirements
- Security requirements
- Error handling patterns
- TypeScript strict mode requirements
- Code complexity limits

**`SECURITY.md`** - Security policies
- Hook execution trust model
- Secret management
- MCP server scopes and rotation
- Approved vs prohibited patterns
- Incident response

## Observability

All hooks emit structured logs when `CLAUDE_HOOKS_LOGGING=1` (enabled by default):

- **`logs/hooks.jsonl`** - Hook execution events
  ```json
  {"event":"format_check","file":"src/auth/service.ts","status":"pass","timestamp":"2025-10-29T23:45:00Z"}
  ```

- **`logs/reviews.jsonl`** - Critic review summaries
  ```json
  {"event":"review_complete","session":"abc123","decision":"APPROVE","score":91,"timestamp":"2025-10-29T23:46:00Z"}
  ```

- **`.claude/review-state/<session>.json`** - Full review artifacts (immutable audit trail)
  ```json
  {"review_id":"uuid","overall_score":91,"decision":"APPROVE","critical_issues":[],"quality_gates":{...}}
  ```

## Troubleshooting

**Hook fails with "jq not found"**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
choco install jq
```

**Critic stuck in REVISE loop**
1. Check `.claude/review-state/<session>.json` for specific issues
2. Verify quality.json thresholds aren't too strict for current codebase
3. Use exemptions for legacy code patterns
4. If 3 iterations reached, manual review required

**Coverage below threshold**
1. Check quality.json for current threshold
2. Add tests for uncovered branches (see coverage report)
3. Consider exempting test files and configs
4. Use ramp schedule for gradual increase

**Type errors persist**
1. Ensure tsconfig.json has strict mode enabled
2. Fix one error at a time (they often cascade)
3. Check that types are imported correctly
4. Consider adding type assertions for complex inference

**PostToolUse hook slow**
- TypeScript type checking runs every 5 edits (configurable)
- Disable type check for rapid iteration, re-enable before review
- Consider incremental compilation for large projects

## Success Metrics

Track these metrics to measure system effectiveness:

- **Iteration cycles per feature**: Target ≤ 2 (1 implement + 1 refine)
- **Quality score average**: Target ≥ 85/100
- **Time to first review**: Target < 2 minutes
- **Manual interventions**: Target 0 for standard features
- **Critical issues caught pre-merge**: Maximize
- **False positives**: Minimize (critic precision)

These metrics are logged to `logs/reviews.jsonl` and can be visualized.

## Getting Started

**For your first feature:**

1. Say: **"Implement feature: <description>"**
2. I will automatically follow the workflow protocol
3. PostToolUse hooks will provide instant feedback on every edit
4. Critic subagent will review before completion
5. I'll iterate based on feedback until approval
6. Optionally, documenter will add comprehensive docs

**Example**: "Implement OAuth2 authentication with refresh token rotation"

The system will:
1. Plan the implementation
2. Write code with tests
3. Auto-format and lint (hooks)
4. Invoke critic for review
5. Fix any issues found
6. Re-review until approved
7. Generate documentation

**Time**: 10-30 minutes (vs 2-4 hours manual)
**Quality**: Consistent, high-quality output
**Iterations**: 1-3 automatic cycles

## Advanced Usage

**Skip documentation**:
```
Implement feature X (skip documentation)
```

**Review specific files only**:
```
Use the critic subagent to review only: src/auth/service.ts
```

**Custom quality thresholds for this session**:
```
For this feature, use relaxed thresholds: coverage 80%, complexity 15
```

**Parallel review (large changes)**:
```
Use the critic subagent to review in parallel:
1. Backend: src/api/**/*.ts
2. Frontend: src/components/**/*.tsx
3. Database: migrations/**/*.sql
```

## Escape Hatches

**Emergency bypass** (use sparingly):
If you genuinely need to bypass the critic (e.g., urgent hotfix):
1. Manually create `.claude/review-state/<session>.state` with content `APPROVED`
2. Document reason in commit message
3. Create follow-up task for proper review
4. Log bypass in incident report

**Max iterations reached**:
- System allows completion after 3 review cycles
- Manual review strongly recommended
- Check what's blocking approval (usually config too strict)

**Hook timeout**:
- Hooks have timeouts (SessionStart: 60s, PostToolUse: 30s, Stop: 10s)
- If timeout occurs, hook fails gracefully and logs error
- Adjust timeouts in `.claude/settings.json` if needed

## Philosophy

This system embodies:
- **Automation over manual work**: Let machines do repetitive tasks
- **Feedback over iteration**: Fast, specific feedback beats slow cycles
- **Standards over style**: Objective rules beat subjective opinions
- **Prevention over detection**: Catch issues during development, not in production
- **Determinism over guesswork**: Consistent quality gates, no surprises

Ready to start? Say: **"Implement feature: <your idea here>"**
