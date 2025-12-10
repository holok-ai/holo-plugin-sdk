/**
 * Plugin manifest schema for the Holo plugin system.
 * Defines metadata, capabilities, and requirements for plugins.
 */

/**
 * Plugin type enumeration
 */
export type PluginType = 'provider' | 'guard' | 'evaluator' | 'logger' | 'worker';

/**
 * Plugin category for marketplace organization
 */
export type PluginCategory =
    | 'ai-providers'
    | 'security'
    | 'monitoring'
    | 'evaluation'
    | 'processing'
    | 'integration'
    | 'utility';

/**
 * Pricing model for marketplace plugins
 */
export interface PluginPricing {
    model: 'free' | 'paid' | 'freemium' | 'subscription' | 'usage-based';
    /**
     * Price in base currency units (not cents).
     * Specify whether per seat, per org, etc. in documentation.
     */
    price?: number;
    currency?: string;
    billingPeriod?: 'monthly' | 'yearly' | 'one-time';
    trialDays?: number;
    pricingUrl?: string;
}

/**
 * Support information for plugin users
 */
export interface PluginSupport {
    email?: string;
    url?: string;
    discord?: string;
    slack?: string;
    /**
     * URL pointing to documentation index/homepage
     */
    documentation?: string;
}

/**
 * Plugin capabilities declaration
 */
export interface PluginCapabilities {
    /**
     * Supports configuration hot reload without restart
     */
    supportsHotReload?: boolean;

    /**
     * Can operate in distributed/clustered mode
     */
    supportsDistributed?: boolean;

    /**
     * Supports async/background processing
     */
    supportsAsync?: boolean;

    /**
     * Supports request batching
     */
    supportsBatching?: boolean;

    /**
     * Supports streaming responses
     */
    supportsStreaming?: boolean;

    /**
     * Custom capability flags (e.g. "supportsMultiTenant": true).
     * Keys SHOULD be stable and documented per plugin or plugin type.
     * Values must be boolean or numeric capabilities.
     */
    [key: string]: boolean | number | undefined;
}

/**
 * JSON Schema node definition (Draft 7–style).
 *
 * This represents a generic schema node that can be used at any level
 * (root, property, items, nested objects, etc.).
 */
export interface JSONSchemaProperty {
    // Core
    type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
    description?: string;
    default?: string | number | boolean | null | object | Array<unknown>;
    enum?: Array<string | number | boolean | null>;
    const?: string | number | boolean | null;

    // String validation
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;

    // Number validation
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;

    // Array validation
    items?: JSONSchemaProperty | JSONSchemaProperty[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;

    // Object validation
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean | JSONSchemaProperty;
    patternProperties?: Record<string, JSONSchemaProperty>;

    // Composition
    allOf?: JSONSchemaProperty[];
    anyOf?: JSONSchemaProperty[];
    oneOf?: JSONSchemaProperty[];
    not?: JSONSchemaProperty;

    // References
    $ref?: string;

    // Optional metadata commonly used by tooling
    title?: string;
    examples?: unknown[];
}

/**
 * Configuration schema for runtime validation.
 *
 * This is the *root* JSON Schema object for a plugin's configuration and
 * must describe an object shape. It is what the host uses to validate
 * user-provided configuration for this plugin.
 */
export interface ConfigSchema extends JSONSchemaProperty {
    /**
     * JSON Schema dialect identifier (optional).
     * Example: "http://json-schema.org/draft-07/schema#"
     */
    $schema?: string;

    /**
     * Type of the root configuration object.
     * Must be "object" for all plugin configs.
     */
    type: 'object';

    /**
     * Property definitions for the configuration object.
     */
    properties: Record<string, JSONSchemaProperty>;

    /**
     * Required properties for the configuration object.
     */
    required?: string[];

    /**
     * Additional properties allowed on the configuration object.
     */
    additionalProperties?: boolean | JSONSchemaProperty;

    /**
     * Pattern-based property definitions for the configuration object.
     */
    patternProperties?: Record<string, JSONSchemaProperty>;

    /**
     * Dependencies between properties on the configuration object.
     */
    dependencies?: Record<string, string[] | JSONSchemaProperty>;

    /**
     * Minimum number of properties on the configuration object.
     */
    minProperties?: number;

