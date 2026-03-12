import 'reflect-metadata';
import {container, injectable} from "tsyringe";
import logger from "../../utils/logger";
import {IAppServer} from "../base.server";
import {withQueue} from "./with.queue";
import {env} from "../../env";
import {Constructor} from "../../utils";
import {AdminService} from "../../services";
import {ServerType} from "@holokai/types/entities";

export function withAdmin<TBase extends Constructor<IAppServer>>(Base: TBase) {

    @injectable()
    class WithAdminServer extends withQueue(Base) implements IAppServer {
        id!: string;
        type!: ServerType;
        adminHandlers = new Map<string, (workerId: string, payload: object) => Promise<object>>();
        adminCommandQueue: string;
        adminExchange: string;
        readonly adminService: AdminService;

        constructor(...args: any[]) {
            super(...args);
            this.id = args[0];
            this.type = args[1];
            this.adminCommandQueue = env.queue.adminCommandQueue;
            this.adminExchange = env.queue.adminExchange;
            this.adminService = container.resolve(AdminService);
        }

        async onInit(): Promise<void> {
            await super.onInit(); // This calls withQueue's onInit, which calls Base's onInit

            logger.debug(`${this.id} is Admin Aware`);
            let commandQueue = env.worker.adminCommandQueue;
            let exchange = env.queue.adminExchange;
            await this.queueService.assertQueue(commandQueue, {
                exclusive: false,
                durable: true,
                autoDelete: true
            }, exchange, 'model.#');

            await this.queueService.bindQueue(commandQueue, exchange, 'worker.#');

            await this.queueService.consume(commandQueue, async (messageId, content, _message) => {
                const {action, serverId, timestamp, ...payload} = content;
                logger.info(`Worker (${this.id}) received admin command: ${action}, messageId: ${messageId}`);


                let handler = this.adminHandlers.get(action);
                let response = {};
                if (!handler) {
                    logger.warn(`No handler registered for admin command: ${action}`);
                    response = {success: false, message: `No handler registered for admin command: ${action}`};
                } else {
                    try {
                        response = await handler(this.id, payload);
                    } catch (error) {
                        logger.error(`Error handling admin command: ${action} - ${(error as Error).message}`);
                        response = {success: false, message: (error as Error).message};
                    }
                }
                await this.adminService.sendAdminResponse(this.id, serverId, messageId, response);
            });

        }

        async onShutdown(): Promise<void> {
            logger.debug('Cleaning up anything Admin related...');// Cleanup audit if it has shutdown method
            await super.onShutdown(); // This calls withQueue's onShutdown
        }

        async onError(error: Error): Promise<void> {
            await super.onError(error); // This calls withQueue's onError
        }
    }

    return WithAdminServer;
}
