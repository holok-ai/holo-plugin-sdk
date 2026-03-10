import {injectable} from 'tsyringe';
import {PluginDiscoveryService} from './discovery.service';
import {PluginLoaderService} from './loader.service';
import {ProviderPluginService} from './provider.plugin.service';
import {
    IPlugin,
    type IPluginRegistry,
    IProviderPlugin,
    PluginContext,
    PluginState,
    PluginType
} from '@holokai/types/plugin';
import type {HoloLogger} from "@holokai/types/logger";
import logger from "../../utils/logger";
import {PluginDB, PricingDB, ServerDB} from "../../db";
import {BaseEntityService} from "../entities";
import {Plugin} from "@holokai/types/entities";
import {RedisService} from "../redis.service";
import {ProviderImplService} from "./provider.impl.service";
import {pickDefined} from "@holokai/sdk";

/**
 * Service responsible for initializing and managing the plugin system
 * Orchestrates plugin discovery, loading, initialization, and registration
 */
@injectable()
export class PluginService extends BaseEntityService<Plugin> implements IPluginRegistry<IPlugin> {

    private readonly defaultPlugins: Map<string, Plugin> = new Map();
    private readonly versionedPlugins: Map<string, Map<string, Plugin>> = new Map();
    private readonly pluginImpls: Map<string, IPlugin> = new Map();

    constructor(
        private readonly pluginDB: PluginDB,
        private readonly serverDB: ServerDB,
        private readonly pricingDB: PricingDB,
        private readonly discovery: PluginDiscoveryService,
        private readonly loader: PluginLoaderService,
        private readonly providerPluginService: ProviderPluginService,
        private readonly providerImplService: ProviderImplService,
        redis: RedisService,
    ) {
        super(redis, {prefix: 'plugin', ttl: 300});
    }

    /**
     * Initialize the plugin system by discovering, loading, and registering plugins
     * @returns Promise that resolves when all plugins are initialized
     */
    async initializePluginSystem(serverName: string): Promise<void> {
        const log = this.mlog(this.initializePluginSystem);
        log.info('Initializing plugin system...');

        // Discover provider plugins
        const discovered = await this.discovery.discoverPluginsByType(PluginType.PROVIDER);
        log.info(`Discovered ${discovered.length} provider plugins`);

        // Load plugins
        const loaded = await this.loader.loadPlugins(discovered);
        log.info(`Loaded ${loaded.length} provider plugins`);

        // Initialize and register each provider plugin
        for (const {plugin, discoveryInfo} of loaded) {

            //register plugin
            await this.registerPlugin(
                serverName,
                plugin as IProviderPlugin,
                discoveryInfo.isLatest
            );

            // Create plugin context
            const pluginContext: PluginContext = {
                logger: logger as HoloLogger,
                config: {},
                env: process.env
            };

            // Initialize plugin
            await plugin.initialize(pluginContext);

            if (plugin.getState() === PluginState.READY) {
                log.info(`Registered provider plugin: ${plugin.manifest.name}@${discoveryInfo.version}${discoveryInfo.isLatest ? ' (latest)' : ''}`);
            } else {
                log.warn(`Plugin ${plugin.manifest.name} not ready, state: ${plugin.getState()}`);
            }
        }

        const registeredIds = Array.from(this.pluginImpls.keys());
        const removed = await this.serverDB.syncPlugins(serverName, registeredIds);
        if (removed > 0) {
            log.info(`Removed ${removed} stale plugin(s) from server ${serverName}`);
        }

        log.info('Plugin system initialized successfully');
    }

    async registerPlugin(serverName: string, plugin: IProviderPlugin, isLatest: boolean = false): Promise<void> {
        const logger = this.mlog(this.registerPlugin);
        logger.info(`Registering plugin: ${plugin.name} with server: ${serverName}`);
        if (!plugin.family) {
            throw new Error(`Plugin ${plugin.manifest.name} has no family defined`);
        }
        const family = plugin.family.toUpperCase();
        const pluginVersion = plugin.version;

        // 1. Upsert version-specific snapshot row (e.g., "1.2.0")
        await this.pluginDB.upsert(family, plugin.manifest.name, pluginVersion, plugin.type);

        // 2. Upsert the "latest" alias row (stable UUID, always updated in-place)
        const latestPlugin = await this.pluginDB.upsertLatest(family, plugin.manifest.name, plugin.type);
        if (!latestPlugin) throw new Error(`Error registering latest plugin for ${plugin.name}`);

        // 3. Mark "latest" as the default (atomically toggles is_default across the family)
        if (isLatest) {
            await this.pluginDB.setDefault(family, 'latest');
            latestPlugin.is_default = true;
        }

        // 4. Register with server using the "latest" row
        await this.serverDB.registerPlugin(serverName, latestPlugin.id);

        // 5. Store in memory maps
        this.pluginImpls.set(latestPlugin.id, plugin);
        if (!this.versionedPlugins.has(family)) {
            this.versionedPlugins.set(family, new Map());
        }
        this.versionedPlugins.get(family)!.set('latest', latestPlugin);
        this.versionedPlugins.get(family)!.set(pluginVersion, latestPlugin);
        if (latestPlugin.is_default) {
            this.defaultPlugins.set(family, latestPlugin);
        }

        const routeTree = plugin.getRoutes();

        switch (plugin.type) {
            case PluginType.PROVIDER:
                // 6. Register protocols against the "latest" row
                await this.providerPluginService.registerProtocols(latestPlugin.id, routeTree, family);

                // 7. Migrate providers from old versioned rows to "latest"
                const migrated = await this.providerImplService.migrateProvidersToLatest(family, latestPlugin.id);
                if (migrated > 0) {
                    logger.info(`Migrated ${migrated} provider(s) to latest plugin for ${family}`);
                }

                // 8. Create impls for providers on "latest"
                await this.providerImplService.createProviderImpls(latestPlugin.id, plugin);

                // 9. Create impls for version-pinned providers (using current runtime code)
                await this.providerImplService.createFamilyProviderImpls(family, latestPlugin.id, plugin);

                // 10. Register default pricing against "latest"
                await this.registerDefaultPricing(plugin, family, latestPlugin.id);

                // 11. Deactivate old versioned rows with no providers
                await this.pluginDB.deactivateUnusedVersions(family);
                break;
            default:
                throw new Error(`Unsupported plugin type ${plugin.type}`);
        }

    }

