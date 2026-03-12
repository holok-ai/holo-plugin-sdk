# @holokai/types

## 1.2.0

### Minor Changes

- Pricing system, cache invalidation, `/holo/api` route prefix, model access checks, Claude SDK update.
  - Pricing system: plans, sheets, per-model token costs with bulk recalculation via CTE
  - Cache invalidation endpoints for Redis flush on application/provider updates
  - Moved Holo management APIs to `/holo/api` prefix to separate from provider routes
  - Model access validation in request pipeline
  - Updated Claude provider SDK and response translators
  - Plugin route and protocol type updates

## 1.1.0

### Minor Changes

- ProviderRequest/ProviderResponse entity types with metadata JSONB
- ProtocolCapability enum (chat, generate, embed, models)
- Plugin, Protocol, PricingPlan entity types
- Renamed `model_slug` → `access_model`, added `client_identifier`
- Auth type definitions (HoloToken, JWT options)
- Plugin route and protocol type declarations

### Patch Changes

- fd64cb1: Moved app to separate workspace so that we can track with changeset.

## 1.0.0

### Minor Changes

- Broke up SDK to have dependency-less @holokai/types. Reorganized types and interfaces. Fixed up some types vs interfaces. Prefixed true interfaces that are used to describe classes vs TypeScript interfaces used to just describe an object.
