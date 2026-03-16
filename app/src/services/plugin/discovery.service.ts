import {injectable} from 'tsyringe';
import {promises as fs} from 'fs';
import path from 'path';
import {PluginType} from '@holokai/types/plugin';
import {ClassLogger} from "@holokai/sdk";
import {env} from "../../env";

export interface DiscoveredPlugin {
    packageName: string;
    version: string;
    entryPoint: string;
    pluginType: PluginType;
    packagePath: string;
    isLatest: boolean;
}

interface PackageJson {
    name: string;
    version: string;
    main?: string;
}

@injectable()
export class PluginDiscoveryService extends ClassLogger {
    private readonly pluginScopePath: string;

    constructor() {
        super();
        this.pluginScopePath = path.resolve(env.api.builtinPluginsDir, '@holokai');
    }

    async discoverPlugins(): Promise<DiscoveredPlugin[]> {
        const logger = this.mlog(this.discoverPlugins);
        try {
            logger.info(`Discovering plugins in ${this.pluginScopePath}`);
            const scopeExists = await this.directoryExists(this.pluginScopePath);
            if (!scopeExists) {
                logger.info('No @holokai scope found in node_modules', {path: this.pluginScopePath});
                return [];
            }

            const entries = await fs.readdir(this.pluginScopePath, {withFileTypes: true});
            const packageDirs = entries.filter(d => d.isDirectory() || d.isSymbolicLink()).map(d => d.name);

            if (packageDirs.length === 0) {
                logger.info('No plugin packages found in @holokai scope');
                return [];
            }

            const discovered: DiscoveredPlugin[] = [];
            for (const packageDir of packageDirs) {
                const plugin = await this.parsePackage(packageDir);
                if (plugin) {
                    discovered.push(plugin);
                }
            }

            // Mark latest versions for each unique plugin
            this.markLatestVersions(discovered);

            if (discovered.length > 0) {
                const pluginNames = discovered.map(p => p.packageName).join(', ');
                logger.info(`Found ${discovered.length} plugins: ${pluginNames}`, {
                    count: discovered.length,
                    plugins: discovered.map(p => ({
                        name: p.packageName,
                        type: p.pluginType,
                        version: p.version,
                        isLatest: p.isLatest
                    }))
                });
            } else {
                logger.info('No valid plugin packages found');
            }

            return discovered;
        } catch (error) {
            logger.error('Failed to discover plugins', {error});
            return [];
        }
    }

    async discoverSingle(packagePath: string): Promise<DiscoveredPlugin | null> {
        const packageDir = path.basename(packagePath);
        return this.parsePackage(packageDir, packagePath);
    }

    async discoverPluginsByType(pluginType: PluginType): Promise<DiscoveredPlugin[]> {
        const allPlugins = await this.discoverPlugins();
        return allPlugins.filter(plugin => plugin.pluginType === pluginType);
    }

    private async parsePackage(packageDir: string, fullPath?: string): Promise<DiscoveredPlugin | null> {
        const logger = this.mlog(this.parsePackage);
        const packagePath = fullPath ?? path.join(this.pluginScopePath, packageDir);

        try {
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson: PackageJson = JSON.parse(packageJsonContent);

            if (!packageJson.name || !packageJson.version) {
                logger.warn('Package missing required fields', {
                    packageDir,
                    hasName: !!packageJson.name,
                    hasVersion: !!packageJson.version
                });
                return null;
            }

            const pluginType = this.inferPluginType(packageJson.name);
            if (!pluginType) {
                logger.warn('Could not infer plugin type from package name', {packageName: packageJson.name});
                return null;
            }

            return {
                packageName: packageJson.name,
                version: packageJson.version,
                entryPoint: packageJson.main || 'index.js',
                pluginType,
                packagePath,
                isLatest: false // Will be determined after all plugins are discovered
            };
        } catch (error) {
            logger.warn('Failed to parse package', {
                packageDir,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    private inferPluginType(packageName: string): PluginType | null {
        const match = packageName.match(/@holokai\/(?:holo-)?provider-/);
        return match ? PluginType.PROVIDER : null;
    }

    /**
     * Marks the latest version for each unique plugin package
     * Groups plugins by package name and marks the highest version as latest
     */
    private markLatestVersions(plugins: DiscoveredPlugin[]): void {
        const pluginGroups = new Map<string, DiscoveredPlugin[]>();

        // Group plugins by package name
        for (const plugin of plugins) {
            const existing = pluginGroups.get(plugin.packageName) || [];
            existing.push(plugin);
            pluginGroups.set(plugin.packageName, existing);
        }

        // For each group, find and mark the latest version
        for (const [, group] of pluginGroups) {
            if (group.length === 1) {
                group[0].isLatest = true;
            } else {
                // Sort by version (descending) and mark the first one as latest
                group.sort((a, b) => this.compareVersions(b.version, a.version));
                group[0].isLatest = true;
            }
        }
    }

    /**
     * Compare semantic versions
     * Returns positive if v1 > v2, negative if v1 < v2, 0 if equal
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
        const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);

        const maxLength = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < maxLength; i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;

            if (part1 !== part2) {
                return part1 - part2;
            }
        }

        return 0;
    }

    private async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stats = await fs.stat(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}
