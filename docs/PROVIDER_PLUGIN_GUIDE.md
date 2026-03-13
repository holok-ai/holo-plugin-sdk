# Provider Plugin Guide

This guide walks through building a new Holo provider plugin from scratch. All examples reference the Claude plugin (`holo-provider-claude`) as the canonical implementation.

## 1. Overview

A **provider plugin** adapts an external LLM API (Anthropic, OpenAI, Cohere, etc.) into Holo's unified gateway. The hierarchy:

- **Plugin** -- the npm package. Declares protocols, routes, capabilities, default pricing, and factory methods for providers and wire adapters.
- **Protocol** -- a specific endpoint the plugin exposes, identified by `{family}.{endpoint}` (e.g. `grok.chat`, `grok.models`). Each protocol has a `ProtocolCapability`.
- **Provider** -- a configured instance of the plugin, scoped to an organization. Holds the SDK client, auditor, translator, and response factory.

Available capabilities (`ProtocolCapability`):

| Capability | Value        | Use                        |
|------------|--------------|----------------------------|
| CHAT       | `'chat'`     | Conversational completions |
| GENERATE   | `'generate'` | Text generation            |
| EMBED      | `'embed'`    | Embeddings                 |
| MODELS     | `'models'`   | Model listing              |
| METRICS    | `'metrics'`  | Token counting, metrics    |

## 2. File Structure

```
plugins/holo-provider-{family}/
  package.json
  tsconfig.json
  src/
    index.ts                          # entry point, default export = plugin singleton
    manifest.ts                       # PluginManifest (name, version, family)
    plugin.ts                         # plugin class (routes, protocols, pricing)
    {family}.provider.ts              # BaseProvider subclass (SDK client, request dispatch)
    {family}.auditor.ts               # BaseAuditor subclass (audit record mapping)
    {family}.translator.ts            # top-level IProviderTranslator (composition root)
    {family}.wire.adapter.ts          # BaseWireAdapter subclass (SSE formatting)
    {family}.response.factory.ts      # IResponseFactory (error/synthetic response shapes)
    translators/
      index.ts                        # barrel export
      {family}.request.translators.ts
      {family}.message.translators.ts
      {family}.content.translators.ts
      {family}.tool.translators.ts
      {family}.usage.translators.ts
      {family}.response.translators.ts
      {family}.response.message.translators.ts
      {family}.response.content.translators.ts
      streaming/
        index.ts
        {family}.stream.translator.ts
        {family}.message.start.event.translator.ts
        {family}.message.delta.event.translator.ts
        {family}.message.stop.event.translator.ts
        {family}.content.block.start.event.translator.ts
        {family}.content.block.delta.event.translator.ts
        {family}.content.block.stop.event.translator.ts
```

## 3. Step-by-Step Implementation

### 3.1 Package Setup

**package.json** -- key fields:

```json
{
  "name": "@holokai/holo-provider-grok",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "@holokai/sdk": "^1.1.0"
  },
  "dependencies": {
    "xai-sdk": "^1.0.0"
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  }
}
```

The provider's vendor SDK goes in `dependencies`. The Holo SDK is a `peerDependency`.

**tsconfig.json** -- extends the workspace root, references `types` and `sdk`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ESNext", "ESNext.Intl"]
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "tests/**/*"],
  "references": [
    { "path": "../types" },
    { "path": "../sdk" }
  ]
}
```

### 3.2 Manifest

Read the version from `package.json` at runtime using `createRequire`. Never hardcode the version.

```typescript
// src/manifest.ts
import {PluginManifest, PluginType} from "@holokai/types/plugin";
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {version} = require('../package.json');

