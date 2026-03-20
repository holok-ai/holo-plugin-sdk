import {promises as fs} from 'fs';
import path from 'path';
import type {IProviderPlugin, PluginContext} from '@holokai/holo-types/plugin';
import type {HoloLogger} from '@holokai/holo-types/logger';

const pluginCache = new Map<string, IProviderPlugin>();

export interface LoadPluginOptions {
    context?: PluginContext;
    skipInitialize?: boolean;
}

export function createMockPluginContext(): PluginContext {
    const noop = () => {};
    const noopLogger = {
        level: 'silent',
        info: noop,
        warn: noop,
        error: noop,
        debug: noop,
        verbose: noop,
        child: () => noopLogger,
    } as unknown as HoloLogger;
    return {logger: noopLogger};
}

export async function discoverPlugins(nodeModulesDir?: string): Promise<string[]> {
    const scopePath = path.resolve(nodeModulesDir ?? 'node_modules', '@holokai');

    try {
        const entries = await fs.readdir(scopePath, {withFileTypes: true});
        return entries
            .filter(d => (d.isDirectory() || d.isSymbolicLink()) && d.name.startsWith('holo-provider-'))
            .map(d => `@holokai/${d.name}`);
    } catch {
        return [];
    }
}

export function familyFromPackage(packageName: string): string {
    const match = packageName.match(/@holokai\/holo-provider-(.+)/);
    return match?.[1] ?? packageName;
}

export async function loadPlugin(family: string, opts?: LoadPluginOptions): Promise<IProviderPlugin> {
    const cached = pluginCache.get(family);
    if (cached) return cached;

    const packageName = `@holokai/holo-provider-${family}`;
    return loadPluginFromPackage(packageName, opts);
}

export async function loadPluginFromPackage(packageName: string, opts?: LoadPluginOptions): Promise<IProviderPlugin> {
    const family = familyFromPackage(packageName);
    const cached = pluginCache.get(family);
    if (cached) return cached;

    const mod = await import(packageName);
    const plugin: IProviderPlugin = mod.default;

    if (!opts?.skipInitialize && plugin.getState() !== 'READY') {
        await plugin.initialize(opts?.context ?? createMockPluginContext());
    }

    pluginCache.set(family, plugin);
    return plugin;
}

export async function loadAllPlugins(nodeModulesDir?: string, opts?: LoadPluginOptions): Promise<Map<string, IProviderPlugin>> {
    const packages = await discoverPlugins(nodeModulesDir);
    for (const pkg of packages) {
        await loadPluginFromPackage(pkg, opts);
    }
    return getLoadedPlugins();
}

export function getLoadedPlugins(): Map<string, IProviderPlugin> {
    return new Map(pluginCache);
}

export function clearPluginCache(): void {
    pluginCache.clear();
}
