import {container} from 'tsyringe';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import type {HoloLogger} from '@holokai/types/logger';

const pluginCache = new Map<string, IProviderPlugin>();

const PLUGIN_PACKAGES: Record<string, string> = {
    openai: '@holokai/holo-provider-openai',
    claude: '@holokai/holo-provider-claude',
    gemini: '@holokai/holo-provider-gemini',
    ollama: '@holokai/holo-provider-ollama',
};

let loggerRegistered = false;

function ensureLoggerFactory() {
    if (loggerRegistered) return;
    loggerRegistered = true;

    const noop = () => {
    };
    const noopLogger: HoloLogger = {
        info: noop,
        warn: noop,
        error: noop,
        debug: noop,
        trace: noop,
        verbose: noop,
        fatal: noop,
        child: () => noopLogger,
    } as any;

    container.register('LoggerFactory', {
        useValue: (_cls: Function | string) => noopLogger,
    });
}

function createMockContext(): PluginContext {
    const noop = () => {
    };
    return {
        logger: {
            info: noop,
            warn: noop,
            error: noop,
            debug: noop,
            trace: noop,
            verbose: noop,
            fatal: noop,
            child: () => ({
                info: noop,
                warn: noop,
                error: noop,
                debug: noop,
                trace: noop,
                verbose: noop,
                fatal: noop,
                child: () => ({})
            } as any),
        } as any,
    };
}

export async function loadPlugin(family: string): Promise<IProviderPlugin> {
    ensureLoggerFactory();

    const cached = pluginCache.get(family);
    if (cached) return cached;

    const pkg = PLUGIN_PACKAGES[family];
    if (!pkg) throw new Error(`Unknown plugin family: ${family}`);

    const mod = await import(pkg);
    const plugin: IProviderPlugin = mod.default;

    if (plugin.getState() !== 'READY') {
        await plugin.initialize(createMockContext());
    }

    pluginCache.set(family, plugin);
    return plugin;
}

export function getLoadedPlugins(): Map<string, IProviderPlugin> {
    return new Map(pluginCache);
}
