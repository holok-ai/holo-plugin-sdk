# @holokai/holo-sdk

SDK for the Holo platform. Provides base classes for building provider plugins and a client SDK for consuming the Holo API.

## Installation

```bash
npm install @holokai/holo-sdk
```

Plugins also need the types package:

```bash
npm install @holokai/holo-types
```

## Overview

The SDK provides:

- `BasePlugin` — lifecycle management (initialize, destroy, state machine)
- `BaseProvider` — provider request processing and auditing
- `BaseAuditor` — request/response audit record construction
- `BaseTranslator` — Holo universal format translation
- `BaseWireAdapter` — provider events to HTTP wire chunks
- Core utilities (`ClassLogger`, `pickDefined`, `AsyncEventQueue`, etc.)
- Notification factories and stores

## Package Exports

```typescript
// Plugin development
import {BasePlugin} from '@holokai/holo-sdk/plugin';
import {BaseProvider, BaseAuditor, BaseTranslator, BaseWireAdapter} from '@holokai/holo-sdk/provider';
import {ClassLogger, pickDefined, stringifyError} from '@holokai/holo-sdk';
import {HoloRequestDefaults} from '@holokai/holo-sdk/holo';
import {NotificationServiceToken, NotificationEventFactory} from '@holokai/holo-sdk/notification';

// Client SDK
import {HoloClient, HoloRequestBuilder, HoloStream, HoloToolRunner} from '@holokai/holo-sdk/client';
```

| Subpath | Description |
|---------|-------------|
| `@holokai/holo-sdk` | Core utilities: `pickDefined`, `ClassLogger`, `AsyncEventQueue`, logging |
| `@holokai/holo-sdk/plugin` | `BasePlugin`, plugin loader, discovery |
| `@holokai/holo-sdk/provider` | `BaseProvider`, `BaseAuditor`, `BaseTranslator`, `BaseWireAdapter`, event processor |
| `@holokai/holo-sdk/holo` | Holo format helpers, content type guards, request factories |
| `@holokai/holo-sdk/core` | Low-level utilities |
| `@holokai/holo-sdk/notification` | Notification service, event factory |
| `@holokai/holo-sdk/client` | `HoloClient`, `HoloRequestBuilder`, streaming, tool runner |

## Building a Provider Plugin

### Directory Structure

```
plugins/holo-provider-{name}/
├── src/
│   ├── index.ts              # Default export of plugin instance
│   ├── manifest.ts           # Plugin manifest definition
│   ├── plugin.ts             # IProviderPlugin implementation
│   ├── {name}.provider.ts    # IProvider implementation
│   ├── {name}.auditor.ts     # IAuditor implementation
│   ├── {name}.translator.ts  # IProviderTranslator implementation
│   ├── {name}.wire.adapter.ts # IWireAdapter implementation
│   └── types.ts              # Provider-specific types
├── package.json
├── tsconfig.json
└── README.md
```

### Plugin Implementation

```typescript
// plugin.ts
import {BasePlugin} from '@holokai/holo-sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/holo-types/plugin';
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from '@holokai/holo-types/provider';
import type {RouteTree} from '@holokai/holo-types/routing';
import {RouteHandler} from '@holokai/holo-types/routing';
import {ProtocolCapability} from '@holokai/holo-types/entities';
import {manifest} from './manifest';
import {MyProvider} from './my.provider';
import {MyWireAdapter} from './my.wire.adapter';
import {MyTranslator} from './my.translator';

export const MyProtocols = {
    CHAT: 'my.chat',
    MODELS: 'my.models'
} as const;

export class MyProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = MyTranslator.instance();
    protocols = MyProtocols;
    defaultProtocol = MyProtocols.CHAT;

    async createProvider(id: string, name: string, config: any): Promise<IProvider> {
        return new MyProvider(this, config);
    }

    async createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter> {
        return new MyWireAdapter(params.requestId, params.isStreaming);
    }

    getCapabilities(): ProviderCapabilities {
        return {streaming: true, tools: true, vision: false, functionCalling: true, maxTokens: 128000};
    }

    getRoutes(): RouteTree {
        return {
            v1: {
                chat: {
                    method: 'POST',
                    handler: RouteHandler.REQUEST,
                    protocol: {name: MyProtocols.CHAT, capability: ProtocolCapability.CHAT}
                },
                models: {
                    method: 'GET',
                    handler: RouteHandler.MODELS,
                    protocol: {name: MyProtocols.MODELS, capability: ProtocolCapability.MODELS}
                }
            }
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

### Protocols and Capabilities

Each route declares a **protocol** (wire format identifier) and **capability** (what kind of request it handles):

| Capability                    | Description                 |
|-------------------------------|-----------------------------|
| `ProtocolCapability.CHAT`     | Conversational LLM requests |
| `ProtocolCapability.GENERATE` | Text generation (non-chat)  |
| `ProtocolCapability.EMBED`    | Embedding generation        |
| `ProtocolCapability.MODELS`   | Model listing               |

Protocols are registered in the database at startup. Each protocol is tied to a specific plugin version.

### Auditor Implementation

The auditor transforms worker requests/responses into `ProviderRequest`/`ProviderResponse` audit records:

```typescript
import {BaseAuditor} from '@holokai/holo-sdk/provider';
import type {HoloWorkerRequest} from '@holokai/holo-types/worker';
import type {ProviderRequest} from '@holokai/holo-types/entities';

