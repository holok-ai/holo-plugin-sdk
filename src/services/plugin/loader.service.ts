import { injectable } from 'tsyringe';
import { EventEmitter } from 'events';
import type { IPlugin } from '@holokai/common/plugin';
import type { DiscoveredPlugin } from './discovery.service';

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
  async loadPlugins(discovered: DiscoveredPlugin[]): Promise<IPlugin[]> {
    const loaded: IPlugin[] = [];

    for (const plugin of discovered) {
      const result = await this.loadPlugin(plugin);
      if (result) {
        loaded.push(result);
      }
    }

    return loaded;
  }

  async loadPlugin(discovered: DiscoveredPlugin): Promise<IPlugin | null> {
    try {
      const module = await import(discovered.packageName);

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

      console.log(`[Plugin] Loaded ${discovered.packageName} v${plugin.manifest.version}`);
      this.emit('plugin:loaded', { plugin, packageName: discovered.packageName } as PluginLoadedEvent);

      return plugin;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Plugin] Failed to load ${discovered.packageName}: ${err.message}`);
      this.emit('plugin:failed', { packageName: discovered.packageName, error: err } as PluginFailedEvent);
      return null;
    }
  }
}