    private async registerDefaultPricing(plugin: IProviderPlugin, family: string, pluginId: string): Promise<void> {
        const logger = this.mlog(this.registerDefaultPricing);
        if (!plugin.getDefaultPricing) return;

        const pricingData = plugin.getDefaultPricing();
        if (!pricingData) return;

        const plan = await this.pricingDB.upsertPlan(
            family,
            pricingData.name,
            'plugin',
            true,
            true,
        );
        if (!plan) {
            logger.warn(`Failed to upsert default pricing plan for ${family}`);
            return;
        }

        await this.pluginDB.setDefaultPricingPlan(pluginId, plan.id);

        const sheet = await this.pricingDB.upsertSheet(
            plan.id,
            pricingData.name,
            pricingData.version,
            pricingData.effective_from
        );
        if (!sheet) {
            logger.warn(`Failed to upsert pricing sheet for ${family}`);
            return;
        }

        for (const model of pricingData.models) {
            await this.pricingDB.upsertSheetModel(sheet.id, model.model_name, pickDefined({
                input_cost: model.input_cost,
                output_cost: model.output_cost,
                cache_read_cost: model.cache_read_cost,
                cache_write_cost: model.cache_write_cost,
                batch_input_cost: model.batch_input_cost,
                batch_output_cost: model.batch_output_cost,
                context_threshold: model.context_threshold,
                extended_input_cost: model.extended_input_cost,
                extended_output_cost: model.extended_output_cost,
            }) as {
                input_cost: number;
                output_cost: number;
                cache_read_cost?: number;
                cache_write_cost?: number;
                batch_input_cost?: number;
                batch_output_cost?: number;
                context_threshold?: number;
                extended_input_cost?: number;
                extended_output_cost?: number;
            });
        }

        const currentModelNames = pricingData.models.map(m => m.model_name);
        await this.pricingDB.deleteStaleModels(sheet.id, currentModelNames);

        logger.info(`Registered default pricing for ${family}: ${pricingData.models.length} models`);
    }

    async unregisterPlugin(family: string, version?: string): Promise<void> {
        const familyKey = family.toUpperCase();

        if (!version) {
            this.defaultPlugins.delete(familyKey);
            this.versionedPlugins.delete(familyKey);
        } else {
            const versions = this.versionedPlugins.get(familyKey);
            if (versions) {
                versions.delete(version);

                const latestPlugin = this.defaultPlugins.get(familyKey);
                if (latestPlugin?.version === version) {
                    this.defaultPlugins.delete(familyKey);
                }

                if (versions.size === 0) {
                    this.versionedPlugins.delete(familyKey);
                }
            }
        }
    }

    async getPlugins(filter?: (plugin: Plugin) => boolean): Promise<Plugin[]> {
        const result: Plugin[] = [];
        for (const versionMap of this.versionedPlugins.values()) {
            for (const plugin of versionMap.values()) {
                if (!filter || filter(plugin)) {
                    result.push(plugin);
                }
            }
        }
        return result;
    }

    async getImpls(filter?: (plugin: Plugin) => boolean): Promise<IPlugin[]> {
        const result: IPlugin[] = [];
        for (const versionMap of this.versionedPlugins.values()) {
            for (const plugin of versionMap.values()) {
                if (!filter || filter(plugin)) {
                    const impl = this.pluginImpls.get(plugin.id);
                    if (impl) result.push(impl);
                }
            }
        }
        return result;
    }

    async getImplById(id: string): Promise<IPlugin | null> {
        return this.pluginImpls.get(id) || null;
    }

    async getImplByFamily(family: string, version?: string): Promise<IPlugin | null> {
        const familyKey = family.toUpperCase();
        const impls = await this.getImpls(p =>
            (!version && p.is_default || version === p.version) && p.family === familyKey);
        return impls.length > 0 ? impls[0] : null;
    }
}
