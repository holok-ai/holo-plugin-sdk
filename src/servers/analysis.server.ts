// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {AnalysisService} from "../services";
import {withDB, withQueue} from "./mixins";
import {container, injectable} from "tsyringe";
import {env} from "../env";


@injectable()
export class AnalysisServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private analysisService: AnalysisService) {
        super(env.analysis.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.queueService.consume(env.queue.analysisQueue, async (_id, content) => {
            await this.analysisService.processAnalysisRequest(content);
        });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const analysisServer = container.resolve(AnalysisServer);
analysisServer.start();
