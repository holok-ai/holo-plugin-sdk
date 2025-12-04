import { injectable } from 'tsyringe';
import type { IProviderPlugin } from '@holokai/common/plugin';
import type { IPluginRegistry } from './registry.service';

@injectable()
export class ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin> {
  private readonly plugins: Map<string, IProviderPlugin>;

  constructor() {
    this.plugins = new Map();
  }

  registerPlugin(plugin: IProviderPlugin): void {
    const providerType = this.getProviderType(plugin);
    this.plugins.set(providerType, plugin);
  }

  private getProviderType(plugin: IProviderPlugin): string {
    if (plugin.manifest.custom?.providerType) {
      return String(plugin.manifest.custom.providerType);
    }
    const match = plugin.manifest.name.match(/@[\w-]+\/provider-(.+)/);
    return match ? match[1] : plugin.manifest.name;
  }

  unregisterPlugin(providerType: string): void {
    this.plugins.delete(providerType);
  }

  listPlugins(): IProviderPlugin[] {
    return Array.from(this.plugins.values());
  }

  getByProviderType(providerType: string): IProviderPlugin | null {
    return this.plugins.get(providerType) || null;
  }

  async atomicReplace(providerType: string, newPlugin: IProviderPlugin): Promise<IProviderPlugin | null> {
    const oldPlugin = this.plugins.get(providerType) || null;
    this.plugins.set(providerType, newPlugin);
    return oldPlugin;
  }
}
