import 'reflect-metadata';
import {ClaudeProvider, OllamaProvider, OpenAIProvider} from "../providers";
import logger from "../utils/logger";
import {Provider} from "../db/types";
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";
import {ProviderType} from "../providers/types";
import {ResponseService} from "./response.service";
import {PerplexityProvider} from "../providers/perplexity/perplexity.provider";
import {IProvider} from "../providers/ai.provider";

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
        const providers: Provider[] = await this.getProviders();
        logger.debug(`Refreshing available providers: ${providers.map(p => p.name)}`);
        if (providers.length === 0) return;
        let aiProvider;
        for (const provider of providers) {
            switch (provider.type) {
                case ProviderType.OPENAI:
                    aiProvider = new OpenAIProvider(provider, this.responseService, serverId);
                    break;
                case ProviderType.CLAUDE:
                    aiProvider = new ClaudeProvider(provider, this.responseService, serverId);
                    break;
                case ProviderType.OLLAMA:
                    aiProvider = new OllamaProvider(provider, this.responseService, serverId);
                    break;
                case ProviderType.PERPLEXITY:
                    aiProvider = new PerplexityProvider(provider, this.responseService, serverId);
                    break;
                default:
                    break;
            }
            if (!aiProvider) {
                logger.warn(`No provider found for ${provider.name} (${provider.id}) with type ${provider.type}. Skipping...`);
                continue;
            }
            await aiProvider.init();
            this.aiProviders.set(provider.type, aiProvider);
        }
        logger.debug(`Available providers: ${Array.from(this.aiProviders.keys())}`);
    }

    async matchProvider(key: string): Promise<IProvider | undefined> {
        return this.aiProviders.get(key);
    }
}
