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

    error: HoloLoggerMethod;

    warn: HoloLoggerMethod;

    info: HoloLoggerMethod;

    debug: HoloLoggerMethod;

    verbose: HoloLoggerMethod;

    child(meta: Record<string, unknown>): HoloLogger;
}