export const manifest: PluginManifest = {
    name: '@holokai/provider-grok',
    version,
    pluginType: PluginType.PROVIDER,
    family: 'grok',
    displayName: 'Grok Provider',
    description: 'xAI Grok provider plugin for Holo.',
};
```

The `family` field is the canonical identifier used in protocol names and database lookups.

### 3.3 Translators

Translators convert between Holo's canonical types and the provider's wire types. They follow a composition pattern: leaf translators handle atomic types, parent translators compose them.

**Base classes:**

- `BaseTranslator<THolo, TProvider>` -- 1:1 translation. Implement `fromHoloImpl` and `toHoloImpl`.
- `StreamTranslator<THolo, TProvider>` -- 1:N translation for streaming chunks. Implement `fromHoloManyImpl` and `toHoloManyImpl`.

**Leaf translator example** (content blocks):

```typescript
// src/translators/grok.content.translators.ts
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloContent} from "@holokai/types/holo";

export class GrokContentTranslator extends BaseTranslator<HoloContent, GrokContentBlock> {
    protected holoDefaults = {};
    protected providerDefaults = {};

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<GrokContentBlock>> {
        return pickDefined({
            type: 'text',
            text: source.text,
        });
    }

    protected async toHoloImpl(source: GrokContentBlock): Promise<Partial<HoloContent>> {
        return pickDefined({
            type: 'text',
            text: source.text,
        });
    }
}
```

**Parent translator** (request) -- composes child translators via constructor injection:

```typescript
// src/translators/grok.request.translators.ts
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";

export class GrokRequestTranslator extends BaseTranslator<HoloRequest, GrokChatRequest> {
    protected holoDefaults: Partial<HoloRequest> = HoloRequestDefaults;
    protected providerDefaults: Partial<GrokChatRequest> = {};

    constructor(
        private readonly messageTranslator: GrokMessageTranslator,
        private readonly toolTranslator: GrokToolTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<GrokChatRequest>> {
        const [messages, tools] = await Promise.all([
            source.messages ? this.messageTranslator.fromHoloArray(source.messages) : undefined,
            source.tools ? this.toolTranslator.fromHoloArray(source.tools) : undefined,
        ]);

        return pickDefined({
            model: source.model,
            stream: source.stream,
            messages,
            tools,
        });
    }

    protected async toHoloImpl(source: GrokChatRequest): Promise<Partial<HoloRequest>> {
        const [messages, tools] = await Promise.all([
            source.messages ? this.messageTranslator.toHoloArray(source.messages) : undefined,
            source.tools ? this.toolTranslator.toHoloArray(source.tools) : undefined,
        ]);

        return pickDefined({
            model: source.model,
            stream: source.stream,
            messages,
            tools,
        });
    }
}
```

**Top-level translator** -- the composition root. Uses a static `instance()` factory to wire up the entire tree:

```typescript
// src/grok.translator.ts
import type {IProviderTranslator} from "@holokai/types/provider";
import {ClassLogger} from "@holokai/sdk";

export class GrokTranslator extends ClassLogger implements IProviderTranslator {
    constructor(
        private readonly requestTranslator: GrokRequestTranslator,
        private readonly messageTranslator: GrokMessageTranslator,
        private readonly responseTranslator: GrokResponseTranslator,
        private readonly streamTranslator: GrokStreamTranslator
    ) {
        super();
    }

    static instance(): IProviderTranslator {
        // Build leaf translators
        const contentTranslator = new GrokContentTranslator();
        const toolTranslator = new GrokToolTranslator();
        const messageTranslator = new GrokMessageTranslator(contentTranslator);
        const requestTranslator = new GrokRequestTranslator(messageTranslator, toolTranslator);

        // Build response translators
        const usageTranslator = new GrokUsageTranslator();
        const responseContentTranslator = new GrokResponseContentTranslator();
        const responseMessageTranslator = new GrokResponseMessageTranslator(responseContentTranslator);
        const responseTranslator = new GrokResponseTranslator(responseMessageTranslator, usageTranslator);

        // Build stream event translators
        const streamTranslator = new GrokStreamTranslator(/* sub-translators */);

        return new GrokTranslator(requestTranslator, messageTranslator, responseTranslator, streamTranslator);
    }

