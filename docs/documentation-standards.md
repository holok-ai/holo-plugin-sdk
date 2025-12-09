# Documentation Standards

**Version:** 1.0.0
**Created:** 2025-11-24
**Status:** Active
**Owner:** Junior Developer

---

## Overview

This document establishes standards for maintaining up-to-date documentation throughout the development lifecycle. Documentation is not an afterthought—it's an integral part of our Definition of Done.

**Core Principle:** If it's not documented, it doesn't exist.

---

## Documentation Triggers

### MUST Document (Required)

The following changes **REQUIRE** documentation updates before PR approval:

#### 1. New Features

**Trigger:** Adding new functionality visible to users or developers
**Required Documentation:**

- Feature description in README
- Usage examples
- Configuration options (if any)
- API documentation (if exposed)

**Example:**

````markdown
## New Feature: Plugin Hot Reload

The system now supports hot reloading of provider plugins without server restart.

### Usage

```javascript
// Enable hot reload in config
{
  "plugins": {
    "hotReload": true,
    "watchInterval": 5000
  }
}
```
````

### Configuration

- `hotReload`: Enable/disable hot reload (default: false)
- `watchInterval`: Check interval in ms (default: 10000)

````

#### 2. API Changes
**Trigger:** Any modification to public APIs (REST, GraphQL, SDK)
**Required Documentation:**
- Endpoint changes
- Request/response format changes
- New parameters or fields
- Deprecations
- Breaking changes

**Example:**
```markdown
## API Changes

### POST /api/completions
**Added:** `stream` parameter for SSE streaming responses
**Type:** boolean
**Default:** false
**Since:** v2.1.0

Request:
```json
{
  "prompt": "Hello",
  "stream": true
}
````

Response (SSE stream):

```
data: {"chunk": "Hello", "done": false}
data: {"chunk": " there", "done": false}
data: {"chunk": "!", "done": true}
```

````

#### 3. Configuration Changes
**Trigger:** New, modified, or deprecated configuration options
**Required Documentation:**
- Config key and description
- Valid values/types
- Default values
- Examples
- Migration notes (if changing)

**Example:**
```markdown
## Configuration

### New: Rate Limiting
```yaml
rateLimit:
  enabled: true
  requests: 100
  window: 60000  # 1 minute in ms
````

- `enabled`: Enable rate limiting (boolean, default: false)
- `requests`: Max requests per window (number, default: 100)
- `window`: Time window in ms (number, default: 60000)

````

#### 4. Breaking Changes
**Trigger:** Any change that requires user action to maintain functionality
**Required Documentation:**
- What changed
- Why it changed
- Migration steps
- Timeline (if deprecation)

**Example:**
```markdown
## Breaking Change: Provider Config Structure

**Version:** 3.0.0
**Impact:** All provider configurations must be updated

### What Changed
Provider configs moved from flat structure to nested format.

### Migration
Before:
```json
{
  "openai_api_key": "sk-...",
  "openai_model": "gpt-4"
}
````

After:

```json
{
  "providers": {
    "openai": {
      "apiKey": "sk-...",
      "model": "gpt-4"
    }
  }
}
```

### Timeline

- v2.9.0: New format supported (backward compatible)
- v3.0.0: Old format deprecated with warnings
- v4.0.0: Old format removed

```

#### 5. Architecture Decisions
**Trigger:** Significant technical decisions affecting system design
**Required Documentation:**
- Architecture Decision Record (ADR)
- Context and problem
- Decision and rationale
- Alternatives considered
- Consequences

**Template:** See [ADR Template](templates/adr-template.md)

---

### SHOULD Document (Recommended)

The following changes **SHOULD** include documentation updates:

#### 1. Performance Improvements
- Benchmarks or metrics
- Configuration for optimization
- Trade-offs

#### 2. Bug Fixes (if user-visible)
- What was broken
- How to verify the fix
- Workarounds (if any)

#### 3. Development Setup Changes
- New dependencies
- Environment requirements
- Tool configurations

#### 4. Complex Business Logic
- Inline code comments
- Algorithm explanations
- Edge case handling

---

### MAY Document (Optional)

The following are helpful but not required:

#### 1. Internal Refactoring
- Developer notes for future work

#### 2. Test Improvements
- Test strategy changes
- Coverage improvements

#### 3. Minor UI/UX Updates
- Screenshot updates

---

## Documentation Locations

### Where to Document

```

