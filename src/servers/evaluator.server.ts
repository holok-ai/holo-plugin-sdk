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
        super(env.analysis.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        // await this.queueService.consume(env.queue.evaluatorQueue, async (_id, content) => {
        //     await this.evaluatorService.handleRequest(content);
        // });
        let mockContent : EvaluatorQCommand= {
            evaluatorId: '93c4c311-d3e1-4a8b-9bf4-c6505a4a97b6',
            applicationId: '',
            responseId: '02527ba8-9bda-4573-bd2c-8721218c8a8a' //,'02527ba8-9bda-4573-bd2c-8721218c8a8a'
        };
        await this.evaluatorService.handleRequest(mockContent);
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