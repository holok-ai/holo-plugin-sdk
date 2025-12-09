# HoloKai Holo - Coding Standards

## Overview

This document defines the coding standards, patterns, and conventions used throughout the codebase. These standards ensure consistency, maintainability, and enable effective code auditing by both developers and AI assistants.

---

## 1. TypeScript Configuration

### Compiler Settings (`tsconfig.json`)

**Target & Module**:
- `target: "ESNext"` - Use latest ECMAScript features
- `module: "ESNext"` - Native ES modules
- `moduleResolution: "bundler"` - Modern bundler-aware resolution

**Strict Mode** (ALL enabled):
- `strict: true` - Enable all strict type checking
- `noImplicitAny: true` - No implicit any types
- `noImplicitReturns: true` - All code paths must return
- `noImplicitThis: true` - No implicit this binding
- `noUnusedLocals: true` - Flag unused local variables
- `noUnusedParameters: true` - Flag unused parameters
- `exactOptionalPropertyTypes: true` - Distinguish `undefined` from missing properties

**Decorators**:
- `experimentalDecorators: true` - Required for TSyringe DI
- `emitDecoratorMetadata: true` - Required for reflection metadata

**Key Rule**: Maximum TypeScript strictness for type safety and error prevention.

---

## 2. Dependency Injection Pattern

### TSyringe Convention

**Injectable Services**:
```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';

@injectable()
export class ServiceName extends ClassLogger {
    constructor(
        private readonly dependency1: Dependency1,
        private readonly dependency2: Dependency2
    ) {
        super();
    }
}
```

**Requirements**:
1. Import `'reflect-metadata'` at top of file
2. Use `@injectable()` decorator on class
3. Use `readonly` for constructor-injected dependencies
4. Extend `ClassLogger` for logging capabilities
5. Call `super()` in constructor

**DI Container Registration**:
- Services auto-register via decorators
- Manual registration only for tokens/factories
- Singleton pattern preferred (default TSyringe behavior)

---

## 3. Logging Standards

### ClassLogger Pattern

**Base Pattern**:
```typescript
import { ClassLogger } from '../types/class.logger';

export class MyService extends ClassLogger {
    someMethod() {
        const logger = this.mlog(this.someMethod);  // Method-scoped logger
        logger.info('Message', { requestId, context });
        logger.error(`Error: ${error.message}`, { details });
    }
}
```

**Requirements**:
1. Extend `ClassLogger` for all services
2. Use `this.mlog(this.methodName)` for method-scoped logging
3. Pass structured metadata in second parameter
4. Include `requestId` in all request-related logs
5. Use template literals for error messages with context

**Log Levels**:
- `error` - Errors requiring attention
- `warn` - Unexpected but handled conditions
- `info` - Important business events
- `debug` - Detailed debugging information (verbose)

**Structured Logging**:
```typescript
logger.info('Processing request', {
    requestId,
    providerType,
    model,
    isStreaming
});
```

---

## 4. Validation Standards (ArkType)

### Validator Pattern

**Type Definition**:
```typescript
import { Type, type } from 'arktype';

export const ModelValidator = type({
    name: 'string',
    accessModel: 'string',
    providerName: 'string'
}) satisfies Type<Model>;
```

**Requirements**:
1. Use `type()` from `arktype` for runtime validators
2. Use `satisfies Type<T>` to link validator to TypeScript type
3. Export validators with `Validator` suffix (e.g., `ModelValidator`)
4. Co-locate validators with type definitions

**Usage Pattern**:
```typescript
const result = ModelValidator(data);
if (result instanceof ArkErrors) {
    logger.error(`Validation failed: ${result.summary}`);
    throw new Error(result.summary);
}
// result is now strongly typed as Model
```

**Validation Location**:
- **Input boundaries**: HTTP request bodies, queue messages, SDK responses
- **Core logic**: Type guards for critical transformations
- **Never**: Internal function calls between trusted components

---

## 5. Translation Pattern (Holo System)

### BaseTranslator Pattern

**Abstract Base**:
```typescript
import { BaseTranslator } from '../base.translator';

@injectable()
export class ProviderTranslator extends BaseTranslator<HoloType, ProviderType> {
    protected holoValidator = HoloValidator;
    protected providerValidator = ProviderValidator;
    protected holoDefaults: Partial<HoloType> = {};
    protected providerDefaults: Partial<ProviderType> = {};

    protected async fromHoloImpl(holo: HoloType): Promise<Partial<ProviderType>> {
        return pickDefined({
            provider_field: holo.holo_field,
            // ...mappings
        });
    }

    protected async toHoloImpl(provider: ProviderType): Promise<Partial<HoloType>> {
        return pickDefined({
            holo_field: provider.provider_field,
            // ...mappings
        });
    }
}
```