Project Root/
├── README.md # Project overview, setup, basic usage
├── CONTRIBUTING.md # Development setup, processes
├── CHANGELOG.md # Version history, breaking changes
├── docs/
│ ├── api/ # API documentation
│ │ ├── rest.md
│ │ └── graphql.md
│ ├── architecture/ # Architecture decisions (ADRs)
│ │ └── adr-001-_.md
│ ├── configuration.md # All config options
│ ├── deployment.md # Production deployment
│ └── troubleshooting.md # Common issues and solutions
├── packages/_/README.md # Package-specific documentation
└── src/
└── \*_/_.ts # Inline code documentation

````

### Documentation by Audience

| Audience | Location | Content |
|----------|----------|---------|
| End Users | README.md, docs/api/ | How to use the system |
| Developers | CONTRIBUTING.md, packages/*/README.md | How to develop/extend |
| Operators | docs/deployment.md, docs/configuration.md | How to run/configure |
| Architects | docs/architecture/*.md | Why decisions were made |

---

## Documentation Quality Standards

### Good Documentation Has:

✅ **Clear Purpose**
- Who is the audience?
- What problem does this solve?
- When should this be used?

✅ **Complete Examples**
```typescript
// BAD: Incomplete example
const client = new Client(config);

// GOOD: Complete, runnable example
import { Client } from '@holokai/sdk';

const client = new Client({
  apiKey: process.env.API_KEY,
  timeout: 30000
});

const response = await client.chat({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
````

✅ **Version Information**

- When was this added/changed?
- What version does this apply to?
- Are there compatibility concerns?

✅ **Cross-References**

- Link to related documentation
- Reference issue/story numbers
- Point to examples in code

✅ **Maintenance Metadata**

```markdown
**Last Updated:** 2025-11-24
**Applies To:** v2.1.0+
**Status:** Current
**Owner:** Team/Person
```

### Avoid:

❌ **Outdated Information**

- Review docs when changing related code
- Remove deprecated content promptly
- Update version references

❌ **Ambiguous Language**

- Be specific: "may" vs "must"
- Define technical terms
- Avoid assumptions about reader knowledge

❌ **Missing Context**

```typescript
// BAD: No context
// Set to true for better performance
optimizeQueries: true;

// GOOD: Explains trade-offs
// Enable query optimization (default: false)
// Pros: 2-3x faster for large datasets
// Cons: Uses more memory (~100MB)
// Recommended for: Production with >10k records
optimizeQueries: true;
```

❌ **Wall of Text**

- Use headings and sections
- Include bullet points
- Add diagrams where helpful

---

## Documentation Templates

### Feature Documentation Template

````markdown
## Feature Name

**Since:** vX.Y.Z
**Status:** Stable|Beta|Experimental

### Overview

Brief description of what this feature does and why it exists.

### Usage

```language
// Code example showing basic usage
```
````

### Configuration

| Option | Type | Default | Description  |
| ------ | ---- | ------- | ------------ |
| key    | type | value   | What it does |

### Examples

#### Example 1: Common Use Case

```language
// Complete example
```

#### Example 2: Advanced Use Case

```language
// Complete example
```

### Limitations

- Known limitations or constraints

### See Also

- [Related Feature](link)
- [Configuration Guide](link)

````

### API Endpoint Template
```markdown
## METHOD /path/to/endpoint

**Since:** vX.Y.Z
**Auth:** Required|Optional|None
**Rate Limit:** X requests per Y seconds

### Description
What this endpoint does.

### Request
```http
METHOD /path/to/endpoint HTTP/1.1
Content-Type: application/json

{
  "field": "value"
}
````

### Parameters

| Name  | Type   | Required | Description   |
| ----- | ------ | -------- | ------------- |
| field | string | Yes      | What it's for |

### Response

#### Success (200)

```json
{
  "result": "value"
}
```

#### Error (4xx/5xx)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Examples

```bash
curl -X METHOD https://api.example.com/path \
  -H "Authorization: Bearer TOKEN" \
  -d '{"field": "value"}'
```

````

---

## Documentation Checklist

Use this checklist when updating documentation:

### Before Writing
- [ ] Identify the documentation trigger
- [ ] Determine the target audience
- [ ] Choose appropriate location
- [ ] Check for existing related docs

### While Writing
- [ ] Use appropriate template
- [ ] Include complete examples
- [ ] Add version information
- [ ] Explain the "why" not just "what"
- [ ] Define technical terms
- [ ] Add cross-references

### After Writing
- [ ] Test all code examples
- [ ] Verify links work
- [ ] Check formatting renders correctly
- [ ] Update related documentation
- [ ] Add to CHANGELOG if significant

### Review Checklist
- [ ] Is it accurate?
- [ ] Is it complete?
- [ ] Is it clear?
- [ ] Is it maintainable?
- [ ] Does it follow standards?

---

## Code Documentation

### When to Add Code Comments

✅ **ALWAYS Comment:**
```typescript
// Complex algorithms
function calculateOptimalBatch(items: Item[]): Batch[] {
  // Using dynamic programming to minimize batch cost
  // Time: O(n²), Space: O(n)
  // See: https://example.com/batch-optimization

  // Initialize DP table where dp[i] = min cost for items 0..i
  const dp = new Array(items.length + 1).fill(Infinity);
  // ... implementation
}

// Non-obvious business logic
if (user.accountAge < 30 && user.purchases > 10) {
  // Fraud detection: New accounts with high activity
  // Requirement from SECURITY-123
  await flagForReview(user);
}

// Workarounds or hacks
// TODO[JIRA-456]: Remove after MySQL 8.0 upgrade
// Workaround for MySQL 5.7 JSON indexing limitation
const query = `SELECT JSON_EXTRACT(data, '$.id') as id FROM ...`;

// Complex regular expressions
// Matches semantic version with optional pre-release
// Examples: 1.2.3, 2.0.0-alpha.1, 3.1.4-beta.2+build.123
const VERSION_REGEX = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
````

❌ **AVOID Commenting:**

```typescript
// Bad: Obvious code
// Increment counter by 1
counter++;

// Bad: Redundant with good naming
// Get user by id
function getUserById(id: string) {}

// Bad: Outdated comments
// Returns user name (actually returns full user object)
function getUser(id: string): User {}
```

### Documentation Comments (JSDoc)

Use JSDoc for public APIs and complex functions:

````typescript
/**
 * Processes a batch of messages with retry logic and backpressure handling.
 *
 * @param messages - Array of messages to process
 * @param options - Processing configuration
 * @param options.retries - Number of retry attempts (default: 3)
 * @param options.timeout - Timeout per message in ms (default: 5000)
 * @param options.parallel - Process in parallel (default: false)
 *
 * @returns Promise resolving to processing results
 *
 * @throws {ValidationError} If messages are invalid
 * @throws {TimeoutError} If processing exceeds timeout
 *
 * @example
 * ```typescript
 * const results = await processBatch(messages, {
 *   retries: 5,
 *   timeout: 10000,
 *   parallel: true
 * });
 * ```
 *
 * @since v2.1.0
 * @see {@link processMessage} for single message processing
 */
