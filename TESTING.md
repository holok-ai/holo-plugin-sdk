# @holokai/holo-sdk Testing Guide

## Test Layers

The SDK has two test layers, each in its own Vitest project:

| Layer       | Project           | Directory            | Requires             |
|-------------|-------------------|----------------------|----------------------|
| Unit        | `sdk`             | `tests/unit/`        | Nothing (mock fetch) |
| Integration | `sdk-integration` | `tests/integration/` | Live Holo gateway    |

## Running Tests

```bash
# SDK unit tests
npx vitest run --project sdk

# All fast tests (SDK unit + provider conformance)
npm test

# SDK integration tests (skipped without HOLO_URL)
npm run test:integration

# Or with env vars
HOLO_URL=https://holo.example.com HOLO_TEST_TOKEN=my-token npx vitest run --project sdk-integration

# Watch mode (unit tests)
npx vitest --project sdk

# Coverage
npm run test:coverage
```

## Unit Tests

Unit tests use mock `fetch` via `HoloClientOptions.fetch` — no live server needed.

| File                     | What it tests                                                           |
|--------------------------|-------------------------------------------------------------------------|
| `builder.test.ts`        | Chaining, `build()` output, defaults, response_format, tool_choice      |
| `client.test.ts`         | URL normalization, auth headers, `request()`, `streamRequest()`, errors |
| `chat-namespace.test.ts` | Proxy methods, `create()`, builder inheritance, system parity           |
| `sse.test.ts`            | Buffer splitting, multi-line data, malformed blocks, partial buffers    |
| `merge.test.ts`          | Text accumulation, `toResponse()`, tool call deltas, failed events      |
| `stream.test.ts`         | Async iteration, double-iterate guard, `.text()`, `.on()`, `.abort()`   |
| `runner.test.ts`         | Tool loop, maxIterations cap, abort, event emission                     |
| `errors.test.ts`         | HoloApiError, HoloStreamError, HoloTimeoutError properties              |

### Writing Unit Tests

Tests import directly from source (no build needed — Vitest transforms TypeScript):

```typescript
import {describe, it, expect, vi} from 'vitest';
import {HoloClient} from '../../src/client/client.js';

describe('HoloClient', () => {
    it('strips trailing slashes', async () => {
        const fetchFn = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({success: true, data: []}), {status: 200}),
        );
        const client = new HoloClient({baseUrl: 'https://holo.example.com/', token: 'tok', fetch: fetchFn});
        await client.models.list();
        expect(fetchFn.mock.calls[0][0]).toBe('https://holo.example.com/holo/api/v1/models');
    });
});
```

For streaming tests, use `createSseMockFetch` from `@holokai/holo-test` or build a `ReadableStream` directly.

## Integration Tests

Integration tests hit a live Holo gateway. The setup file checks for required env vars and fails
immediately with a clear error message if they're missing — no silent skips.

| File                   | What it tests                                                |
|------------------------|--------------------------------------------------------------|
| `chat-create.test.ts`  | `client.chat.create()` returns complete response             |
| `chat-stream.test.ts`  | `client.chat.stream()` text + parity with create             |
| `tools.test.ts`        | `client.chat.runner()` tool loop end-to-end                  |
| `cancellation.test.ts` | Abort mid-stream without unhandled errors                    |
| `errors.test.ts`       | 401/404 map to `HoloApiError` with correct status            |
| `smoke-matrix.test.ts` | Minimal prompt per provider (openai, claude, gemini, ollama) |

Integration tests assert only on Holo API and SDK behavior, not provider-native payload structure.
Provider translation correctness belongs in the conformance tests.

### Env Variables

| Variable          | Required | Description                     |
|-------------------|----------|---------------------------------|
| `HOLO_URL`        | Yes      | Base URL of the Holo gateway    |
| `HOLO_TEST_TOKEN` | Yes      | Bearer token (JWT or HoloToken) |

## Vitest Configuration

The SDK has two Vitest project configs:

- **`vitest.config.ts`** — unit tests (`tests/unit/**/*.test.ts`), project name `sdk`
- **`vitest.integration.config.ts`** — integration tests (`tests/integration/**/*.test.ts`), project name
  `sdk-integration`

Both use `vite-tsconfig-paths` to resolve `@holokai/*` path aliases from the root tsconfig.

The root `npm test` runs all fast projects (including `sdk`) but excludes `sdk-integration`.
Integration tests run only via `npm run test:integration` or `npx vitest run --project sdk-integration`.
