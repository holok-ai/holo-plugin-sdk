import 'reflect-metadata';
import '../container/base.registry';
import '../container/evaluator.registry';
import {container, injectable} from "tsyringe";
import {BaseServer} from "./base.server";
import {EvaluatorService} from "../services";
import {withDB, withQueue} from "./mixins";
import {env} from "../env";
import {ServerType} from "@holokai/types/entities";

@injectable()
export class EvaluatorServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private evaluatorService: EvaluatorService
    ) {
        super(env.evaluator.serverId, ServerType.EVALUATOR);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.evaluatorService.init();

        await this.queueService.assertQueue(env.queue.evaluatorQueue, {durable: true});
        await this.queueService.bindQueue(env.queue.evaluatorQueue, env.queue.directExchange, env.queue.evaluatorRoutingKey);
        await this.queueService.consume(env.queue.evaluatorQueue, async (_id, content) => {
            await this.evaluatorService.handleRequest(content);
        });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const server = container.resolve(EvaluatorServer);
await server.start();
