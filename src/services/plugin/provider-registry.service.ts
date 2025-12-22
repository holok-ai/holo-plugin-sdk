import {injectable} from 'tsyringe';
import type {IProviderPlugin} from '@holokai/sdk/plugin';
import type {IPluginRegistry} from './registry.service';

interface VersionedPlugin {
    plugin: IProviderPlugin;
    version: string;
    isLatest: boolean;
}

@injectable()
export class ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin> {
    // Map of providerType -> array of versioned plugins
    private readonly plugins: Map<string, VersionedPlugin[]>;

    constructor() {
        this.plugins = new Map();
    }

    registerPlugin(plugin: IProviderPlugin, version?: string, isLatest: boolean = true): void {
        const providerType = this.getProviderType(plugin);
        const pluginVersion = version || plugin.manifest.version;

        const versionedPlugin: VersionedPlugin = {
            plugin,
            version: pluginVersion,
            isLatest
        };

        const existing = this.plugins.get(providerType) || [];

        // If marking as latest, unmark other versions
        if (isLatest) {
            existing.forEach(vp => vp.isLatest = false);
        }

        existing.push(versionedPlugin);
        this.plugins.set(providerType, existing);
    }

    unregisterPlugin(providerType: string, version?: string): void {
        if (!version) {
            // Remove all versions
            this.plugins.delete(providerType);
        } else {
            // Remove specific version
            const existing = this.plugins.get(providerType);
            if (existing) {
                const filtered = existing.filter(vp => vp.version !== version);
                if (filtered.length === 0) {
                    this.plugins.delete(providerType);
                } else {
                    this.plugins.set(providerType, filtered);
                }
            }
        }
    }

    listPlugins(): IProviderPlugin[] {
        const allPlugins: IProviderPlugin[] = [];
        for (const versions of this.plugins.values()) {
            allPlugins.push(...versions.map(vp => vp.plugin));
        }
        return allPlugins;
    }

    getByProviderType(providerType: string, version?: string): IProviderPlugin | null {
        const versions = this.plugins.get(providerType);
        if (!versions || versions.length === 0) {
            return null;
        }

        if (!version) {
            // Return latest version
            const latest = versions.find(vp => vp.isLatest);
            return latest ? latest.plugin : versions[0].plugin;
        }

        // Return specific version
        const match = versions.find(vp => vp.version === version);
        return match ? match.plugin : null;
    }

    async atomicReplace(providerType: string, newPlugin: IProviderPlugin, version?: string): Promise<IProviderPlugin | null> {
        const oldPlugin = this.getByProviderType(providerType, version);
        this.unregisterPlugin(providerType, version);
        this.registerPlugin(newPlugin, version);
        return oldPlugin;
    }

    /**
     * Get all available versions for a provider type
     */
    getVersions(providerType: string): string[] {
        const versions = this.plugins.get(providerType);
        if (!versions) {
            return [];
        }
        return versions.map(vp => vp.version);
    }

    /**
     * Get the latest version string for a provider type
     */
    getLatestVersion(providerType: string): string | null {
        const versions = this.plugins.get(providerType);
        if (!versions) {
            return null;
        }
        const latest = versions.find(vp => vp.isLatest);
        return latest ? latest.version : null;
    }

    /**
     * Check if a specific version exists
     */
    hasVersion(providerType: string, version: string): boolean {
        const versions = this.plugins.get(providerType);
        if (!versions) {
            return false;
        }
        return versions.some(vp => vp.version === version);
    }

    private getProviderType(plugin: IProviderPlugin): string {
        if (plugin.manifest.custom?.providerType) {
            return String(plugin.manifest.custom.providerType);
        }
        const match = plugin.manifest.name.match(/@[\w-]+\/(?:holo-)?provider-(.+)/);
        return match ? match[1] : plugin.manifest.name;
    }
}
