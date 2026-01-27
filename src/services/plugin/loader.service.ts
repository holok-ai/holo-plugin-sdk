import {injectable} from 'tsyringe';
import {EventEmitter} from 'events';
import type {IPlugin} from '@holokai/sdk/plugin';
import type {DiscoveredPlugin} from './discovery.service';

export interface LoadedPlugin {
    plugin: IPlugin;
    discoveryInfo: DiscoveredPlugin;
}

interface PluginLoadedEvent {
    plugin: IPlugin;
    packageName: string;
}

interface PluginFailedEvent {
    packageName: string;
    error: Error;
}

@injectable()
export class PluginLoaderService extends EventEmitter {
    async loadPlugins(discovered: DiscoveredPlugin[]): Promise<LoadedPlugin[]> {
        const loaded: LoadedPlugin[] = [];

        for (const discoveryInfo of discovered) {
            const result = await this.loadPlugin(discoveryInfo);
            if (result) {
                loaded.push(result);
            }
        }

        return loaded;
    }

    async loadPlugin(discovered: DiscoveredPlugin): Promise<LoadedPlugin | null> {
        try {
            // Import from package path instead of package name to handle workspace packages
            const modulePath = `${discovered.packagePath}/${discovered.entryPoint}`;
            const module = await import(modulePath);

            if (!module.default || typeof module.default !== 'object') {
                throw new Error('Plugin must export a default object');
            }

            const plugin = module.default as IPlugin;

            if (!plugin.manifest) {
                throw new Error('Plugin missing manifest property');
            }

            if (!plugin.manifest.name || !plugin.manifest.version || !plugin.manifest.pluginType) {
                throw new Error('Plugin manifest missing required fields');
            }

            console.log(`[Plugin] Loaded ${discovered.packageName} v${plugin.manifest.version}${discovered.isLatest ? ' (latest)' : ''}`);
            this.emit('plugin:loaded', {plugin, packageName: discovered.packageName} as PluginLoadedEvent);

            return {
                plugin,
                discoveryInfo: discovered
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.warn(`[Plugin] Failed to load ${discovered.packageName}: ${err.message}`);
            this.emit('plugin:failed', {packageName: discovered.packageName, error: err} as PluginFailedEvent);
            return null;
        }
    }
}
