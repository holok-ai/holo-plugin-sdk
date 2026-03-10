import {BasePlugin} from '@holokai/sdk/plugin';
import type {IProviderPlugin, PluginContext} from '@holokai/types/plugin';
import {manifest} from "./manifest.js";
import type {IProvider, IWireAdapter, ProviderCapabilities, WireAdapterParams} from "@holokai/types/provider";
import {OpenAIProvider} from "./openai.provider";
import {RouteHandler, RouteTree, RouteTreeNode} from "@holokai/types/routing";
import {OpenAITranslator} from "./openai.translator";
import {OpenAICompletionsWireAdapter, OpenAIResponsesWireAdapter} from "./openai.wire.adapter";
import {ProtocolCapability} from "@holokai/types/entities";
import type {PluginPricingSheet} from "@holokai/types/plugin";

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

    getDefaultPricing(): PluginPricingSheet {
        const M = 1_000_000;
        return {
            name: 'OpenAI Standard 2026-03',
            version: '2026-03',
            effective_from: '2026-03-01',
            models: [
                // ── o-series reasoning models ──────────────────────────────
                ...[
                    'o1', 'o1-2024-12-17',
                ].map(m => ({model_name: m, input_cost: 15 / M, output_cost: 60 / M, cache_read_cost: 7.5 / M, batch_input_cost: 7.5 / M, batch_output_cost: 30 / M})),

                ...[
                    'o1-pro', 'o1-pro-2025-03-19',
                ].map(m => ({model_name: m, input_cost: 150 / M, output_cost: 600 / M})),

                ...[
                    'o3', 'o3-2025-04-16',
                ].map(m => ({model_name: m, input_cost: 2 / M, output_cost: 8 / M, cache_read_cost: 1 / M, batch_input_cost: 1 / M, batch_output_cost: 4 / M})),

                ...[
                    'o3-mini', 'o3-mini-2025-01-31',
                ].map(m => ({model_name: m, input_cost: 1.1 / M, output_cost: 4.4 / M, cache_read_cost: 0.275 / M, batch_input_cost: 0.55 / M, batch_output_cost: 2.2 / M})),

                {model_name: 'o3-pro', input_cost: 20 / M, output_cost: 80 / M, batch_input_cost: 10 / M, batch_output_cost: 40 / M},

                ...[
                    'o4-mini', 'o4-mini-2025-04-16',
                ].map(m => ({model_name: m, input_cost: 1.1 / M, output_cost: 4.4 / M, cache_read_cost: 0.275 / M, batch_input_cost: 0.55 / M, batch_output_cost: 2.2 / M})),

                ...[
                    'o4-mini-deep-research', 'o4-mini-deep-research-2025-06-26',
                ].map(m => ({model_name: m, input_cost: 1.1 / M, output_cost: 4.4 / M, cache_read_cost: 0.275 / M})),

                // ── GPT-5.2 family ─────────────────────────────────────────
                ...[
                    'gpt-5.2', 'gpt-5.2-2025-12-11', 'gpt-5.2-chat-latest', 'gpt-5.2-codex',
                ].map(m => ({model_name: m, input_cost: 1.75 / M, output_cost: 14 / M, cache_read_cost: 0.0875 / M, batch_input_cost: 0.875 / M, batch_output_cost: 7 / M})),

                ...[
                    'gpt-5.2-pro', 'gpt-5.2-pro-2025-12-11',
                ].map(m => ({model_name: m, input_cost: 21 / M, output_cost: 168 / M, batch_input_cost: 10.5 / M, batch_output_cost: 84 / M})),

                // ── GPT-5.1 family ─────────────────────────────────────────
                ...[
                    'gpt-5.1', 'gpt-5.1-2025-11-13', 'gpt-5.1-chat-latest',
                    'gpt-5.1-codex', 'gpt-5.1-codex-max', 'gpt-5.1-codex-mini',
                ].map(m => ({model_name: m, input_cost: 1.25 / M, output_cost: 10 / M, cache_read_cost: 0.0625 / M, batch_input_cost: 0.625 / M, batch_output_cost: 5 / M})),

                // ── GPT-5 family ───────────────────────────────────────────
                ...[
                    'gpt-5', 'gpt-5-2025-08-07', 'gpt-5-chat-latest', 'gpt-5-codex',
                    'gpt-5-search-api', 'gpt-5-search-api-2025-10-14',
                ].map(m => ({model_name: m, input_cost: 1.25 / M, output_cost: 10 / M, cache_read_cost: 0.0625 / M, batch_input_cost: 0.625 / M, batch_output_cost: 5 / M})),

                ...[
                    'gpt-5-mini', 'gpt-5-mini-2025-08-07',
                ].map(m => ({model_name: m, input_cost: 0.25 / M, output_cost: 2 / M, cache_read_cost: 0.0125 / M, batch_input_cost: 0.125 / M, batch_output_cost: 1 / M})),

                ...[
                    'gpt-5-nano', 'gpt-5-nano-2025-08-07',
                ].map(m => ({model_name: m, input_cost: 0.05 / M, output_cost: 0.4 / M, cache_read_cost: 0.0025 / M, batch_input_cost: 0.025 / M, batch_output_cost: 0.2 / M})),

                ...[
                    'gpt-5-pro', 'gpt-5-pro-2025-10-06',
                ].map(m => ({model_name: m, input_cost: 15 / M, output_cost: 120 / M, batch_input_cost: 7.5 / M, batch_output_cost: 60 / M})),

                // ── GPT-4.1 family (1M context, cache = 75% off) ──────────
                ...[
                    'gpt-4.1', 'gpt-4.1-2025-04-14',
                ].map(m => ({model_name: m, input_cost: 2 / M, output_cost: 8 / M, cache_read_cost: 0.5 / M, batch_input_cost: 1 / M, batch_output_cost: 4 / M})),

                ...[
                    'gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14',
                ].map(m => ({model_name: m, input_cost: 0.4 / M, output_cost: 1.6 / M, cache_read_cost: 0.1 / M, batch_input_cost: 0.2 / M, batch_output_cost: 0.8 / M})),

                ...[
                    'gpt-4.1-nano', 'gpt-4.1-nano-2025-04-14',
                ].map(m => ({model_name: m, input_cost: 0.1 / M, output_cost: 0.4 / M, cache_read_cost: 0.025 / M, batch_input_cost: 0.05 / M, batch_output_cost: 0.2 / M})),

                // ── GPT-4o family (cache = 50% off) ───────────────────────
                ...[
                    'gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4o-2024-08-06', 'gpt-4o-2024-11-20',
                    'chatgpt-4o-latest',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M, cache_read_cost: 1.25 / M, batch_input_cost: 1.25 / M, batch_output_cost: 5 / M})),

                ...[
                    'gpt-4o-mini', 'gpt-4o-mini-2024-07-18',
                ].map(m => ({model_name: m, input_cost: 0.15 / M, output_cost: 0.6 / M, cache_read_cost: 0.075 / M, batch_input_cost: 0.075 / M, batch_output_cost: 0.3 / M})),

                // GPT-4o search variants (same text token pricing as gpt-4o)
                ...[
                    'gpt-4o-search-preview', 'gpt-4o-search-preview-2025-03-11',
                    'gpt-4o-mini-search-preview', 'gpt-4o-mini-search-preview-2025-03-11',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M, cache_read_cost: 1.25 / M})),

                // GPT-4o audio models (audio token rates)
                ...[
                    'gpt-4o-audio-preview', 'gpt-4o-audio-preview-2024-12-17', 'gpt-4o-audio-preview-2025-06-03',
                    'gpt-4o-mini-audio-preview', 'gpt-4o-mini-audio-preview-2024-12-17',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M, cache_read_cost: 1.25 / M})),

                // GPT-4o realtime models (text token component)
                ...[
                    'gpt-4o-realtime-preview', 'gpt-4o-realtime-preview-2024-12-17', 'gpt-4o-realtime-preview-2025-06-03',
                    'gpt-4o-mini-realtime-preview', 'gpt-4o-mini-realtime-preview-2024-12-17',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M, cache_read_cost: 1.25 / M})),

                // GPT-4o transcription models (text token pricing)
                ...[
                    'gpt-4o-transcribe', 'gpt-4o-transcribe-diarize',
                    'gpt-4o-mini-transcribe', 'gpt-4o-mini-transcribe-2025-03-20', 'gpt-4o-mini-transcribe-2025-12-15',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M})),

                // GPT-4o TTS models (text token input pricing)
                ...[
                    'gpt-4o-mini-tts', 'gpt-4o-mini-tts-2025-03-20', 'gpt-4o-mini-tts-2025-12-15',
                ].map(m => ({model_name: m, input_cost: 0.15 / M, output_cost: 0.6 / M})),

                // GPT audio/realtime standalone models (text token component)
                ...[
                    'gpt-audio', 'gpt-audio-2025-08-28',
                    'gpt-audio-mini', 'gpt-audio-mini-2025-10-06', 'gpt-audio-mini-2025-12-15',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M})),

                ...[
                    'gpt-realtime', 'gpt-realtime-2025-08-28',
                    'gpt-realtime-mini', 'gpt-realtime-mini-2025-10-06', 'gpt-realtime-mini-2025-12-15',
                ].map(m => ({model_name: m, input_cost: 2.5 / M, output_cost: 10 / M})),

                // ── Legacy GPT-4 ──────────────────────────────────────────
                ...[
                    'gpt-4', 'gpt-4-0613', 'gpt-4-0125-preview', 'gpt-4-1106-preview',
                    'gpt-4-turbo-preview',
                ].map(m => ({model_name: m, input_cost: 30 / M, output_cost: 60 / M})),

                ...[
                    'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
                ].map(m => ({model_name: m, input_cost: 10 / M, output_cost: 30 / M})),

                // ── Legacy GPT-3.5 ────────────────────────────────────────
                ...[
                    'gpt-3.5-turbo', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-16k',
                ].map(m => ({model_name: m, input_cost: 0.5 / M, output_cost: 1.5 / M, batch_input_cost: 0.25 / M, batch_output_cost: 0.75 / M})),

                ...[
                    'gpt-3.5-turbo-instruct', 'gpt-3.5-turbo-instruct-0914',
                ].map(m => ({model_name: m, input_cost: 1.5 / M, output_cost: 2 / M})),

                // ── Legacy completions ────────────────────────────────────
                {model_name: 'babbage-002', input_cost: 0.4 / M, output_cost: 0.4 / M},
                {model_name: 'davinci-002', input_cost: 2 / M, output_cost: 2 / M},

                // ── Codex ─────────────────────────────────────────────────
                {model_name: 'codex-mini-latest', input_cost: 1.25 / M, output_cost: 10 / M, cache_read_cost: 0.0625 / M},

                // ── Embeddings (input only) ───────────────────────────────
                ...[
                    'text-embedding-3-small',
                ].map(m => ({model_name: m, input_cost: 0.02 / M, output_cost: 0, batch_input_cost: 0.01 / M})),

                ...[
                    'text-embedding-3-large',
                ].map(m => ({model_name: m, input_cost: 0.13 / M, output_cost: 0, batch_input_cost: 0.065 / M})),

                {model_name: 'text-embedding-ada-002', input_cost: 0.1 / M, output_cost: 0},

                // ── Image generation (per-image, tracked as $0 tokens) ───
                ...[
                    'dall-e-2', 'dall-e-3', 'gpt-image-1', 'gpt-image-1-mini', 'gpt-image-1.5',
                    'chatgpt-image-latest', 'sora-2', 'sora-2-pro',
                ].map(m => ({model_name: m, input_cost: 0, output_cost: 0})),

                // ── TTS / Whisper / Moderation (non-token pricing) ────────
                ...[
                    'tts-1', 'tts-1-1106', 'tts-1-hd', 'tts-1-hd-1106',
                    'whisper-1',
                    'omni-moderation-latest', 'omni-moderation-2024-09-26',
                ].map(m => ({model_name: m, input_cost: 0, output_cost: 0})),
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