    async fromHoloRequest(request: HoloRequest) { return this.requestTranslator.fromHolo(request); }
    async toHoloRequest(request: any) { return this.requestTranslator.toHolo(request); }
    async fromHoloMessages(messages: HoloMessage[]) { return this.messageTranslator.fromHoloArray(messages); }
    async toHoloMessages(messages: any[]) { return this.messageTranslator.toHoloArray(messages); }
    async fromHoloResponse(message: HoloResponse) { return this.responseTranslator.fromHolo(message); }
    async toHoloResponse(message: any) { return this.responseTranslator.toHolo(message); }
    async fromHoloStreamChunks(chunks: HoloStreamChunk[]) { return this.streamTranslator.fromHoloManyArray(chunks); }
}
```

### 3.4 Auditor

The auditor extracts audit-relevant fields from provider-specific payloads. Extend `BaseAuditor`:

```typescript
// src/grok.auditor.ts
import {BaseAuditor} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import type {ProviderRequest} from "@holokai/types/entities";
import {LlmStatus} from "@holokai/types/entities";

export class GrokAuditor extends BaseAuditor {
    readonly provider = 'grok';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        const payload = workerRequest.payload;
        llmRequest.access_model = payload.model;

        const userMessages = payload.messages?.filter((m: any) => m.role === 'user');
        const last = userMessages?.[userMessages.length - 1];
        if (last) {
            llmRequest.metadata.user_prompt = typeof last.content === 'string'
                ? last.content
                : last.content?.find((b: any) => b.type === 'text')?.text;
        }

        if (payload.system) {
            llmRequest.metadata.system_prompt = payload.system;
        }
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        const payload = workerRequest.payload;
        const options: Record<string, any> = {};

        if (payload.max_tokens !== undefined) options.max_tokens = payload.max_tokens;
        if (payload.temperature !== undefined) options.temperature = payload.temperature;
        if (payload.top_p !== undefined) options.top_p = payload.top_p;
        if (payload.stream !== undefined) options.stream = payload.stream;

        if (Object.keys(options).length > 0) {
            llmRequest.metadata.options = options;
        }
    }

    protected async mapResponseMetrics(providerEvent: Extract<ProviderEvent, { type: 'done' | 'error' }>) {
        const metrics = await super.mapResponseMetrics(providerEvent);
        if (providerEvent.type === 'error') return metrics;

        const {usage} = providerEvent.message;
        return pickDefined({
            ...metrics,
            usage_raw: usage,
            input_tokens: usage?.prompt_tokens,
            output_tokens: usage?.completion_tokens,
        });
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent): Promise<LlmStatus> {
        if (providerEvent.type === 'done') {
            const reason = providerEvent.message?.choices?.[0]?.finish_reason;
            if (reason === 'length') return LlmStatus.PARTIAL;
        }
        return super.mapResponseStatus(providerEvent);
    }

    protected async createProviderEnvelope(payload: any): Promise<ProviderEnvelope> {
        return pickDefined({
            access_model: payload.model,
            system_prompt: payload.system,
        }) as ProviderEnvelope;
    }
}
```

Three required abstract methods:
- `toHoloRequest` -- extract `access_model`, `user_prompt`, `system_prompt` from the provider payload
- `mapProviderPayload` -- capture provider-specific options into `metadata.options`
- `createProviderEnvelope` -- minimal envelope for worker request/response wrappers

Override `mapResponseMetrics` to extract token counts from the provider's usage object. Override `mapResponseStatus` to map provider-specific finish reasons (e.g. `max_tokens` -> `PARTIAL`).

### 3.5 Response Factory

Creates synthetic responses (guard rejections, errors) in the provider's native wire format. Implement `IResponseFactory`:

```typescript
// src/grok.response.factory.ts
import type {IResponseFactory} from '@holokai/types/provider';
import type {HoloErrorCode} from '@holokai/types/holo';

export class GrokResponseFactory implements IResponseFactory {

    static instance(): GrokResponseFactory {
        return new GrokResponseFactory();
    }

