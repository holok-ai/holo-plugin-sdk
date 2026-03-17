import {BasePlugin, normalizePricingDataset} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext, PluginPricingSheet} from '@holokai/types/plugin';
import type {PricingSheetModel} from '@holokai/types/entities';
import {ProtocolCapability} from "@holokai/types/entities";
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {OpenAIProvider} from "./openai.provider";
import {RouteDefinition, RouteHandler} from "@holokai/types/routing";
import {OpenAITranslator} from "./openai.translator";
import {OpenAICompletionsWireAdapter, OpenAIResponsesWireAdapter} from "./openai.wire.adapter";
import {OPENAI_PRICING_DATASET} from "./openai.pricing.js";

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

    getProtocolByCapability(capability: ProtocolCapability): string | undefined {
        const route = this.getRoutes().find(r => r.protocol.capability === capability);
        return route?.protocol.name;
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

    getRoutes(): RouteDefinition[] {
        return [
            {
                paths: ['/models', '/v1/models'],
                method: 'GET',
                protocol: {
                    name: OpenAIProtocols.MODELS,
                    capability: ProtocolCapability.MODELS,
                },
                handler: RouteHandler.MODELS
            },
            {
                paths: ['/chat/completions', '/v1/chat/completions'],
                method: 'POST',
                protocol: {
                    name: OpenAIProtocols.CHAT_COMPLETIONS,
                    capability: ProtocolCapability.CHAT
                },
                handler: RouteHandler.REQUEST
            },
            {
                paths: ['/responses', '/v1/responses'],
                method: 'POST',
                protocol: {
                    name: OpenAIProtocols.RESPONSES,
                    capability: ProtocolCapability.CHAT
                },
                handler: RouteHandler.REQUEST
            },
            {
                paths: ['/embeddings', '/v1/embeddings'],
                method: 'POST',
                protocol: {
                    name: OpenAIProtocols.EMBED,
                    capability: ProtocolCapability.EMBED
                },
                handler: RouteHandler.REQUEST
            }

        ]
    }

    getPricingSheets(): Map<string, PluginPricingSheet> {
        return normalizePricingDataset(OPENAI_PRICING_DATASET);
    }

    getDefaultPricing(): PluginPricingSheet {
        const sheets = this.getPricingSheets();
        const sorted = Array.from(sheets.values()).sort(
            (a, b) => b.effective_from.localeCompare(a.effective_from)
        );
        return sorted[0];
    }

    protected calculateExtraCosts(tokens: Record<string, number>, pricing: PricingSheetModel) {
        const cacheReadRate = pricing.token_costs?.cache_read ?? Number(pricing.cache_read_cost ?? 0);
        const cacheReadCost = (tokens.cache_read ?? 0) * cacheReadRate;
        return {
            total: cacheReadCost,
            detail: {
                cache_read: {tokens: tokens.cache_read ?? 0, cost: cacheReadCost},
            }
        };
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
