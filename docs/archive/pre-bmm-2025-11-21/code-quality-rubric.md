# Code Quality Rubric

> **Purpose**: This rubric defines the evaluation criteria for **all code implementations** in the Holo LLM proxy. Every code change must score **10/10** against this rubric before being submitted.

---

## Evaluation Framework

Each implementation is scored on **10 dimensions**, weighted equally. A score of **10/10** means all criteria are met with zero violations.

---

## 1. Architectural Alignment (Critical)

**Score: 0-10**

### ✅ Perfect (10/10)
- Code follows **exact patterns** from existing similar implementations
- File structure matches established conventions (`src/providers/{provider}/types/`, `src/providers/{provider}/validators/`)
- Types are **type aliases** to official SDK types (no duplication)
- Validators are co-located with types in **provider-specific directories**
- Dependencies flow correctly: Controllers → Services → Cache → Types
- No cross-layer violations (e.g., no Express in domain types)

### ❌ Failure Triggers (0/10)
- Inventing new file structures when existing patterns exist
- Placing provider-specific code in generic locations (e.g., all validators in one file)
- Creating custom type definitions when SDK types exist
- Violating dependency flow (e.g., types importing from services)

### Verification Checklist
- [ ] Searched codebase for **existing similar implementations** before starting
- [ ] File paths match **exact patterns** from similar providers
- [ ] No new architectural patterns introduced without explicit justification
- [ ] All types are **type aliases** (`export type X = SDKType`), not interfaces
- [ ] Validators in `src/providers/{provider}/validators/` (NOT in `src/cache/validators/` for provider-specific types)

**Example (Correct)**:
```typescript
// src/providers/openai/types/responses.ts
import type { Model as OpenAISDKModel } from 'openai/resources/models';
export type OpenAIModel = OpenAISDKModel;

// src/providers/openai/validators/openai.models.ts
import { type, Type } from 'arktype';
import { OpenAIModel } from '../types/responses';
export const OpenAIModelValidator = type({...}) satisfies Type<OpenAIModel>;
```

**Example (Wrong)**:
```typescript
// src/cache/validators/model.validator.ts - ❌ Wrong location for provider-specific validators
export const OpenAIModelValidator = type({...});
export const ClaudeModelInfoValidator = type({...});
export const OllamaModelResponseValidator = type({...}); // All in one file
```

---

## 2. Type Safety (Critical)

**Score: 0-10**

### ✅ Perfect (10/10)
- Zero `any` types (use `unknown` if truly unknown)
- All function parameters have explicit types
- All function return types declared explicitly
- No type assertions without null checks (`metadata!.openai` only after verifying `metadata?.openai` exists)
- Union types over loose types (`string | number` over `any`)
- Validators use `satisfies Type<T>` to ensure type/validator alignment

### ❌ Failure Triggers (0/10)
- Using `any` types (e.g., `let models: any[] = []`)
- Type assertions without guards (e.g., `m.metadata!.claude` without checking existence)
- Mixing incompatible types (e.g., `string | any[]`)
- Missing return type declarations on public methods
- Validators don't `satisfies Type<T>` (breaks type/validator sync)

### Verification Checklist
- [ ] `npx tsc --noEmit` passes with **zero errors**
- [ ] ESLint passes with **zero `any` type warnings**
- [ ] All public methods have explicit return types
- [ ] All type assertions have corresponding null/undefined checks
- [ ] Validators use `satisfies Type<T>` pattern

**Example (Correct)**:
```typescript
let claudeModels: ClaudeModelInfo[] = [];
const allModels = this.organizationService.getModels(orgId, slug) ?? [];
claudeModels = allModels
  .filter(m => m.metadata?.claude) // ✅ Check existence
  .map(m => m.metadata!.claude as ClaudeModelInfo); // ✅ Safe assertion after filter
```

**Example (Wrong)**:
```typescript
let claudeModels: string | any[] = []; // ❌ any type, nonsensical union
claudeModels = allModels.map(m => m.metadata!.claude); // ❌ No existence check before assertion
```

---

## 3. Validator Correctness (Critical)

**Score: 0-10**