export async function processBatch(
  messages: Message[],
  options?: ProcessOptions
): Promise<ProcessResult[]> {
  // Implementation
}
````

---

## Enforcement

### Definition of Done Integration

Documentation is part of our Definition of Done:

✅ **Required for Story Completion:**

- [ ] User-facing features documented
- [ ] API changes documented
- [ ] Breaking changes documented with migration guide
- [ ] Configuration changes documented
- [ ] Complex code has inline documentation

### PR Checklist Integration

The PR template includes:

- [ ] Documentation updated (if applicable)
- [ ] README updated (if setup/config changed)
- [ ] API docs updated (if endpoints changed)
- [ ] CHANGELOG updated (if user-visible changes)

### Automated Checks

Consider implementing:

- Documentation coverage tools
- Broken link checkers
- API documentation generators
- Changelog generators from commits

---

## Examples of Good Documentation

### Example 1: Feature Addition

**Commit:** `feat(workers): add automatic retry mechanism`

**Documentation Updates:**

1. `README.md` - Added retry configuration section
2. `docs/configuration.md` - Detailed retry options
3. `packages/workers/README.md` - Implementation details
4. `CHANGELOG.md` - User-visible change noted
5. Code comments explaining backoff algorithm

### Example 2: API Change

**Commit:** `feat(api): add pagination to list endpoints`

