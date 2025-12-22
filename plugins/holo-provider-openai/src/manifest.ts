import {PluginManifest} from "@holokai/sdk";

export const manifest: PluginManifest = {
    // Required identity
    name: '@holokai/provider-openai',
    family: 'openai',
    version: '1.0.0',
    pluginType: 'provider',
    displayName: 'OpenAI Provider',
    description: 'First-party OpenAI provider plugin for Holokai, providing chat, tools, and streaming via the Holo universal format.',

    // Optional metadata
    author: {
        name: 'Holokai Team',
        url: 'https://holok.ai'
    },
    license: 'MIT',
    homepage: 'https://holok.ai/docs/providers/openai',
    repository: {
        type: 'git',
        url: 'https://github.com/holokai/holokai',
        directory: 'packages/provider-openai'
    },
    bugs: {
        url: 'https://github.com/holokai/holokai/issues'
    },
    keywords: [
        'holokai',
        'holo',
        'openai',
        'provider',
        'llm',
        'chat-completions',
        'tools',
        'streaming'
    ],

    // Engine / dependency requirements
    engineVersion: '>=1.0.0 <2.0.0',
    peerDependencies: {
        '@holokai/sdk': '^1.0.0'
    },
    dependencies: {
        openai: '^4.73.0'
    },

    // Capabilities
    capabilities: {
        supportsStreaming: true,
        supportsHotReload: true,
        supportsAsync: true,
        supportsBatching: false,
        supportsDistributed: true,
        // Custom capability flags
        supportsTools: true,
        supportsVision: true,
        supportsStructuredOutputs: true
    },

    // Permissions (what the host must allow)
    permissions: ['network', 'env'],

    // Configuration schema (what the operator configures for this plugin)
    configSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: 'OpenAI Provider Configuration',
        description:
            'Configuration for the @holokai/provider-openai plugin. Used by Holokai to connect to the OpenAI API.',
        properties: {
            apiKey: {
                type: 'string',
                description:
                    'OpenAI API key. This SHOULD be supplied via secure secret management (env/secret store), not hard-coded.',
                minLength: 20
            },
            organizationId: {
                type: 'string',
                description:
                    'Optional OpenAI organization ID to use for requests.',
                minLength: 1
            },
            projectId: {
                type: 'string',
                description:
                    'Optional OpenAI project ID (for org/project-scoped keys).'
            },
            baseUrl: {
                type: 'string',
                description:
                    'Optional custom base URL for OpenAI-compatible endpoints (e.g., proxy or Azure/OpenAI-compatible gateway).',
                format: 'uri'
            },
            defaultModel: {
                type: 'string',
                description:
                    'Default OpenAI model to use when no model is specified in the HoloRequest (e.g., "gpt-4o-mini").'
            },
            allowedModels: {
                type: 'array',
                description:
                    'Optional allowlist of OpenAI model IDs that this plugin may use. If set, all requests will be validated against this list.',
                items: {
                    type: 'string'
                },
                uniqueItems: true
            },
            timeoutMs: {
                type: 'integer',
                description:
                    'Default request timeout in milliseconds for OpenAI calls.',
                minimum: 1000,
                maximum: 600000,
                default: 60000
            },
            maxRetries: {
                type: 'integer',
                description:
                    'Maximum number of retry attempts for transient OpenAI errors.',
                minimum: 0,
                maximum: 10,
                default: 2
            },
            enableStructuredOutputs: {
                type: 'boolean',
                description:
                    'Enable OpenAI structured outputs (json_object/json_schema) when requested via Holo response_format.',
                default: true
            },
            enableVision: {
                type: 'boolean',
                description:
                    'Enable multimodal/vision support for models that accept image content.',
                default: true
            },
            logRequests: {
                type: 'boolean',
                description:
                    'If true, log summarized request/response metadata for observability (never full content or secrets).',
                default: false
            },
            telemetrySampleRate: {
                type: 'number',
                description:
                    'Sampling rate (0.0–1.0) for sending telemetry events related to this provider.',
                minimum: 0,
                maximum: 1,
                default: 1
            }
        },
        required: ['apiKey'],
        additionalProperties: false
    },

    // Marketplace metadata
    category: 'ai-providers',
    screenshots: [
        'https://holok.ai/assets/screenshots/provider-openai-1.png'
    ],
    changelog: 'https://holok.ai/docs/providers/openai/changelog',

    pricing: {
        model: 'free',
        price: 0,
        currency: 'USD',
        billingPeriod: 'one-time'
    },

    support: {
        email: 'support@holok.ai',
        documentation: 'https://holok.ai/docs/providers/openai'
    },

    // Upgrade semantics
    upgradeFrom: '>=1.0.0',

    // Entrypoints
    main: 'dist/index.js',
    types: 'dist/index.d.ts',

    // Custom metadata for host/runtime
    custom: {
        // Used by the host/plugin loader to auto-wire this plugin
        providerKind: 'openai',
        // Hints for the host UI
        recommendedDefaultModel: 'gpt-4o-mini'
    }
};