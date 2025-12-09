import {IPlugin} from './index.js';

/**
 * Log entry structure
 */
export interface LogEntry {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    timestamp: number;
    context?: {
        requestId?: string;
        userId?: string;
        sessionId?: string;
        [key: string]: unknown;
    };
    metadata?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}

/**
 * Log filter for querying logs
 */
export interface LogFilter {
    levels?: string[];
    startTime?: number;
    endTime?: number;
    requestId?: string;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

/**
 * Configuration for logger plugins
 */
export interface LoggerConfig {
    level: string;
    format?: 'json' | 'text' | 'structured';
    destination?: string;
    buffer?: {
        size: number;
        flushInterval: number;
    };
    custom?: Record<string, unknown>;
}

/**
 * Logger plugin interface for custom logging backends.
 *
 * @example
 * ```typescript
 * class CloudLoggerPlugin extends BasePlugin implements ILoggerPlugin {
 *   async log(entry: LogEntry): Promise<void> {
 *     await this.sendToCloud(entry);
 *   }
 *
 *   async query(filter: LogFilter): Promise<LogEntry[]> {
 *     return await this.queryCloud(filter);
 *   }
 *
 *   async flush(): Promise<void> {
 *     await this.flushBuffer();
 *   }
 *
 *   async configure(config: Partial<LoggerConfig>): Promise<void> {
 *     Object.assign(this.config, config);
 *   }
 *
 *   async batchLog(entries: LogEntry[]): Promise<void> {
 *     await this.sendBatchToCloud(entries);
 *   }
 * }
 * ```
 */
export interface ILoggerPlugin extends IPlugin {
    /**
     * Log an entry.
     * @param entry The log entry to record.
     */
    log(entry: LogEntry): Promise<void>;

    /**
     * Query logs with filters.
     * @param filter Filter criteria for log retrieval.
     * @returns Array of matching log entries.
     */
    query(filter: LogFilter): Promise<LogEntry[]>;

    /**
     * Flush any buffered logs.
     * Implementations should ensure all pending logs are persisted.
     */
    flush(): Promise<void>;

    /**
     * Configure the logger. Implementations may merge with existing config.
     * @param config Logger configuration (partial updates allowed).
     */
    configure(config: Partial<LoggerConfig>): Promise<void>;

    /**
     * Batch log multiple entries for improved performance.
     * @param entries Array of log entries.
     */
    batchLog?(entries: LogEntry[]): Promise<void>;
}