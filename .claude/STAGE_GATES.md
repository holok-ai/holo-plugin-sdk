# Stage Gate Workflow Protocol

**Interactive development with explicit approval checkpoints**

## Philosophy

Rather than implementing features end-to-end from a single prompt, the platform uses **stage gates** where work pauses for user input, clarification, or approval. This ensures:

- Requirements are fully understood before coding
- Architecture decisions align with project goals
- Implementation approach is validated before significant work
- User maintains control over technical decisions
- Ambiguities are resolved early, not late

## Git Branch Strategy

**IMPORTANT**: Before entering the stage gate workflow, create a feature branch:

```bash
git checkout -b feature/short-descriptive-name
# or
git checkout -b bugfix/issue-number-description
# or
git checkout -b refactor/what-is-being-refactored
```

**Branch naming conventions**:
- `feature/` - New functionality
- `bugfix/` or `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation only
- `chore/` - Maintenance tasks

All stage gate commits will be made to this feature branch. At the end of the workflow (after Gate 7), you can create a pull request to merge back to main/master.

## Stage Gate Overview

```
Create feature branch
    ↓
User Request
    ↓
[GATE 1: Requirements Clarification]
    ↓ (User approves understanding)
    ↓ git commit "requirements"
[GATE 2: Architecture Design Review]
    ↓ (User approves approach)
    ↓ git commit "architecture"
[GATE 3: Implementation Plan Approval]
    ↓ (User approves plan)
    ↓ git commit "plan"
[GATE 4: Implementation] (Auto: code + tests)
    ↓ git commit "implementation"
[GATE 5: Critic Review]
    ↓ (Automated, may loop)
    ↓ git commit "post-review"
[GATE 6: Documentation Review]
    ↓ (User approves or standards-updater runs)
    ↓ git commit "documentation"
Task Complete
```

---

## Gate 1: Requirements Clarification

**Purpose**: Ensure complete understanding of what needs to be built

**Trigger**: User provides feature request

**Process**:

1. **Create feature branch** (if not already on one):
   ```bash
   git checkout -b feature/[descriptive-name]
   ```

2. **Parse user request** and extract:
   - Core feature description
   - Identified ambiguities
   - Missing information
   - Assumptions being made

3. **Ask clarifying questions** in categories:

   **Functional Requirements**:
   - What is the expected input/output?
   - What edge cases should be handled?
   - What should happen on errors?
   - Are there performance requirements?

   **Non-Functional Requirements**:
   - Security considerations?
   - Scalability needs?
   - Backwards compatibility constraints?
   - Data retention/privacy requirements?

   **Scope Boundaries**:
   - What is explicitly OUT of scope?
   - Dependencies on other features?
   - MVP vs. future enhancements?

4. **Present structured clarification request**:

   ```
   📋 Requirements Clarification Needed

   I understand you want: [SUMMARY]

   Before proceeding, I need clarification on:

   **Functional Questions:**
   1. What should happen if [edge case]?
      - Option A: [approach]
      - Option B: [approach]
      - Your preference?

   2. Should this feature support [scenario]?
      - Yes: [implications]
      - No: [simplified scope]

   **Security Questions:**
   3. Who should have access to this feature?
      - All users
      - Admin only
      - Custom role: [specify]

   **Technical Questions:**
   4. Should this integrate with existing [component]?
      - Yes: [integration approach]
      - No: [standalone approach]

   **Assumptions I'm making:**
   - [Assumption 1]
   - [Assumption 2]
   - Correct?

   Please answer, or say "proceed with assumptions" if they're correct.
   ```

5. **Wait for user response** - DO NOT proceed to Gate 2 without answers

6. **Create git commit after approval**:
   ```bash
   git add .
   git commit -m "Gate 1: Requirements clarification

   [Summary of agreed requirements]

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- All questions answered OR user explicitly approves assumptions
- **Git commit created** documenting agreed requirements

**Example**:

```
User: "Add password reset functionality"

Claude (Gate 1):
📋 Requirements Clarification Needed

I understand you want to implement password reset for users who forgot their password.

Before proceeding, I need clarification on:

**Functional Questions:**
1. How should users initiate password reset?
   - Option A: Email link with token
   - Option B: SMS code
   - Option C: Security questions
   - Your preference?

2. How long should reset tokens be valid?
   - 15 minutes (high security)
   - 1 hour (balanced)
   - 24 hours (convenient)

3. Should we prevent reuse of old passwords?
   - Yes: Check last N passwords (specify N)
   - No: Allow any new password

**Security Questions:**
4. Should reset invalidate existing sessions?
   - Yes: Force re-login everywhere (more secure)
   - No: Only on device where reset occurred

5. Rate limiting for reset requests?
   - Standard: 3 attempts per hour per email
   - Custom: [specify]

**Assumptions I'm making:**
- Using email-based reset (not SMS)
- Tokens are single-use
- Send plain text email (not HTML)
- Store tokens hashed in database

Please answer, or say "proceed with assumptions" if correct.

[WAIT FOR USER INPUT]
```

