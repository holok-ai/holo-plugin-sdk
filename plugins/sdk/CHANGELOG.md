# @holokai/sdk

## 1.2.1

### Patch Changes

- @holokai/types@1.2.1

## 1.2.0

### Minor Changes

- Pricing system, cache invalidation, `/holo/api` route prefix, model access checks, Claude SDK update.
  - Pricing system: plans, sheets, per-model token costs with bulk recalculation via CTE
  - Cache invalidation endpoints for Redis flush on application/provider updates
  - Moved Holo management APIs to `/holo/api` prefix to separate from provider routes
  - Model access validation in request pipeline
  - Updated Claude provider SDK and response translators
  - Plugin route and protocol type updates

### Patch Changes

- Updated dependencies
  - @holokai/types@1.2.0

## 1.1.0

### Minor Changes

- BaseServer with composable mixins (withDB, withQueue, withAdmin, withStats)
- BaseProvider abstract class with plugin contract
- Plugin RouteTree with `{ name, capability }` protocol declarations
- `pickDefined` utility for stripping undefined fields
- `stringifyAny` utility (renamed from `stringifyError`)
- Base auditor and wire adapter classes for provider plugins

### Patch Changes

- fd64cb1: Moved app to separate workspace so that we can track with changeset.
- Updated dependencies
  - @holokai/types@1.1.0

## 1.0.0

### Minor Changes

- Broke up SDK to have dependency-less @holokai/types. Reorganized types and interfaces. Fixed up some types vs interfaces. Prefixed true interfaces that are used to describe classes vs TypeScript interfaces used to just describe an object.

### Patch Changes

- Updated dependencies
  - @holokai/types@1.0.0
