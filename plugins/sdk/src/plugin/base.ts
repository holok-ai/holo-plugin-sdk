import {PluginManifest} from "./manifest";
import {PluginContext} from "./context";
import {PluginError, PluginErrorCode} from "./errors";
import {ClassLogger} from "../core";


export enum PluginState {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
    DESTROYING = 'destroying',
    DESTROYED = 'destroyed'
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
 * Health check result for plugin status monitoring
 */
export interface HealthCheckResult {
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
    timestamp: number;
}

/**
 * Base abstract class implementing common plugin functionality.
 *
 * Lifecycle:
 *   UNINITIALIZED → INITIALIZING → READY → DESTROYING → DESTROYED
 *   Any failure moves the plugin to ERROR.
 */
export abstract class BasePlugin extends ClassLogger implements IPlugin {
    /**
     * Static manifest per-plugin implementation.
     * Implementations SHOULD treat this as immutable metadata.
     */
    abstract readonly manifest: PluginManifest;

    private _context: PluginContext | undefined;
    protected _state: PluginState = PluginState.UNINITIALIZED;

    /**
     * Current plugin state (read-only from outside).
     */
    get state(): PluginState {
        return this._state;
    }


    /**
     * Strongly typed access to the plugin context.
     * Throws if accessed before initialize() or after destroy().
     */
    protected get pluginContext(): PluginContext {
        if (!this._context) {
            throw new PluginError(
                'Plugin context is not available. Initialize the plugin first.',
                PluginErrorCode.INVALID_STATE,
                this.manifest.name
            );
        }
        return this._context;
    }

    /**
     * Backwards-compatible state accessor.
     */
    getState(): PluginState {
        return this._state;
    }

    async initialize(context: PluginContext): Promise<void> {
        if (this._state !== PluginState.UNINITIALIZED) {
            throw new PluginError(
                `Cannot initialize plugin in state ${this._state}`,
                PluginErrorCode.INITIALIZATION_FAILED,
                this.manifest.name
            );
        }

        this._state = PluginState.INITIALIZING;
        this._context = context;

        try {
            this.log.debug('Initializing plugin');
            await this.onInitialize(context);
            this._state = PluginState.READY;
            this.log.info('Plugin initialized successfully');
        } catch (error) {
            this._state = PluginState.ERROR;
            this.log.error('Plugin initialization failed', {error});
            throw new PluginError(
                'Failed to initialize plugin',
                PluginErrorCode.INITIALIZATION_FAILED,
                this.manifest.name,
                error
            );
        }
    }

    async destroy(): Promise<void> {
        if (this._state === PluginState.DESTROYED) {
            return;
        }

        if (this._state === PluginState.UNINITIALIZED) {
            this._state = PluginState.DESTROYED;
            return;
        }

        this._state = PluginState.DESTROYING;

        try {
            this.log.info('Destroying plugin');
            await this.onDestroy();
            this._state = PluginState.DESTROYED;
            this._context = undefined;
        } catch (error) {
            this._state = PluginState.ERROR;
            // Fall back to console if logger is gone
            try {
                this.log.error('Plugin destruction failed', {error});
            } catch {
                console.error(`[${this.manifest.name}] Plugin destruction failed`, error);
            }
            throw new PluginError(
                'Failed to destroy plugin',
                PluginErrorCode.DESTRUCTION_FAILED,
                this.manifest.name,
                error
            );
        }
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const timestamp = Date.now();

        if (this._state !== PluginState.READY) {
            return {
                healthy: false,
                message: `Plugin not ready (state: ${this._state})`,
                timestamp
            };
        }

        try {
            const customCheck = await this.onHealthCheck();
            return (
                customCheck ?? {
                    healthy: true,
                    timestamp
                }
            );
        } catch (error) {
            this.log.warn('Health check failed', {error});
            return {
                healthy: false,
                message: error instanceof Error ? error.message : 'Health check failed',
                timestamp
            };
        }
    }

    protected abstract onInitialize(context: PluginContext): Promise<void>;

    protected abstract onDestroy(): Promise<void>;

    protected async onHealthCheck(): Promise<HealthCheckResult | void> {
        // Default implementation: no-op (host treats as healthy if READY)
        return;
    }

}