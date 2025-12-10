# @holokai/common

> Common SDK for Holo plugin development - provides interfaces, types, and utilities for building provider plugins.

## Installation

```bash
npm install @holokai/common
```

## Overview

The Common SDK is the foundation for developing Holo plugins. It provides:

- Type-safe interfaces for plugin lifecycle
- Provider abstractions and base implementations
- Universal Holo format definitions
- Shared utilities and types

## Usage

### Plugin Development

```typescript
import { IPlugin, PluginManifest, PluginContext } from '@holokai/common/plugin';

export class MyPlugin implements IPlugin {
  public manifest: PluginManifest = {
    name: '@myorg/my-plugin',
    version: '1.0.0',
    pluginType: 'provider',
    description: 'My custom provider plugin',
  };

  async initialize(context: PluginContext): Promise<void> {
    // Plugin initialization
  }

  async destroy(): Promise<void> {
    // Cleanup resources
  }
}
```

### Provider Implementation

```typescript
import { IProvider } from '@holokai/common/provider';
import { HoloRequest, HoloResponse } from '@holokai/common/holo';

export class MyProvider implements IProvider {
  async processRequest(request: HoloRequest): Promise<HoloResponse> {
    // Transform Holo format to provider-specific format
    // Call provider API
    // Transform response back to Holo format
    return response;
  }
}
```

## Package Exports

The SDK is organized into focused subpath exports:

### `/plugin`

Core plugin interfaces and lifecycle management.

```typescript
import { IPlugin, PluginManifest, PluginContext, PluginCapabilities } from '@holokai/common/plugin';
```

### `/provider`

Provider interfaces and base implementations.

```typescript
import { IProvider, IProviderPlugin, ProviderConfig } from '@holokai/common/provider';
```

### `/holo`

Universal Holo format definitions for cross-provider compatibility.

```typescript
import { HoloRequest, HoloResponse, HoloMessage, HoloStream } from '@holokai/common/holo';
```

### `/utils`

Shared utilities and helper types.

```typescript
import { Logger, ErrorResponse, HealthStatus, Result, AsyncResult } from '@holokai/common/utils';
```

## Type Safety

All interfaces are fully typed with TypeScript:

```typescript
interface PluginManifest {
  name: string;
  version: string;
  pluginType: 'provider' | 'transformer' | 'validator';
  description?: string;
  author?: string;
  license?: string;
  capabilities?: PluginCapabilities;
}
```

## Best Practices

1. **Import Boundaries**: Never import from the core platform (`../../src`)
2. **Versioning**: Follow semantic versioning for your plugins
3. **Error Handling**: Use provided error types for consistency
4. **Logging**: Use the Logger interface for standardized logging
5. **Configuration**: Use ConfigLoader for environment-based config

## Provider Plugin Package Template

When creating a new provider plugin, follow this standardized package structure:

### Directory Structure

```
packages/provider-{name}/
├── src/
│   ├── index.ts            # Default export of plugin (REQUIRED)
│   ├── plugin.ts           # IProviderPlugin implementation (REQUIRED)
│   ├── provider.ts         # Provider implementation (REQUIRED)
│   └── translator.ts       # Holo format translator (REQUIRED)
├── tests/
│   ├── integration/        # Real API tests (PRIMARY - 70% coverage)
│   └── unit/              # Contract tests only (LIMITED - 30% coverage)
├── package.json            # Package configuration (REQUIRED)
├── tsconfig.json           # TypeScript configuration (REQUIRED)
└── README.md               # Plugin documentation (REQUIRED)
```

### package.json Template

```json
{
  "name": "@holokai/provider-{name}",
  "version": "1.0.0",
  "description": "Holo provider plugin for {Provider Name}",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@holokai/common": "^1.0.0",
    "arktype": "^2.0.0"
  },
  "dependencies": {
    "{provider-sdk}": "x.y.z"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:integration": "jest tests/integration"
  },
  "keywords": ["holo", "plugin", "provider", "{name}"],
  "author": "Your Name",
  "license": "MIT"
}
```

**Important package.json rules:**

- **Naming**: MUST follow `@holokai/provider-{name}` convention
- **peerDependencies**: MUST include `@holokai/common` and `arktype` (shared versions)
- **dependencies**: Provider SDK with **EXACT version** (e.g., `"openai": "4.73.1"`, NOT `"^4.73.1"`)
- **engines**: MUST specify `node >= 18.0.0`

### src/index.ts Template

```typescript
import plugin from './plugin';

// Default export REQUIRED - this is what the plugin system loads
export default plugin;

// Named exports for testing/utilities (optional)
export {OpenAIProvider} from './provider';
export {OpenAITranslator} from './translator';
```

