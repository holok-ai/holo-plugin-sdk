import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IAppServer} from "../base.server";
import {Constructor} from "@holokai/sdk";


export interface ServerStats {
    chatErrors: number;
    chatRequests: number;
    chatSuccesses: number;
    chatTime: number;
    generateErrors: number;
    generateRequests: number;
    generateSuccesses: number;
    generateTime: number;
    startTime: Date;
    totalErrors: number;
    totalProcessingTime: number;
    totalRequests: number;
    totalSuccesses: number;
}

/**
 * Mixin to add stats functionality to a class
 */
export function withStats<TBase extends Constructor<IAppServer>>(Base: TBase) {
    @injectable()
    class WithStatsServer extends Base implements IAppServer {
        stats: ServerStats;

        constructor(...args: any[]) {
            super(...args);

            this.stats = {
                chatErrors: 0,
                chatRequests: 0,
                chatSuccesses: 0,
                chatTime: 0,
                generateErrors: 0,
                generateRequests: 0,
                generateSuccesses: 0,
                generateTime: 0,
                startTime: new Date(),
                totalErrors: 0,
                totalProcessingTime: 0,
                totalRequests: 0,
                totalSuccesses: 0
            }
        }

        async onError(error: Error): Promise<void> {
            await super.onError(error);
        }

        async onInit(): Promise<void> {
            await super.onInit();
        }

        async onShutdown(): Promise<void> {
            await super.onShutdown();
        }
    }

    return WithStatsServer;
}
