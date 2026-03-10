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
import type {PluginPricingSheet} from "@holokai/types/plugin";

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

    getDefaultPricing(): PluginPricingSheet {
        const M = 1_000_000;
        return {
            name: 'Anthropic Standard 2026-03',
            version: '2026-03',
            effective_from: '2026-03-01',
            models: [
                // ── Opus 4.5+ tier ($5/$25 per MTok) ──────────────────────
                // Long context (>200K input): $10/$37.50
                // cache_read = 0.1x, cache_write = 1.25x (5-min tier), batch = 50% off
                ...[
                    'claude-opus-4-6',
                    'claude-opus-4-5-20251101',
                ].map(m => ({model_name: m, input_cost: 5 / M, output_cost: 25 / M, cache_read_cost: 0.5 / M, cache_write_cost: 6.25 / M, batch_input_cost: 2.5 / M, batch_output_cost: 12.5 / M, context_threshold: 200_000, extended_input_cost: 10 / M, extended_output_cost: 37.5 / M})),

                // ── Opus 4.0/4.1 tier ($15/$75 per MTok) ──────────────────
                ...[
                    'claude-opus-4-1-20250805',
                    'claude-opus-4-20250514',
                    'claude-3-opus-20240229',
                ].map(m => ({model_name: m, input_cost: 15 / M, output_cost: 75 / M, cache_read_cost: 1.5 / M, cache_write_cost: 18.75 / M, batch_input_cost: 7.5 / M, batch_output_cost: 37.5 / M})),

                // ── Sonnet tier ($3/$15 per MTok) ─────────────────────────
                // Long context (>200K input) for 4.0+: $6/$22.50
                ...[
                    'claude-sonnet-4-6',
                    'claude-sonnet-4-5-20250929',
                    'claude-sonnet-4-20250514',
                ].map(m => ({model_name: m, input_cost: 3 / M, output_cost: 15 / M, cache_read_cost: 0.3 / M, cache_write_cost: 3.75 / M, batch_input_cost: 1.5 / M, batch_output_cost: 7.5 / M, context_threshold: 200_000, extended_input_cost: 6 / M, extended_output_cost: 22.5 / M})),

                // Sonnet 3.x (no long context pricing)
                ...[
                    'claude-3-7-sonnet-20250219',
                    'claude-3-5-sonnet-20241022',
                ].map(m => ({model_name: m, input_cost: 3 / M, output_cost: 15 / M, cache_read_cost: 0.3 / M, cache_write_cost: 3.75 / M, batch_input_cost: 1.5 / M, batch_output_cost: 7.5 / M})),

                // ── Haiku 4.5 tier ($1/$5 per MTok) ───────────────────────
                {model_name: 'claude-haiku-4-5-20251001', input_cost: 1 / M, output_cost: 5 / M, cache_read_cost: 0.1 / M, cache_write_cost: 1.25 / M, batch_input_cost: 0.5 / M, batch_output_cost: 2.5 / M},

                // ── Haiku 3.5 tier ($0.80/$4 per MTok) ────────────────────
                {model_name: 'claude-3-5-haiku-20241022', input_cost: 0.8 / M, output_cost: 4 / M, cache_read_cost: 0.08 / M, cache_write_cost: 1 / M, batch_input_cost: 0.4 / M, batch_output_cost: 2 / M},

                // ── Haiku 3 tier ($0.25/$1.25 per MTok, retiring 2026-04) ─
                {model_name: 'claude-3-haiku-20240307', input_cost: 0.25 / M, output_cost: 1.25 / M, cache_read_cost: 0.03 / M, cache_write_cost: 0.3 / M, batch_input_cost: 0.125 / M, batch_output_cost: 0.625 / M},
            ]
        };
    }

    protected onInitialize(_context: PluginContext): Promise<void> {
        return Promise.resolve();
    }

    protected onDestroy(): Promise<void> {
        return Promise.resolve();
    }

}
