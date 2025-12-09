import {
  HealthCheckResult,
  IPlugin,
  PluginContext,
  PluginError,
  PluginErrorCode,
  PluginManifest,
  PluginState
} from './index.js';

/**
 * Base abstract class implementing common plugin functionality
 */
export abstract class BasePlugin implements IPlugin {
    abstract readonly manifest: PluginManifest;
    private context: PluginContext | undefined;

    protected _state: PluginState = PluginState.UNINITIALIZED;

    get state(): PluginState {
        return this._state;
    }

    protected get pluginContext(): PluginContext {
        if (!this.context) {
            throw new PluginError(
                'Plugin context is not available. Initialize the plugin first.',
                PluginErrorCode.INVALID_STATE,
                this.manifest.name
            );
        }
        return this.context;
    }

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
        this.context = context;

        try {
            await this.onInitialize(context);
            this._state = PluginState.READY;
        } catch (error) {
            this._state = PluginState.ERROR;
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
            await this.onDestroy();
            this._state = PluginState.DESTROYED;
            this.context = undefined;
        } catch (error) {
            this._state = PluginState.ERROR;
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
            return customCheck ?? {
                healthy: true,
                timestamp
            };
        } catch (error) {
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
    }
}