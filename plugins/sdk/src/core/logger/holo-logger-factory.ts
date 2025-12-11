import {HoloLogger, HoloLoggerError} from "./logger";
import {container, InjectionToken} from "tsyringe";

export type HoloLoggerFactory = (cls: Function | string) => HoloLogger;

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

export const LoggerFactoryToken: InjectionToken<(cls: Function | string) => HoloLogger> = 'LoggerFactory';