**Requirements**:
1. Extend `BaseTranslator<THolo, TProvider>`
2. Implement `fromHoloImpl` (Holo → Provider) and `toHoloImpl` (Provider → Holo)
3. Use `pickDefined()` to strip undefined values
4. Keep translators **stateless** (no instance variables)
5. Implement private helper methods for complex mappings (e.g., `mapUsageToHolo()`)

**Naming Convention**:
- `fromHolo*` - Holo → Provider
- `toHolo*` - Provider → Holo
- Private mappers: `mapFieldFromHolo()`, `mapFieldToHolo()`

---

## 6. Type Organization

### Interface vs Type

**Use `interface` for**:
- Object shapes that may be extended
- API contracts
- Service interfaces
- Domain models

```typescript
export interface LLMWorkerRequest {
    organizationId?: string;
    providerType: ProviderType;
    requestId: string;
    // ...
}
```

**Use `type` for**:
- Union types
- Mapped types
- Type aliases
- Validator definitions

```typescript
export type ProviderType = 'OPENAI' | 'CLAUDE' | 'OLLAMA' | 'PERPLEXITY';
export type ProviderRequest = OpenAIRequest | ClaudeRequest | OllamaRequest;
```

### Optional vs Undefined

**Distinguish between**:
- `field?: string` - Property may be missing OR undefined
- `field: string | undefined` - Property must exist but may be undefined

**Use `exactOptionalPropertyTypes: true`** to enforce this distinction.

---

## 7. Naming Conventions

### Files

- `*.types.ts` - Type definitions only
- `*.validator.ts` - ArkType validators
- `*.translator.ts` - Holo translation logic
- `*.provider.ts` - Provider SDK clients
- `*.factory.ts` - Factory classes
- `*.service.ts` - Business logic services
- `*.controller.ts` - HTTP controllers
- `*.middleware.ts` - Express middleware
- `*.routes.ts` - Express routes

### Classes

- `PascalCase` for all class names
- Suffix patterns:
  - `*Service` - Business logic services
  - `*Controller` - HTTP controllers
  - `*Translator` - Translation logic
  - `*Provider` - Provider SDK wrappers
  - `*Factory` - Factory pattern implementations
  - `*Validator` - Validation schemas

### Functions

- `camelCase` for all functions
- Prefix patterns:
  - `parse*` - Parse/convert strings to types
  - `map*` - Transform one type to another
  - `create*` - Factory methods
  - `handle*` - Event/error handlers
  - `process*` - Complex multi-step operations

### Constants

- `SCREAMING_SNAKE_CASE` for true constants
- `camelCase` for configuration objects

### Enums

- Use TypeScript `enum` or string literal unions
- `PascalCase` for enum names
- `SCREAMING_SNAKE_CASE` for enum values

```typescript
export enum ProviderType {
    OPENAI = 'OPENAI',
    CLAUDE = 'CLAUDE',
    OLLAMA = 'OLLAMA',
    PERPLEXITY = 'PERPLEXITY'
}
```

---

## 8. Error Handling

### Standard Pattern

**Services**:
```typescript
try {
    const result = await operation();
    logger.info('Operation successful', { result });
    return result;
} catch (error) {
    logger.error(`Operation failed: ${(error as Error).message}`, {
        context,
        stack: (error as Error).stack
    });
    throw error; // or throw new CustomError()
}
```

**Controllers** (Express):
```typescript
protected handleError(
    res: Response,
    error: Error,
    message: string = 'Internal server error',
    statusCode: number = 500
): void {
    const logger = this.mlog(this.handleError);
    logger.error(`${message}: ${error.message}`);
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: error.name || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        },
        timestamp: new Date().toISOString()
    });
}
```

**Requirements**:
1. Always log errors with context
2. Never swallow errors silently
3. Use type assertion `(error as Error)` for error handling
4. Include stack traces only in development
5. Return structured error responses in HTTP layer

---

## 9. Async/Await Standards

### Rules

1. **Always use async/await** (never `.then()` chains)
2. **No floating promises** - always await or explicitly handle
3. **Use `Promise.all()`** for parallel operations
4. **Use sequential await** for dependent operations