---

## Gate 2: Architecture Design Review

**Purpose**: Validate technical approach aligns with project architecture

**Trigger**: Gate 1 approved (requirements clear)

**Process**:

1. **Load project context**:
   - Read ARCHITECTURE.md for patterns
   - Read STANDARDS.md for conventions
   - Search codebase for similar features

2. **Design solution** following project patterns:
   - Identify affected layers (API, Service, Repository, etc.)
   - Choose design patterns (Factory, Repository, etc.)
   - Identify new files to create vs. existing files to modify
   - Plan database schema changes (if any)

3. **Present architecture design for approval**:

   ```
   🏗️  Architecture Design Review

   **Proposed Approach:**

   Following the [Repository Pattern] documented in ARCHITECTURE.md:

   **New Components:**
   - `src/services/password-reset-service.ts` - Business logic
   - `src/repositories/reset-token-repository.ts` - Data access
   - `src/api/password-reset-routes.ts` - API endpoints
   - `src/utils/email-sender.ts` - Email utility (reusable)

   **Database Changes:**
   - New table: `reset_tokens` (token_hash, user_id, expires_at, used)
   - Index on: user_id, expires_at

   **Modified Components:**
   - `src/api/index.ts` - Register new routes
   - `src/services/user-service.ts` - Add updatePassword method

   **Integration Points:**
   - EmailService: Use existing or create new?
     - I see you have `src/services/notification-service.ts`
     - Should I extend that or create separate EmailService?

   **Data Flow:**
   1. POST /api/auth/reset-request → PasswordResetService.initiateReset()
   2. Generate secure token → ResetTokenRepository.create()
   3. Send email with token link → EmailSender.send()
   4. User clicks link → GET /api/auth/reset/:token (validate)
   5. User submits new password → POST /api/auth/reset/:token
   6. Validate token → ResetTokenRepository.findValid(token)
   7. Update password → UserService.updatePassword()
   8. Invalidate token → ResetTokenRepository.markUsed(token)

   **Security Measures:**
   - Tokens hashed with SHA-256 before storage
   - 1-hour expiration
   - Rate limiting: 3 requests/hour per email
   - Single-use tokens (marked as used)
   - Constant-time token comparison (prevent timing attacks)

   **Alternative Approaches Considered:**
   A. Use JWT tokens instead of database tokens
      - Pros: Stateless
      - Cons: Can't revoke, harder to audit
      - Rejected because: SECURITY.md requires revocable tokens

   B. Store tokens in Redis with TTL
      - Pros: Automatic expiration
      - Cons: Lose audit trail, Redis dependency
      - Could use this if you prefer?

   Does this architecture align with your project? Any changes needed?

   [WAIT FOR USER INPUT]
   ```

4. **Address feedback** if user requests changes

5. **Wait for explicit approval** before Gate 3