### ✅ Perfect (10/10)
- Validators match **exact** SDK/REST API types (verified against official docs)
- String timestamps stored as strings (NOT Date objects)
- Optional fields marked with `?` suffix (`'field?': 'type'`)
- Nested validators composed correctly (no inline definitions)
- Validators tested with **sample data from actual API responses**

### ❌ Failure Triggers (0/10)
- Validators expect wrong types (e.g., `Date` when API returns ISO 8601 strings)
- Required fields marked optional (or vice versa)
- Validators fail on valid API responses
- No verification against actual SDK behavior

### Verification Checklist
- [ ] Compared validator against **official SDK type definitions**
- [ ] Tested validator with **real API response samples** (not just invented test data)
- [ ] Verified timestamps: strings stay strings, numbers stay numbers
- [ ] Optional fields match SDK (check for `?` in SDK interface)
- [ ] Ran validator against sample config from Moku

**Example (Correct)**:
```typescript
// Ollama REST API returns ISO 8601 strings, NOT Date objects
export const OllamaModelResponseValidator = type({
  name: 'string',
  modified_at: 'string', // ✅ String (matches REST API)
  'expires_at?': 'string', // ✅ Optional string
  'size_vram?': 'number'   // ✅ Optional number
}) satisfies Type<OllamaModelResponse>;
```

**Example (Wrong)**:
```typescript
// ❌ Expecting Date objects when API sends strings
export const OllamaModelResponseValidator = type({
  modified_at: 'Date',  // ❌ API sends strings
  expires_at: 'Date',   // ❌ Should be optional
  size_vram: 'number'   // ❌ Should be optional
});
```

---

## 4. Coding Standards Compliance (Critical)

**Score: 0-10**

### ✅ Perfect (10/10)
- Follows **all** patterns from `CODING_STANDARDS.md`
- DI: `@injectable()` decorator, constructor injection, `readonly` dependencies
- Logging: `this.mlog(this.methodName)` pattern with structured metadata
- Error Handling: `BaseController.handleError()` for HTTP errors
- Async: `async/await` only (no `.then()` chains)
- Naming: camelCase functions, PascalCase classes, SCREAMING_SNAKE_CASE constants
- Comments: Only for "why", not "what"; JSDoc for public APIs

### ❌ Failure Triggers (0/10)
- Not using `@injectable()` on services
- Not extending `BaseController` for controllers
- Not using `this.mlog()` for method-scoped logging
- Using `.then()` chains instead of `async/await`
- Violating naming conventions

### Verification Checklist
- [ ] All classes use `@injectable()` decorator
- [ ] Controllers extend `BaseController` and use `this.mlog()`
- [ ] All logging includes structured metadata (`{ orgId, appSlug }`)
- [ ] All async code uses `async/await` (no `.then()`)
- [ ] Naming conventions followed (checked against standards doc)

**Example (Correct)**:
```typescript
@injectable()
export class ClaudeController extends BaseController {
  constructor(
    private readonly requestService: RequestService,
    private readonly organizationService: OrganizationService
  ) {
    super();
  }

  public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    const logger = this.mlog(this.models);
    logger.info('Getting models', { organizationId: req.auth?.organizationId });
    // ...
  }
}
```

---

## 5. Consistency (Critical)

**Score: 0-10**

### ✅ Perfect (10/10)
- **Identical patterns** across all three providers (OpenAI, Claude, Ollama)
- Only differences are provider-specific types/validators
- Same logging, same error handling, same control flow
- If OpenAI does X, Claude and Ollama do X identically

