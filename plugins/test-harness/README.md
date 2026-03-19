# @holokai/test-harness

Standalone test runner for Holo provider plugins. Tests wire format correctness, audit record mapping, full pipeline
behavior, and native SDK round-trip parsing — all without running the Holo app, RabbitMQ, or Postgres.

## Quick Start

```bash
# From the repo root — run all tests for all plugins
npm run holo-test -- --fixtures $PWD/plugins --verbose

# One plugin, one category
npm run holo-test -- --fixtures $PWD/plugins --plugin openai --wire

# From the test-harness directory (dev workflow)
cd plugins/test-harness
node --import ./register.mjs src/cli.ts --fixtures ../holo-provider-openai/tests/fixtures --verbose
```

## CLI Reference

```
npx holo-test [options]

Options:
  --plugin <name>     Test only this plugin family (openai, claude, gemini, ollama)
  --tag <tag>         Filter fixtures by tag (e.g. "streaming", "tool-calling")
  --fixtures <dir>    Path to scan for *.fixture.ts files (default: ./plugins)
  --wire              Run wire format tests only
  --audit             Run audit record tests only
  --pipeline          Run full pipeline tests only
  --roundtrip         Run SDK round-trip tests only
  --verbose, -v       Show diffs on failure
  --help, -h          Show this help
```