6. **Create git commit after approval**:
   ```bash
   git add .
   git commit -m "Gate 2: Architecture design

   [Summary of approved architecture]

   Components: [list]
   Patterns: [list]
   Integration points: [list]

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- User approves architecture OR requests modifications (loop back)
- **Git commit created** documenting approved design

---

## Gate 3: Implementation Plan Approval

**Purpose**: Validate specific implementation steps before coding

**Trigger**: Gate 2 approved (architecture validated)

**Process**:

1. **Break down into implementation tasks**:
   - Database migrations
   - Repository layer
   - Service layer
   - API layer
   - Tests (unit + integration)
   - Documentation

2. **Present detailed plan with effort estimates**:

   ```
   📝 Implementation Plan

   I'll implement this in the following order:

   **Phase 1: Data Layer (10 min)**
   1. Create migration: `migrations/001_create_reset_tokens_table.sql`
      - Table schema with indexes
   2. Create `src/repositories/reset-token-repository.ts`
      - create(userId, tokenHash, expiresAt)
      - findValidToken(tokenHash)
      - markAsUsed(tokenHash)
      - cleanupExpired() [for maintenance]
   3. Write tests: `reset-token-repository.test.ts`

   **Phase 2: Business Logic (15 min)**
   4. Create `src/services/password-reset-service.ts`
      - initiateReset(email) → sends email with token
      - validateToken(token) → checks if valid
      - resetPassword(token, newPassword) → updates password
   5. Extend `src/services/user-service.ts`
      - updatePassword(userId, newPasswordHash)
   6. Create `src/utils/email-sender.ts` (if not using existing)
      - sendPasswordResetEmail(to, token)
   7. Write tests: `password-reset-service.test.ts`

   **Phase 3: API Layer (10 min)**
   8. Create `src/api/password-reset-routes.ts`
      - POST /api/auth/reset-request → initiateReset
      - GET  /api/auth/reset/:token → validateToken (for UI)
      - POST /api/auth/reset/:token → resetPassword
   9. Add rate limiting middleware to reset-request
   10. Update `src/api/index.ts` to register routes
   11. Write tests: `password-reset-routes.test.ts`

   **Phase 4: Integration Tests (5 min)**
   12. Write end-to-end flow test:
       - Request reset → receive email → use token → password changed

   **Total Estimated Time: ~40 minutes**

   **Testing Strategy:**
   - Unit tests: All service methods, repository methods
   - Integration tests: Full reset flow
   - Edge cases: Expired tokens, invalid tokens, reused tokens
   - Security tests: Rate limiting, timing attacks

   **What I'll skip (let me know if you want these):**
   - Email template (using plain text)
   - Admin API to view reset attempts
   - Audit logging (can add if needed)

   Approve this plan? Any additions/changes?

   [WAIT FOR USER INPUT]
   ```

3. **Adjust plan** based on user feedback

4. **Wait for explicit "go ahead"** before starting implementation

5. **Create git commit after approval**:
   ```bash
   git add .
   git commit -m "Gate 3: Implementation plan

   [Summary of approved plan]

   Tasks: [list]
   Order: [sequence]
   Testing strategy: [description]

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- User approves plan OR requests changes (loop back)
- **Git commit created** documenting approved implementation plan

---

## Gate 4: Implementation (Automated)

**Purpose**: Execute approved plan with automated quality gates

**Trigger**: Gate 3 approved (plan locked in)

**Process**:

1. **Execute plan step-by-step**:
   - Implement each task in order
   - Show progress: "✅ Created migration file" / "⚙️  Writing PasswordResetService..."

2. **PostToolUse hooks run automatically**:
   - Prettier formats code
   - ESLint checks for errors
   - TypeScript validates types
   - Fix any issues immediately

3. **Run tests after each major component**:
   - Repository → run repository tests
   - Service → run service tests
   - API → run API tests

4. **No user intervention needed** unless hooks fail

5. **Create git commit after implementation**:
   ```bash
   git add .
   git commit -m "Gate 4: Implementation complete

   [Summary of implemented components]

   Files created: [count]
   Files modified: [count]
   Tests added: [count]
   Coverage: [percentage]%

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- All code written, all tests pass, no linting/type errors
- **Git commit created** with complete implementation

---

## Gate 5: Critic Review (Automated with Optional Loop)

**Purpose**: Automated quality review with iteration if needed

**Trigger**: Gate 4 complete (implementation done)

**Process**:

1. **Invoke critic subagent automatically**:
   ```
   Use the critic subagent to review files: src/services/password-reset-service.ts, src/repositories/reset-token-repository.ts, src/api/password-reset-routes.ts
   ```

2. **Critic evaluates**:
   - Syntax, Semantics, Architecture, Security, Performance, Maintainability
   - Checks against STANDARDS.md, ARCHITECTURE.md, SECURITY.md

3. **Three possible outcomes**:

   **A. APPROVE (score ≥ 85, no critical issues)**:
   ```
   ✅ Critic Review: APPROVED (Score: 91/100)

   All quality gates passed. Code is production-ready.

   Proceeding to Gate 6...
   ```

   **B. REVISE (score 70-84, or medium issues)**:
   ```
   ⚠️  Critic Review: REVISE (Score: 78/100)

   Issues found:
   - MEDIUM: Function complexity in validateToken (12, max 10)
   - MEDIUM: Missing JSDoc on resetPassword method

   I'll fix these issues and re-review.

   [Fixes issues automatically]
   [Re-invokes critic]
   ```

   **C. REJECT (score < 70, or critical issues)**:
   ```
   ❌ Critic Review: REJECT (Score: 62/100)

   CRITICAL: SQL injection in resetPassword (line 45)
   HIGH: Timing attack vulnerability in token comparison (line 67)

   Should I:
   1. Fix these issues automatically
   2. Show me the issues first so I can decide
   3. Rollback and redesign approach

   [WAIT FOR USER INPUT]
   ```

4. **Iterate up to 3 times** (max iterations from settings)

5. **If blocked after 3 iterations**: Flag for manual review

6. **Create git commit after approval**:
   ```bash
   git add .
   git commit -m "Gate 5: Critic review approved

   Quality score: [score]/100

   Quality gates:
   - Syntax: [score]
   - Semantics: [score]
   - Architecture: [score]
   - Security: [score]
   - Performance: [score]
   - Maintainability: [score]

   Issues fixed: [count]

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- Critic approves (APPROVE status) OR user intervention required
- **Git commit created** documenting quality approval

