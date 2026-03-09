import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {OpenAIProvider} from "./openai.provider";
import {RouteHandler, RouteTree, RouteTreeNode} from "@holokai/types/routing";
import {OpenAITranslator} from "./openai.translator";
import {OpenAICompletionsWireAdapter, OpenAIResponsesWireAdapter} from "./openai.wire.adapter";
import {ProtocolCapability} from "@holokai/types/entities";

export const OpenAIProtocols = {
    EMBED: 'openai.embeddings',
    CHAT_COMPLETIONS: 'openai.chatCompletions',
    RESPONSES: 'openai.responses',
    MODELS: 'openai.models'
} as const;

export type OpenAIProtocols = typeof OpenAIProtocols[keyof typeof OpenAIProtocols];

export class OpenAIProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = OpenAITranslator.instance();
    protocols = OpenAIProtocols;
    defaultProtocol = OpenAIProtocols.RESPONSES;

    async createProvider(id: string, name: string, config: any): Promise<IProvider> {
        return new OpenAIProvider(
            id,
            name,
            this,
            config
        );
    }

    async createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter> {
        const {requestId, isStreaming, protocol} = params;
        return protocol === OpenAIProtocols.RESPONSES
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
                protocol: {
                    name: OpenAIProtocols.MODELS,
                    capability: ProtocolCapability.MODELS,
                },
                handler: RouteHandler.MODELS
            },
            chat: {
                completions: {
                    method: 'POST',
                    protocol: {
                        name: OpenAIProtocols.CHAT_COMPLETIONS,
                        capability: ProtocolCapability.CHAT
                    },
                    handler: RouteHandler.REQUEST
                }
            },
            responses: {
                method: 'POST',
                protocol: {
                    name: OpenAIProtocols.RESPONSES,
                    capability: ProtocolCapability.CHAT
                },
                handler: RouteHandler.REQUEST
            },
            embeddings: {
                method: 'POST',
                protocol: {
                    name: OpenAIProtocols.EMBED,
                    capability: ProtocolCapability.EMBED
                },
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
