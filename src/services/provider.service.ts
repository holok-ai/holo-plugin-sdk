import 'reflect-metadata';
import {OpenAIProvider} from "../providers/openai.provider";
import logger from "../utils/logger";
import {Provider} from "../db/types";
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";
import {ClaudeProvider} from "../providers/claude.provider";
import {IProvider} from "../providers/types";
import {OllamaProvider} from "../providers/ollama.provider";
import {ResponseService} from "./response.service";

@injectable()
export class ProviderService {
    private aiProviders: Map<string, IProvider> = new Map();

    constructor(
        private providerDB: ProviderDB,
        private responseService: ResponseService) {

    }

    async init(serverId: string): Promise<void> {
        await this.refreshAvailableProviders(serverId);
    }

    async getProviders(): Promise<Provider[]> {
        return this.providerDB.list();
    }

    async refreshAvailableProviders(serverId: string) {
        const providers = await this.getProviders();
        if (providers.length === 0) return;
        let aiProvider;
        for (const provider of providers) {
            switch (provider.name) {
                case 'openai':
                    aiProvider = new OpenAIProvider(provider.config as any, this.responseService, serverId);
                    break;
                case 'claude':
                    aiProvider = new ClaudeProvider(provider.config as any, this.responseService, serverId);
                    break;
                case 'ollama':
                    aiProvider = new OllamaProvider(provider.config as any, this.responseService, serverId);
                    break;
                default:
                    break;
            }
            if (!aiProvider) {
                logger.warn(`No provider found for ${provider.name}`);
                continue;
            }
            await aiProvider.init();
            this.aiProviders.set(provider.name, aiProvider);
        }
        logger.debug(`Available providers: ${Array.from(this.aiProviders.keys())}`);
    }

    async matchProvider(key: string): Promise<IProvider | undefined> {
        return this.aiProviders.get(key);
    }
}