**Documentation Updates:**

1. `docs/api/rest.md` - Updated all list endpoints
2. Added request/response examples with pagination
3. Migration guide for existing integrations
4. Inline JSDoc for new parameters

### Example 3: Configuration Change

**Commit:** `feat(config): support environment-specific settings`

**Documentation Updates:**

1. `docs/configuration.md` - Environment variable precedence
2. `docs/deployment.md` - Production configuration guide
3. `.env.example` - Updated with new variables
4. README troubleshooting section

---

## Common Pitfalls

### 1. Documentation Drift

**Problem:** Docs don't match implementation
**Solution:** Update docs in same PR as code changes

### 2. Copy-Paste Errors

**Problem:** Examples don't work
**Solution:** Test all examples before committing

### 3. Assumption Overload

**Problem:** Assuming reader knowledge
**Solution:** Define terms, link to prerequisites

### 4. Update Fatigue

**Problem:** Docs become stale over time
**Solution:** Regular documentation reviews, ownership assignment

### 5. Over-Documentation

**Problem:** Too much trivial documentation
**Solution:** Focus on what's not obvious from code

---

## Training Scenarios

### Scenario 1: Adding a New Feature

You're adding a caching layer to improve performance.

**Required Documentation:**

1. Update README with caching configuration
2. Document cache keys and TTL in configuration.md
3. Add performance metrics to show improvement
4. Include code examples of cache usage
5. Document cache invalidation triggers

### Scenario 2: Changing an API

You're adding optional filtering to a GET endpoint.

**Required Documentation:**

1. Update API docs with new query parameters
2. Provide filtering syntax examples
3. Document supported operators
4. Show response differences with/without filters
5. Note any performance implications

### Scenario 3: Fixing a Bug

You fixed a race condition in the queue processor.

**Consider Documentation:**

1. If user-visible, document in CHANGELOG
2. Add code comment explaining the fix
3. Document any new configuration to prevent recurrence
4. Update troubleshooting guide if relevant

---

## Quick Reference

### Documentation Required?

| Change Type           | Required | Location             |
| --------------------- | -------- | -------------------- |
| New Feature           | Yes      | README, feature docs |
| API Change            | Yes      | API docs             |
| Config Change         | Yes      | Configuration docs   |
| Breaking Change       | Yes      | Migration guide      |
| Architecture Decision | Yes      | ADR                  |
| Performance Fix       | Should   | CHANGELOG, comments  |
| Bug Fix (visible)     | Should   | CHANGELOG            |
| Internal Refactor     | May      | Code comments        |

### Documentation Checklist

```markdown
- [ ] Identified documentation trigger
- [ ] Updated relevant docs
- [ ] Tested code examples
- [ ] Added version info
- [ ] Cross-referenced related docs
- [ ] Updated CHANGELOG (if user-visible)
```

---

## Tools and Resources

### Recommended Tools

- **Markdown Preview**: VS Code Markdown Preview
- **Diagram Creation**: Mermaid, draw.io
- **API Documentation**: OpenAPI/Swagger
- **Documentation Hosting**: GitHub Pages, GitBook

### Useful Links

- [Markdown Guide](https://www.markdownguide.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [ADR Template](templates/adr-template.md)
- [Conventional Comments](https://conventionalcomments.org/)

---

## Document History

- v1.0.0 (2025-11-24): Initial documentation standards
