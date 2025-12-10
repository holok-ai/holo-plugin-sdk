# @holokai/common Package Testing Guide

## Overview

This guide explains how we verify that the @holokai/common package is properly built, can be published to npm, and can
be consumed by other packages.

## Testing Strategy

### 1. Build Verification

Before publishing, we verify the package builds correctly:

```bash
cd packages/common
npm run build
```

This should:

- Compile TypeScript to JavaScript in `dist/`
- Generate type declarations (`.d.ts` files)
- Create sourcemaps for debugging

### 2. Package Verification Script

Run the verification script before publishing:

```bash
node scripts/verify-package.js
```

This script checks:

- ✅ package.json has required fields (name, version, main, types)
- ✅ dist folder exists with compiled output
- ✅ Main entry point (dist/index.js) exists
- ✅ Type declarations (dist/index.d.ts) exist

### 3. Local Testing with npm link

Test the package locally before publishing:

```bash
# In packages/common
npm link

# In a test project or another package
npm link @holokai/common

# Now you can import it
import { Plugin, HoloRequest } from '@holokai/common';
```

### 4. Test Consumer Package

The `packages/test-consumer` package serves as an integration test:

```bash
cd packages/test-consumer
npm install
npm test
```

This verifies:

- Package can be installed as a dependency
- Types are properly exported and work with TypeScript
- Runtime exports work correctly

### 5. npm Pack Testing

Test what would be published without actually publishing:

```bash
cd packages/common
npm pack --dry-run
```

This shows exactly which files would be included in the npm package.

### 6. Pre-publish Checklist

Before running `npm publish`:

- [ ] All tests pass: `npm test`
- [ ] Package builds: `npm run build`
- [ ] Verification passes: `node scripts/verify-package.js`
- [ ] Version bumped in package.json
- [ ] CHANGELOG updated
- [ ] Git tag created for version
- [ ] No sensitive files in package (check .npmignore)

### 7. Continuous Integration

In CI/CD pipeline, run:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Verify package
cd packages/common && node scripts/verify-package.js
```

## Common Issues and Solutions

### Issue: Types not found after installation

**Solution**: Ensure `types` field in package.json points to the correct .d.ts file

### Issue: Module not found at runtime

**Solution**: Check `main` field points to compiled JS, not TS source

### Issue: Large package size

**Solution**: Review .npmignore, ensure only necessary files are published

### Issue: Peer dependency conflicts

**Solution**: Use `peerDependencies` for shared dependencies like TypeScript

## Testing After Publishing

Once published to npm:

1. Create a fresh test project
2. Install the package: `npm install @holokai/common`
3. Test imports work in both JS and TS
4. Verify IntelliSense/autocomplete works
5. Check package size with `npm pack @holokai/common`

## Automated Testing Pipeline

Our testing pipeline ensures quality at every stage:

1. **Pre-commit**: ESLint, Prettier, TypeScript checks
2. **PR checks**: Build verification, tests, package verification
3. **Pre-publish**: Full verification suite
4. **Post-publish**: Integration tests in consumer packages

## Version Management

Follow semantic versioning:

- PATCH (0.0.x): Bug fixes, documentation
- MINOR (0.x.0): New features, backward compatible
- MAJOR (x.0.0): Breaking changes

Always test with the exact version that will be published!
