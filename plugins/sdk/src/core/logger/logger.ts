export type HoloLogLevel =
    'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'verbose'
    | 'debug'
    | 'trace'
    | 'silent';

export interface HoloLoggerMethod {
    (message: string, ...meta: any[]): HoloLogger;

    (message: any): HoloLogger;

    (infoObject: object): HoloLogger;
}

export interface HoloLogger {
    level: HoloLogLevel;

    fatal: HoloLoggerMethod;

    error: HoloLoggerMethod;

    warn: HoloLoggerMethod;

    info: HoloLoggerMethod;

    debug: HoloLoggerMethod;

    trace: HoloLoggerMethod;

    verbose: HoloLoggerMethod;

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
        value === 'verbose' ||
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