---

## Gate 6: Documentation Review (Semi-Automated)

**Purpose**: Ensure documentation is updated and synchronized

**Trigger**: Gate 5 approved (code quality validated)

**Process**:

1. **Detect documentation drift** (already in critic output):
   ```
   📚 Documentation Check

   New patterns detected:
   - Single-use token pattern (not documented in SECURITY.md)
   - Email-based verification flow (not in ARCHITECTURE.md)

   Options:
   A. Auto-update docs with standards-updater
   B. Show proposed changes first
   C. Skip documentation updates

   Your choice?

   [WAIT FOR USER INPUT - or auto-proceed if configured]
   ```

2. **If user chooses A or auto-configured**:
   - Invoke standards-updater subagent
   - Apply approved updates
   - Show summary of changes

3. **Optionally invoke documenter** for comprehensive docs:
   ```
   📖 Documentation

   Should I add comprehensive documentation?
   - JSDoc/TSDoc for all public methods (auto)
   - README.md updates with usage examples
   - API documentation

   [WAIT FOR USER INPUT - or auto-proceed if configured]
   ```

4. **Create git commit after documentation**:
   ```bash
   git add .
   git commit -m "Gate 6: Documentation updated

   [Summary of documentation changes]

   Updated files: [list]
   New patterns documented: [count]
   Standards synchronized: [yes/no]

   🔒 Stage gate checkpoint
   🤖 Generated with Claude Code"
   ```

**Exit Criteria**:
- Documentation updated OR user skips
- **Git commit created** documenting changes (even if skipped)

---

## Gate 7: Final Approval

**Purpose**: User confirms completion and satisfaction

**Trigger**: All previous gates passed

**Process**:

1. **Present completion summary**:
   ```
   ✅ Feature Complete: Password Reset

   **Implemented:**
   - ✅ Database schema (reset_tokens table)
   - ✅ Repository layer (ResetTokenRepository)
   - ✅ Business logic (PasswordResetService)
   - ✅ API endpoints (POST /reset-request, POST /reset/:token)
   - ✅ Rate limiting (3 requests/hour)
   - ✅ Security measures (hashed tokens, constant-time comparison)
   - ✅ Tests (18 tests, 95% coverage)
   - ✅ Documentation (SECURITY.md updated)

   **Quality Scores:**
   - Syntax: 100/100
   - Semantics: 94/100
   - Architecture: 90/100
   - Security: 96/100
   - Performance: 88/100
   - Maintainability: 92/100
   - Overall: 93/100 ✅

   **Files Changed:**
   - 6 files created
   - 2 files modified
   - 1 migration added

   **Next Steps:**
   - Run migrations: `npm run migrate`
   - Test locally: `curl -X POST http://localhost:3000/api/auth/reset-request`
   - Deploy when ready

   Feature ready for testing. Any issues or changes needed?

   [WAIT FOR USER INPUT or auto-complete after timeout]
   ```

2. **Allow user to request changes** or approve

**Exit Criteria**: User satisfied OR requests modifications (loop back to appropriate gate)

---

## Configuration

Control stage gate behavior in `.claude/settings.json`:

```json
{
  "workflow": {
    "stage_gates": {
      "enabled": true,
      "gates": {
        "requirements_clarification": {
          "enabled": true,
          "auto_proceed": false,
          "timeout_seconds": null
        },
        "architecture_review": {
          "enabled": true,
          "auto_proceed": false,
          "timeout_seconds": null
        },
        "implementation_plan": {
          "enabled": true,
          "auto_proceed": false,
          "timeout_seconds": null
        },
        "implementation": {
          "enabled": true,
          "auto_proceed": true
        },
        "critic_review": {
          "enabled": true,
          "auto_proceed": true,
          "max_iterations": 3
        },
        "documentation_review": {
          "enabled": true,
          "auto_proceed": false
        },
        "final_approval": {
          "enabled": true,
          "auto_proceed": false,
          "timeout_seconds": 300
        }
      }
    }
  }
}
```

**Options**:
- `enabled: false` - Skip this gate entirely
- `auto_proceed: true` - Don't wait for user input (automated)
- `timeout_seconds: N` - Auto-proceed after N seconds of no input

**Presets**:

**Strict Mode** (all gates enabled, all require approval):
```json
{ "auto_proceed": false }  // for all gates
```

**Fast Mode** (minimal gates, auto-proceed where safe):
```json
{
  "requirements_clarification": { "auto_proceed": true },
  "architecture_review": { "enabled": false },
  "implementation_plan": { "enabled": false }
}
```

**Balanced Mode** (default - clarify requirements, auto-implement):
```json
{
  "requirements_clarification": { "auto_proceed": false },
  "architecture_review": { "auto_proceed": false },
  "implementation_plan": { "auto_proceed": false },
  "implementation": { "auto_proceed": true },
  "critic_review": { "auto_proceed": true }
}
```

---

## Benefits

1. **No surprises** - User knows what will be built before it's built
2. **Early feedback** - Catch misalignments in design, not implementation
3. **Faster iterations** - Fix approach before coding, not after
4. **Learning opportunity** - User sees architectural decisions explained
5. **Reduced waste** - Don't code features that need redesign
6. **Clear expectations** - Both parties agree on plan before execution

## Anti-Patterns to Avoid

❌ **Asking too many questions** - If requirements are clear, proceed
❌ **Rubber-stamp gates** - If gate adds no value, disable it
❌ **Analysis paralysis** - Limit clarification rounds to 1-2
❌ **Ignoring user answers** - If user says "X", build X, not Y
❌ **Gate theater** - Don't ask for approval then ignore feedback

---

## Example: Full Flow

```
User: "Add real-time notifications"

