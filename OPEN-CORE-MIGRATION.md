# Open Core Migration Plan

## Goal

Transform holo from a private monolith into an open-core platform with:

- **Private**: Core business logic (holo app)
- **Public**: SDK + first-party plugins (holokai SDK)

## Phase 1: Create holokai SDK Repo (Public)

### Step 1: Create new public repo

```bash
# New repo: holokai
mkdir holokai
cd holokai
git init
```

### Step 2: Extract SDK from current packages/common

```
holokai/
├── packages/
│   └── sdk/
│       ├── src/
│       │   ├── plugin/          # From packages/common/src/plugin
│       │   ├── holo/            # From packages/common/src/holo
│       │   ├── provider/        # From packages/common/src/provider
│       │   └── guard/           # NEW: Guard interfaces
│       └── package.json
│           name: "@holokai/sdk"
│           version: "1.0.0"
│           license: "MIT"
```

**What goes in SDK:**

- ✅ Interfaces: `IProviderPlugin`, `IGuardPlugin`, `IEvaluatorPlugin`
- ✅ Base classes: `BasePlugin` (minimal)
- ✅ Types: `HoloRequest`, `HoloResponse`, `PluginManifest`
- ✅ Pure utilities: Type guards, validators (no side effects)
- ✅ API versioning: `PluginApiVersion` for evolution
- ❌ Services: NO queue, config, admin services
- ❌ Discovery: NO file system scanning, DB queries
- ❌ Orchestration: NO multi-tenant wiring, RBAC, routing
- ❌ Runtime: NO plugin loading/lifecycle management
- ❌ Database: NO Prisma schemas, migrations
- ❌ Business logic: NO private algorithms

**Key principle:** SDK defines contracts and shapes. Holo implements discovery, loading, and orchestration.

### Step 3: Create first-party provider packages

```
holokai/
├── packages/
│   ├── sdk/                     # Already done
│   ├── provider-openai/
│   │   ├── src/
│   │   │   ├── plugin.ts        # ~100 lines
│   │   │   ├── translator.ts    # ~200 lines
│   │   │   └── index.ts
│   │   └── package.json
│   │       name: "@holokai/provider-openai"
│   │       peerDependencies:
│   │         "@holokai/sdk": "^1.0.0"
│   │
│   ├── provider-claude/         # Same structure
│   └── provider-ollama/         # Same structure
```

**What goes in each provider:**

- ✅ Plugin implementation (extends BasePlugin)
- ✅ Provider-specific translator (OpenAI ↔ Holo)
- ✅ Provider-specific types (OpenAI SDK types)
- ❌ NO copies of base/, utils/, services/
- ❌ NO database schemas
- ❌ NO queue handling

### Step 4: Publish to npm

```bash
cd packages/sdk
npm publish --access public

cd ../provider-openai
npm publish --access public
```

## Phase 2: Refactor holo App (Private)

### Step 1: Remove packages/ from holo

```bash
# In holo repo
rm -rf packages/
```

### Step 2: Add SDK as dependency

```json
// holo/package.json
{
  "name": "holo",
  "private": true,
  "dependencies": {
    "@holokai/sdk": "^1.0.0",
    "@holokai/provider-openai": "^1.0.0",
    "@holokai/provider-claude": "^1.0.0",
    "@holokai/provider-ollama": "^1.0.0"
  }
}
```

### Step 3: Update imports

```typescript
// Before
import { IProviderPlugin } from '../packages/common/src/plugin';

// After
import { IProviderPlugin } from '@holokai/sdk/plugin';
```

### Step 4: Keep private in holo

```
holo/
├── src/
│   ├── app.ts                  # API server
│   ├── servers/
│   │   ├── worker.server.ts    # Worker
│   │   └── auditor.server.ts   # Auditor
│   ├── services/               # ALL services stay here
│   │   ├── queue.service.ts
│   │   ├── config.service.ts
│   │   ├── response.service.ts
│   │   └── plugin/
│   │       ├── discovery.service.ts
│   │       ├── loader.service.ts
│   │       └── registry.service.ts
│   ├── db/                     # Prisma, migrations
│   ├── admin/                  # Admin APIs
│   └── api/                    # REST endpoints
└── LICENSE: Proprietary
```

## Phase 3: Documentation & Community

### Step 1: Create holokai README

