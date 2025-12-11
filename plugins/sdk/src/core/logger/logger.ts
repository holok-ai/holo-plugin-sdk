export type HoloLogLevel =
    'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace'
    | 'silent';

export interface HoloLogger {
    level: HoloLogLevel;

    error(message: string, meta?: unknown): void;

    warn(message: string, meta?: unknown): void;

    info(message: string, meta?: unknown): void;

    debug(message: string, meta?: unknown): void;

    trace?(message: string, meta?: unknown): void;

    /**
     * Optional child logger for scoping (class, method, plugin, etc.)
     */
    child(meta: Record<string, unknown>): HoloLogger;
}

export function isHoloLogLevel(value: unknown): value is HoloLogLevel {
    return (
        value === 'fatal' ||
        value === 'error' ||
        value === 'warn' ||
        value === 'info' ||
        value === 'debug' ||
        value === 'trace' ||
        value === 'silent'
    );
}

export class HoloLoggerError extends Error {
    constructor(
        message: string
    ) {
        super(message);
        this.name = 'LoggerError';
    }
}