**Correct**:
```typescript
// Parallel
const [result1, result2] = await Promise.all([
    operation1(),
    operation2()
]);

// Sequential (dependent)
const result1 = await operation1();
const result2 = await operation2(result1);
```

**Incorrect**:
```typescript
// ❌ Floating promise
operation(); // Missing await

// ❌ Then chains
operation1()
    .then(result => operation2(result))
    .then(final => console.log(final));
```

---

## 10. Utility Function Standards

### Pure Functions

**Requirements**:
1. No side effects
2. Deterministic (same input = same output)
3. No I/O operations
4. No external state access

**Example**:
```typescript
export function pickDefined<T extends {}>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}
```

### Function Signatures

**Type Parameters First**:
```typescript
function transform<TInput, TOutput>(
    input: TInput,
    transformer: (item: TInput) => TOutput
): TOutput {
    return transformer(input);
}
```

**Optional Parameters Last**:
```typescript
function parseNumber(
    value: string | undefined,
    defaultValue: number
): number {
    // ...
}
```

---

## 11. Component-Specific Standards

### Core (Pure TypeScript)

**Constraints**:
- ❌ No Node.js APIs (`fs`, `path`, `process`, etc.)
- ❌ No I/O operations
- ❌ No framework dependencies (Express, etc.)
- ✅ Pure types, interfaces, validators
- ✅ Stateless transformation logic
- ✅ ArkType validators only

**Example Structure**:
```
core/
├── types/           # Pure interfaces/types
├── validators/      # ArkType schemas
├── utils/           # Pure utility functions
└── domain/          # Domain models (no persistence)
```

### Providers (Translation + SDK)

**Constraints**:
- ✅ Translator classes (stateless)
- ✅ SDK client wrappers
- ✅ Provider-specific types
- ❌ No business logic beyond translation
- ❌ No database/queue operations

**Translator Rules**:
1. Extend `BaseTranslator<THolo, TProvider>`
2. No instance state (all logic in methods)
3. Use `pickDefined()` to clean output
4. Validate with ArkType at boundaries
5. Include defaults for provider-specific fields

**Provider (SDK Client) Rules**:
1. Extend base provider class
2. Handle SDK initialization
3. Implement retry logic if needed
4. Map SDK responses to domain types
5. Log all external API calls

### Services (Business Logic + I/O)