With no category flags, `--wire`, `--audit`, and `--pipeline` all run. `--roundtrip` must be explicitly requested (it
requires SDK adapters and spins up an HTTP server).

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Test Categories                             │
├────────────┬─────────────┬──────────────┬─────────────────────────┤
│   Wire     │   Audit     │  Pipeline    │  Round-trip             │
│            │             │              │                         │
│ Fixture →  │ Fixture →   │ Fixture →    │ Fixture → Wire →       │
│ WireAdapter│ Auditor →   │ Pipeline() → │ HTTP Server → SDK →    │
│ → assert   │ assert      │ assert       │ assert parsed output   │
│ body/hdrs  │ tokens/     │ chunks +     │                        │
│            │ model/status│ audit record │                        │
└────────────┴─────────────┴──────────────┴─────────────────────────┘
```

- **Wire** — feeds `providerChunks` through the plugin's `IWireAdapter`, asserts the output body strings, HTTP status,
  and headers match expectations.
- **Audit** — feeds the terminal chunk through the plugin's `IAuditor`, asserts `access_model`, token counts,
  `LlmStatus`, and metadata fields.
- **Pipeline** — runs the full `runPipelineFromFixture()` from `@holokai/lib` (the same code path used in production),
  asserts both wire output and audit record.
- **Round-trip** — starts an Express server that serves the fixture's wire output at the correct route, then points the
  native provider SDK at it and verifies the SDK can parse the response.

## Fixture Format

Fixtures are TypeScript files matching `**/*.fixture.ts`. Each exports a `FixtureScenario`:

```typescript
import type {FixtureScenario} from '@holokai/test-harness';
import {LlmStatus} from '@holokai/types/entities';

const fixture: FixtureScenario = {
    // ── Identity ──────────────────────────────────────────────
    name: 'openai/chat-simple.streaming',   // unique name, shown in output
    plugin: 'openai',                        // plugin family
    protocol: 'openai.chatCompletions',      // protocol name from plugin
    streaming: true,                         // streaming or non-streaming

    // ── Provider output ───────────────────────────────────────
    // Array of raw objects the provider SDK would return.
    // Last element = the terminal response (becomes the "done" event).
    // All preceding elements = streaming chunks (become "stream_event" events).
    providerChunks: [chunk1, chunk2, doneChunk],
    expectedText: 'Hello! How can I help?',  // accumulated text from the response

    // ── Wire expectations ─────────────────────────────────────
    // Each entry = the body string of one WireChunk.
    // Must match exactly what the wire adapter produces.
    expectedWire: [
        `data: ${JSON.stringify(chunk1)}\n\n`,
        `data: ${JSON.stringify(chunk2)}\n\n`,
        `data: ${JSON.stringify(doneChunk)}\n\n`,
        `data: [DONE]\n\n`,
    ],
    expectedStatus: 200,
    expectedHeaders: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    },

    // ── Audit expectations (optional) ─────────────────────────
    expectedAudit: {
        access_model: 'gpt-4o',
        input_tokens: 10,
        output_tokens: 6,
        status: LlmStatus.SUCCESS,
        // metadata: { ... }    // partial match on metadata fields
    },

    // ── SDK round-trip (optional) ─────────────────────────────
    sdkAdapter: adapter,                     // SdkAdapter instance
    sdkRequest: {model: 'gpt-4o', ...},    // request payload for the SDK
    expectedSdkResult: {id: '...', ...},   // partial match on SDK output

    // ── Filtering ─────────────────────────────────────────────
    tags: ['chat', 'streaming'],
};

export default fixture;
```

### Field Reference

| Field               | Required | Description                                                      |
|---------------------|----------|------------------------------------------------------------------|
| `name`              | yes      | Unique fixture name, shown in test output                        |
| `plugin`            | yes      | Plugin family: `openai`, `claude`, `gemini`, `ollama`            |
| `protocol`          | yes      | Protocol name (e.g. `openai.chatCompletions`, `claude.messages`) |
| `streaming`         | yes      | Whether the wire adapter runs in streaming mode                  |
| `providerChunks`    | yes      | Raw provider SDK objects. Last = terminal (done event).          |
| `expectedText`      | yes      | Full accumulated response text                                   |
| `expectedWire`      | yes      | Expected body string for each `WireChunk`                        |
| `expectedStatus`    | yes      | HTTP status code on first chunk                                  |
| `expectedHeaders`   | yes      | HTTP headers on first chunk (partial match)                      |
| `expectedAudit`     | no       | Audit record assertions. Omit to skip audit tests.               |
| `sdkAdapter`        | no       | `SdkAdapter` for round-trip tests. Required with `sdkRequest`.   |
| `sdkRequest`        | no       | Request payload sent via the native SDK                          |
| `expectedSdkResult` | no       | Partial match on what the SDK returns                            |
| `tags`              | no       | Tags for filtering with `--tag`                                  |

## Adding a New Fixture

### Step 1: Capture provider output

The easiest way to get fixture data is to capture real API responses. Add temporary logging in the provider's
`handleRequest` or use the Holo audit `metadata.response_raw` field.

For streaming, capture each chunk. For non-streaming, capture the full response.

### Step 2: Create the fixture file

```bash
# Convention: {scenario}.{streaming|nonstreaming}.fixture.ts
touch plugins/holo-provider-openai/tests/fixtures/chat-tool-calling.streaming.fixture.ts
```

### Step 3: Build the expected wire output

Run the provider chunks through the wire adapter mentally (or in a scratch script):

| Plugin               | Format | Stream event                      | Done event                              |
|----------------------|--------|-----------------------------------|-----------------------------------------|
| **OpenAI Chat**      | SSE    | `data: {json}\n\n`                | `data: {json}\n\n` + `data: [DONE]\n\n` |
| **OpenAI Responses** | SSE    | `event: {type}\ndata: {json}\n\n` | same format                             |
| **Claude**           | SSE    | `event: {type}\ndata: {json}\n\n` | same format                             |
| **Gemini**           | SSE    | `data: {json}\n\n`                | same format                             |
| **Ollama**           | NDJSON | `{json}\n`                        | same format                             |

For non-streaming, all plugins emit a single chunk: `JSON.stringify(response)` with `Content-Type: application/json`.

### Step 4: Add audit expectations

Check the plugin's auditor to understand how it maps tokens:

| Plugin               | Input tokens                     | Output tokens                        | Extra tokens                                             |
|----------------------|----------------------------------|--------------------------------------|----------------------------------------------------------|
| **OpenAI Chat**      | `usage.prompt_tokens`            | `usage.completion_tokens`            | `cache_read`                                             |
| **OpenAI Responses** | `response.usage.input_tokens`    | `response.usage.output_tokens`       | `cache_read`                                             |
| **Claude**           | `usage.input_tokens`             | `usage.output_tokens`                | `cache_read_input_tokens`, `cache_creation_input_tokens` |
| **Gemini**           | `usageMetadata.promptTokenCount` | `usageMetadata.candidatesTokenCount` | `thoughtsTokenCount`, `cachedContentTokenCount`          |
| **Ollama**           | `prompt_eval_count`              | `eval_count`                         | none                                                     |

### Step 5: Verify

```bash
npm run holo-test -- --fixtures $PWD/plugins/holo-provider-openai/tests/fixtures --verbose
```

## Vitest Integration

The test harness is bridged into Vitest via `@holokai/provider-contract-tests`. Each provider plugin has Vitest
conformance tests that import fixtures and run them through the harness.

### Running via Vitest

```bash
# All tests (unit + conformance), excludes integration
npm test

# SDK unit tests only
npm run test:unit

# Provider conformance tests only
npm run test:conformance

# Single provider
npx vitest run --project openai

# Multiple projects
npx vitest run --project sdk --project openai

# SDK integration tests (requires HOLO_URL)
npm run test:integration

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Project Names

| Project           | Location                        | What it tests                        |
|-------------------|---------------------------------|--------------------------------------|
| `sdk`             | `plugins/sdk`                   | SDK client unit tests                |
| `openai`          | `plugins/holo-provider-openai`  | OpenAI wire/audit/pipeline/roundtrip |
| `claude`          | `plugins/holo-provider-claude`  | Claude wire/audit/pipeline           |
| `gemini`          | `plugins/holo-provider-gemini`  | Gemini wire/audit/pipeline           |
| `ollama`          | `plugins/holo-provider-ollama`  | Ollama wire/audit/pipeline           |
| `app`             | `app`                           | App unit tests                       |
| `sdk-integration` | `plugins/sdk` (separate config) | SDK client vs live gateway           |

### Writing Vitest Conformance Tests

Each provider plugin has `tests/conformance/` with test files that bridge fixtures into Vitest:

```typescript
// plugins/holo-provider-openai/tests/conformance/wire.test.ts
import {describe, it} from 'vitest';
import {runWireContract} from '@holokai/provider-contract-tests';
import chatStreaming from '../fixtures/chat-simple.streaming.fixture.js';

describe('openai wire conformance', () => {
    it(chatStreaming.name, () => runWireContract('openai', chatStreaming));
});
```

Available contract runners from `@holokai/provider-contract-tests`:

- `runWireContract(family, fixture)` — tests wire adapter output
- `runAuditContract(family, fixture)` — tests audit record mapping (skips if no `expectedAudit`)
- `runPipelineContract(family, fixture)` — tests full pipeline
- `runRoundTripContract(fixture, adapter)` — tests SDK round-trip (skips if no `sdkRequest`)

### Standalone CLI vs Vitest

Both the standalone CLI and Vitest conformance tests use the same fixtures and the same test-harness service functions.
Choose whichever fits your workflow:

| Feature              | `holo-test` CLI                    | Vitest                            |
|----------------------|------------------------------------|-----------------------------------|
| Dependency on vitest | No                                 | Yes                               |
| Watch mode           | No                                 | `npm run test:watch`              |
| Filtering            | `--plugin`, `--tag`, `--wire` etc. | `--project`, `-t` pattern         |
| CI integration       | Exit code 0/1                      | Native vitest reporter + coverage |
| Fixture discovery    | Glob scan of directory             | Explicit imports in test files    |
| Output               | Custom colored reporter            | Vitest reporter                   |

## Fluent DSL

For programmatic use (e.g. in custom scripts):

```typescript
import {suite} from '@holokai/test-harness';

// Wire + audit for one plugin
await suite()
    .forPlugin('openai')
    .protocol('openai.chatCompletions')
    .streaming()
    .wire()
    .audit()
    .fixtureDir('./plugins/holo-provider-openai/tests/fixtures')
    .verbose()
    .run();

// All fixtures, all categories
await suite()
    .fixtureDir('./plugins')
    .run();

// With pre-loaded fixtures
await suite()
    .withFixtures(myFixtures)
    .pipeline()
    .run();
```

## SDK Round-Trip Testing

Round-trip tests verify that the native provider SDK can parse the wire output. This catches format issues that string
comparison might miss (e.g. missing required fields that the SDK validates).

### Writing an SDK Adapter

Each plugin needs an `sdk-adapter.ts` in its `tests/` directory:

```typescript
import type {SdkAdapter, FixtureScenario} from '@holokai/test-harness';
import SomeSDK from 'some-provider-sdk';

const adapter: SdkAdapter = {
    family: 'myplugin',

    // Point the native SDK at the fixture server and return its parsed output
    async call(fixture: FixtureScenario, port: number) {
        const client = new SomeSDK({
            apiKey: 'test-key',
            baseURL: `http://localhost:${port}`,
        });
        // Make the API call using fixture.sdkRequest
        // Return whatever the SDK returns
    },

    // Map protocol → HTTP route the fixture server should serve
    routes(fixture: FixtureScenario) {
        if (fixture.protocol === 'myplugin.chat') {
            return {method: 'POST', path: '/v1/chat'};
        }
        return undefined;
    },
};

export default adapter;
```

Then reference it in your fixtures:

```typescript
import sdkAdapter from '../sdk-adapter.js';

const fixture: FixtureScenario = {
    // ... other fields ...
    sdkAdapter,
    sdkRequest: {model: 'my-model', messages: [...]},
    expectedSdkResult: {id: 'expected-id'},  // partial match
};
```

Run with `--roundtrip`:

```bash
npm run holo-test -- --fixtures $PWD/plugins --roundtrip --verbose
```

## Project Structure

```
plugins/test-harness/                  # Core test engine (standalone, no vitest dep)
  src/
    cli.ts                             # Entry point, arg parsing
    index.ts                           # Public API exports
    runner/
      test-runner.ts                   # Discovers fixtures, runs test categories
      test-reporter.ts                 # Colored console output with diffs
    dsl/
      suite-builder.ts                 # Fluent DSL API
      assertions.ts                    # assertEqual, assertDeepEqual, assertPartialMatch
    fixtures/
      fixture-loader.ts               # Glob *.fixture.ts, import, filter
      types.ts                         # FixtureScenario, SdkAdapter interfaces
    services/
      plugin-loader.ts                 # Load plugin singletons with mock context
      wire-tester.ts                   # ProviderEvent[] → WireAdapter → assert
      audit-tester.ts                  # ProviderEvent → Auditor → assert
      pipeline-tester.ts              # Full pipeline via @holokai/lib
      sdk-roundtrip-tester.ts          # SDK → fixture server → assert
      http-fixture-server.ts           # Express server serving fixture wire output
      sse-parser.ts                    # Parse SSE body → frames
      ndjson-parser.ts                 # Parse NDJSON body → objects

plugins/provider-contract-tests/       # Vitest adapter layer (bridges harness → vitest)
  src/
    vitest-helpers.ts                  # assertTestResult → expect.fail()
    wire-contract.ts                   # runWireContract(family, fixture)
    audit-contract.ts                  # runAuditContract(family, fixture)
    pipeline-contract.ts              # runPipelineContract(family, fixture)
    roundtrip-contract.ts              # runRoundTripContract(fixture, adapter)

plugins/test-utils/                    # Shared test utilities
  src/
    env.ts                             # hasGateway, gatewayUrl(), getTestConfig()
    mock-fetch.ts                      # createMockFetch(), createSseMockFetch()
    stream-helpers.ts                  # collectStreamText(), collectStreamEvents()
    matrix.ts                          # providerMatrix (family/model pairs)

plugins/holo-provider-*/
  vitest.config.ts                     # Vitest project config (defineProject)
  tests/
    setup.ts                           # reflect-metadata import
    fixtures/
      *.fixture.ts                     # Declarative test fixtures
    conformance/
      wire.test.ts                     # Wire conformance via Vitest
      audit.test.ts                    # Audit conformance via Vitest
      pipeline.test.ts                # Pipeline conformance via Vitest
      roundtrip.test.ts                # SDK round-trip via Vitest (OpenAI only)
    sdk-adapter.ts                     # Native SDK adapter (optional, for round-trip)

plugins/sdk/
  vitest.config.ts                     # Unit test project config
  vitest.integration.config.ts         # Integration test project config (separate)
  tests/
    unit/
      builder.test.ts                  # HoloRequestBuilder tests
      client.test.ts                   # HoloClient tests
      chat-namespace.test.ts           # ChatNamespace proxy method tests
      sse.test.ts                      # SSE parser tests
      merge.test.ts                    # HoloStreamAccumulator tests
      stream.test.ts                   # HoloStream tests
      runner.test.ts                   # HoloToolRunner tests
      errors.test.ts                   # Error type tests
    integration/
      chat-create.test.ts             # Live gateway: chat.create()
      chat-stream.test.ts             # Live gateway: chat.stream()
      tools.test.ts                    # Live gateway: tool runner
      cancellation.test.ts            # Live gateway: abort mid-stream
      errors.test.ts                   # Live gateway: error mapping
      smoke-matrix.test.ts            # Live gateway: all providers
```
