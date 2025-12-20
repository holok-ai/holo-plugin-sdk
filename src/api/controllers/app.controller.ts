import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ApiResponse, HttpApiRequest} from "../types";

@injectable()
export class AppController extends BaseController {

    constructor() {
        super();
    }

    public resolveRequest = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        const logger = this.mlog(this.resolveRequest);
        try {
            const {auth} = req;
            const provider = auth ? auth.providerType : (req.params.provider?.toUpperCase());

            if (!auth && provider) {
                logger.error('No auth provided for custom url request, but providerType in params');
            }
            if (!provider) {
                throw new Error('No providerType provided in params');
            }
            return;
            // const urlPath = req.params[0]; // This captures the rest of the URL after /:provider/:appUrlSlug/
            //
            // Get the appropriate controller based on provider
            // const controller = this.getControllerForProvider(provider);
            //
            // if (!controller) {
            //     logger.error(`no controller resolved for : ${provider}`);
            //     res.status(400).json({error: `Unsupported provider: ${provider}`});
            //     return;
            // }
            //
            // // Route to the appropriate method based on the URL path and provider
            // // const method = this.getMethodForPath(urlPath, provider);
            //
            // if (!method || typeof controller[method] !== 'function') {
            //     res.status(404).json({error: `Method not found for path: ${urlPath}`});
            //     return;
            // }
            //
            // // Call the appropriate method on the controller
            // await controller[method](req, res);

        } catch (error) {
            this.handleError(res, error as Error, 'Failed to resolve request');
        }
    }
    //
    // private getControllerForProvider(provider: ProviderType): any {
    //     logger.debug(`resolving controller for provider: ${provider as ProviderType}`);
    //     switch (provider as ProviderType) {
    //         case ProviderType.OPENAI:
    //             return container.resolve(OpenAIController);
    //         case ProviderType.CLAUDE:
    //             return container.resolve(ClaudeController);
    //         case ProviderType.OLLAMA:
    //             return container.resolve(OllamaController);
    //         case ProviderType.PERPLEXITY:
    //             return container.resolve(PerplexityController);
    //         default:
    //             return null;
    //     }
    // }
    //
    // private getMethodForPath(urlPath: string, provider: ProviderType): string | null {
    //     // Remove leading slash if present
    //     const cleanPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
    //     logger.debug(`resolving method for path: ${cleanPath} and provider: ${provider}`);
    //
    //     // Map URL paths to controller methods based on provider
    //     switch (provider) {
    //         case ProviderType.OPENAI:
    //             switch (cleanPath) {
    //                 case 'chat/completions':
    //                     return 'chatCompletions';
    //                 case 'v1/chat/completions':
    //                     return 'chatCompletions';
    //                 case 'models':
    //                     return 'models';
    //                 default:
    //                     return null;
    //             }
    //         case ProviderType.CLAUDE:
    //             switch (cleanPath) {
    //                 case 'v1/messages':
    //                     return 'messages';
    //                 case 'v1/models':
    //                     return 'models';
    //                 default:
    //                     return null;
    //             }
    //         case ProviderType.OLLAMA:
    //             switch (cleanPath) {
    //                 case 'api/chat':
    //                     return 'chat';
    //                 case 'api/generate':
    //                     return 'generate';
    //                 default:
    //                     return null;
    //             }
    //         case ProviderType.PERPLEXITY:
    //             switch (cleanPath) {
    //                 case 'models':
    //                     return 'models';
    //                 case 'chat/completions':
    //                     return 'chatCompletions'; // If Perplexity uses this pattern
    //                 default:
    //                     return null;
    //             }
    //         default:
    //             return null;
    //     }
    // }

}
