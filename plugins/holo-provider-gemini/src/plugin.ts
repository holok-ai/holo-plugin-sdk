import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext, PluginPricingSheet} from '@holokai/types/plugin';
import type {PricingSheetModel} from '@holokai/types/entities';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {RouteDefinition, RouteHandler} from "@holokai/types/routing";
import {GeminiProvider} from "./gemini.provider.js";
import {GeminiWireAdapter} from "./gemini.wire.adapter.js";
import {GeminiTranslator} from "./gemini.translator.js";
import {ProtocolCapability} from "@holokai/types/entities";

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

    getDefaultPricing(): PluginPricingSheet {
        const M = 1_000_000;
        return {
            name: 'Google Gemini Standard 2026-03',
            version: '2026-03',
            effective_from: '2026-03-01',
            models: [
                // ── Gemini 2.5 Pro ($1.25/$10 per MTok, 200K threshold) ──
                {
                    model_name: 'gemini-2.5-pro',
                    input_cost: 1.25 / M,
                    output_cost: 10 / M,
                    token_costs: {thinking: 10 / M},
                    context_threshold: 200_000,
                    extended_input_cost: 2.50 / M,
                    extended_output_cost: 15 / M
                },

                // ── Gemini 2.5 Flash ($0.15/$0.60 per MTok, 200K threshold) ──
                {
                    model_name: 'gemini-2.5-flash',
                    input_cost: 0.15 / M,
                    output_cost: 0.60 / M,
                    token_costs: {thinking: 0.60 / M},
                    context_threshold: 200_000,
                    extended_input_cost: 0.30 / M,
                    extended_output_cost: 1.20 / M
                },

                // ── Gemini 2.0 Flash ($0.10/$0.40 per MTok) ──
                {
                    model_name: 'gemini-2.0-flash',
                    input_cost: 0.10 / M,
                    output_cost: 0.40 / M
                },

                // ── Gemini 2.0 Flash Lite ($0.025/$0.10 per MTok) ──
                {
                    model_name: 'gemini-2.0-flash-lite',
                    input_cost: 0.025 / M,
                    output_cost: 0.10 / M
                },

                // ── Gemini 1.5 Pro ($1.25/$5.00 per MTok, 128K threshold) ──
                {
                    model_name: 'gemini-1.5-pro',
                    input_cost: 1.25 / M,
                    output_cost: 5.00 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 2.50 / M,
                    extended_output_cost: 10.00 / M
                },

                // ── Gemini 1.5 Flash ($0.075/$0.30 per MTok, 128K threshold) ──
                {
                    model_name: 'gemini-1.5-flash',
                    input_cost: 0.075 / M,
                    output_cost: 0.30 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 0.15 / M,
                    extended_output_cost: 0.60 / M
                }
            ]
        };
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
