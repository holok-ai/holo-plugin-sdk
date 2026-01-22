import {BasePlugin, IProviderPlugin, PluginContext} from '@holokai/sdk/plugin';
import {manifest} from "./manifest.js";
import {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/sdk/provider";
import {OpenAIProvider} from "./openai.provider";
import {RequestType, RouteHandler, RouteTree, RouteTreeNode} from "@holokai/sdk";
import {OpenAIChatWireAdapter, OpenAIResponsesWireAdapter} from "./adapters";
import {OpenAITranslator} from "./openai.translator";

export class OpenAIProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = OpenAITranslator.Instance();

    async createProvider(config: any): Promise<IProvider> {
        return new OpenAIProvider(
            this.name,
            this.family,
            this.version,
            config
        );
    }

    createWireAdapter(params: WireAdapterParams): IWireAdapter {
        const {requestId, isStreaming, requestType} = params;
        return requestType === RequestType.RESPONSES
            ? new OpenAIResponsesWireAdapter(requestId, isStreaming)
            : new OpenAIChatWireAdapter(requestId, isStreaming);
    }

    getCapabilities(): ProviderCapabilities {
        return {
            streaming: true,
            tools: true,
            vision: true,
            functionCalling: true,
            maxTokens: 128000
        };
    }

    getRoutes(): RouteTree {
        const routes: RouteTreeNode = {
            models: {
                method: 'GET',
                handler: RouteHandler.MODELS
            },
            chat: {
                completions: {
                    method: 'POST',
                    requestType: RequestType.CHAT,
                    handler: RouteHandler.REQUEST
                }
            },
            response: {
                method: 'POST',
                requestType: RequestType.RESPONSES,
                handler: RouteHandler.REQUEST
            }
        };
        return {
            ...routes,
            v1: routes
        }
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
