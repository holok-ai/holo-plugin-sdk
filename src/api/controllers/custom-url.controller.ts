import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {container, injectable} from "tsyringe";
import {ApiResponse, HttpApiRequest} from "../types";
import {OpenAIController} from './openai.controller';
import {ClaudeController} from './claude.controller';
import OllamaController from './ollama.controller';
import {PerplexityController} from './perplexity.controller';
import logger from '../../utils/logger';
import {ProviderType} from "../../providers/types";

@injectable()
export class CustomUrlController extends BaseController {

    constructor() {
        super();
    }

    public resolveRequest = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const {provider, appId} = req.params;
            const urlPath = req.params[0]; // This captures the rest of the URL after /:provider/:appId/
            req.applicationId = appId;

            // Get the appropriate controller based on provider
            const controller = this.getControllerForProvider(provider.toUpperCase() as ProviderType);

            if (!controller) {
                logger.error(`no controller resolved for : ${provider}`);
                res.status(400).json({error: `Unsupported provider: ${provider}`});
                return;
            }

            // Route to the appropriate method based on the URL path and provider
            const method = this.getMethodForPath(urlPath, provider.toUpperCase() as ProviderType);

            if (!method || typeof controller[method] !== 'function') {
                res.status(404).json({error: `Method not found for path: ${urlPath}`});
                return;
            }

            // Call the appropriate method on the controller
            await controller[method](req, res);

        } catch (error) {
            this.handleError(res, error as Error, 'Failed to resolve request');
        }
    }

    private getControllerForProvider(provider: ProviderType): any {
        logger.debug(`resolving controller for provider: ${provider as ProviderType}`);
        switch (provider as ProviderType) {
            case ProviderType.OPENAI:
                return container.resolve(OpenAIController);
            case ProviderType.ANTHROPIC:
                logger.debug(`Anthropic is deprecated. Using Claude instead.`);
                return container.resolve(ClaudeController);
            case ProviderType.CLAUDE:
                return container.resolve(ClaudeController);
            case ProviderType.OLLAMA:
                return container.resolve(OllamaController);
            case ProviderType.PERPLEXITY:
                return container.resolve(PerplexityController);
            default:
                return null;
        }
    }

    private getMethodForPath(urlPath: string, provider: ProviderType): string | null {
        // Remove leading slash if present
        const cleanPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        logger.debug(`resolving method for path: ${cleanPath} and provider: ${provider}`);

        // Map URL paths to controller methods based on provider
        switch (provider) {
            case ProviderType.OPENAI:
                switch (cleanPath) {
                    case 'chat/completions':
                        return 'chatCompletions';
                    case 'v1/chat/completions':
                        return 'chatCompletions';
                    case 'models':
                        return 'models';
                    default:
                        return null;
                }
            case ProviderType.CLAUDE:
                switch (cleanPath) {
                    case 'v1/messages':
                        return 'messages';
                    case 'v1/models':
                        return 'models';
                    default:
                        return null;
                }
            case ProviderType.OLLAMA:
                switch (cleanPath) {
                    case 'api/chat':
                        return 'chat';
                    case 'api/generate':
                        return 'generate';
                    default:
                        return null;
                }
            case ProviderType.PERPLEXITY:
                switch (cleanPath) {
                    case 'models':
                        return 'models';
                    case 'chat/completions':
                        return 'chatCompletions'; // If Perplexity uses this pattern
                    default:
                        return null;
                }
            default:
                return null;
        }
    }

}
