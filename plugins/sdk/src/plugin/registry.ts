import {IPlugin} from "./base";

/**
 * Plugin registry interface (read-only access)
 */
export interface PluginRegistry {
    /** Get a plugin by name */
    getPlugin(name: string): IPlugin | undefined;

    /** List all registered plugins */
    listPlugins(): ReadonlyArray<string>;

    /** Check if a plugin is registered */
    hasPlugin(name: string): boolean;
}