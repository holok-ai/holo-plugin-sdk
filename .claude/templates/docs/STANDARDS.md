# Coding Standards

**Last updated**: [Date]
**Applies to**: [Languages/frameworks used in this project]

## Overview

This document defines the coding standards and conventions for this project. All code must follow these standards to ensure consistency, maintainability, and quality.

## General Principles

1. **Clarity over cleverness** - Write code that's easy to understand
2. **Consistency over personal preference** - Follow project conventions
3. **Simplicity over complexity** - Choose the simplest solution that works
4. **Maintainability over optimization** - Optimize only when necessary
5. **Testability over convenience** - Write code that's easy to test

## File Organization

### Directory Structure

```
src/
├── api/              # API routes and controllers
├── services/         # Business logic
├── repositories/     # Data access layer
├── models/           # Domain models and types
├── utils/            # Shared utilities
├── config/           # Configuration
└── tests/            # Test files
```

### File Naming

- **TypeScript/JavaScript**: `kebab-case.ts` (e.g., `user-service.ts`)
- **Python**: `snake_case.py` (e.g., `user_service.py`)
- **Java**: `PascalCase.java` (e.g., `UserService.java`)
- **Go**: `snake_case.go` (e.g., `user_service.go`)

### File Size

- Maximum 300 lines per file
- Split larger files into logical modules
- Each file should have a single, clear purpose

## Naming Conventions

### TypeScript/JavaScript

```typescript
// Classes and Interfaces: PascalCase
class UserService {}
interface UserRepository {}

// Functions and Variables: camelCase
function getUserById(id: string) {}
const userName = "John";

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = "https://api.example.com";

// Private members: prefix with _
class User {
  private _password: string;
}

// Type parameters: Single capital letter or PascalCase
function map<T, U>(fn: (item: T) => U) {}
type Result<TData, TError> = ...;

// Enums: PascalCase for name and values
enum UserRole {
  Admin = "ADMIN",
  User = "USER"
}

// Files: kebab-case
// user-service.ts, auth-middleware.ts
```

### Python

```python
# Classes: PascalCase
class UserService:
    pass

# Functions and Variables: snake_case
def get_user_by_id(user_id: str):
    pass

user_name = "John"

# Constants: UPPER_SNAKE_CASE
MAX_RETRIES = 3
API_BASE_URL = "https://api.example.com"

# Private members: prefix with _
class User:
    def __init__(self):
        self._password = ""

# Files: snake_case
# user_service.py, auth_middleware.py
```

### Naming Best Practices

- Use descriptive names (avoid abbreviations unless widely known)
- Boolean variables should start with `is`, `has`, `should`, `can`
- Functions should start with verbs (`get`, `create`, `update`, `delete`)
- Avoid single-letter variables (except for loop counters)

**Good**:
```typescript
const isAuthenticated = true;
const hasPermission = checkPermission(user);
function getUserById(id: string) {}
```

**Bad**:
```typescript
const auth = true;  // Unclear
const perm = checkPermission(user);  // Abbreviated
function user(id: string) {}  // Not a verb
```

## Code Formatting

### Indentation
- Use **2 spaces** for TypeScript/JavaScript/JSON
- Use **4 spaces** for Python
- Never mix tabs and spaces

### Line Length
- Maximum **100 characters** per line
- Break long lines at logical points
- Use multi-line for long function calls

**Good**:
```typescript
const result = await userService.createUser({
  email: "user@example.com",
  name: "John Doe",
  role: UserRole.User
});
```

### Braces and Brackets
- Opening brace on same line (K&R style for TypeScript/JavaScript)
- Always use braces, even for single-line blocks

**Good**:
```typescript
if (condition) {
  doSomething();
}
```

**Bad**:
```typescript
if (condition) doSomething();  // No braces
```

### Whitespace
- One blank line between functions
- Two blank lines between classes
- No trailing whitespace
- Add blank lines to separate logical sections

### Quotes
- **TypeScript/JavaScript**: Use double quotes `"`
- **Python**: Use double quotes `"`
- **SQL**: Use single quotes for strings `'`

## Comments and Documentation

### JSDoc/TSDoc (TypeScript/JavaScript)

