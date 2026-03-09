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
import {PluginDB, ServerDB} from "../../db";
import {BaseEntityService} from "../entities";
import {Plugin} from "@holokai/types/entities";
import {RedisService} from "../redis.service";
import {ProviderImplService} from "./provider.impl.service";

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
        const dbPlugin = await this.pluginDB.upsert(family, plugin.manifest.name, pluginVersion, plugin.type, isLatest);
        if (!dbPlugin) throw new Error(`Error registering plugin ${plugin.name}:${plugin.version} does not exist`);

        await this.serverDB.registerPlugin(serverName, dbPlugin.id);

        this.pluginImpls.set(dbPlugin.id, plugin);

        if (!this.versionedPlugins.has(family)) {
            this.versionedPlugins.set(family, new Map());
        }
        this.versionedPlugins.get(family)!.set(pluginVersion, dbPlugin);

        if (dbPlugin.is_default) {
            this.defaultPlugins.set(family, dbPlugin);
        }

        const routeTree = plugin.getRoutes();

        switch (plugin.type) {
            case PluginType.PROVIDER:
                await this.providerPluginService.registerProtocols(dbPlugin.id, routeTree, family);
                await this.providerImplService.createProviderImpls(dbPlugin.id, plugin);
                break;
            default:
                throw new Error(`Unsupported plugin type ${plugin.type}`);
        }

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
