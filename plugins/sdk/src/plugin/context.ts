import {HoloLogger} from "../core";

/**
 * Runtime context provided to plugins
 */
export interface PluginContext {
    /**
     * Logger instance scoped to this plugin host.
     * The host may already have plugin-specific bindings applied.
     */
    logger: HoloLogger;

    /**
     * Optional factory to create per-plugin loggers.
     * If provided, BasePlugin will prefer this over `logger`.
     */
    loggerFactory?: (pluginName: string) => HoloLogger;

    /** Plugin-specific configuration */
    config?: unknown;

    /** Environment variables */
    env?: Record<string, string | undefined>;

}
