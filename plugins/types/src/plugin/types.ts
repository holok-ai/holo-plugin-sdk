import type {HoloLogger} from "../logger";
import type {IProvider, IProviderTranslator, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "../provider";
import type {RouteHandler, RouteTree} from "../routing";
import type {INotificationService} from "../notification";

export type PluginType = 'provider';

export const PluginState = {
    UNINITIALIZED: 'uninitialized',
    INITIALIZING: 'initializing',
    READY: 'ready',
    ERROR: 'error',
    DESTROYING: 'destroying',
    DESTROYED: 'destroyed',
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
    readonly state: PluginState;
    readonly family: string;

    initialize(context: PluginContext): Promise<void>;

    destroy(): Promise<void>;

    getState(): PluginState;
}

export interface IPluginRegistry<T extends IPlugin> {
    registerPlugin(plugin: T, version?: string, isLatest?: boolean): void;

    unregisterPlugin(id: string, version?: string): void;

    listPlugins(): T[];
}

export interface IProviderPlugin<TProvider = IProvider> extends IPlugin {
    translator: IProviderTranslator;
    defaultRouteHandler?: RouteHandler;

    createProvider(config: any): Promise<TProvider>;

    getCapabilities(): ProviderCapabilities;

    getRoutes(): RouteTree;

    createWireAdapter(params: WireAdapterParams): IWireAdapter;
}
