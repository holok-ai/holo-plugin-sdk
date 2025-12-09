import {injectable} from 'tsyringe';
import type {IWorkerPlugin} from '@holokai/sdk/plugin';
import type {IPluginRegistry} from './registry.service';

@injectable()
export class WorkerPluginRegistry implements IPluginRegistry<IWorkerPlugin> {
    private readonly plugins: Map<string, IWorkerPlugin>;

    constructor() {
        this.plugins = new Map();
    }

    registerPlugin(plugin: IWorkerPlugin): void {
        const workerType = this.getWorkerType(plugin);
        this.plugins.set(workerType, plugin);
    }

    unregisterPlugin(workerType: string): void {
        this.plugins.delete(workerType);
    }

    listPlugins(): IWorkerPlugin[] {
        return Array.from(this.plugins.values());
    }

    getByType(workerType: string): IWorkerPlugin | null {
        return this.plugins.get(workerType) || null;
    }

    async atomicReplace(workerType: string, newPlugin: IWorkerPlugin): Promise<IWorkerPlugin | null> {
        const oldPlugin = this.plugins.get(workerType) || null;
        this.plugins.set(workerType, newPlugin);
        return oldPlugin;
    }

    private getWorkerType(plugin: IWorkerPlugin): string {
        if (plugin.manifest.custom?.workerType) {
            return String(plugin.manifest.custom.workerType);
        }
        const match = plugin.manifest.name.match(/@[\w-]+\/worker-(.+)/);
        return match ? match[1] : plugin.manifest.name;
    }
}
