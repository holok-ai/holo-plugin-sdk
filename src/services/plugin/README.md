# Plugin Services

This directory contains the **proprietary plugin orchestration services** that remain in the private `holo` repository.

## Status: Ready for Open-Core Migration

These services are complete and functional, but they reference `@holokai/common` which doesn't exist yet. Once the open-core migration (see `OPEN-CORE-MIGRATION.md`) is complete, these services will work with the published npm package.

## Services

- **discovery.service.ts** - Discovers plugins via filesystem scanning
- **loader.service.ts** - Dynamically loads plugin modules
- **plugin.service.ts** - Orchestrates plugin initialization
- **provider-registry.service.ts** - Registry for provider plugins
- **guard-registry.service.ts** - Registry for guard plugins
- **worker-registry.service.ts** - Registry for worker plugins
- **registry.service.ts** - Base registry implementation

## What These Services Do (Private IP)

These services implement the **HOW** of plugin management:
- How plugins are discovered (filesystem scanning, npm packages)
- How plugins are loaded dynamically
- How plugins are registered and managed
- Multi-tenant orchestration
- Plugin lifecycle management

## What Goes in @holokai/sdk (Public)

The SDK defines the **WHAT** of plugins:
- `IProviderPlugin` interface
- `IGuardPlugin` interface
- `PluginManifest` type
- `PluginContext` type
- `PluginState` enum
- Pure contracts and types

## Next Steps

1. Create `holokai` public repo with SDK
2. Extract `@holokai/sdk` with plugin interfaces
3. Publish to npm
4. Update imports in these services from `@holokai/common` to `@holokai/sdk`
5. Services will then work with published SDK

## Note

These services were cherry-picked from `feature/monorepo-plugins` as the valuable ~1,500 lines of proprietary plugin orchestration logic. The bloated ~40k lines of duplicate package implementations were discarded.

See `ROLLBACK-ANALYSIS.md` for details on what was kept vs discarded.
