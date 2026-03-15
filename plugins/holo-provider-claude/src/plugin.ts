import {BasePlugin, normalizePricingDataset} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext, PluginPricingSheet} from '@holokai/types/plugin';
import type {PricingSheetModel} from '@holokai/types/entities';
import {ProtocolCapability} from "@holokai/types/entities";
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {RouteDefinition, RouteHandler} from "@holokai/types/routing";
import {ClaudeProvider} from "./claude.provider";
import {ClaudeWireAdapter} from "./claude.wire.adapter";
import {ClaudeTranslator} from "./claude.translator";
import {CLAUDE_PRICING_DATASET} from "./claude.pricing.js";

export const ClaudeProtocols = {
    MESSAGES: 'claude.messages',
    MODELS: 'claude.models',
    COUNT_TOKENS: 'claude.count_tokens'
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

    getRoutes(): RouteDefinition[] {
        return [
            {
                paths: ['/v1/models'],
                method: 'GET',
                handler: RouteHandler.MODELS,
                protocol: {
                    name: ClaudeProtocols.MODELS,
                    capability: ProtocolCapability.MODELS
                }
            },
            {
                paths: ['/v1/messages'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: {
                    name: ClaudeProtocols.MESSAGES,
                    capability: ProtocolCapability.CHAT
                }
            },
            {
                paths: ['/v1/messages/count_tokens'],
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: {
                    name: ClaudeProtocols.COUNT_TOKENS,
                    capability: ProtocolCapability.METRICS
                }
            }
        ];
    }

    getPricingSheets(): Map<string, PluginPricingSheet> {
        return normalizePricingDataset(CLAUDE_PRICING_DATASET);
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
        const cacheWriteRate = pricing.token_costs?.cache_write ?? Number(pricing.cache_write_cost ?? 0);
        const cacheReadCost = (tokens.cache_read ?? 0) * cacheReadRate;
        const cacheWriteCost = (tokens.cache_write ?? 0) * cacheWriteRate;
        return {
            total: cacheReadCost + cacheWriteCost,
            detail: {
                cache_read: {tokens: tokens.cache_read ?? 0, cost: cacheReadCost},
                cache_write: {tokens: tokens.cache_write ?? 0, cost: cacheWriteCost},
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
