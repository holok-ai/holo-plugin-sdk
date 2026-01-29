import {injectable} from 'tsyringe';
import {EventEmitter} from 'events';
import {pathToFileURL} from 'url';
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
            let modulePath = `${discovered.packagePath}/${discovered.entryPoint}`;

            // Check if running in WSL (Linux platform but Windows-style paths)
            const isWindowsPath = /^[A-Z]:[\\\/]/i.test(modulePath);
            if (isWindowsPath && process.platform === 'linux') {
                // Convert Windows path to WSL mount path: C:\... -> /mnt/c/...
                modulePath = modulePath.replace(/^([A-Z]):[\\\/]/i, (_match, drive) => {
                    return `/mnt/${drive.toLowerCase()}/`;
                }).replace(/\\/g, '/');
            }

            // Convert to file:// URL for ESM import
            const moduleURL = pathToFileURL(modulePath).href;
            const module = await import(moduleURL);

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
