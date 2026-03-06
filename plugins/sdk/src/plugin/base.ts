import {PluginManifest, IPlugin, PluginContext, PluginState} from "@holokai/types/plugin";
import {PluginError, PluginErrorCode} from "./errors";
import {ClassLogger} from "../core";


export abstract class BasePlugin extends ClassLogger implements IPlugin {
    abstract readonly manifest: PluginManifest;

    private _context: PluginContext | undefined;
    protected _state: PluginState = PluginState.UNINITIALIZED;

    get state(): PluginState {
        return this._state;
    }

    get name(): string {
        return this.manifest.name;
    }

    get family(): string {
        return this.manifest.family ?? this.manifest.name;
    }

    get version(): string {
        return this.manifest.version;
    }

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

    getState(): PluginState {
        return this._state;
    }

    async initialize(context: PluginContext): Promise<void> {
        const logger = this.mlog(this.initialize);
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
            logger.debug('Initializing plugin');
            await this.onInitialize(context);
            this._state = PluginState.READY;
            logger.info('Plugin initialized successfully');
        } catch (error) {
            this._state = PluginState.ERROR;
            logger.error('Plugin initialization failed', {error});
            throw new PluginError(
                'Failed to initialize plugin',
                PluginErrorCode.INITIALIZATION_FAILED,
                this.manifest.name,
                error
            );
        }
    }

    async destroy(): Promise<void> {
        const logger = this.mlog(this.destroy);
        if (this._state === PluginState.DESTROYED) {
            return;
        }

        if (this._state === PluginState.UNINITIALIZED) {
            this._state = PluginState.DESTROYED;
            return;
        }

        this._state = PluginState.DESTROYING;

        try {
            logger.info('Destroying plugin');
            await this.onDestroy();
            this._state = PluginState.DESTROYED;
            this._context = undefined;
        } catch (error) {
            this._state = PluginState.ERROR;
            try {
                logger.error('Plugin destruction failed', {error});
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

    protected abstract onInitialize(context: PluginContext): Promise<void>;

    protected abstract onDestroy(): Promise<void>;
}
