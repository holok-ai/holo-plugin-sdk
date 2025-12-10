import {
    HealthCheckResult,
    IPlugin,
    PluginContext,
    PluginError,
    PluginErrorCode,
    PluginManifest,
    PluginState,
} from './index.js';

/**
 * Base abstract class implementing common plugin functionality.
 *
 * Lifecycle:
 *   UNINITIALIZED → INITIALIZING → READY → DESTROYING → DESTROYED
 *   Any failure moves the plugin to ERROR.
 */
export abstract class BasePlugin implements IPlugin {
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

    /**
     * Initialize the plugin with a runtime context.
     * May only be called once from the UNINITIALIZED state.
     */
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
            await this.onInitialize(context);
            this._state = PluginState.READY;
        } catch (error) {
            // Clear context on failed initialization to avoid half-initialized usage
            this._context = undefined;
            this._state = PluginState.ERROR;

            throw new PluginError(
                'Failed to initialize plugin',
                PluginErrorCode.INITIALIZATION_FAILED,
                this.manifest.name,
                error
            );
        }
    }

    /**
     * Destroy the plugin and release any resources.
     * Idempotent: safe to call multiple times.
     */
    async destroy(): Promise<void> {
        if (this._state === PluginState.DESTROYED) {
            return;
        }

        if (this._state === PluginState.UNINITIALIZED) {
            // Nothing to tear down; just mark as destroyed
            this._state = PluginState.DESTROYED;
            this._context = undefined;
            return;
        }

        this._state = PluginState.DESTROYING;

        try {
            await this.onDestroy();
            this._state = PluginState.DESTROYED;
            this._context = undefined;
        } catch (error) {
            this._state = PluginState.ERROR;
            // Keep context for potential debugging/logging while in ERROR
            throw new PluginError(
                'Failed to destroy plugin',
                PluginErrorCode.DESTRUCTION_FAILED,
                this.manifest.name,
                error
            );
        }
    }

    /**
     * Health check endpoint used by the host.
     * By default:
     *   - Not READY → unhealthy
     *   - READY → healthy unless onHealthCheck() reports otherwise
     */
    async healthCheck(): Promise<HealthCheckResult> {
        const timestamp = Date.now();

        if (this._state !== PluginState.READY) {
            return {
                healthy: false,
                message: `Plugin not ready (state: ${this._state})`,
                timestamp,
            };
        }

        try {
            const customCheck = await this.onHealthCheck();
            // Allow plugin to override default response
            return (
                customCheck ?? {
                    healthy: true,
                    timestamp,
                }
            );
        } catch (error) {
            return {
                healthy: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Health check failed',
                timestamp,
            };
        }
    }

    /**
     * Hook invoked during initialize().
     * Implementations should:
     *   - Validate configuration
     *   - Establish any long-lived connections
     *   - Perform a lightweight self-check
     *
     * Throwing will mark the plugin as ERROR and fail initialization.
     */
    protected abstract onInitialize(context: PluginContext): Promise<void>;

    /**
     * Hook invoked during destroy().
     * Implementations should:
     *   - Close connections
     *   - Flush buffers
     *   - Release resources
     *
     * Throwing will mark the plugin as ERROR.
     */
    protected abstract onDestroy(): Promise<void>;

    /**
     * Optional hook for custom health checks.
     * Return:
     *   - undefined → host will consider the plugin healthy
     *   - HealthCheckResult → host will use this result verbatim
     *
     * Throwing marks the plugin unhealthy for that check invocation.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    protected async onHealthCheck(): Promise<HealthCheckResult | void> {
        // Default implementation: no-op (host treats as healthy if READY)
        return;
    }
}