```typescript
/**
 * Retrieves a user by their unique identifier.
 *
 * @param id - The unique user identifier
 * @returns The user object if found
 * @throws {UserNotFoundError} If user doesn't exist
 *
 * @example
 * ```typescript
 * const user = await getUserById("123");
 * console.log(user.email);
 * ```
 */
async function getUserById(id: string): Promise<User> {
  // Implementation
}
```

### Docstrings (Python)

```python
def get_user_by_id(user_id: str) -> User:
    """
    Retrieves a user by their unique identifier.

    Args:
        user_id: The unique user identifier

    Returns:
        The user object if found

    Raises:
        UserNotFoundError: If user doesn't exist

    Example:
        >>> user = get_user_by_id("123")
        >>> print(user.email)
    """
    # Implementation
```

### Inline Comments

- Use sparingly - code should be self-documenting
- Explain **why**, not **what**
- Keep comments up-to-date with code changes

**Good**:
```typescript
// Retry failed requests due to transient network issues
const maxRetries = 3;
```

**Bad**:
```typescript
// Set maxRetries to 3
const maxRetries = 3;
```

### Comment Style
- Use `//` for single-line comments in TypeScript/JavaScript
- Use `#` for single-line comments in Python
- Use `/* */` for multi-line explanations (sparingly)

## Functions and Methods

### Function Length
- Maximum **30 lines** per function
- Extract complex logic into helper functions
- One function should do one thing

### Parameters
- Maximum **4 parameters**
- Use object destructuring for multiple params
- Required params first, optional params last

**Good**:
```typescript
function createUser({ email, name, role = UserRole.User }: CreateUserParams) {
  // Implementation
}
```

**Bad**:
```typescript
function createUser(email: string, name: string, role: string, verified: boolean, createdAt: Date) {
  // Too many parameters
}
```

### Return Values
- Always specify return types in TypeScript
- Functions should have consistent return types
- Avoid returning `null` - prefer `undefined` or Option types

### Default Parameters
```typescript
function fetchUsers(limit: number = 50, offset: number = 0) {
  // Implementation
}
```

## Error Handling

### Try-Catch
- Always wrap async operations in try-catch
- Catch specific error types when possible
- Log errors with context

```typescript
try {
  const user = await getUserById(id);
  return user;
} catch (error) {
  if (error instanceof UserNotFoundError) {
    logger.warn(`User not found: ${id}`);
    return null;
  }
  logger.error(`Failed to fetch user: ${id}`, error);
  throw error;
}
```

### Custom Errors
```typescript
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
```

### Error Messages
- Include context (IDs, values)
- Use consistent error codes
- Don't expose sensitive information

## TypeScript Specific

### Type Annotations
- Always add explicit return types for public functions
- Prefer interfaces over type aliases for objects
- Use `unknown` instead of `any` when type is truly unknown

```typescript
// Good
function getUser(id: string): Promise<User | null> {
  // Implementation
}

interface User {
  id: string;
  email: string;
}

// Bad
function getUser(id) {  // Missing types
  // Implementation
}
```

### Strict Mode
- Enable `strict: true` in `tsconfig.json`
- Handle `null` and `undefined` explicitly
- Use optional chaining `?.` and nullish coalescing `??`

```typescript
const userName = user?.profile?.name ?? "Anonymous";
```

### Enums vs Union Types
- Use union types for simple string constants
- Use enums for sets of related constants

```typescript
// Union type for simple cases
type Status = "pending" | "active" | "inactive";

// Enum for complex cases
enum UserRole {
  Admin = "ADMIN",
  User = "USER",
  Guest = "GUEST"
}
```

## Asynchronous Code

### Promises
- Always use `async/await` over `.then()`
- Handle errors with try-catch
- Avoid mixing callbacks and promises

**Good**:
```typescript
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    logger.error("Failed to fetch user", error);
    throw error;
  }
}
```

**Bad**:
```typescript
function fetchUser(id: string): Promise<User> {
  return api.get(`/users/${id}`)
    .then(response => response.data)
    .catch(error => {
      logger.error("Failed to fetch user", error);
      throw error;
    });
}
```

### Parallel Operations
```typescript
// Run operations in parallel when independent
const [user, posts, comments] = await Promise.all([
  getUserById(id),
  getPostsByUserId(id),
  getCommentsByUserId(id)
]);
```

