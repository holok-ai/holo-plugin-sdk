import {injectable} from 'tsyringe';
import {PluginDiscoveryService} from './discovery.service';
import {PluginLoaderService} from './loader.service';
import {ProviderPluginRegistry} from './provider.registry.service';
import type {IPluginContext, IProviderPlugin} from '@holokai/types/plugin';
import {PluginState} from '@holokai/types/plugin';
import {ClassLogger} from "@holokai/sdk";
import type {HoloLogger} from "@holokai/types/logger";
import logger from "../../utils/logger";

/**
 * Service responsible for initializing and managing the plugin system
 * Orchestrates plugin discovery, loading, initialization, and registration
 */
@injectable()
export class PluginService extends ClassLogger {

    constructor(
        private readonly discovery: PluginDiscoveryService,
        private readonly loader: PluginLoaderService,
        private readonly providerRegistry: ProviderPluginRegistry
    ) {
        super();
    }

    /**
     * Initialize the plugin system by discovering, loading, and registering plugins
     * @returns Promise that resolves when all plugins are initialized
     */
    async initializePluginSystem(): Promise<void> {
        const log = this.mlog(this.initializePluginSystem);
        log.info('Initializing plugin system...');

        // Discover provider plugins
        const discovered = await this.discovery.discoverPluginsByType('provider');
        log.info(`Discovered ${discovered.length} provider plugins`);

        // Load plugins
        const loaded = await this.loader.loadPlugins(discovered);
        log.info(`Loaded ${loaded.length} provider plugins`);

        // Initialize and register each provider plugin
        for (const {plugin, discoveryInfo} of loaded) {
            const providerPlugin = plugin as IProviderPlugin;

            // Create plugin context
            const pluginContext: IPluginContext = {
                logger: logger as HoloLogger,
                config: {},
                env: process.env
            };

            // Initialize plugin
            await providerPlugin.initialize(pluginContext);

            if (providerPlugin.getState() === PluginState.READY) {
                this.providerRegistry.registerPlugin(
                    providerPlugin,
                    discoveryInfo.version,
                    discoveryInfo.isLatest
                );
                log.info(`Registered provider plugin: ${providerPlugin.manifest.name}@${discoveryInfo.version}${discoveryInfo.isLatest ? ' (latest)' : ''}`);
            } else {
                log.warn(`Plugin ${providerPlugin.manifest.name} not ready, state: ${providerPlugin.getState()}`);
            }
        }

        log.info('Plugin system initialized successfully');
    }
}
