import winston from "winston";
import {LoggerFactoryToken} from "../utils";
import {container} from "tsyringe";
import logger from "../utils/logger";


export abstract class ClassLogger {
    private _log?: winston.Logger;
    protected __className?: string;

    // Cache the factory once (lazy); fallback to base child logger
    private static _factory?: (cls: Function) => winston.Logger;

    private static get factory(): (cls: Function) => winston.Logger {
        if (!this._factory) {
            if (container.isRegistered(LoggerFactoryToken, true)) {
                this._factory = container.resolve(LoggerFactoryToken);
            } else {
                this._factory = (cls: Function) => logger.child({className: cls.name});
            }
        }
        return this._factory;
    }

    protected get log(): winston.Logger {
        this.__className = this.constructor?.name;
        return (this._log ??= ClassLogger.factory(this.constructor));
    }

    protected mlog(fn: Function): winston.Logger {
        return this.log.child({methodName: fn.name});
    }
}