### src/plugin.ts Template

```typescript
import { IProviderPlugin, PluginManifest, PluginContext } from '@holokai/common/plugin';
import { ProviderConfig, ProviderCapabilities } from '@holokai/common/provider';
import { OpenAIProvider } from './provider';
import { type } from 'arktype';

class OpenAIProviderPlugin implements IProviderPlugin {
  public manifest: PluginManifest = {
    name: '@holokai/provider-openai',
    version: '1.0.0',
    pluginType: 'provider',
    providerType: 'openai',
    sdkVersion: 'openai@4.73.1',
    commonSdkVersion: '^1.0.0',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
      reasoning: false
    },
    author: 'HoloKai Team',
    source: 'official',
    description: 'OpenAI provider plugin for GPT models'
  };

  private context?: PluginContext;
  private initialized = false;

  async initialize(context: PluginContext): Promise<void> {
    if (this.initialized) return; // Idempotent
    this.context = context;
    this.initialized = true;
    context.logger.info('[OpenAI Plugin] Initialized');
  }

  async destroy(): Promise<void> {
    this.context = undefined;
    this.initialized = false;
  }

  createProvider(config: ProviderConfig): OpenAIProvider {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }
    return new OpenAIProvider(config, this.context!.logger);
  }

  validateConfig(config: unknown): boolean {
    const validator = type({
      api_key: 'string',
      model: 'string',
      provider_type: '"openai"'
    });

    const result = validator(config);
    return !(result instanceof type.errors);
  }

  getCapabilities(): ProviderCapabilities {
    return this.manifest.capabilities!;
  }
}

// Export singleton instance
const plugin = new OpenAIProviderPlugin();
export default plugin;
```

### src/provider.ts Template

```typescript
import {IProvider} from '@holokai/common/provider';
import {HoloRequest, HoloResponse} from '@holokai/common/holo';
import {Logger} from '@holokai/common/utils';
import OpenAI from 'openai';

export class OpenAIProvider implements IProvider {
    private client: OpenAI;

    constructor(
        private config: { api_key: string; model: string },
        private logger: Logger
    ) {
        this.client = new OpenAI({apiKey: config.api_key});
    }

    async processRequest(request: HoloRequest): Promise<HoloResponse> {
        // Transform Holo to OpenAI format
        const openaiRequest = this.translator.toOpenAI(request);

        // Call provider API
        const response = await this.client.chat.completions.create(openaiRequest);

        // Transform back to Holo format
        return this.translator.fromOpenAI(response);
    }

    async processStreamRequest(request: HoloRequest): AsyncIterator<HoloStream> {
        // Streaming implementation
    }
}
```

### src/translator.ts Template

```typescript
import {HoloRequest, HoloResponse} from '@holokai/common/holo';
import {ChatCompletion, ChatCompletionCreateParams} from 'openai/resources';

export class OpenAITranslator {
    toOpenAI(holoRequest: HoloRequest): ChatCompletionCreateParams {
        return {
            model: holoRequest.model,
            messages: holoRequest.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: holoRequest.temperature,
            max_tokens: holoRequest.maxTokens,
            stream: false
        };
    }

    fromOpenAI(openaiResponse: ChatCompletion): HoloResponse {
        return {
            id: openaiResponse.id,
            model: openaiResponse.model,
            choices: openaiResponse.choices.map(choice => ({
                index: choice.index,
                message: {
                    role: choice.message.role,
                    content: choice.message.content || ''
                },
                finishReason: choice.finish_reason
            })),
            usage: {
                promptTokens: openaiResponse.usage?.prompt_tokens || 0,
                completionTokens: openaiResponse.usage?.completion_tokens || 0,
                totalTokens: openaiResponse.usage?.total_tokens || 0
            },
            created: openaiResponse.created
        };
    }
}
```

### tsconfig.json Template

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Testing Structure

**Integration Tests (PRIMARY - tests/integration/):**

- Test real API calls with actual provider SDK
- Verify request/response transformations work correctly
- Test streaming functionality
- Verify error handling with real API errors
- Compare plugin output with expected Holo format

**Unit Tests (LIMITED - tests/unit/):**

- Test contract validation logic
- Test manifest structure
- Test plugin lifecycle (initialize, destroy)
- Minimal mocking - focus on contracts only

### Complete Example

See [packages/provider-openai](../provider-openai) for a complete reference implementation following this template.

## Examples

See the [OpenAI Provider Plugin](../provider-openai) for a complete reference implementation.

## API Reference

Full API documentation is available in the [TypeScript definitions](./src/index.d.ts).

## Contributing

This SDK is part of the Holo platform. See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT
