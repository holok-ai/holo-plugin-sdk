# Architecture Comparison

## Current Branch (feature/monorepo-plugins) vs Proposed Open-Core

### What This Branch Implemented

This feature branch created a **single monorepo** with packages:

```
llm-proxy/                           # One monorepo
├── src/                             # Main app (private logic)
│   ├── app.ts
│   ├── servers/
│   ├── services/                    # All services including plugin loading
│   └── ...
├── packages/
│   ├── common/                      # @holokai/common
│   │   ├── plugin/                  # Plugin interfaces
│   │   ├── holo/                    # Universal types
│   │   ├── provider/                # Provider types
│   │   └── utils/                   # Utilities
│   ├── provider-openai/             # @holokai/provider-openai
│   │   ├── plugin.ts
│   │   ├── provider.ts
│   │   ├── translator.ts
│   │   └── [PROBLEM] base/, db/, services/, utils/ (duplication)
│   ├── provider-claude/             # Similar structure with duplication
│   └── provider-ollama/             # Similar structure with duplication
└── LICENSE: Proprietary             # Everything is closed source
```

**Key Issues Identified:**

1. **Massive Code Duplication**
   - Each provider plugin: ~4000 lines (should be ~300)
   - Duplicated: `base/`, `db/`, `services/`, `utils/`, `holo/`, `legacy-types/`
   - Plugins are NOT thin - they carry infrastructure code

2. **Everything Closed Source**
   - No way for community to contribute
   - No way to open-source the SDK
   - SDK and proprietary code mixed together

3. **Unclear Boundaries**
   - `@holokai/common` has plugin system AND runtime logic
   - Plugins have their own copies of services
   - No clear separation between contracts vs implementation

4. **Publishing Issues**
   - Can't publish packages without exposing private code
   - Would need to carefully audit what's in common
   - Providers can't be published with all that duplication

---

## Proposed Open-Core Architecture

Two separate repositories with clear boundaries:

### Repository 1: holo (Private)

```
holo/                                # Private GitHub repo
├── src/
│   ├── app.ts                       # API server
│   ├── servers/
│   │   ├── worker.server.ts         # Worker
│   │   └── auditor.server.ts        # Auditor
│   ├── services/                    # ALL orchestration stays here
│   │   ├── queue.service.ts
│   │   ├── config.service.ts
│   │   ├── response.service.ts
│   │   └── plugin/                  # Plugin loading/discovery
│   │       ├── discovery.service.ts # How to find plugins
│   │       ├── loader.service.ts    # How to load plugins
│   │       └── registry.service.ts  # How to manage plugins
│   ├── db/                          # Prisma, migrations
│   ├── admin/                       # Admin server
│   └── api/                         # REST endpoints
├── package.json
│   dependencies:
│     "@holokai/sdk": "^1.0.0"       # From npm
│     "@holokai/provider-openai": "^1.0.0"
└── LICENSE: Proprietary
```

**What stays private:**

- ✅ How plugins are discovered (filesystem, db, admin server)
- ✅ Multi-tenant orchestration
- ✅ Queue management
- ✅ Provider/guard selection logic
- ✅ Business rules and algorithms
- ✅ Admin check-in protocol

### Repository 2: holokai (Public Monorepo)

```
holokai/                             # Public GitHub repo
├── packages/
│   ├── sdk/                         # @holokai/sdk
│   │   ├── plugin/
│   │   │   ├── types.ts             # IProviderPlugin, IGuardPlugin
│   │   │   ├── base.ts              # Minimal BasePlugin
│   │   │   └── manifest.ts          # PluginManifest shape
│   │   ├── holo/
│   │   │   └── types.ts             # HoloRequest, HoloResponse
│   │   ├── provider/
│   │   │   └── types.ts             # IProvider, ProviderConfig
│   │   └── guard/
│   │       └── types.ts             # IGuard, GuardConfig
│   │
│   ├── provider-openai/             # @holokai/provider-openai
│   │   ├── plugin.ts                # ~100 lines
│   │   ├── provider.ts              # ~100 lines
│   │   ├── translator.ts            # ~100 lines
│   │   └── index.ts
│   │   └── package.json
│   │       peerDependencies:
│   │         "@holokai/sdk": "^1.0.0"
│   │
│   ├── provider-claude/             # ~300 lines total
│   ├── provider-ollama/             # ~300 lines total
│   ├── guard-pii/                   # @holokai/guard-pii
│   └── client/                      # @holokai/client (future)
│
└── LICENSE: MIT
```