## Testing Standards

### Test File Naming
- Place tests next to source: `user-service.test.ts`
- Or in separate directory: `tests/user-service.test.ts`

### Test Structure
```typescript
describe("UserService", () => {
  describe("getUserById", () => {
    it("should return user when found", async () => {
      // Arrange
      const userId = "123";
      const expectedUser = { id: userId, email: "test@example.com" };

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });

    it("should throw UserNotFoundError when user doesn't exist", async () => {
      // Arrange
      const userId = "nonexistent";

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects.toThrow(UserNotFoundError);
    });
  });
});
```

### Test Coverage
- Minimum **90%** line coverage
- Minimum **85%** branch coverage
- Test edge cases and error paths
- Don't test implementation details

### Mocking
- Mock external dependencies (database, API calls)
- Don't mock the system under test
- Use dependency injection for testability

## Security Standards

### Input Validation
- Validate all user input
- Sanitize data before using in queries or rendering
- Use type guards and runtime validation (e.g., Zod, Yup)

```typescript
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
});

function createUser(data: unknown) {
  const validated = UserSchema.parse(data);  // Throws if invalid
  // Use validated data
}
```

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL

**Good**:
```typescript
const user = await db.query(
  "SELECT * FROM users WHERE id = $1",
  [userId]
);
```

**Bad**:
```typescript
const user = await db.query(
  `SELECT * FROM users WHERE id = '${userId}'`  // SQL injection risk!
);
```

### Secrets Management
- Never hardcode secrets
- Use environment variables
- Don't commit `.env` files
- Rotate secrets regularly

```typescript
const apiKey = process.env.API_KEY;  // Good
const apiKey = "abc123";  // Bad!
```

### Authentication
- Hash passwords with bcrypt (12+ rounds)
- Use secure session management
- Implement rate limiting
- Use HTTPS in production

## Performance Standards

### Database Queries
- Add indexes for frequently queried columns
- Avoid N+1 queries - use joins or batch loading
- Paginate large result sets
- Use connection pooling

### Caching
- Cache expensive computations
- Use appropriate TTL values
- Invalidate cache when data changes

### Algorithmic Complexity
- Avoid O(n²) or worse for large datasets
- Use appropriate data structures
- Profile before optimizing

## Imports and Dependencies

### Import Order
1. External libraries
2. Internal modules (absolute imports)
3. Relative imports

```typescript
// External
import express from "express";
import { z } from "zod";

// Internal
import { UserService } from "@/services/user-service";
import { logger } from "@/utils/logger";

// Relative
import { validateEmail } from "./validators";
```

### Avoid Circular Dependencies
- Use dependency injection
- Extract shared code to separate modules
- Use interfaces to break cycles

## Git Commit Standards

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Example**:
```
feat(auth): add password reset functionality

Implement secure password reset using time-limited tokens.
Tokens expire after 1 hour and are single-use.

Closes #123
```

### Commit Best Practices
- One logical change per commit
- Write clear, descriptive messages
- Reference issue numbers
- Keep commits small and focused

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] All tests pass
- [ ] Code follows naming conventions
- [ ] Functions are small and focused
- [ ] Error handling is present
- [ ] No hardcoded values or secrets
- [ ] Comments explain complex logic
- [ ] Type annotations are complete
- [ ] No console.log() or debugging code
- [ ] Documentation is updated
- [ ] No linting errors

## Linting and Formatting

### Tools
- **TypeScript**: ESLint + Prettier
- **Python**: Ruff + Black
- **Java**: Checkstyle + Spotless
- **Go**: golangci-lint + gofmt

### Pre-commit Hooks
Install pre-commit hooks to enforce standards:

```bash
npm install -D husky lint-staged
```

### Configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier config
- `.editorconfig` - Editor settings

## Exceptions

When you need to deviate from these standards:

1. Document why with a comment
2. Get approval during code review
3. Add entry to technical debt log

```typescript
// EXCEPTION: Using deprecated API until v2 is ready
// TODO: Migrate to new API (ticket #456)
const result = await legacyApi.call();
```

---

**Note**: These standards evolve with the project. Propose changes through the team review process.
