/**
 * @holokai/common/utils - Shared utility types for plugin development
 *
 * This module provides common utility types that are shared across all plugins,
 * ensuring consistent patterns for logging, error handling, and health monitoring.
 */

/**
 * Logger interface aligned with Winston logger pattern
 *
 * Provides standardized logging methods for plugins. The logger instance
 * is injected via PluginContext during plugin initialization, preventing
 * plugins from needing direct Winston dependencies.
 *
 * @example
 * ```typescript
 * // Inside a plugin's initialize method
 * initialize(context: PluginContext): void {
 *   context.logger.info('Plugin initialized', { pluginId: this.id });
 *   context.logger.debug('Debug details', { config: this.config });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Error handling with context
 * try {
 *   // operation
 * } catch (error) {
 *   context.logger.error('Operation failed', {
 *     error: error.message,
 *     stack: error.stack,
 *     operationId: 'op-123'
 *   });
 * }
 * ```
 */
export interface Logger {
    /**
     * Log informational messages
     * @param message - The message to log
     * @param context - Optional structured context data for the log entry
     */
    info(message: string, context?: object): void;

    /**
     * Log warning messages
     * @param message - The warning message to log
     * @param context - Optional structured context data for the log entry
     */
    warn(message: string, context?: object): void;

    /**
     * Log error messages
     * @param message - The error message to log
     * @param context - Optional structured context data for the log entry
     */
    error(message: string, context?: object): void;

    /**
     * Log debug messages (typically filtered in production)
     * @param message - The debug message to log
     * @param context - Optional structured context data for the log entry
     */
    debug(message: string, context?: object): void;
}

/**
 * Standardized error response interface
 *
 * Provides a consistent structure for error responses across all plugins,
 * supporting FR72 requirement for clear error messages with sufficient
 * context for debugging.
 *
 * @example
 * ```typescript
 * // Validation error
 * const error: ErrorResponse = {
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid configuration: missing required field',
 *   details: {
 *     field: 'apiKey',
 *     expected: 'string',
 *     received: 'undefined'
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Plugin load error
 * const error: ErrorResponse = {
 *   code: 'PLUGIN_LOAD_ERROR',
 *   message: 'Failed to load plugin: invalid manifest',
 *   details: {
 *     pluginPath: '/path/to/plugin',
 *     manifestError: 'Missing required field: version'
 *   }
 * };
 * ```
 */
export interface ErrorResponse {
    /**
     * Error code identifier (e.g., 'VALIDATION_ERROR', 'PLUGIN_LOAD_ERROR')
     * Should be CONSTANT_CASE for consistency
     */
    code: string;

    /**
     * Human-readable error message describing what went wrong
     */
    message: string;

    /**
     * Optional additional context about the error
     * Can include field names, values, stack traces, etc.
     */
    details?: object;
}

/**
 * Health status interface for plugin health checks
 *
 * Used by plugins that implement the optional healthCheck() hook
 * to report their current operational status. This enables monitoring
 * and alerting on plugin health in production environments.
 *
 * @example
 * ```typescript
 * // Healthy plugin
 * const status: HealthStatus = {
 *   healthy: true,
 *   timestamp: Date.now(),
 *   details: {
 *     connections: { active: 5, max: 10 },
 *     lastRequest: Date.now() - 1000
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Unhealthy plugin
 * const status: HealthStatus = {
 *   healthy: false,
 *   timestamp: Date.now(),
 *   details: {
 *     error: 'Cannot connect to provider API',
 *     lastAttempt: Date.now(),
 *     retryCount: 3
 *   }
 * };
 * ```
 */
export interface HealthStatus {
    /**
     * Overall health status of the plugin
     * true = operational, false = experiencing issues
     */
    healthy: boolean;

    /**
     * Unix timestamp (milliseconds) when the health check was performed
     */
    timestamp: number;

    /**
     * Optional detailed health check information
     * Can include connection counts, error details, performance metrics, etc.
     */
    details?: object;
}

/**
 * Result type for operations that can fail
 *
 * A discriminated union type that explicitly represents success or failure,
 * forcing error handling at compile time. This is an optional enhancement
 * for plugin developers who prefer functional error handling patterns.
 *
 * @template T - The type of the success data
 * @template E - The type of the error data (defaults to ErrorResponse)
 *
 * @example
 * ```typescript
 * // Success case
 * const result: Result<User, ErrorResponse> = {
 *   success: true,
 *   data: { id: '123', name: 'John' }
 * };
 *
 * // Error case
 * const result: Result<User, ErrorResponse> = {
 *   success: false,
 *   error: {
 *     code: 'NOT_FOUND',
 *     message: 'User not found',
 *     details: { userId: '123' }
 *   }
 * };
 *
 * // Type-safe handling
 * if (result.success) {
 *   console.log(result.data.name); // TypeScript knows data exists
 * } else {
 *   console.log(result.error.message); // TypeScript knows error exists
 * }
 * ```
 */
export type Result<T, E = ErrorResponse> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Async version of Result type
 *
 * Convenience type for async operations that return a Result.
 *
 * @template T - The type of the success data
 * @template E - The type of the error data (defaults to ErrorResponse)
 *
 * @example
 * ```typescript
 * async function fetchUser(id: string): AsyncResult<User> {
 *   try {
 *     const user = await api.getUser(id);
 *     return { success: true, data: user };
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: {
 *         code: 'FETCH_ERROR',
 *         message: error.message,
 *         details: { userId: id }
 *       }
 *     };
 *   }
 * }
 * ```
 */
export type AsyncResult<T, E = ErrorResponse> = Promise<Result<T, E>>;