import 'reflect-metadata';
import {injectable} from "tsyringe";
import logger from "../../utils/logger";
import {IAppServer} from "../base.server";
import {withQueue} from "./withQueue";
import {Constructor} from '../../types';
import {env} from "../../env";

export function adminAware<TBase extends Constructor<IAppServer>>(Base: TBase) {

    @injectable()
    class AdminAwareClass extends withQueue(Base) implements IAppServer {
        id!: string;
        adminHandlers: Map<string, (payload: object) => Promise<void>>;
        adminCommandQueue: string;
        adminExchange: string;

        constructor(...args: any[]) {
            super(...args);
            this.adminCommandQueue = env.queue.adminCommandQueue;
            this.adminExchange = env.queue.adminExchange;
            this.adminHandlers = new Map<string, (payload: object) => Promise<void>>();
        }

        async onInit(): Promise<void> {
            await super.onInit(); // This calls withQueue's onInit, which calls Base's onInit

            logger.debug(`Server ${this.id} is Admin Aware initialized`);


        }

        async onShutdown(): Promise<void> {
            logger.debug('Shutting down audit service...');// Cleanup audit if it has shutdown method
            await super.onShutdown(); // This calls withQueue's onShutdown
        }

        async onError(): Promise<void> {
            logger.debug('Error occurred, handling audit cleanup...');
            await super.onError(); // This calls withQueue's onError
        }

        registerHandler(id: string, handler: (payload: object) => Promise<void>) {
            this.adminHandlers.set(id, handler);
        }
    }

    return AdminAwareClass;
}