```markdown
# Holokai SDK

Open-source SDK for building LLM provider plugins and guards for the Holo platform.

## Quick Start

\`\`\`bash
npm install @holokai/sdk
\`\`\`

## Create a Provider Plugin

\`\`\`typescript
import { BasePlugin, IProviderPlugin } from '@holokai/sdk/plugin';

export class MyProviderPlugin extends BasePlugin implements IProviderPlugin {
// Your implementation
}
\`\`\`

## Official Plugins

- @holokai/provider-openai
- @holokai/provider-claude
- @holokai/provider-ollama

## Community Plugins

Want to add support for a new LLM? Create a plugin!
See [CONTRIBUTING.md](CONTRIBUTING.md)
```

### Step 2: Add CONTRIBUTING.md

- How to create a provider plugin
- Testing guidelines
- Publishing to npm
- Naming conventions

### Step 3: Add examples/

```
holokai/
└── examples/
    ├── custom-provider/
    │   └── README.md           # How to create provider
    └── custom-guard/
        └── README.md           # How to create guard
```

## Phase 4: CI/CD

### holokai (public)

```yaml
# .github/workflows/publish.yml
name: Publish to NPM
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm publish --workspaces --access public
```

### holo (private)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install # Pulls @holokai/* from npm
      - run: npm run build
      - run: npm run deploy
```

## Timeline

**Week 1: Extract SDK**

- Create holokai repo
- Move packages/common → packages/sdk
- Clean up SDK (remove services, db)
- Add proper exports

**Week 2: Extract Providers**

- Create provider-openai package (thin, ~300 lines)
- Create provider-claude package
- Create provider-ollama package
- Remove duplication

**Week 3: Publish & Refactor**

- Publish @holokai/\* to npm
- Update holo to use published packages
- Test everything works

**Week 4: Documentation**

- Write SDK docs
- Create contribution guide
- Add examples

## Benefits

1. **Clear Boundaries**
   - No accidental IP leaks
   - Community contributions isolated

2. **Marketing**
   - GitHub stars drive adoption
   - Developers can test locally

3. **Ecosystem**
   - Community creates long-tail providers
   - Your platform becomes standard

4. **Security**
   - Open SDK gets community security audits
   - Private app stays protected

## Key Refinements (from OpenAI)

### 1. Keep SDK Contracts Minimal

The SDK should be **pure contracts only**:

- ✅ Interface definitions (IProvider, IGuard)
- ✅ Type shapes (HoloRequest, HoloResponse)
- ✅ Zero-dependency utilities
- ❌ NO runtime orchestration
- ❌ NO discovery logic
- ❌ NO business logic

**SDK defines WHAT a plugin looks like. Holo defines HOW plugins are used.**

### 2. API Versioning

Version the plugin API explicitly for evolution:

```typescript
export type PluginApiVersion = 'v1';

export interface PluginManifest {
  apiVersion: PluginApiVersion; // Required
  name: string;
  version: string;
  // ...
}
```

This lets holo enforce `apiVersion: 'v1'` while leaving room for future versions.

### 3. Simple Plugin Abstraction (v1)

Don't over-engineer. Start with:

```typescript
export interface IProviderPlugin {
  provider: IProvider;
  manifest: ProviderManifest;
}
```

Enough to:

- Identify the provider
- Advertise capabilities
- Instantiate with config

Heavy plugin frameworks can come later if needed.

### 4. Future-Proof Naming (Optional)

Current naming is fine for v1:

- `@holokai/provider-openai`
- `@holokai/provider-claude`

If you later add embeddings, rerankers, vector DBs, consider:

- `@holokai/provider-llm-openai`
- `@holokai/provider-embed-openai`
- `@holokai/provider-rerank-cohere`

Not required now, but keep in mind.

### 5. Boundary Between SDK and Holo

**SDK (Public):**

- Model/ProviderDescriptor shapes
- IProvider interface with `models(): Promise<ModelDescriptor[]>`
- Pure contracts

**Holo (Private):**

- Which models allowed for which org/app
- Which provider packages allowed
- Provider configs (API keys, endpoints)
- Plugin discovery/loading
- Admin check-in protocol

Worker checks in to admin → receives config → instantiates providers using SDK contracts.

## Questions?

1. **Can we still develop rapidly?**
   Yes! Use `file:` dependencies during dev:

   ```json
   "@holokai/sdk": "file:../holokai/packages/sdk"
   ```

2. **What if we need breaking changes?**
   SDK uses semver + explicit `apiVersion` field. Major versions for breaking changes.

3. **How do we prevent forks?**
   SDK is MIT/Apache, but holo platform has network effects:
   - Hosted service
   - Enterprise features
   - Support & SLAs

4. **What about the plugin discovery?**
   Holo (private) scans npm for `holokai-provider-*` or `@*/holokai-provider-*`.
   Admin server controls which are actually allowed in production.
