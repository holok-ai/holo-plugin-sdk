import type {HoloLogger} from "../logger";
import type {IProvider, IProviderTranslator, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "../provider";
import type {RouteDefinition, RouteHandler} from "../routing";
import type {INotificationService} from "../notification";
import type {CostResult, PricingSheetModel, ProtocolCapability} from "../entities";
import {Plugin} from "../entities";

export const PluginType = {
    PROVIDER: 'PROVIDER'
} as const;

export type PluginType = typeof PluginType[keyof typeof PluginType];

export const PluginState = {
    UNINITIALIZED: 'UNINITIALIZED',
    INITIALIZING: 'INITIALIZING',
    READY: 'READY',
    ERROR: 'ERROR',
    DESTROYING: 'DESTROYING',
    DESTROYED: 'DESTROYED',
} as const;

export type PluginState = typeof PluginState[keyof typeof PluginState];

export const PluginErrorCode = {
    INITIALIZATION_FAILED: 'PLUGIN_INIT_FAILED',
    DESTRUCTION_FAILED: 'PLUGIN_DESTROY_FAILED',
    INVALID_STATE: 'PLUGIN_INVALID_STATE',
} as const;

export type PluginErrorCode = typeof PluginErrorCode[keyof typeof PluginErrorCode];

export interface PluginManifest {
    name: string;
    version: string;
    pluginType: PluginType;
    family?: string;
    displayName?: string;
    description?: string;
}

export interface PluginContext {
    logger: HoloLogger;
    loggerFactory?: (pluginName: string) => HoloLogger;
    config?: unknown;
    env?: Record<string, string | undefined>;
    notifications?: INotificationService;
}

export interface IPlugin {
    readonly manifest: PluginManifest;
    readonly name: string;
    readonly state: PluginState;
    readonly family: string;
    readonly type: PluginType;
    readonly version: string;

    initialize(context: PluginContext): Promise<void>;

    destroy(): Promise<void>;

    getState(): PluginState;
}

export interface IPluginRegistry<T extends IPlugin> {
    registerPlugin(serverName: string, plugin: T, isLatest?: boolean): Promise<void>;

    unregisterPlugin(serverName: string, id: string, version?: string): Promise<void>;

    getPlugins(filter?: (plugin: Plugin) => boolean): Promise<Plugin[]>

    getImpls(filter?: (plugin: Plugin) => boolean): Promise<T[]>
}

export interface PluginPricingModel {
    model_name: string;
    input_cost: number;
    output_cost: number;
    cache_read_cost?: number;
    cache_write_cost?: number;
    batch_input_cost?: number;
    batch_output_cost?: number;
    context_threshold?: number;
    extended_input_cost?: number;
    extended_output_cost?: number;
    token_costs?: Record<string, number>;
}

export interface PluginPricingSheet {
    name: string;
    version: string;
    effective_from: string;
    effective_to?: string;
    models: PluginPricingModel[];
}

export interface PricingSnapshot {
    name: string;
    version: string;
    effective_from: string;
    models: PluginPricingModel[];
}

export interface PricingModelId {
    model_id: string;
    family: string;
    kind: string;
    release_date: string;
    shutdown_date: string | null;
    pricing_snapshot: string | null;
    aliases?: string[];
}

export interface PricingDataset {
    name: string;
    version: string;
    pricing_snapshots: PricingSnapshot[];
    model_ids: PricingModelId[];
}

export interface IProviderPlugin<TProvider = IProvider> extends IPlugin {
    translator: IProviderTranslator;
    defaultRouteHandler?: RouteHandler;
    protocols: Record<string, string>;
    defaultProtocol: string;

    createProvider(id: string, name: string, config: any): Promise<TProvider>;

    getCapabilities(): ProviderCapabilities;

    getRoutes(): RouteDefinition[];

    createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter>;

    getDefaultPricing?(): PluginPricingSheet;

    getPricingSheets?(): Map<string, PluginPricingSheet>;

    calculateCost(tokens: Record<string, number>, pricing: PricingSheetModel): CostResult;

    getProtocolByCapability(capability: ProtocolCapability): string | undefined;
}