### ❌ Failure Triggers (0/10)
- Different patterns between providers (e.g., OpenAI extracts metadata, Claude doesn't)
- Inconsistent logging messages
- Different error handling approaches
- Asymmetric implementations

### Verification Checklist
- [ ] Controllers follow **identical** structure (only types differ)
- [ ] Logging messages parallel across providers
- [ ] Error handling identical across providers
- [ ] Side-by-side diff shows only type differences

**Example (Correct)**:
```typescript
// OpenAI Controller
let openaiModels: OpenAIModel[] = [];
if (auth.organizationId && auth?.appSlug) {
  logger.debug(`Getting models for app: ${auth.appSlug}`);
  const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
  openaiModels = allModels.map(m => m.metadata!.openai as OpenAIModel);
}

// Claude Controller (IDENTICAL except types)
let claudeModels: ClaudeModelInfo[] = [];
if (auth.organizationId && auth?.appSlug) {
  logger.debug(`Getting models for app: ${auth.appSlug}`); // ✅ Same message
  const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
  claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo); // ✅ Same pattern
}
```

---

## 6. Testability

**Score: 0-10**

### ✅ Perfect (10/10)
- Pure functions without side effects (easy to test)
- Dependencies injected via constructor (easy to mock)
- No hard-coded values (config injected)
- No global state mutations
- Clear input/output contracts

### ❌ Failure Triggers (0/10)
- Direct instantiation of dependencies (`new Service()`)
- Reading from global state or environment variables directly
- Side effects in constructors
- Hard-coded URLs, magic numbers, etc.

### Verification Checklist
- [ ] All dependencies in constructor (zero `new` keywords in methods)
- [ ] No environment variable reads in business logic (only in `env.ts`)
- [ ] Methods have clear inputs and outputs (no hidden state)
- [ ] Can write unit test by mocking constructor dependencies

---

## 7. Specification Compliance

**Score: 0-10**

### ✅ Perfect (10/10)
- Implements **exactly** what specification requires
- No extra features not in spec
- No missing features from spec
- Output formats match spec byte-for-byte

### ❌ Failure Triggers (0/10)
- Adding features not in specification
- Skipping specified features
- Output formats deviate from spec

### Verification Checklist
- [ ] Read specification section **line-by-line** before implementing
- [ ] Every "MUST" in spec is implemented
- [ ] Every "MUST NOT" in spec is avoided
- [ ] Output format matches spec examples exactly

**Example (Spec Requirement)**:
> Claude controller **MUST** return pagination fields: `has_more`, `first_id`, `last_id`

**Correct Implementation**:
```typescript
res.status(200).json({
  data: claudeModels,
  has_more: false, // ✅ Required field
  first_id: claudeModels.length > 0 ? claudeModels[0].id : null, // ✅ Required field
  last_id: claudeModels.length > 0 ? claudeModels[claudeModels.length - 1].id : null // ✅ Required field
});
```

---

## 8. Error Handling & Edge Cases

**Score: 0-10**

### ✅ Perfect (10/10)
- All error paths have handlers
- Auth failures return 401
- Empty lists handled gracefully
- Null/undefined checks before accessing nested properties
- Logging for all error conditions

### ❌ Failure Triggers (0/10)
- Unhandled promise rejections
- Missing null checks causing runtime errors
- No logging for failure paths
- Incorrect HTTP status codes

### Verification Checklist
- [ ] Auth check at start of every controller method
- [ ] Empty array returns correct empty container (not error)
- [ ] Null checks before accessing `metadata?.provider`
- [ ] Try/catch blocks for async operations
- [ ] All errors logged with context

---

## 9. Documentation

**Score: 0-10**

### ✅ Perfect (10/10)
- JSDoc comments for all public APIs
- Complex logic has "why" comments
- Type definitions have source references (e.g., "Maps to OpenAI SDK Model")
- No obvious code (e.g., no `// increment counter` comments)

### ❌ Failure Triggers (0/10)
- No JSDoc on public methods
- Commented-out code left in codebase
- "What" comments instead of "why" comments
- Missing type source references

---

## 10. Verification & Testing

**Score: 0-10**

### ✅ Perfect (10/10)
- `npx tsc --noEmit` passes (zero errors)
- Validators tested with real API responses
- Controllers tested with mock services
- Edge cases tested (empty lists, missing auth, etc.)

### ❌ Failure Triggers (0/10)
- TypeScript compilation errors
- Validators untested against real API data
- No unit tests written
- Implementation not verified before submission

### Verification Checklist
- [ ] `npx tsc --noEmit` exits with status 0
- [ ] Validators tested with sample API responses
- [ ] Controllers have unit tests (empty state, single model, multiple models, auth failure)
- [ ] Tested with actual SDK clients (OpenAI, Claude, Ollama packages)

---

## Scoring Guide

### 10/10 - Perfect
- All criteria met with zero violations
- Code is indistinguishable from best existing implementations
- Ready for immediate merge

### 7-9/10 - Acceptable
- Minor issues (e.g., missing JSDoc on one method)
- Fixable in <10 minutes

### 4-6/10 - Needs Revision
- Moderate issues (e.g., wrong file locations, missing null checks)
- Requires 30-60 minutes of rework

### 1-3/10 - Major Rework Required
- Critical failures (e.g., breaking architectural patterns, type safety violations)
- Requires redesign

### 0/10 - Unacceptable
- Multiple critical failures
- Must restart from scratch

---

## Pre-Implementation Checklist

**Before writing ANY code, complete this checklist:**

- [ ] **Search codebase**: Found **exact similar implementation** to copy pattern from
- [ ] **Read spec**: Understood every "MUST" and "MUST NOT" requirement
- [ ] **Review architecture**: Know where files go (providers/{provider}/types/, providers/{provider}/validators/)
- [ ] **Check standards**: Re-read CODING_STANDARDS.md sections relevant to this task
- [ ] **Verify types**: Confirmed SDK types exist and are importable
- [ ] **Plan testing**: Know how to verify implementation (tsc, unit tests, real API calls)

---

## Implementation Workflow

### Phase 1: Research (30% of time)
1. Find **existing similar implementation** (e.g., if implementing Claude models, look at OpenAI models)
2. Read SDK documentation for exact types
3. Understand data flow: Controller → Service → Cache → Types
4. Identify all files that need changes (types, validators, controllers)

### Phase 2: Design (20% of time)
1. Create mental model of changes (or write them down)
2. Check design against rubric (score yourself honestly)
3. Iterate design until 10/10 score
4. **Do NOT code until design scores 10/10**

### Phase 3: Implementation (30% of time)
1. Write code following exact patterns from similar implementations
2. Double-check type safety (`npx tsc --noEmit` after each file)
3. Test incrementally (don't wait until end)

### Phase 4: Verification (20% of time)
1. Score implementation against rubric (all 10 dimensions)
2. Fix any issues (iterate until 10/10)
3. Run full test suite
4. Verify with real SDK clients

---

## Common Failure Patterns (Learn from Mistakes)

### ❌ Validator in Wrong Location
**What happened**: Placed all provider validators in `src/cache/validators/model.validator.ts`
**Why wrong**: Provider-specific validators belong in `src/providers/{provider}/validators/`
**How to avoid**: Search codebase for existing validators **before** creating new files

### ❌ Wrong Validator Types
**What happened**: Used `'Date'` in Ollama validator when API returns ISO 8601 strings
**Why wrong**: Didn't verify against actual API responses
**How to avoid**: Test validator with **real API response samples** (not invented test data)

### ❌ Type Safety Violations
**What happened**: Used `string | any[]` union type
**Why wrong**: `any` breaks type safety, union makes no sense
**How to avoid**: Run `npx tsc --noEmit` after every change

### ❌ Inconsistent Patterns
**What happened**: OpenAI extracted `metadata.openai`, Claude didn't
**Why wrong**: Different patterns for same operation across providers
**How to avoid**: Copy-paste pattern from working implementation, change only types

---

## Self-Assessment Questions

Before submitting code, answer these honestly:

1. **Did I search for existing similar implementations?** (If no, STOP and search)
2. **Does my code follow the exact pattern from similar implementations?** (If no, refactor to match)
3. **Did I verify validators against real API responses?** (If no, test now)
4. **Does `npx tsc --noEmit` pass with zero errors?** (If no, fix errors)
5. **Are all 10 rubric dimensions scoring 10/10?** (If no, iterate until they do)
6. **Can I explain why every line of code exists?** (If no, remove or document)
7. **Would this code pass code review by the original author?** (If no, revise)

---

## Rubric Maintenance

This rubric is a **living document**. Update when:
- New architectural patterns are established
- Coding standards change
- New failure patterns discovered

**Version**: 1.0
**Last Updated**: 2025-10-12
**Status**: **AUTHORITATIVE**
