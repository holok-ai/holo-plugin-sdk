import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClassLogger} from '@holokai/sdk';
import {IProviderPlugin, PluginContext, PluginState} from '@holokai/types/plugin';
import type {HoloLogger} from '@holokai/types/logger';
import logger from '../../utils/logger';
import {PluginInstallerService} from './plugin.installer.service';
import {PluginDiscoveryService} from './discovery.service';
import {PluginLoaderService} from './loader.service';
import {PluginService} from './plugin.service';
import {PluginRouteService} from './plugin.route.service';
import {ProviderImplService} from './provider.impl.service';
import {ProviderPluginService} from './provider.plugin.service';
import {PluginPackageDB, PluginPackageMeta} from '../../db/plugin.package.db';
import {QueueService} from '../queue.service';
import {env} from '../../env';

interface PluginEventPayload {
    action: string;
    packageName: string;
    version: string;
    family: string;
    sha256: string;
    serverId: string;
    timestamp: number;
}

@injectable()
export class PluginLifecycleService extends ClassLogger {
    private serverId: string = '';

    constructor(
        private installer: PluginInstallerService,
        private packageDB: PluginPackageDB,
        private discovery: PluginDiscoveryService,
        private loader: PluginLoaderService,
        private pluginService: PluginService,
        private routeService: PluginRouteService,
        private providerImplService: ProviderImplService,
        private providerPluginService: ProviderPluginService,
        private queueService: QueueService,
    ) {
        super();
    }

    setServerId(serverId: string): void {
        this.serverId = serverId;
    }

    async install(packageName: string, version?: string, installedBy?: string): Promise<PluginPackageMeta> {
        const log = this.mlog(this.install);
        log.info(`Installing ${packageName}${version ? '@' + version : ''}`);
        return this.installer.installFromRegistry(packageName, version, installedBy);
    }

    async enable(packageName: string, enabledBy: string): Promise<void> {
        const log = this.mlog(this.enable);
        const pkg = await this.packageDB.getByName(packageName);
        if (!pkg) throw new Error(`Package ${packageName} not found. Install it first.`);
        if (pkg.enabled) {
            log.info(`${packageName} already enabled`);
            return;
        }

        await this.packageDB.enable(packageName, enabledBy);
        log.info(`Enabled ${packageName}, loading...`);

        await this.loadAndRegister(packageName, pkg.version, pkg.sha256);

        await this.broadcast('plugin.enabled', {
            packageName, version: pkg.version, family: pkg.family, sha256: pkg.sha256
        });
    }

    async disable(packageName: string): Promise<void> {
        const log = this.mlog(this.disable);
        const pkg = await this.packageDB.getByName(packageName);
        if (!pkg || !pkg.enabled) {
            log.info(`${packageName} not enabled`);
            return;
        }

        await this.unloadByFamily(pkg.family);
        await this.packageDB.disable(packageName);

        await this.broadcast('plugin.disabled', {
            packageName, version: pkg.version, family: pkg.family, sha256: pkg.sha256
        });

        log.info(`Disabled ${packageName}`);
    }

    async uninstall(packageName: string): Promise<void> {
        const pkg = await this.packageDB.getByName(packageName);
        if (pkg?.enabled) {
            throw new Error(`Cannot uninstall ${packageName} while enabled. Disable it first.`);
        }
        if (pkg?.source === 'builtin') {
            throw new Error(`Cannot uninstall builtin plugin ${packageName}`);
        }
        await this.installer.uninstall(packageName);
    }

    async reload(packageName: string, enabledBy: string): Promise<void> {
        const log = this.mlog(this.reload);
        log.info(`Reloading ${packageName}`);
        await this.disable(packageName);
        await this.enable(packageName, enabledBy);
    }

    async handleRemoteEnable(payload: PluginEventPayload): Promise<void> {
        if (payload.serverId === this.serverId) return;
        const log = this.mlog(this.handleRemoteEnable);
        log.info(`Remote enable: ${payload.packageName}@${payload.version} from ${payload.serverId}`);
        await this.loadAndRegister(payload.packageName, payload.version, payload.sha256);
    }

    async handleRemoteDisable(payload: PluginEventPayload): Promise<void> {
        if (payload.serverId === this.serverId) return;
        const log = this.mlog(this.handleRemoteDisable);
        log.info(`Remote disable: ${payload.family} from ${payload.serverId}`);
        await this.unloadByFamily(payload.family);
    }

    async syncEnabledPlugins(_serverName?: string): Promise<void> {
        const log = this.mlog(this.syncEnabledPlugins);
        const enabled = await this.packageDB.getEnabled();
        log.info(`Syncing ${enabled.length} enabled plugin(s)`);

        for (const pkg of enabled) {
            try {
                await this.loadAndRegister(pkg.package_name, pkg.version, pkg.sha256);
            } catch (e) {
                log.error(`Failed to sync ${pkg.package_name}: ${(e as Error).message}`);
            }
        }
    }

    private async loadAndRegister(packageName: string, version: string, sha256: string): Promise<void> {
        const log = this.mlog(this.loadAndRegister);

        const packageDir = await this.installer.ensurePlugin(packageName, version, sha256);

        const discovered = await this.discovery.discoverSingle(packageDir);
        if (!discovered) throw new Error(`Failed to discover ${packageName} at ${packageDir}`);
        discovered.isLatest = true;

        const loaded = await this.loader.loadPlugin(discovered);
        if (!loaded) throw new Error(`Failed to load ${packageName}`);

        const plugin = loaded.plugin as IProviderPlugin;
        const pluginContext: PluginContext = {
            logger: logger as HoloLogger,
            config: {},
            env: process.env
        };
        await plugin.initialize(pluginContext);

        if (plugin.getState() !== PluginState.READY) {
            throw new Error(`Plugin ${packageName} failed to initialize, state: ${plugin.getState()}`);
        }

        await this.pluginService.registerPlugin(this.serverId, plugin, true);

        const plugins = await this.pluginService.getPlugins(p => p.family === plugin.family.toUpperCase() && p.is_default);
        if (plugins.length > 0) {
            await this.routeService.registerPluginRoutes(plugins[0], plugin);
        }

        log.info(`Loaded and registered ${packageName}@${version}`);
    }

    private async unloadByFamily(family: string): Promise<void> {
        const plugins = await this.pluginService.getPlugins(p => p.family === family.toUpperCase());
        for (const plugin of plugins) {
            this.providerPluginService.removeProtocols(plugin.id);
            this.providerImplService.removeImplsByPluginId(plugin.id);
            await this.pluginService.removePlugin(plugin.id);
        }
    }

    private async broadcast(action: string, data: Omit<PluginEventPayload, 'action' | 'serverId' | 'timestamp'>): Promise<void> {
        try {
            await this.queueService.sendToExchange(env.queue.adminExchange, action, {
                action,
                ...data,
                serverId: this.serverId,
                timestamp: Date.now()
            });
        } catch (e) {
            this.log.warn(`Failed to broadcast ${action}: ${(e as Error).message}`);
        }
    }
}
