/**
 * Claude Provider Plugin Implementation
 *
 * Implements IProviderPlugin contract for Claude/Anthropic API
 */

import {BasePlugin, IProviderPlugin, PluginContext} from '@holokai/sdk/plugin';
import {manifest} from "./manifest.js";
import {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/sdk/provider";
import {ClaudeProvider} from "./claude.provider";
import {ClaudeWireAdapter} from "./claude.wire.adapter";
import {RequestType, RouteHandler, RouteTree} from "@holokai/sdk";
import {ClaudeTranslator} from "./claude.translator";

export class ClaudeProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = ClaudeTranslator.instance();

    async createProvider(config: any): Promise<IProvider> {
        return new ClaudeProvider(
            this.name,
            this.family,
            this.version,
            config
        );
    }

    createWireAdapter(params: WireAdapterParams): IWireAdapter {
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
                    handler: RouteHandler.MODELS
                },
                messages: {
                    method: 'POST',
                    requestType: RequestType.CHAT,
                    handler: RouteHandler.REQUEST
                }
            },
            // api: {
            //     event_logging: {
            //         batch: {
            //             method: 'POST',
            //             handler: RouteHandler.NOOP
            //         }
            //     }
            // }
        }
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
