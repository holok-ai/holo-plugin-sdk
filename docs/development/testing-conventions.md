# Testing Conventions

## Test Organization

The project uses a specific test organization structure:

### 1. Integration and Baseline Tests

- **Location**: `/tests/` directory
- **Purpose**: Integration tests, baseline tests, performance tests
- **Examples**:
  - `/tests/integration/` - Integration tests
  - `/tests/baseline/` - Baseline validation tests

### 2. Package Unit Tests

- **Location**: NOT in package src directories
- **Important**: Test files (`*.test.ts`) are excluded from TypeScript compilation
- **Convention**:
  - Test packages (like `test-common`, `test-consumer`) can have tests in src
  - Regular packages should NOT have tests in their src directories
  - Do NOT use `__tests__` directories in packages

### Known Issues

1. **ESLint Configuration**: Test files in package directories will fail ESLint because they're not included in tsconfig.json
2. **ArkType with Jest**: There are ESM/CommonJS compatibility issues with arktype in Jest tests

### Jest Configuration

The project's `jest.config.cjs` supports:

- Test matching patterns: `**/__tests__/**/*.test.ts` and `**/?(*.)+(spec|test).ts`
- Roots: `<rootDir>/src`, `<rootDir>/tests`, `<rootDir>/packages`
- However, due to TypeScript and ESLint constraints, tests should primarily be in `/tests/` directory

### Recommendations

1. Place integration tests in `/tests/integration/`
2. Place baseline tests in `/tests/baseline/`
3. For package-specific tests that require importing from built packages, consider:
   - Creating test-specific packages (like `test-common`)
   - Or placing tests in `/tests/unit/` with proper imports

## Test File Naming

- Use `.test.ts` suffix for test files
- Use descriptive names that indicate what is being tested
- Example: `provider-types.test.ts`, `workspace.test.ts`
