/**
 * Plugin error class for consistent error handling
 */
export class PluginError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly plugin?: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'PluginError';
    }
}

/**
 * Common plugin error codes
 */
export enum PluginErrorCode {
    INITIALIZATION_FAILED = 'PLUGIN_INIT_FAILED',
    DESTRUCTION_FAILED = 'PLUGIN_DESTROY_FAILED',
    INVALID_CONFIG = 'PLUGIN_INVALID_CONFIG',
    DEPENDENCY_MISSING = 'PLUGIN_DEPENDENCY_MISSING',
    INCOMPATIBLE_VERSION = 'PLUGIN_INCOMPATIBLE_VERSION',
    PERMISSION_DENIED = 'PLUGIN_PERMISSION_DENIED',
    HEALTH_CHECK_FAILED = 'PLUGIN_HEALTH_CHECK_FAILED',
    INVALID_STATE = 'PLUGIN_INVALID_STATE',
    UNKNOWN_ERROR = 'PLUGIN_UNKNOWN_ERROR'
}