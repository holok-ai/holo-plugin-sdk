import type {HoloLogger, HoloLogLevel} from '@holokai/types/logger';
import {container, InjectionToken} from "tsyringe";
import {Transform} from "node:stream";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Constructor<T = {}> = new (...args: any[]) => T;

export type HoloLoggerFactory = (cls: Function | string) => HoloLogger;

// ---------------------------------------------------------------------------
// Log-level guard
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Logger error
// ---------------------------------------------------------------------------

export class HoloLoggerError extends Error {
    constructor(
        message: string
    ) {
        super(message);
        this.name = 'LoggerError';
    }
}

// ---------------------------------------------------------------------------
// Factory token + accessor
// ---------------------------------------------------------------------------

export const LoggerFactoryToken: InjectionToken<(cls: Function | string) => HoloLogger> = 'LoggerFactory';

let cachedFactory: HoloLoggerFactory | undefined;

export function getLoggerFactory(): HoloLoggerFactory {
    if (!cachedFactory) {
        if (container.isRegistered(LoggerFactoryToken, true)) {
            cachedFactory = container.resolve<HoloLoggerFactory>(LoggerFactoryToken);
        } else {
            throw new HoloLoggerError("No HoloLogger Factory Defined");
        }
    }
    return cachedFactory;
}

// ---------------------------------------------------------------------------
// ClassLogger base class
// ---------------------------------------------------------------------------

export abstract class ClassLogger {
    protected __className?: string;

    private _log?: HoloLogger;

    protected get log(): HoloLogger {
        this.__className = this.__className ?? this.constructor?.name;
        return (this._log ??= getLoggerFactory()(this.__className));
    }

    protected mlog(methodName: Function | string): HoloLogger {
        return this.log.child({methodName: (methodName as Function).name ?? methodName});
    }
}

// ---------------------------------------------------------------------------
// withClassLogger mixin
// ---------------------------------------------------------------------------

export function withClassLogger<TBase extends Constructor>(Base: TBase) {
    return class WithClassLogger extends Base {
        #log?: HoloLogger;
        #className?: string;

        get log(): HoloLogger {
            this.#className = this.#className ?? this.constructor?.name;
            return (this.#log ??= getLoggerFactory()(this.#className));
        }

        mlog(methodName: Function | string): HoloLogger {
            return this.log.child({methodName: (methodName as Function).name ?? methodName});
        }
    }
}

export abstract class ObservableClassLogger extends withClassLogger(Transform) {
}