    mapHoloCode(code: HoloErrorCode): string {
        switch (code) {
            case 'guard_failure': return 'invalid_request_error';
        }
    }

    createError(message: string, code: HoloErrorCode): any {
        return {
            error: {
                type: this.mapHoloCode(code),
                message,
            }
        };
    }
}
```

Also include static helpers for building streaming response sequences (`streamResponseMessage`, `createResponseMessage`) if your provider uses SSE.

### 3.6 Wire Adapter

Formats `ProviderEvent` objects into SSE wire format. Extend `BaseWireAdapter` and implement `formatWire`:

```typescript
// src/grok.wire.adapter.ts
import {BaseWireAdapter} from "@holokai/sdk/provider";

export class GrokWireAdapter extends BaseWireAdapter {
    formatWire(data: any): string {
        const eventLine = `event: ${data.type}\n`;
        const dataLine = `data: ${JSON.stringify(data)}\n\n`;
        return eventLine + dataLine;
    }
}
```

`BaseWireAdapter` handles the full lifecycle: first-chunk headers (`text/event-stream` vs `application/json`), sequencing, non-streaming passthrough, and error formatting. You only need to define how a single event becomes an SSE frame.

### 3.7 Provider

The provider wires up the SDK client and dispatches requests. Extend `BaseProvider<ClientType, RequestPayloadType>`:

```typescript
// src/grok.provider.ts
import {BaseProvider} from '@holokai/sdk/provider';
import {pickHeadersByPrefix} from '@holokai/sdk';
import type {IAuditor, IProviderTranslator, IResponseFactory, ProviderContext} from '@holokai/types/provider';
import {GrokAuditor} from './grok.auditor';
import {GrokTranslator} from './grok.translator';
import {GrokResponseFactory} from './grok.response.factory';
import {GrokProtocols} from './plugin';

export class GrokProvider extends BaseProvider<GrokClient, GrokChatRequest> {

    async getModels(allowedModels: string[] | true): Promise<any> {
        const response = await this.client.models.list();
        if (allowedModels === true) return response;
        response.data = response.data.filter((m: any) => allowedModels.includes(m.id));
        return response;
    }

    async getModelNameFromRequest(payload: GrokChatRequest): Promise<string> {
        return payload.model;
    }

    protected createClient(): GrokClient {
        return new GrokClient(this._config);
    }

    protected createAuditor(): IAuditor {
        return new GrokAuditor();
    }

    protected createTranslator(): IProviderTranslator {
        return GrokTranslator.instance();
    }

    protected createResponseFactory(): IResponseFactory {
        return GrokResponseFactory.instance();
    }

    protected async handleRequest(payload: GrokChatRequest, ctx: ProviderContext) {
        const headers = ctx.headers ? pickHeadersByPrefix(ctx.headers, ['x-grok-']) : [];
        const options = { headers };

        if (payload.stream) {
            // --- Option A: Event-emitter SDK (e.g. Anthropic, OpenAI) ---
            // If the vendor SDK exposes .on('chunk') / .on('text') event emitters
            // and a .finalMessage() method, wire them up directly:
            //
            //   const stream = this.client.chat.stream(payload, options);
            //   stream.on('chunk', (event: any) => ctx.emitStreamEvent(event));
            //   stream.on('text', (delta: string) => ctx.emitTextDelta(delta));
            //   return { final: () => stream.finalMessage() };

            // --- Option B: Async-iterator SDK (e.g. Google GenAI) ---
            // If the vendor SDK returns an AsyncIterable, use a SINGLE loop that
            // both emits events and captures the final chunk. Never iterate the
            // same async iterator twice -- the second loop will see an exhausted
            // iterator and return undefined.
            const finalPromise = (async () => {
                const stream = await this.client.chat.stream(payload, options);
                let finalResponse: any;
                for await (const event of stream) {
                    ctx.emitStreamEvent(event);
                    finalResponse = event;
                    const text = event.choices?.[0]?.delta?.content;
                    if (text) ctx.emitTextDelta(text);
                }
                return finalResponse;
            })();
            return { final: () => finalPromise };
        }

        return { final: () => this.client.chat.create({ ...payload, stream: false }, options) };
    }