═══════════════════════════════════════
GATE 1: Requirements Clarification
═══════════════════════════════════════

Claude: 📋 I understand you want real-time notifications.

Questions:
1. What events should trigger notifications?
2. Push notifications, in-app, email, or all?
3. Should users be able to customize notification preferences?
4. Real-time via WebSockets or polling?
5. Should notifications persist (store in DB)?

User: "Push + in-app, yes customization, use WebSockets, yes persist"

Claude: ✅ Requirements clear, proceeding to architecture design...

═══════════════════════════════════════
GATE 2: Architecture Design Review
═══════════════════════════════════════

Claude: 🏗️  Proposed architecture:
- WebSocket server (Socket.io)
- NotificationService (business logic)
- NotificationRepository (persistence)
- Redis pub/sub for horizontal scaling
- User preference table

Does this align with your stack?

User: "Yes but we use AWS, can you use SQS instead of Redis pub/sub?"

Claude: ✅ Updated design to use AWS SQS for horizontal scaling.

═══════════════════════════════════════
GATE 3: Implementation Plan Approval
═══════════════════════════════════════

Claude: 📝 Implementation plan:
1. Database: notifications table, user_notification_preferences
2. NotificationService with send/fetch/markRead
3. WebSocket integration with Socket.io
4. AWS SQS for multi-server support
5. API endpoints + tests
Estimated: 60 minutes

User: "Approved, go ahead"

═══════════════════════════════════════
GATE 4: Implementation (Automated)
═══════════════════════════════════════

Claude:
⚙️  Creating database migrations...
✅ Migration created
⚙️  Implementing NotificationService...
✅ Service complete (PostToolUse hooks passed)
⚙️  Setting up WebSocket server...
✅ WebSocket server complete
⚙️  Integrating AWS SQS...
✅ SQS integration complete
⚙️  Writing tests...
✅ 24 tests passing, 93% coverage

═══════════════════════════════════════
GATE 5: Critic Review (Automated)
═══════════════════════════════════════

Claude: Invoking critic...

Critic: Score 89/100 - APPROVED
All quality gates passed.

Documentation drift detected:
- WebSocket pattern not documented
- AWS SQS usage not documented

═══════════════════════════════════════
GATE 6: Documentation Review
═══════════════════════════════════════

Claude: 📚 Update docs with new patterns?

User: "Yes"

Claude: ✅ Updated ARCHITECTURE.md with WebSocket pattern
✅ Updated ARCHITECTURE.md with AWS SQS integration

═══════════════════════════════════════
GATE 7: Final Approval
═══════════════════════════════════════

Claude: ✅ Feature complete: Real-time Notifications
- 8 files created, 3 modified
- Quality score: 89/100
- Documentation updated

Ready for testing!

User: "Looks good!"
```

---

**Remember**: Stage gates are about **collaboration, not bureaucracy**. Use them to ensure alignment, not to slow down development. Adjust gate configuration based on team velocity and trust level.