    /**
     * Maximum number of properties on the configuration object.
     */
    maxProperties?: number;
}

/**
 * Plugin manifest with comprehensive metadata
 *
 * @example
 * ```typescript
 * const manifest: PluginManifest = {
 *   // Required fields
 *   name: '@holokai/provider-openai',
 *   version: '1.0.0',
 *   pluginType: 'provider',
 *   displayName: 'OpenAI Provider',
 *   description: 'Official OpenAI integration for Holo',
 *
 *   // Optional metadata
 *   author: 'Holo Team',
 *   license: 'MIT',
 *   homepage: 'https://docs.holo.ai/plugins/openai',
 *   repository: {
 *     type: 'git',
 *     url: 'https://github.com/holo-ai/provider-openai'
 *   },
 *
 *   // Technical requirements
 *   engineVersion: '>=1.0.0',
 *   dependencies: {
 *     'openai': '^4.0.0'
 *   },
 *
 *   // Capabilities
 *   capabilities: {
 *     supportsStreaming: true,
 *     supportsHotReload: true
 *   },
 *
 *   // Permissions
 *   permissions: ['network']
 * };
 * ```
 */
export interface PluginManifest {
    /**
     * Unique plugin identifier and canonical key in the Holo ecosystem.
     * Follows npm naming conventions and is used as the plugin ID everywhere
     * (registry key, internal maps, etc.).
     * Should be scoped (e.g., @org/plugin-name) for published plugins.
     */
    name: string;

    /**
     * Semantic version of the plugin (e.g., "1.2.3").
     * Must follow semver specification.
     */
    version: string;

    /**
     * Type of plugin functionality.
     * Determines which interface the plugin must implement.
     */
    pluginType: PluginType;

    /**
     * Human-readable name for UI display.
     * Used in marketplace and admin interfaces.
     */
    displayName: string;

    /**
     * Brief description of plugin functionality.
     * Should be 1-2 sentences explaining what the plugin does.
     */
    description: string;

    /**
     * Plugin author or organization.
     * Can be a string or an object with name, email, and url.
     */
    author?:
        | string
        | {
        name: string;
        email?: string;
        url?: string;
    };

    /**
     * License identifier (SPDX format preferred).
     * Examples: "MIT", "Apache-2.0", "GPL-3.0"
     */
    license?: string;

    /**
     * Plugin homepage URL.
     * Should link to documentation or marketing page.
     */
    homepage?: string;

    /**
     * Source code repository information.
     * Follows npm package.json repository format.
     */
    repository?:
        | string
        | {
        type: string;
        url: string;
        directory?: string;
    };

    /**
     * Issue tracker URL.
     * Where users can report bugs or request features.
     */
    bugs?:
        | string
        | {
        url?: string;
        email?: string;
    };

    /**
     * Searchable keywords for plugin discovery.
     * Used in marketplace search and filtering.
     */
    keywords?: string[];

    /**
     * Required host/engine version range (semver).
     * Example: ">=1.0.0 <2.0.0"
     */
    engineVersion?: string;

    /**
     * Runtime dependencies required by the plugin.
     * Uses npm-style dependency specification.
     */
    dependencies?: Record<string, string>;

    /**
     * Peer dependencies expected in the host environment.
     * Used for shared dependencies to avoid duplication.
     */
    peerDependencies?: Record<string, string>;

    /**
     * Plugin capability declarations.
     * Used by the host to understand plugin features.
     */
    capabilities?: PluginCapabilities;

    /**
     * Required permissions for plugin operation.
     * Examples: ["network", "filesystem", "env"]
     * The host is responsible for enforcing or denying these.
     * This is the canonical list of required runtime permissions.
     */
    permissions?: string[];

    /**
     * JSON Schema for configuration validation.
     * Should be a valid JSON Schema object with "type": "object" at the root.
     * Used to validate plugin configuration at runtime.
     */
    configSchema?: ConfigSchema;

    /**
     * Marketplace category for plugin organization.
     */
    category?: PluginCategory;

    /**
     * Screenshot URLs for marketplace display.
     * Should be publicly accessible image URLs.
     */
    screenshots?: string[];

    /**
     * URL to plugin changelog.
     * Used to communicate updates to users.
     */
    changelog?: string;

    /**
     * Pricing information for commercial plugins.
     */
    pricing?: PluginPricing;

    /**
     * Support contact information.
     */
    support?: PluginSupport;

    /**
     * Minimum supported previous version (semver range) for in-place upgrades.
     * Used to determine safe upgrade paths and migration steps.
     * Example: ">=0.9.0"
     */
    upgradeFrom?: string;

    /**
     * Plugin entrypoint file (relative to package root).
     * Defaults to "dist/index.js" if not specified.
     */
    main?: string;

    /**
     * TypeScript type definitions file.
     * Used for TypeScript integration.
     */
    types?: string;

    /**
     * Custom metadata for future extensions.
     * Allows plugins to include additional metadata.
     * Values must be primitive types or arrays of primitives.
     */
    custom?: {
        [key: string]:
            | string
            | number
            | boolean
            | string[]
            | number[]
            | undefined;
    };
}