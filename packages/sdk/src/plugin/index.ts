/**
 * @holokai/common/plugin - Core plugin interfaces and types
 *
 * @packageDocumentation
 */

import type {PluginManifest} from './manifest.js';

/**
 * Plugin state enumeration
 */
export enum PluginState {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
    DESTROYING = 'destroying',
    DESTROYED = 'destroyed'
}

/**
 * Health check result for plugin status monitoring
 */
export interface HealthCheckResult {
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
    timestamp: number;
}

/**
 * Base plugin interface that all plugin types must implement
 *
 * @example
 * ```typescript
 * class MyPlugin implements IPlugin {
 *   manifest = {
 *     name: '@myorg/my-plugin',
 *     version: '1.0.0',
 *     pluginType: 'provider' as const
 *   };
 *
 *   async initialize(context: PluginContext): Promise<void> {
 *     // Setup plugin resources
 *   }
 *
 *   async destroy(): Promise<void> {
 *     // Cleanup resources
 *   }
 * }
 * ```
 */
export interface IPlugin {
    /** Plugin metadata and configuration */
    readonly manifest: PluginManifest;

    /** Current plugin state */
    readonly state: PluginState;

    /**
     * Initialize the plugin with provided context
     * @param context Runtime context including logger, config, and environment
     * @throws {PluginError} If initialization fails
     */
    initialize(context: PluginContext): Promise<void>;

    /**
     * Destroy the plugin and cleanup resources
     * @throws {PluginError} If cleanup fails
     */
    destroy(): Promise<void>;

    /**
     * Get current plugin state
     * @returns Current state of the plugin
     */
    getState(): PluginState;

    /**
     * Perform health check on the plugin
     * @returns Health status and diagnostic information
     */
    healthCheck(): Promise<HealthCheckResult>;
}


/**
 * Logger interface for plugins
 */
export interface PluginLogger {
    log(message: string, ...args: unknown[]): void;

    info(message: string, ...args: unknown[]): void;

    warn(message: string, ...args: unknown[]): void;

    error(message: string, ...args: unknown[]): void;

    debug(message: string, ...args: unknown[]): void;

    trace?(message: string, ...args: unknown[]): void;
}

/**
 * Runtime context provided to plugins
 */
export interface PluginContext {
    /** Logger instance for plugin use */
    logger: PluginLogger;

    /** Plugin-specific configuration */
    config?: unknown;

    /** Environment variables */
    env?: Record<string, string | undefined>;

    /** Plugin registry for inter-plugin communication (read-only) */
    registry?: PluginRegistry;

    /** Event emitter for plugin events */
    events?: PluginEventEmitter;

    /** Metrics collector */
    metrics?: PluginMetrics;
}

/**
 * Plugin registry interface (read-only access)
 */
export interface PluginRegistry {
    /** Get a plugin by name */
    getPlugin(name: string): IPlugin | undefined;

    /** List all registered plugins */
    listPlugins(): ReadonlyArray<string>;

    /** Check if a plugin is registered */
    hasPlugin(name: string): boolean;
}

/**
 * Event emitter for plugin communication
 */
export interface PluginEventEmitter {
    /** Emit an event */
    emit(event: string, data?: unknown): void;

    /** Listen to an event */
    on(event: string, handler: (data?: unknown) => void): void;

    /** Remove event listener */
    off(event: string, handler: (data?: unknown) => void): void;

    /** Listen to an event once */
    once(event: string, handler: (data?: unknown) => void): void;
}

/**
 * Metrics collection interface
 */
export interface PluginMetrics {
    /** Increment a counter */
    increment(name: string, value?: number): void;

    /** Record a gauge value */
    gauge(name: string, value: number): void;

    /** Record a histogram value */
    histogram(name: string, value: number): void;

    /** Start a timer */
    startTimer(name: string): () => void;
}

/**
 * Optional lifecycle hooks for plugins
 */
export interface PluginLifecycle {
    /** Called before initialize() */
    onBeforeInitialize?(): Promise<void>;

    /** Called after successful initialize() */
    onAfterInitialize?(): Promise<void>;

    /** Called before destroy() */
    onBeforeDestroy?(): Promise<void>;

    /** Called after successful destroy() */
    onAfterDestroy?(): Promise<void>;

    /** Called when configuration changes */
    onConfigChange?(newConfig: unknown, oldConfig: unknown): Promise<void>;

    /** Called periodically for health checks */
    onHealthCheck?(): Promise<HealthCheckResult>;

    /** Called when plugin enters error state */
    onError?(error: Error): Promise<void>;

    /** Called when plugin recovers from error */
    onRecover?(): Promise<void>;
}

/**
 * Plugin error class for consistent error handling
 */
export class PluginError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly plugin?: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'PluginError';
    }
}

/**
 * Common plugin error codes
 */
export enum PluginErrorCode {
    INITIALIZATION_FAILED = 'PLUGIN_INIT_FAILED',
    DESTRUCTION_FAILED = 'PLUGIN_DESTROY_FAILED',
    INVALID_CONFIG = 'PLUGIN_INVALID_CONFIG',
    DEPENDENCY_MISSING = 'PLUGIN_DEPENDENCY_MISSING',
    INCOMPATIBLE_VERSION = 'PLUGIN_INCOMPATIBLE_VERSION',
    PERMISSION_DENIED = 'PLUGIN_PERMISSION_DENIED',
    HEALTH_CHECK_FAILED = 'PLUGIN_HEALTH_CHECK_FAILED',
    INVALID_STATE = 'PLUGIN_INVALID_STATE',
    UNKNOWN_ERROR = 'PLUGIN_UNKNOWN_ERROR'
}

/**
 * Plugin SDK version for compatibility checking
 */
export const PLUGIN_SDK_VERSION = '0.1.0';

export {BasePlugin} from './base.js';

export type {
    PluginManifest,
    PluginCapabilities,
    PluginType,
    PluginCategory,
    PluginPricing,
    PluginSupport,
    ConfigSchema
} from './manifest.js';

export type {IProviderPlugin} from './provider.js';
export {GuardType} from './guard.js';
export type {IGuardPlugin, GuardConfig, GuardResult, GuardRule} from './guard.js';
export type {IEvaluatorPlugin, EvaluatorConfig, EvaluationResult, EvaluationMetric} from './evaluator.js';
export type {ILoggerPlugin, LoggerConfig, LogEntry, LogFilter} from './logger.js';
export type {IWorkerPlugin, WorkerConfig, WorkerTask, WorkerResult, QueueStatus} from './worker.js';

// Export validators
// Validators removed - using TypeScript types only for plugin architecture