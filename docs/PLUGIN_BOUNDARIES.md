# Plugin Boundary Guidelines

> **Last Updated:** 2025-12-18
> **Status:** ✅ All plugins validated and compliant

---

## Overview

This document defines the boundaries between plugins and the main codebase, ensuring proper isolation and preventing build issues.

---

## The Problem

When plugins import from the main `./src` directory (e.g., `import { Foo } from '../../../src/utils'`), TypeScript's project references follow these imports during compilation, causing:

1. **Compiled files in wrong locations**: `.js`, `.d.ts`, `.js.map`, `.d.ts.map` files generated in `./src` instead of `./dist`
2. **Build cascading**: Building one plugin triggers compilation of the entire main codebase
3. **Circular dependencies**: Plugins depend on main, main depends on plugins
4. **Type conflicts**: Multiple compilation outputs create type resolution issues

---

## Plugin Import Rules

### ✅ Allowed Imports

#### 1. SDK Imports
```typescript
import { HoloRequest, HoloResponse } from '@holokai/sdk';
import { BaseTranslator } from '@holokai/sdk/provider';
```
**Why:** Proper dependency through published package or workspace reference.

#### 2. External Package Imports
```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
```
**Why:** Standard npm packages, properly declared in `package.json`.

#### 3. Plugin-Internal Imports (Relative)
```typescript
// From: plugins/holo-provider-claude/src/translators/streaming/file.ts
import { ClaudeTypes } from '../../types';       // ✅ Stays within plugin
import { mapFinishReason } from '../../utils';   // ✅ Stays within plugin
import { Something } from '../shared';           // ✅ Stays within plugin
```
**Why:** Internal plugin organization, never escapes plugin directory.

---

### ❌ Forbidden Imports

#### 1. Main Src Directory Imports
```typescript
// ❌ NEVER DO THIS
import { ErrorMessages } from '../../../src/utils';
import { ResponseService } from '../../../src/services';
import { Provider } from '../../../src/db/types';
```
**Why:** Causes TypeScript to compile main `./src` when building plugin.

#### 2. Absolute Path Imports to Main
```typescript
// ❌ NEVER DO THIS
import { Foo } from '/Users/alexduan/IdeaProjects/holo/src/foo';
import { Bar } from '/src/bar';
```
**Why:** Hard-coded paths break portability and cause build issues.

---

## How to Fix Forbidden Imports

### Option 1: Use SDK (Preferred)
If the type/utility is generic and reusable:
```typescript
// Move to @holokai/sdk and import from there
import { HoloErrorMessages } from '@holokai/sdk/utils';
```

### Option 2: Copy into Plugin
If the code is specific to this plugin:
```typescript
// Copy the utility into your plugin
// plugins/holo-provider-openai/src/utils/error-messages.ts
export const ErrorMessages = {
  apiKeyRequired: (provider: string) => `${provider} API key is required`
};
```

### Option 3: Create Common Package
If shared by multiple plugins but not in SDK:
```typescript
// Create @holokai/common and import from there
import { SharedUtil } from '@holokai/common';
```

---

## Validation

### Automated Validation Script

Run this command to check plugin boundaries:

```bash
npm run validate:plugin-boundaries
```

This script checks for:
1. ✅ Imports escaping to main `./src` (3+ parent directory levels)
2. ✅ Compiled files in plugin `src/` directories (should only be in `dist/`)
3. ✅ Compiled files in main `src/` directory (should only be in `dist/`)

### Manual Validation

Search for problematic imports:
```bash
# Check for imports with 3+ parent directories (escaping plugin)
grep -r "from ['\"].*\.\./\.\./\.\." plugins/*/src --include="*.ts"

# Check for main src imports
grep -r "from ['\"].*src/" plugins/*/src --include="*.ts" | grep -v "from ['\"]\./"
```

### Pre-commit Hook (Optional)

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run validate:plugin-boundaries
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Plugin boundary validation failed!"
  echo "Fix the imports before committing."
  exit 1
