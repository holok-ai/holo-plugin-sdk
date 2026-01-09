import {injectable} from 'tsyringe';
import type {IProviderPlugin} from '@holokai/sdk/plugin';
import type {IPluginRegistry} from './registry.service';

@injectable()
export class ProviderPluginRegistry implements IPluginRegistry<IProviderPlugin> {
    private readonly latestPlugins: Map<string, IProviderPlugin>;
    private readonly versionedPlugins: Map<string, Map<string, IProviderPlugin>>;

    constructor() {
        this.latestPlugins = new Map();
        this.versionedPlugins = new Map();
    }

    registerPlugin(plugin: IProviderPlugin, version?: string, isLatest: boolean = true): void {
        if (!plugin.family) {
            throw new Error(`Plugin ${plugin.manifest.name} has no family defined`);
        }
        const family = plugin.family.toUpperCase();
        const pluginVersion = version || plugin.manifest.version;

        if (!this.versionedPlugins.has(family)) {
            this.versionedPlugins.set(family, new Map());
        }
        this.versionedPlugins.get(family)!.set(pluginVersion, plugin);

        if (isLatest) {
            this.latestPlugins.set(family, plugin);
        }
    }

    unregisterPlugin(family: string, version?: string): void {
        const familyKey = family.toUpperCase();

        if (!version) {
            this.latestPlugins.delete(familyKey);
            this.versionedPlugins.delete(familyKey);
        } else {
            const versions = this.versionedPlugins.get(familyKey);
            if (versions) {
                versions.delete(version);

                const latestPlugin = this.latestPlugins.get(familyKey);
                if (latestPlugin?.manifest.version === version) {
                    this.latestPlugins.delete(familyKey);
                }

                if (versions.size === 0) {
                    this.versionedPlugins.delete(familyKey);
                }
            }
        }
    }

    listPlugins(): IProviderPlugin[] {
        const allPlugins: IProviderPlugin[] = [];
        for (const versions of this.versionedPlugins.values()) {
            allPlugins.push(...versions.values());
        }
        return allPlugins;
    }

    getByFamily(family: string, version?: string): IProviderPlugin | null {
        const familyKey = family.toUpperCase();

        if (!version) {
            return this.latestPlugins.get(familyKey) || null;
        }

        const versions = this.versionedPlugins.get(familyKey);
        if (!versions) {
            return null;
        }
        return versions.get(version) || null;
    }

    async atomicReplace(family: string, newPlugin: IProviderPlugin, version?: string): Promise<IProviderPlugin | null> {
        const oldPlugin = this.getByFamily(family, version);
        this.unregisterPlugin(family, version);
        this.registerPlugin(newPlugin, version);
        return oldPlugin;
    }

    getVersions(family: string): string[] {
        const familyKey = family.toUpperCase();
        const versions = this.versionedPlugins.get(familyKey);
        if (!versions) {
            return [];
        }
        return Array.from(versions.keys());
    }

    getLatestVersion(family: string): string | null {
        const familyKey = family.toUpperCase();
        const plugin = this.latestPlugins.get(familyKey);
        return plugin ? plugin.manifest.version : null;
    }

    getLatest(family: string): IProviderPlugin | null {
        const familyKey = family.toUpperCase();
        return this.latestPlugins.get(familyKey) || null;
    }

    hasVersion(family: string, version: string): boolean {
        const familyKey = family.toUpperCase();
        const versions = this.versionedPlugins.get(familyKey);
        if (!versions) {
            return false;
        }
        return versions.has(version);
    }

    getFamilies(): string[] {
        return Array.from(this.latestPlugins.keys());
    }
}