    protected async handleError(error: any): Promise<any> {
        if (error.error) {
            return { type: 'error', error: error.error };
        }
        return this.responseFactory.createError(error.message, 'api_error');
    }
}
```

`handleRequest` must return a `ProviderRunner` -- an object with a `final()` method that resolves to the complete response. For streaming, wire up `ctx.emitStreamEvent` (SSE frames) and `ctx.emitTextDelta` (text accumulation). The base class handles the async event queue and metrics.

**Important:** If the vendor SDK returns an async iterator (not an event emitter), consume it in a **single loop** that both emits events and captures the final chunk. Iterating the same async iterator twice causes a race: the first loop may exhaust the iterator before the second starts, leaving `final()` returning `undefined`.

### 3.8 Plugin Class

The plugin class ties everything together. Extend `BasePlugin`, implement `IProviderPlugin`:

```typescript
// src/plugin.ts
import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext, PluginPricingSheet} from '@holokai/types/plugin';
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from '@holokai/types/provider';
import {RouteDefinition, RouteHandler} from '@holokai/types/routing';
import {ProtocolCapability} from '@holokai/types/entities';
import {manifest} from './manifest.js';
import {GrokProvider} from './grok.provider';
import {GrokWireAdapter} from './grok.wire.adapter';
import {GrokTranslator} from './grok.translator';

export const GrokProtocols = {
    CHAT: 'grok.chat',
    MODELS: 'grok.models',
} as const;

export type GrokProtocols = typeof GrokProtocols[keyof typeof GrokProtocols];

export class GrokProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = GrokTranslator.instance();
    defaultRouteHandler = RouteHandler.PASSTHROUGH;
    protocols = GrokProtocols;
    defaultProtocol = GrokProtocols.CHAT;

    async createProvider(id: string, name: string, config: any): Promise<IProvider> {
        return new GrokProvider(id, name, this, config);
    }

    async createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter> {
        return new GrokWireAdapter(params.requestId, params.isStreaming);
    }

    getCapabilities(): ProviderCapabilities {
        return {
            streaming: true,
            tools: true,
            vision: false,
            functionCalling: true,
            maxTokens: 131072,
        };
    }

    getRoutes(): RouteDefinition[] {
        return [
            {
                paths: ['/v1/models'],
                method: 'GET',
                handler: RouteHandler.MODELS,
                protocol: { name: GrokProtocols.MODELS, capability: ProtocolCapability.MODELS }
            },
            {
                paths: ['/v1/chat/completions'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: { name: GrokProtocols.CHAT, capability: ProtocolCapability.CHAT }
            },
        ];
    }

    getDefaultPricing(): PluginPricingSheet {
        const M = 1_000_000;
        return {
            name: 'xAI Standard 2026-03',
            version: '2026-03',
            effective_from: '2026-03-01',
            models: [
                {
                    model_name: 'grok-3',
                    input_cost: 3 / M,
                    output_cost: 15 / M,
                },
            ]
        };
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }
}
```

Key fields:
- `protocols` -- const object mapping logical names to `{family}.{endpoint}` strings
- `defaultProtocol` -- the protocol used when none is specified
- `defaultRouteHandler` -- fallback handler for routes (typically `PASSTHROUGH`)

### 3.9 Entry Point

Export a singleton instance as the default export. This is the contract the plugin loader expects.

```typescript
// src/index.ts
import {GrokProviderPlugin} from './plugin.js';

