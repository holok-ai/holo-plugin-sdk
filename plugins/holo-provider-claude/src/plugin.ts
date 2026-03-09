import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import type {RouteTree} from "@holokai/types/routing";
import {RouteHandler} from "@holokai/types/routing";
import {ClaudeProvider} from "./claude.provider";
import {ClaudeWireAdapter} from "./claude.wire.adapter";
import {ClaudeTranslator} from "./claude.translator";
import {ProtocolCapability} from "@holokai/types/entities";

export const ClaudeProtocols = {
    MESSAGES: 'claude.messages',
    MODELS: 'claude.models'
} as const;

export type ClaudeProtocols = typeof ClaudeProtocols[keyof typeof ClaudeProtocols];

export class ClaudeProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = ClaudeTranslator.instance();
    defaultRouteHandler = RouteHandler.PASSTHROUGH;
    protocols = ClaudeProtocols;
    defaultProtocol = ClaudeProtocols.MESSAGES;

    async createProvider(id: string, name: string, config: any): Promise<IProvider> {
        return new ClaudeProvider(
            id,
            name,
            this,
            config
        );
    }

    async createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter> {
        return new ClaudeWireAdapter(params.requestId, params.isStreaming);
    }

    getCapabilities(): ProviderCapabilities {
        return {
            streaming: true,
            tools: true,
            vision: true,
            functionCalling: true,
            maxTokens: 200000
        };
    }

    getRoutes(): RouteTree {
        return {
            v1: {
                models: {
                    method: 'GET',
                    handler: RouteHandler.MODELS,
                    protocol: {
                        name: ClaudeProtocols.MODELS,
                        capability: ProtocolCapability.MODELS
                    }
                },
                messages: {
                    method: 'POST',
                    handler: RouteHandler.REQUEST,
                    protocol: {
                        name: ClaudeProtocols.MESSAGES,
                        capability: ProtocolCapability.CHAT
                    }
                }
            }
        }
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