fi
```

---

## Directory Structure

### Correct Plugin Structure
```
plugins/holo-provider-{name}/
├── src/
│   ├── index.ts              # Plugin entrypoint
│   ├── plugin.ts             # ProviderPlugin implementation
│   ├── manifest.ts           # Plugin metadata
│   ├── {provider}.provider.ts
│   ├── translators/
│   │   └── ...
│   ├── types/
│   │   └── index.ts          # Plugin-specific types
│   ├── utils/
│   │   └── ...               # Plugin-specific utilities
│   └── services/
│       └── ...
├── dist/                     # Build output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### Import Resolution Examples

**File:** `plugins/holo-provider-claude/src/translators/streaming/translator.ts`

```typescript
// ✅ GOOD: Imports from plugin's own types
import { ClaudeTypes } from '../../types';
// Resolves to: plugins/holo-provider-claude/src/types

// ✅ GOOD: Imports from SDK
import { HoloRequest } from '@holokai/sdk';
// Resolves to: plugins/sdk/src/holo/request.ts (via package reference)

// ❌ BAD: Would escape to main src
import { Utils } from '../../../src/utils';
// Would resolve to: src/utils (WRONG!)
```

---

## Current Status

### Plugin Inventory

| Plugin | Status | SDK Imports | Internal Imports | External Packages |
|--------|--------|-------------|------------------|-------------------|
| `@holokai/sdk` | ✅ Clean | 7 | 3 (safe) | None |
| `holo-provider-claude` | ✅ Clean | 39 | 9 (safe) | `@anthropic-ai/sdk` |
| `holo-provider-ollama` | ✅ Clean | 27 | 4 (safe) | `ollama` |
| `holo-provider-openai` | ✅ Clean | 33 | 5 (safe) | `openai` |

**Last Validated:** 2025-12-18

---

## TypeScript Configuration

### Plugin tsconfig.json

Each plugin should have:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",          // ✅ Compile to dist
    "rootDir": "./src",           // ✅ Source is in src
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "tests/**/*"],
  "references": [
    { "path": "../sdk" }          // ✅ Reference SDK
  ]
}
```

### Root tsconfig.json

Main project should exclude plugins:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "plugins", "tests"],
  "references": [
    { "path": "./plugins/sdk" }
  ]
}
```

---

## Troubleshooting

### Issue: Compiled files appearing in `./src`

**Symptom:** Running `npm run type-check` or `npm run build` creates `.js`, `.d.ts`, `.map` files in `./src`

**Cause:** A plugin is importing from `../../../src`, causing TypeScript to compile main src

**Solution:**
1. Run `npm run validate:plugin-boundaries` to find the problematic imports
2. Remove or replace the imports (see "How to Fix Forbidden Imports")
3. Clean up: `find ./src -name "*.js" -o -name "*.d.ts" -o -name "*.map" | xargs rm`
4. Run validation again to confirm

### Issue: Build fails with "not under rootDir"

**Symptom:** `error TS6059: File '/path/to/src/file.ts' is not under 'rootDir'`

**Cause:** Plugin is trying to import files outside its `rootDir`

**Solution:** Remove the import and use one of the allowed import patterns

### Issue: Type conflicts between packages

**Symptom:** `Types have separate declarations of a private property`

**Cause:** Multiple versions of the same type being compiled

**Solution:** Ensure all plugins import from `@holokai/sdk` for shared types, not local copies

---

## Best Practices

1. **Always import from SDK first:** Check if the type/utility exists in `@holokai/sdk` before copying
2. **Keep plugins self-contained:** Each plugin should work independently with only SDK dependency
3. **Run validation before commits:** Use `npm run validate:plugin-boundaries`
4. **Document cross-plugin patterns:** If multiple plugins need the same utility, add it to SDK
5. **Clean regularly:** Run `npm run clean:workspaces` to remove stale build artifacts

---

## Related Documentation

- [SDK Documentation](../packages/sdk/README.md)
- [Plugin Development Guide](../packages/sdk/docs/PLUGIN_DEVELOPMENT.md)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

## Maintenance

This document should be updated when:
- New plugins are added
- Plugin boundary rules change
- TypeScript configuration changes
- New validation checks are added

**Maintained by:** Holo Core Team
**Questions?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