export {GrokProviderPlugin};
export default new GrokProviderPlugin();
```

## 4. Protocol & Route Definitions

Each route in `getRoutes()` maps an HTTP path + method to a handler and protocol:

```typescript
{
    paths: ['/v1/chat/completions'],  // URL paths (relative to provider mount)
    method: 'POST',                    // HTTP method
    handler: RouteHandler.REQUEST,     // REQUEST = full pipeline, MODELS = model listing, PASSTHROUGH = raw proxy
    protocol: {
        name: 'grok.chat',            // {family}.{endpoint} -- stored in protocols table
        capability: ProtocolCapability.CHAT
    }
}
```

Route handlers:
- `RouteHandler.REQUEST` -- full pipeline: auth, guards, translation, provider call, audit
- `RouteHandler.MODELS` -- model listing endpoint, calls `provider.getModels()`
- `RouteHandler.PASSTHROUGH` -- raw proxy to upstream, minimal processing

A single path can serve multiple protocols (rare). Multiple paths can map to the same protocol (common for versioned endpoints).

## 5. Translator Pattern

The translator tree mirrors the provider's type hierarchy:

```
GrokTranslator (IProviderTranslator -- composition root)
  +-- GrokRequestTranslator (BaseTranslator<HoloRequest, GrokChatRequest>)
  |     +-- GrokMessageTranslator (BaseTranslator<HoloMessage, GrokMessage>)
  |     |     +-- GrokContentTranslator (BaseTranslator<HoloContent, GrokContentBlock>)
  |     +-- GrokToolTranslator (BaseTranslator<HoloTool, GrokTool>)
  |     +-- GrokToolChoiceTranslator (BaseTranslator<HoloToolChoice, GrokToolChoice>)
  +-- GrokResponseTranslator (BaseTranslator<HoloResponse, GrokChatResponse>)
  |     +-- GrokResponseMessageTranslator
  |     +-- GrokUsageTranslator
  +-- GrokStreamTranslator (StreamTranslator<HoloStreamChunk, GrokStreamEvent>)
        +-- GrokMessageStartEventTranslator
        +-- GrokMessageDeltaEventTranslator
        +-- GrokContentBlockDeltaEventTranslator
        +-- ...
```

Each `BaseTranslator` subclass declares:
- `holoDefaults` / `providerDefaults` -- merged into every translation result
- `fromHoloImpl(source)` -- Holo -> provider
- `toHoloImpl(source)` -- provider -> Holo

The base class handles array iteration (`fromHoloArray` / `toHoloArray`), default merging, and empty-result filtering. Use `pickDefined` to strip `undefined` fields from results.

## 6. Pricing Sheet

`getDefaultPricing()` returns a `PluginPricingSheet` registered at startup. The system creates a read-only pricing plan for the plugin.

```typescript
interface PluginPricingSheet {
    name: string;              // human-readable name
    version: string;           // version tag (e.g. '2026-03')
    effective_from: string;    // ISO date string (YYYY-MM-DD)
    models: PluginPricingModel[];
}

