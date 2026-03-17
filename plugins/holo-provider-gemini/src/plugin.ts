import {BasePlugin, normalizePricingDataset} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext, PluginPricingSheet} from '@holokai/types/plugin';
import type {PricingSheetModel} from '@holokai/types/entities';
import {ProtocolCapability} from "@holokai/types/entities";
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {RouteDefinition, RouteHandler} from "@holokai/types/routing";
import {GeminiProvider} from "./gemini.provider.js";
import {GeminiWireAdapter} from "./gemini.wire.adapter.js";
import {GeminiTranslator} from "./gemini.translator.js";
import {GEMINI_PRICING_DATASET} from "./gemini.pricing.js";

export const GeminiProtocols = {
    GENERATE_CONTENT: 'gemini.generateContent',
    STREAM_GENERATE_CONTENT: 'gemini.streamGenerateContent',
    EMBED_CONTENT: 'gemini.embedContent',
    MODELS: 'gemini.models'
} as const;

export type GeminiProtocols = typeof GeminiProtocols[keyof typeof GeminiProtocols];

export class GeminiProviderPlugin extends BasePlugin implements IProviderPlugin {
    manifest = manifest;
    translator = GeminiTranslator.instance();
    defaultRouteHandler = RouteHandler.PASSTHROUGH;
    protocols = GeminiProtocols;
    defaultProtocol = GeminiProtocols.GENERATE_CONTENT;

    async createProvider(id: string, name: string, config: any): Promise<IProvider> {
        return new GeminiProvider(
            id,
            name,
            this,
            config
        );
    }

    async createWireAdapter(params: WireAdapterParams): Promise<IWireAdapter> {
        return new GeminiWireAdapter(params.requestId, params.isStreaming);
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
            maxTokens: 1_000_000
        };
    }

    getRoutes(): RouteDefinition[] {
        return [
            {
                paths: ['/v1beta/models'],
                method: 'GET',
                handler: RouteHandler.MODELS,
                protocol: {
                    name: GeminiProtocols.MODELS,
                    capability: ProtocolCapability.MODELS
                }
            },
            {
                paths: ['/v1beta/models/:model\\:generateContent'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: {
                    name: GeminiProtocols.GENERATE_CONTENT,
                    capability: ProtocolCapability.CHAT
                }
            },
            {
                paths: ['/v1beta/models/:model\\:streamGenerateContent'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: {
                    name: GeminiProtocols.STREAM_GENERATE_CONTENT,
                    capability: ProtocolCapability.CHAT
                }
            },
            {
                paths: ['/v1beta/models/:model\\:embedContent'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: {
                    name: GeminiProtocols.EMBED_CONTENT,
                    capability: ProtocolCapability.EMBED
                }
            }
        ];
    }

    getPricingSheets(): Map<string, PluginPricingSheet> {
        return normalizePricingDataset(GEMINI_PRICING_DATASET);
    }

    getDefaultPricing(): PluginPricingSheet {
        const sheets = this.getPricingSheets();
        const sorted = Array.from(sheets.values()).sort(
            (a, b) => b.effective_from.localeCompare(a.effective_from)
        );
        return sorted[0];
    }

    protected calculateExtraCosts(tokens: Record<string, number>, pricing: PricingSheetModel) {
        const thinkingRate = pricing.token_costs?.thinking ?? 0;
        const thinkingCost = (tokens.thinking ?? 0) * thinkingRate;
        const cacheReadRate = pricing.token_costs?.cache_read ?? Number(pricing.cache_read_cost ?? 0);
        const cacheReadCost = (tokens.cache_read ?? 0) * cacheReadRate;
        return {
            total: thinkingCost + cacheReadCost,
            detail: {
                thinking: {tokens: tokens.thinking ?? 0, cost: thinkingCost},
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
