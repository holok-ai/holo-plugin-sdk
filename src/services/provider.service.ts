import 'reflect-metadata';
import AIProvider from "../providers/ai.provider";
import {OpenAIProvider} from "../providers/openai.provider";
import logger from "../utils/logger";
import {QueueService} from "./queue.service";
import {Provider} from "../db/types";
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";

@injectable()
export class ProviderService {
    private aiProviders: Map<string, AIProvider> = new Map();

    constructor(
        private providerDB: ProviderDB,
        private queueService: QueueService) {

    }

    async init(): Promise<void> {
        if (!this.queueService.isConnected) {
            await this.queueService.connect();
        }

        await this.refreshAvailableProviders();
    }

    async getProviders(): Promise<Provider[]> {
        return this.providerDB.list();
    }

    async refreshAvailableProviders(serverId?: string) {
        const providers = await this.getProviders();
        if (providers.length === 0) return;
        for (const provider of providers) {
            if (provider.name === 'openai') {
                const aiProvider = new OpenAIProvider(provider.config as any, this.queueService, serverId);
                await aiProvider.init();
                this.aiProviders.set('openai', aiProvider);
            }
        }
        logger.debug(`Available providers: ${Array.from(this.aiProviders.keys())}`);
    }

    async matchProvider(key: string): Promise<AIProvider | undefined> {
        return this.aiProviders.get(key);
    }
}