**What's public:**

- ✅ Pure contracts (IProvider, IGuard, IPlugin)
- ✅ Holo universal format types
- ✅ Type guards and validators (no side effects)
- ✅ First-party provider implementations (thin!)
- ✅ First-party guard implementations
- ✅ API client SDK (future)

---

## Comparison Table

| Aspect                  | Current Branch                                    | Proposed Architecture               |
| ----------------------- | ------------------------------------------------- | ----------------------------------- |
| **Repos**               | 1 monorepo                                        | 2 repos (private + public)          |
| **License**             | All proprietary                                   | Split: proprietary + MIT            |
| **Provider size**       | ~4000 lines (bloated)                             | ~300 lines (thin)                   |
| **Code duplication**    | Massive (base/, services/, utils/ in each plugin) | None (shared via SDK)               |
| **Community**           | Can't contribute                                  | Can create plugins/guards           |
| **Publishing**          | Can't publish safely                              | SDK + plugins publishable           |
| **Boundaries**          | Blurry (runtime in common)                        | Clear (SDK=contracts, holo=runtime) |
| **IP Protection**       | Mixed with SDK                                    | Separated cleanly                   |
| **Plugin Discovery**    | Would be in common (bad)                          | In holo (good)                      |
| **Orchestration**       | Mixed everywhere                                  | Only in holo                        |
| **First-party plugins** | ~29 files each                                    | ~5 files each                       |

---

## Migration from Current Branch

### What to Keep from This Branch

✅ **packages/common/src/plugin/** - Plugin interfaces (move to SDK)
✅ **packages/common/src/holo/** - Holo universal types (move to SDK)
✅ **packages/common/src/provider/types.ts** - Provider contracts (move to SDK)
✅ **Plugin manifest concept** - Already good
✅ **Worker integration** - Shows plugins work

### What to Remove/Refactor

❌ **packages/provider-\*/src/base/** - Delete (duplicated)
❌ **packages/provider-\*/src/db/** - Delete (shouldn't be in plugins)
❌ **packages/provider-\*/src/services/** - Delete (shouldn't be in plugins)
❌ **packages/provider-\*/src/utils/** - Delete (use SDK utils)
❌ **packages/provider-\*/src/legacy-types/** - Delete or move to SDK

### What to Move to Private Holo

✅ **src/services/plugin/** - Discovery, loading, registry (stays in holo)
✅ All orchestration logic
✅ Admin integration
✅ Queue management

---

## Key Differences in Approach

### Current Branch Philosophy

> "Create a monorepo with plugin packages so we can organize code better"

**Result:** Better organization, but still one big closed-source repo with bloated plugins.

### Proposed Architecture Philosophy

> "SDK defines WHAT a plugin is. Holo defines HOW plugins are used."

**Result:** Clear separation enabling:

- Open-source SDK for community
- Thin, independent provider plugins (~300 lines)
- Protected proprietary business logic
- Marketing via GitHub stars
- Extensibility via community plugins

---

## Can We Evolve Current Branch?

**Short answer:** No, you need to split the repos.

**Why?**

1. **Licensing** - Can't have MIT and proprietary in same repo
2. **GitHub visibility** - Can't make repo public with private code
3. **Trust** - Community needs to see full SDK source
4. **Publishing** - npm packages need clean boundaries

**The current branch is a stepping stone:**

- ✅ Proved plugin system works
- ✅ Identified what needs to be in SDK
- ✅ Showed what bloat to remove
- ❌ Can't achieve open-core goal without split

---

## Next Steps

### From Current Branch to Open-Core

1. **Create `holokai` public repo**
   - Extract `packages/common` → `packages/sdk`
   - Clean SDK (remove runtime logic)
   - Add provider-openai (thin version, ~300 lines)
   - Publish to npm

2. **Refactor current `llm-proxy` repo**
   - Remove `packages/` directory
   - Add `@holokai/sdk` as dependency
   - Update imports
   - Keep all services in src/

3. **Rename/archive current branch**
   - This branch was exploratory
   - Keep it for reference
   - Start fresh with new structure

---

## Bottom Line

**Current branch = Good experiment, proved concept works**
**Proposed architecture = Production-ready, enables business model**

The current branch helped us learn:

- What plugin interface should look like ✅
- That plugins work in the system ✅
- How much code duplication exists ❌
- That we can't just reorganize - need separate repos ✅

Time to execute the open-core split properly.
