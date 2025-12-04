import { injectable } from 'tsyringe';
import type { IGuardPlugin } from '@holokai/common/plugin';
import type { IPluginRegistry } from './registry.service';

@injectable()
export class GuardPluginRegistry implements IPluginRegistry<IGuardPlugin> {
  private readonly plugins: Map<string, IGuardPlugin>;

  constructor() {
    this.plugins = new Map();
  }

  registerPlugin(plugin: IGuardPlugin): void {
    const guardName = this.getGuardName(plugin);
    this.plugins.set(guardName, plugin);
  }

  private getGuardName(plugin: IGuardPlugin): string {
    if (plugin.manifest.custom?.guardName) {
      return String(plugin.manifest.custom.guardName);
    }
    const match = plugin.manifest.name.match(/@[\w-]+\/guard-(.+)/);
    return match ? match[1] : plugin.manifest.name;
  }

  unregisterPlugin(guardName: string): void {
    this.plugins.delete(guardName);
  }

  listPlugins(): IGuardPlugin[] {
    return Array.from(this.plugins.values());
  }

  getByName(guardName: string): IGuardPlugin | null {
    return this.plugins.get(guardName) || null;
  }

  async atomicReplace(guardName: string, newPlugin: IGuardPlugin): Promise<IGuardPlugin | null> {
    const oldPlugin = this.plugins.get(guardName) || null;
    this.plugins.set(guardName, newPlugin);
    return oldPlugin;
  }
}
