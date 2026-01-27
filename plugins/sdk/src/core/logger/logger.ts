import {Logger} from "winston";

export type HoloLogLevel =
    'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace'
    | 'silent';

export interface HoloLoggerMethod {
    (message: string, ...meta: any[]): Logger;

    (message: any): Logger;

    (infoObject: object): Logger;
}

export interface HoloLogger {
    level: HoloLogLevel;

    error: HoloLoggerMethod;

    warn: HoloLoggerMethod;

    info: HoloLoggerMethod;

    debug: HoloLoggerMethod;

    trace?: HoloLoggerMethod;

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