**Constraints**:
- ✅ Complex orchestration logic
- ✅ Database operations
- ✅ Queue operations
- ✅ External API calls
- ✅ File I/O
- ❌ No HTTP handling (that's controllers)

**Service Pattern**:
```typescript
@injectable()
export class MyService extends ClassLogger {
    constructor(
        private readonly dependency: Dependency
    ) {
        super();
    }

    async performOperation(params: Params): Promise<Result> {
        const logger = this.mlog(this.performOperation);
        logger.info('Starting operation', { params });

        try {
            const result = await this.dependency.execute(params);
            logger.info('Operation completed', { result });
            return result;
        } catch (error) {
            logger.error(`Operation failed: ${(error as Error).message}`);
            throw error;
        }
    }
}
```

### Controllers (HTTP Layer)

**Constraints**:
- ✅ Express Request/Response handling
- ✅ Input validation (basic)
- ✅ Error response formatting
- ❌ No business logic
- ❌ No direct database access

**Controller Pattern**:
```typescript
export abstract class BaseController extends ClassLogger {
    protected handleError(
        res: Response,
        error: Error,
        message: string = 'Internal server error',
        statusCode: number = 500
    ): void {
        // Standard error handling
    }

    protected success<T>(
        res: Response,
        data: T,
        statusCode: number = 200
    ): void {
        // Standard success response
    }
}

export class ProviderController extends BaseController {
    constructor(private readonly service: ProviderService) {
        super();
    }

    async handleRequest(req: Request, res: Response): Promise<void> {
        const logger = this.mlog(this.handleRequest);
        try {
            const result = await this.service.process(req.body);
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error as Error);
        }
    }
}
```

---

## 12. Import Organization

### Order

1. External libraries (`reflect-metadata` first if needed)
2. Node.js built-ins
3. Framework imports (Express, etc.)
4. Internal shared imports (types, utils)
5. Internal local imports (same directory)

**Example**:
```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { Transform } from 'node:stream';
import { Request, Response } from 'express';
import { ProviderType, RequestType } from '../providers/types';
import { ClassLogger } from '../types/class.logger';
import { WorkerRequestFactory } from './worker.request.factory';
```

### Import Style

**Prefer named imports**:
```typescript
import { ProviderType, RequestType } from '../providers/types';
```

**Use default imports only when required**:
```typescript
import logger from '../utils/logger';
```

**Group imports by barrel files**:
```typescript
import {
    ClaudeMessageTranslator,
    ClaudeRequestTranslator,
    ClaudeResponseTranslator,
    ClaudeStreamTranslator
} from './translators';
```

---

## 13. Comments & Documentation

### When to Comment

**Do comment**:
- Complex algorithms
- Non-obvious business logic
- Workarounds/hacks (with explanation)
- Public API contracts

**Don't comment**:
- Obvious code (`// increment counter`)
- Redundant type information
- Commented-out code (delete it)

### JSDoc for Public APIs

```typescript
/**
 * Translates Holo request to provider-specific format.
 *
 * @param request - Holo canonical request
 * @returns Provider-specific request (partial)
 * @throws {ValidationError} if request fails validation
 */
async fromHoloRequest(request: HoloRequest): Promise<Partial<ProviderRequest>> {
    // ...
}
```

### Inline Comments

**Explain "why" not "what"**:
```typescript
// Claude doesn't support function_call, map to tool_calls
if (finishReason === 'function_call') {
    return 'tool_calls';
}
```

---

## 14. Testing Standards

### File Naming

- `*.test.ts` - Unit tests
- `*.spec.ts` - Integration tests
- Co-locate with implementation files (not separate `/test` folder)

### Test Structure

```typescript
describe('ServiceName', () => {
    let service: ServiceName;
    let mockDependency: jest.Mocked<Dependency>;

    beforeEach(() => {
        mockDependency = createMock<Dependency>();
        service = new ServiceName(mockDependency);
    });

    describe('methodName', () => {
        it('should handle success case', async () => {
            // Arrange
            const input = createTestInput();
            mockDependency.execute.mockResolvedValue(expectedOutput);

            // Act
            const result = await service.methodName(input);

            // Assert
            expect(result).toEqual(expectedOutput);
            expect(mockDependency.execute).toHaveBeenCalledWith(input);
        });

        it('should handle error case', async () => {
            // ...
        });
    });
});
```

**Requirements**:
1. Arrange-Act-Assert pattern
2. One assertion per test (when possible)
3. Descriptive test names (`should X when Y`)
4. Mock external dependencies
5. Test both success and error paths

---

## 15. Code Review Checklist

### For Developers

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] No `any` types (except for truly dynamic data)
- [ ] All functions have return types
- [ ] All public APIs have JSDoc
- [ ] Error handling in place
- [ ] Logging for important operations
- [ ] No hardcoded values (use env/config)
- [ ] Tests written for new functionality
- [ ] No unused imports or variables

### For AI Auditors

- [ ] Correct layer separation (core/api/server)
- [ ] DI pattern used correctly (`@injectable()`)
- [ ] Logging via `ClassLogger.mlog()`
- [ ] Validation at boundaries (ArkType)
- [ ] Translators extend `BaseTranslator`
- [ ] No Express types in core/domain
- [ ] Async/await used consistently
- [ ] Error handling with structured logging
- [ ] Pure functions in utilities
- [ ] Naming conventions followed

---

## 16. Performance Guidelines

### Avoid

- Synchronous I/O in hot paths
- Large object copies (use references)
- Excessive logging in tight loops
- Nested async loops (use `Promise.all()`)

### Prefer

- Streaming for large data
- Connection pooling (DB, HTTP)
- Caching at appropriate layers
- Lazy loading for heavy modules

---

## 17. Security Standards

### Input Validation

- Validate ALL external input (HTTP, queue, file)
- Use ArkType validators at boundaries
- Sanitize user-provided strings
- Never trust client data

### Secrets Management

- All secrets in environment variables
- Never commit secrets to git
- Use secret managers in production
- Rotate credentials regularly

### Logging

- Never log sensitive data (tokens, passwords)
- Redact PII in logs
- Use structured logging for auditing

---

## Summary

These standards ensure:
1. **Consistency** - Same patterns across codebase
2. **Type Safety** - Maximum TypeScript strictness
3. **Maintainability** - Clear separation of concerns
4. **Observability** - Structured logging everywhere
5. **Testability** - DI and pure functions
6. **Security** - Validation and secret management

All code contributions must adhere to these standards. Use this document for both development and AI-assisted code auditing.
