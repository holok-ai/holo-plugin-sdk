// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {EvaluatorService} from "../services";
import {withDB, withQueue} from "./mixins";
import {container, injectable} from "tsyringe";
import {env} from "../env";
import { EvaluatorQCommand } from '../types/evaluator.types';


@injectable()
export class EvaluatorServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private evaluatorService: EvaluatorService) {
        super(env.evaluator.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.queueService.assertQueue(env.queue.evaluatorQueue, {
            durable: true
        });
        await this.queueService.bindQueue(env.queue.evaluatorQueue, env.queue.directExchange, env.queue.evaluatorRoutingKey);
        await this.queueService.consume(env.queue.evaluatorQueue, async (_id, content) => {
             await this.evaluatorService.handleRequest(content as EvaluatorQCommand);
         });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const analysisServer = container.resolve(EvaluatorServer);
analysisServer.start();