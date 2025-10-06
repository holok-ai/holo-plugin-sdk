import winston from "winston";
import {LoggerFactoryToken} from "../utils";
import {container} from "tsyringe";
import logger from "../utils/logger";


export abstract class ClassLogger {
    private _log?: winston.Logger;
    protected __className?: string;

    // Cache the factory once (lazy); fallback to base child logger
    private static _factory?: (cls: Function | string) => winston.Logger;

    private static get factory(): (cls: Function | string) => winston.Logger {
        if (!this._factory) {
            if (container.isRegistered(LoggerFactoryToken, true)) {
                this._factory = container.resolve(LoggerFactoryToken);
            } else {
                this._factory = (cls: Function | string) => logger.child({className: (cls as Function).name ?? cls});
            }
        }
        return this._factory;
    }

    protected get log(): winston.Logger {
        this.__className = this.__className ?? this.constructor?.name;
        return (this._log ??= ClassLogger.factory(this.__className));
    }

    protected mlog(methodName: Function | string): winston.Logger {
        return this.log.child({methodName: (methodName as Function).name ?? methodName});
    }
}