interface PluginPricingModel {
    model_name: string;        // matches the access_model field in requests
    input_cost: number;        // cost per token (NOT per million -- divide first)
    output_cost: number;
    cache_read_cost?: number;
    cache_write_cost?: number;
    batch_input_cost?: number;
    batch_output_cost?: number;
    context_threshold?: number;      // token count above which extended pricing applies
    extended_input_cost?: number;    // input cost above context_threshold
    extended_output_cost?: number;   // output cost above context_threshold
}
```

Costs are per-token. The convention is to express them as `price_per_million / 1_000_000`:

```typescript
const M = 1_000_000;
{ model_name: 'grok-3', input_cost: 3 / M, output_cost: 15 / M }
```

## 7. Registration

### Workspace

Add the plugin to the monorepo workspace. In the root `package.json` (or `pnpm-workspace.yaml`), add:

```
plugins/holo-provider-grok
```

### App dependency

Add the plugin as a dependency of the main `app/` package:

```json
"dependencies": {
    "@holokai/holo-provider-grok": "workspace:*"
}
```

### Dockerfile

Add the plugin to the Dockerfile build stage and production install. Follow the same pattern as existing providers.

### Install

```bash
npm install
npm run build -w plugins/holo-provider-grok
```

## 8. Verification

Start the application and check for:

1. **Plugin registration** -- look for log line: `Plugin initialized successfully` from the plugin's family name.
2. **Protocol registration** -- query the `protocols` table for rows with your family prefix.
3. **Route mounting** -- hit the model listing endpoint:
   ```bash
   curl http://localhost:3000/holo/api/providers/{provider-id}/v1/models
   ```
4. **Request pipeline** -- send a chat request through the gateway and verify:
   - The request reaches the upstream provider
   - The response is returned in the provider's native format
   - An audit record appears in `provider_requests` / `provider_responses`
5. **Streaming** -- send a streaming request and verify SSE frames arrive with correct `event:` and `data:` lines.
6. **Pricing** -- check `pricing_sheet_models` for your models after startup.

## 9. Checklist

**Package**
- [ ] `package.json` has `"type": "module"`, correct `exports`, `peerDependencies` on `@holokai/sdk`
- [ ] `tsconfig.json` references `../types` and `../sdk`
- [ ] Provider vendor SDK in `dependencies` (not `devDependencies`)

**Manifest**
- [ ] Version read from `package.json` via `createRequire` (not hardcoded)
- [ ] `family` matches the prefix used in protocol names
- [ ] `pluginType` is `PluginType.PROVIDER`

**Plugin**
- [ ] Protocols defined as `const` object with `{family}.{endpoint}` naming
- [ ] `defaultProtocol` points to the primary chat/completion protocol
- [ ] `getRoutes()` returns at least a MODELS route and a REQUEST route
- [ ] Each route has a `protocol` with correct `name` and `capability`
- [ ] `getCapabilities()` reflects actual provider capabilities
- [ ] `getDefaultPricing()` covers all supported models
- [ ] `createProvider` passes `this` (the plugin) as the third constructor arg
- [ ] `createWireAdapter` passes `requestId` and `isStreaming`

**Provider**
- [ ] Extends `BaseProvider<ClientType, RequestPayloadType>`
- [ ] `createClient()` initializes the vendor SDK from `this._config`
- [ ] `handleRequest()` returns `{ final: () => Promise<Response> }`
- [ ] Streaming wires `ctx.emitStreamEvent` and `ctx.emitTextDelta` in a single consumption loop (never iterate an async iterator twice)
- [ ] `handleError()` maps vendor errors to the provider's error response format
- [ ] `getModels()` filters by `allowedModels` when not `true`
- [ ] `getModelNameFromRequest()` extracts the model identifier from the payload

**Auditor**
- [ ] `readonly provider` matches the family name
- [ ] `toHoloRequest` sets `access_model`, `user_prompt`, `system_prompt`
- [ ] `mapProviderPayload` captures relevant request options in `metadata.options`
- [ ] `mapResponseMetrics` extracts `input_tokens`, `output_tokens`, `usage_raw`
- [ ] `mapResponseStatus` maps provider finish reasons to `LlmStatus`
- [ ] `createProviderEnvelope` returns at minimum `{ access_model }`

**Translator**
- [ ] Static `instance()` factory builds the full translator tree
- [ ] All leaf translators extend `BaseTranslator` with correct generic types
- [ ] Stream translators extend `StreamTranslator`
- [ ] `pickDefined` used to strip undefined fields from all translation outputs
- [ ] `holoDefaults` and `providerDefaults` set on every translator

**Wire Adapter**
- [ ] `formatWire` produces valid SSE frames matching the provider's expected format

**Response Factory**
- [ ] `mapHoloCode` maps all `HoloErrorCode` values to provider-native error types
- [ ] `createError` produces a response matching the provider's error schema

**Entry Point**
- [ ] Default export is a singleton plugin instance (`new GrokProviderPlugin()`)
- [ ] Named export of the plugin class for testing/extension

**Registration**
- [ ] Plugin added to workspace config
- [ ] Plugin added as dependency of `app/`
- [ ] Plugin added to Dockerfile
