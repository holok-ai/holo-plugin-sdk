import {PluginManifest, IPlugin, PluginContext, PluginState, PluginType} from "@holokai/types/plugin";
import {PluginError, PluginErrorCode} from "./errors";
import {ClassLogger} from "../core";
import type {CostResult, PricingSheetModel} from "@holokai/types/entities";


export abstract class BasePlugin extends ClassLogger implements IPlugin {
    id?: string;
    abstract readonly manifest: PluginManifest;

    private _context: PluginContext | undefined;
    protected _state: PluginState = PluginState.UNINITIALIZED;

    get state(): PluginState {
        return this._state;
    }

    get name(): string {
        return this.manifest.name;
    }

    get type(): PluginType {
        return this.manifest.pluginType;
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

    calculateCost(tokens: Record<string, number>, pricing: PricingSheetModel): CostResult {
        let inputRate = Number(pricing.input_cost);
        let outputRate = Number(pricing.output_cost);

        if (pricing.context_threshold && pricing.extended_input_cost && pricing.extended_output_cost) {
            const totalInput = Object.entries(tokens)
                .filter(([k]) => k !== 'output')
                .reduce((sum, [, v]) => sum + v, 0);
            if (totalInput > pricing.context_threshold) {
                inputRate = Number(pricing.extended_input_cost);
                outputRate = Number(pricing.extended_output_cost);
            }
        }

        const inputCost = (tokens.input ?? 0) * inputRate;
        const outputCost = (tokens.output ?? 0) * outputRate;
        const extraCosts = this.calculateExtraCosts(tokens, pricing);

        return {
            input_cost: inputCost,
            output_cost: outputCost,
            total_cost: inputCost + outputCost + extraCosts.total,
            detail: {
                input: {tokens: tokens.input ?? 0, cost: inputCost},
                output: {tokens: tokens.output ?? 0, cost: outputCost},
                ...extraCosts.detail,
            }
        };
    }

    protected abstract calculateExtraCosts(
        tokens: Record<string, number>,
        pricing: PricingSheetModel
    ): { total: number; detail: Record<string, { tokens: number; cost: number }> };

    protected abstract onInitialize(context: PluginContext): Promise<void>;

    protected abstract onDestroy(): Promise<void>;
}