export class MyAuditor extends BaseAuditor {
    readonly provider = 'my-provider';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, req: Omit<ProviderRequest, 'id'>): void {
        req.access_model = workerRequest.payload.model;
        req.metadata.user_prompt = workerRequest.payload.messages?.at(-1)?.content;
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, req: Omit<ProviderRequest, 'id'>): void {
        const {temperature, max_tokens} = workerRequest.payload;
        req.metadata.options = {temperature, max_tokens};
    }

    protected async createProviderEnvelope(payload: any) {
        return {access_model: payload.model || 'unknown'};
    }
}
```

Audit records use:

- **Real columns** for queryable fields: `access_model`, `application_id`, `provider_id`, `protocol_id`, `user_id`,
  `client_identifier`, `thread_id`, token counts, timing, cost
- **`metadata` JSONB** for extensible data: `user_prompt`, `system_prompt`, `options`, `raw_request`, `headers`,
  `response_raw`, `usage_raw`, etc.

### Manifest

```typescript
// manifest.ts
import type {PluginManifest} from '@holokai/holo-types/plugin';
import {PluginType} from '@holokai/holo-types/plugin';

export const manifest: PluginManifest = {
    name: '@holokai/holo-provider-my',
    version: '1.0.0',
    pluginType: PluginType.PROVIDER,
    family: 'MY_PROVIDER',
    description: 'My custom provider plugin'
};
```

### Default Export

```typescript
// index.ts
import {MyProviderPlugin} from './plugin';

export default new MyProviderPlugin();
```

## Client SDK

The `@holokai/holo-sdk/client` subpath provides a typed client for consuming the Holo API:

```typescript
import {HoloClient} from '@holokai/holo-sdk/client';

const client = new HoloClient({baseUrl: 'http://localhost:3000', token: 'your-token'});

// Simple chat
const response = await client.chat.send({
    model: 'gpt-4o',
    messages: [{role: 'user', content: 'Hello'}],
});

// Fluent builder
const response = await client.chat.builder()
    .model('gpt-4o')
    .system('You are helpful.')
    .user('Hello')
    .temperature(0.7)
    .send();

// Streaming
const stream = await client.chat.builder()
    .model('gpt-4o')
    .user('Write a poem')
    .stream();

for await (const event of stream) {
    process.stdout.write(event.text ?? '');
}

// Tool calling
import {HoloToolRunner} from '@holokai/holo-sdk/client';

const runner = new HoloToolRunner(client, tools, handlers);
const result = await runner.run({model: 'gpt-4o', messages});
```

See [docs/README.md](docs/README.md) for the full client SDK reference.

## Reference Implementations

| Plugin                            | Key Features                                                                   |
|-----------------------------------|--------------------------------------------------------------------------------|
| [OpenAI](../holo-provider-openai) | Dual protocols (completions + responses), dual wire adapters, tool calling     |
| [Claude](../holo-provider-claude) | 6-event streaming lifecycle, content blocks, extended thinking, prompt caching |
| [Ollama](../holo-provider-ollama) | Chat + generate protocols, local deployment, passthrough default handler       |
| [Gemini](../holo-provider-gemini) | Dual protocols (generate + stream), embedding, vision, 1M token context        |

## License

MIT
