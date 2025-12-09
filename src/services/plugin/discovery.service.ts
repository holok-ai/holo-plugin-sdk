import {injectable} from 'tsyringe';
import {promises as fs} from 'fs';
import path from 'path';
import type {PluginType} from '@holokai/sdk/plugin';

interface Logger {
    info(message: string, context?: Record<string, unknown>): void;

    warn(message: string, context?: Record<string, unknown>): void;

    error(message: string, context?: Record<string, unknown>): void;
}

class ConsoleLogger implements Logger {
    info(message: string, context?: Record<string, unknown>): void {
        console.log(`[PluginDiscovery] INFO: ${message}`, context || '');
    }

    warn(message: string, context?: Record<string, unknown>): void {
        console.warn(`[PluginDiscovery] WARN: ${message}`, context || '');
    }

    error(message: string, context?: Record<string, unknown>): void {
        console.error(`[PluginDiscovery] ERROR: ${message}`, context || '');
    }
}

export interface DiscoveredPlugin {
    packageName: string;
    version: string;
    entryPoint: string;
    pluginType: PluginType;
    packagePath: string;
}

interface PackageJson {
    name: string;
    version: string;
    main?: string;
}

@injectable()
export class PluginDiscoveryService {
    private readonly pluginScopePath: string;
    private readonly logger: Logger;

    constructor() {
        this.logger = new ConsoleLogger();
        this.pluginScopePath = path.resolve(process.cwd(), 'node_modules', '@holokai');
    }

    async discoverPlugins(): Promise<DiscoveredPlugin[]> {
        try {
            const scopeExists = await this.directoryExists(this.pluginScopePath);
            if (!scopeExists) {
                this.logger.info('No @holokai scope found in node_modules', {path: this.pluginScopePath});
                return [];
            }

            const entries = await fs.readdir(this.pluginScopePath, {withFileTypes: true});
            const packageDirs = entries.filter(d => d.isDirectory() || d.isSymbolicLink()).map(d => d.name);

            if (packageDirs.length === 0) {
                this.logger.info('No plugin packages found in @holokai scope');
                return [];
            }

            const discovered: DiscoveredPlugin[] = [];
            for (const packageDir of packageDirs) {
                const plugin = await this.parsePackage(packageDir);
                if (plugin) {
                    discovered.push(plugin);
                }
            }

            if (discovered.length > 0) {
                const pluginNames = discovered.map(p => p.packageName).join(', ');
                this.logger.info(`Found ${discovered.length} plugins: ${pluginNames}`, {
                    count: discovered.length,
                    plugins: discovered.map(p => ({name: p.packageName, type: p.pluginType, version: p.version}))
                });
            } else {
                this.logger.info('No valid plugin packages found');
            }

            return discovered;
        } catch (error) {
            this.logger.error('Failed to discover plugins', {error});
            return [];
        }
    }

    async discoverPluginsByType(pluginType: PluginType): Promise<DiscoveredPlugin[]> {
        const allPlugins = await this.discoverPlugins();
        return allPlugins.filter(plugin => plugin.pluginType === pluginType);
    }

    private async parsePackage(packageDir: string): Promise<DiscoveredPlugin | null> {
        const packagePath = path.join(this.pluginScopePath, packageDir);

        try {
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson: PackageJson = JSON.parse(packageJsonContent);

            if (!packageJson.name || !packageJson.version) {
                this.logger.warn('Package missing required fields', {
                    packageDir,
                    hasName: !!packageJson.name,
                    hasVersion: !!packageJson.version
                });
                return null;
            }

            const pluginType = this.inferPluginType(packageJson.name);
            if (!pluginType) {
                this.logger.warn('Could not infer plugin type from package name', {packageName: packageJson.name});
                return null;
            }

            return {
                packageName: packageJson.name,
                version: packageJson.version,
                entryPoint: packageJson.main || 'index.js',
                pluginType,
                packagePath
            };
        } catch (error) {
            this.logger.warn('Failed to parse package', {
                packageDir,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    private inferPluginType(packageName: string): PluginType | null {
        const match = packageName.match(/@holokai\/(provider|guard|evaluator|logger|worker)-/);
        return match ? (match[1] as PluginType) : null;
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
