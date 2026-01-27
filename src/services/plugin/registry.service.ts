import {injectable} from 'tsyringe';
import type {IPlugin, IPluginRegistry, PluginContext, PluginType} from '@holokai/sdk/plugin';
import {HoloLogger} from "@holokai/sdk";
import logger from "../../utils/logger";


@injectable()
export class PluginRegistryService {
    private readonly registries: Map<PluginType, IPluginRegistry<IPlugin>>;

    constructor() {
        this.registries = new Map();
    }

    registerTypeRegistry<T extends IPlugin>(type: PluginType, registry: IPluginRegistry<T>): void {
        this.registries.set(type, registry);
    }

    async registerPlugin(plugin: IPlugin): Promise<void> {
        try {
            const context: PluginContext = {
                logger: logger as HoloLogger,
                config: {},
                env: process.env
            };

            await plugin.initialize(context);

            const registry = this.registries.get(plugin.manifest.pluginType);
            if (!registry) {
                console.warn(`[PluginRegistry] No registry for plugin type: ${plugin.manifest.pluginType}`, {
                    pluginName: plugin.manifest.name
                });
                return;
            }

            registry.registerPlugin(plugin);
            console.log(`[PluginRegistry] Registered ${plugin.manifest.pluginType} plugin: ${plugin.manifest.name}`);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[PluginRegistry] Failed to register plugin: ${plugin.manifest.name}`, {
                error: err.message
            });
        }
    }

    getRegistry<T extends IPlugin>(type: PluginType): IPluginRegistry<T> | undefined {
        return this.registries.get(type) as IPluginRegistry<T> | undefined;
    }
}
