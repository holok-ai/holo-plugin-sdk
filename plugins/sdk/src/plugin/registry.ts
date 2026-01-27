import {IPlugin} from "./base";

export interface IPluginRegistry<T extends IPlugin> {
    registerPlugin(plugin: T, version?: string, isLatest?: boolean): void;

    unregisterPlugin(id: string, version?: string): void;

    listPlugins(): T[];
}