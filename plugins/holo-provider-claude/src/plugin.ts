/**
 * Claude Provider Plugin Implementation
 *
 * Implements IProviderPlugin contract for Claude/Anthropic API
 */

import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import type {RouteTree} from "@holokai/types/routing";
import {RouteHandler} from "@holokai/types/routing";
import {Capability} from "@holokai/types/holo";
import {ClaudeProvider} from "./claude.provider";
import {ClaudeWireAdapter} from "./claude.wire.adapter";
import {ClaudeTranslator} from "./claude.translator";

export class ClaudeProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = ClaudeTranslator.instance();
    defaultRouteHandler = RouteHandler.PASSTHROUGH;

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
                    handler: RouteHandler.MODELS,
                    protocol: 'models',
                    capability: Capability.MODELS
                },
                messages: {
                    method: 'POST',
                    handler: RouteHandler.REQUEST,
                    protocol: 'messages',
                    capability: Capability.CHAT
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
