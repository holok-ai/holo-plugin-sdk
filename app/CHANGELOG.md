# holo

## 1.2.3

### Patch Changes

- migrate test infrastructure to Vitest, merge provider-contract-tests into test-utils, add Holo API controller

## 1.2.2

### Patch Changes

- Add historical pricing datasets with compiled snapshot normalization
  - Add PricingDataset types and normalizePricingDataset() engine to SDK that compiles raw pricing snapshots into complete point-in-time sheets with model carry-forward, alias expansion, shutdown removal, and effective_to date ranges
  - Create historical pricing datasets for Claude (15 snapshots back to 2023-03), Gemini (7 snapshots back to 2024-02), and OpenAI (12 snapshots back to 2023-06)
  - All plugins now implement getPricingSheets() returning full history; plugin service registers all sheets with effective_to for accurate historical cost calculation
  - Fix unhandled promise rejections in streaming paths for OpenAI, Gemini, and Ollama providers by deferring work into final() instead of starting floating IIFEs

## 1.2.1

### Patch Changes

- fffa2e7: Fix Docker build for monorepo structure: single Dockerfile with dev/prod build modes, split docker-compose services, optimized layer caching, and consolidated environment configuration.

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

- Plugin/protocol system with capability-based registration
- Audit tables: `provider_requests`/`provider_responses` replacing `llm_requests`/`llm_responses`
- Unified server lifecycle via BaseServer with composable mixins (withDB, withQueue, withAdmin, withStats)
- Centralized DI registrations in `container/` directory
- Auth middleware: unified `makeAuthMiddleware` with JWT, HoloToken, anonymous support
- ApplicationDB extracted from ApplicationService for proper DB/service layering
- Pricing system: plans, sheets, per-model costs, bulk recalculation
- Cache invalidation endpoints for Redis flush
- Holo management APIs moved to `/holo/api` prefix

### Patch Changes

- fd64cb1: Moved app to separate workspace so that we can track with changeset.
