import 'reflect-metadata';
import {adminAware, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService} from "../services";
import {container, injectable} from "tsyringe";
import {env} from "../env";

@injectable()
export class WorkerServer extends adminAware((withDB(BaseServer))) {

    constructor(
        private providerService: ProviderService) {
        super(env.worker.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);


        // const ai = await this.providerService.matchProvider('openai');
        // ai?.generate('server-1', '1', 'gpt-4', 'Hello world!', {}, false);

        let requestQueue = env.queue.requestQueue;
        await this.queueService.consume(requestQueue, async (id, content) => {
            const {sourceId, payload, type} = content;
            logger.info(`Worker ${this.id} handling generate request: ${id} from server ${sourceId} and queue ${requestQueue}...`);

            try {
                // Extract parameters
                const {model, prompt, options, stream, provider} = payload;
                const ai = await this.providerService.matchProvider(provider);

                switch (type) {
                    case 'generate':
                        await ai!.generate(sourceId, id, model, prompt, options, stream);
                        break;
                    case 'chat':
                        await ai!.chat(sourceId, id, model, prompt, options, stream);
                        break;
                    default:
                        logger.warn(`No handler registered for message type ${type} - ignoring message...`);
                        break;

                }
            } catch (error) {
                logger.error(`Error handling request (${id}): ${(error as Error).message}`);

            }
        });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(): Promise<void> {
        await super.onError();
    }
}

const worker = container.resolve(WorkerServer);
worker.start();
