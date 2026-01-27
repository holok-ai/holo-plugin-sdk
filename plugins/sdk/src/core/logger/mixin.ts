import {Constructor, getLoggerFactory, HoloLogger} from "@holokai/sdk";
import {Transform} from "node:stream";

export abstract class ClassLogger {
    private _log?: HoloLogger;
    protected __className?: string;

    protected get log(): HoloLogger {
        this.__className = this.__className ?? this.constructor?.name;
        return (this._log ??= getLoggerFactory()(this.__className));
    }

    protected mlog(methodName: Function | string): HoloLogger {
        return this.log.child({methodName: (methodName as Function).name ?? methodName});
    }
}

export abstract class ObservableClassLogger extends withClassLogger(Transform) {
}

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