import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {OpenAIProvider} from "./openai.provider";
import {Capability} from "@holokai/types/holo";
import {RouteHandler, RouteTree, RouteTreeNode} from "@holokai/types/routing";
import {OpenAITranslator} from "./openai.translator";
import {OpenAICompletionsWireAdapter, OpenAIResponsesWireAdapter} from "./openai.wire.adapter";

export class OpenAIProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = OpenAITranslator.instance();

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
            : new OpenAICompletionsWireAdapter(requestId, isStreaming);
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
                handler: RouteHandler.MODELS,
                protocol: 'models',
                capability: Capability.MODELS
            },
            chat: {
                completions: {
                    method: 'POST',
                    handler: RouteHandler.REQUEST,
                    protocol: 'completions',
                    capability: Capability.CHAT
                }
            },
            responses: {
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: 'responses',
                capability: Capability.CHAT
            },
            embeddings: {
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: 'embeddings',
                capability: Capability.EMBED
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
