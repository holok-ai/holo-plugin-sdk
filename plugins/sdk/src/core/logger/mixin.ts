import {Constructor} from "../mixins";
import {getLoggerFactory} from "./holo-logger-factory";
import {HoloLogger} from "./logger";
import {Transform} from "node:stream";

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