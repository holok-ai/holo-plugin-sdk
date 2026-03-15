import type {PricingDataset} from '@holokai/types/plugin';

const M = 1_000_000;

export const OPENAI_PRICING_DATASET: PricingDataset = {
    name: 'OpenAI',
    version: '2026-03',
    pricing_snapshots: [
        // ── 2023-06: GPT-4 + GPT-3.5 Turbo baseline ────────────────────
        {
            name: 'openai-2023-06',
            version: '2023-06',
            effective_from: '2023-06-13',
            models: [
                {model_name: 'gpt-4', input_cost: 30 / M, output_cost: 60 / M},
                {
                    model_name: 'gpt-3.5-turbo',
                    input_cost: 0.5 / M,
                    output_cost: 1.5 / M,
                    batch_input_cost: 0.25 / M,
                    batch_output_cost: 0.75 / M,
                },
                {model_name: 'gpt-3.5-turbo-instruct', input_cost: 1.5 / M, output_cost: 2 / M},
                {model_name: 'text-embedding-ada-002', input_cost: 0.1 / M, output_cost: 0},
                {model_name: 'babbage-002', input_cost: 0.4 / M, output_cost: 0.4 / M},
                {model_name: 'davinci-002', input_cost: 2 / M, output_cost: 2 / M},
                {model_name: 'whisper-1', input_cost: 0, output_cost: 0},
                {model_name: 'tts-1', input_cost: 0, output_cost: 0},
                {model_name: 'tts-1-hd', input_cost: 0, output_cost: 0},
                {model_name: 'dall-e-2', input_cost: 0, output_cost: 0},
                {model_name: 'dall-e-3', input_cost: 0, output_cost: 0},
            ],
        },

        // ── 2024-04: GPT-4 Turbo launch ────────────────────────────────
        {
            name: 'openai-2024-04',
            version: '2024-04',
            effective_from: '2024-04-09',
            models: [
                {model_name: 'gpt-4-turbo', input_cost: 10 / M, output_cost: 30 / M},
            ],
        },

        // ── 2024-05: GPT-4o launch ─────────────────────────────────────
        {
            name: 'openai-2024-05',
            version: '2024-05',
            effective_from: '2024-05-13',
            models: [
                {
                    model_name: 'gpt-4o',
                    input_cost: 5 / M,
                    output_cost: 15 / M,
                    cache_read_cost: 2.5 / M,
                    batch_input_cost: 2.5 / M,
                    batch_output_cost: 7.5 / M,
                },
            ],
        },

        // ── 2024-07: GPT-4o mini launch ────────────────────────────────
        {
            name: 'openai-2024-07',
            version: '2024-07',
            effective_from: '2024-07-18',
            models: [
                {
                    model_name: 'gpt-4o-mini',
                    input_cost: 0.15 / M,
                    output_cost: 0.6 / M,
                    cache_read_cost: 0.075 / M,
                    batch_input_cost: 0.075 / M,
                    batch_output_cost: 0.3 / M,
                },
                {
                    model_name: 'text-embedding-3-small',
                    input_cost: 0.02 / M,
                    output_cost: 0,
                    batch_input_cost: 0.01 / M,
                },
                {
                    model_name: 'text-embedding-3-large',
                    input_cost: 0.13 / M,
                    output_cost: 0,
                    batch_input_cost: 0.065 / M,
                },
            ],
        },

        // ── 2024-10: GPT-4o price cut ──────────────────────────────────
        {
            name: 'openai-2024-10',
            version: '2024-10',
            effective_from: '2024-10-02',
            models: [
                {
                    model_name: 'gpt-4o',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M,
                    batch_input_cost: 1.25 / M,
                    batch_output_cost: 5 / M,
                },
            ],
        },

        // ── 2024-12: o1 launch ─────────────────────────────────────────
        {
            name: 'openai-2024-12',
            version: '2024-12',
            effective_from: '2024-12-17',
            models: [
                {
                    model_name: 'o1',
                    input_cost: 15 / M,
                    output_cost: 60 / M,
                    cache_read_cost: 7.5 / M,
                    batch_input_cost: 7.5 / M,
                    batch_output_cost: 30 / M,
                },
            ],
        },

        // ── 2025-01: o3-mini launch ────────────────────────────────────
        {
            name: 'openai-2025-01',
            version: '2025-01',
            effective_from: '2025-01-31',
            models: [
                {
                    model_name: 'o3-mini',
                    input_cost: 1.1 / M,
                    output_cost: 4.4 / M,
                    cache_read_cost: 0.275 / M,
                    batch_input_cost: 0.55 / M,
                    batch_output_cost: 2.2 / M,
                },
            ],
        },

        // ── 2025-03: o1-pro launch ─────────────────────────────────────
        {
            name: 'openai-2025-03',
            version: '2025-03',
            effective_from: '2025-03-19',
            models: [
                {model_name: 'o1-pro', input_cost: 150 / M, output_cost: 600 / M},
                {model_name: 'omni-moderation-latest', input_cost: 0, output_cost: 0},
            ],
        },

        // ── 2025-04: GPT-4.1 + o3 + o4-mini launch ────────────────────
        {
            name: 'openai-2025-04',
            version: '2025-04',
            effective_from: '2025-04-14',
            models: [
                {
                    model_name: 'gpt-4.1',
                    input_cost: 2 / M,
                    output_cost: 8 / M,
                    cache_read_cost: 0.5 / M,
                    batch_input_cost: 1 / M,
                    batch_output_cost: 4 / M,
                },
                {
                    model_name: 'gpt-4.1-mini',
                    input_cost: 0.4 / M,
                    output_cost: 1.6 / M,
                    cache_read_cost: 0.1 / M,
                    batch_input_cost: 0.2 / M,
                    batch_output_cost: 0.8 / M,
                },
                {
                    model_name: 'gpt-4.1-nano',
                    input_cost: 0.1 / M,
                    output_cost: 0.4 / M,
                    cache_read_cost: 0.025 / M,
                    batch_input_cost: 0.05 / M,
                    batch_output_cost: 0.2 / M,
                },
                {
                    model_name: 'o3',
                    input_cost: 2 / M,
                    output_cost: 8 / M,
                    cache_read_cost: 1 / M,
                    batch_input_cost: 1 / M,
                    batch_output_cost: 4 / M,
                },
                {
                    model_name: 'o4-mini',
                    input_cost: 1.1 / M,
                    output_cost: 4.4 / M,
                    cache_read_cost: 0.275 / M,
                    batch_input_cost: 0.55 / M,
                    batch_output_cost: 2.2 / M,
                },
                {
                    model_name: 'o3-pro',
                    input_cost: 20 / M,
                    output_cost: 80 / M,
                    batch_input_cost: 10 / M,
                    batch_output_cost: 40 / M,
                },
            ],
        },

        // ── 2025-06: deep research + audio/realtime/TTS models ─────────
        {
            name: 'openai-2025-06',
            version: '2025-06',
            effective_from: '2025-06-26',
            models: [
                {
                    model_name: 'o4-mini-deep-research',
                    input_cost: 1.1 / M,
                    output_cost: 4.4 / M,
                    cache_read_cost: 0.275 / M
                },
                {
                    model_name: 'gpt-4o-search-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {
                    model_name: 'gpt-4o-mini-search-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {
                    model_name: 'gpt-4o-audio-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {
                    model_name: 'gpt-4o-mini-audio-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {
                    model_name: 'gpt-4o-realtime-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {
                    model_name: 'gpt-4o-mini-realtime-preview',
                    input_cost: 2.5 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 1.25 / M
                },
                {model_name: 'gpt-4o-transcribe', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-4o-transcribe-diarize', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-4o-mini-transcribe', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-4o-mini-tts', input_cost: 0.15 / M, output_cost: 0.6 / M},
                {model_name: 'gpt-audio', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-audio-mini', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-realtime', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-realtime-mini', input_cost: 2.5 / M, output_cost: 10 / M},
                {model_name: 'gpt-image-1', input_cost: 0, output_cost: 0},
                {model_name: 'gpt-image-1-mini', input_cost: 0, output_cost: 0},
                {model_name: 'sora-2', input_cost: 0, output_cost: 0},
                {model_name: 'sora-2-pro', input_cost: 0, output_cost: 0},
                {
                    model_name: 'codex-mini-latest',
                    input_cost: 1.25 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 0.0625 / M,
                },
            ],
        },

        // ── 2025-08: GPT-5 family launch ───────────────────────────────
        {
            name: 'openai-2025-08',
            version: '2025-08',
            effective_from: '2025-08-07',
            models: [
                {
                    model_name: 'gpt-5',
                    input_cost: 1.25 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 0.0625 / M,
                    batch_input_cost: 0.625 / M,
                    batch_output_cost: 5 / M,
                },
                {
                    model_name: 'gpt-5-mini',
                    input_cost: 0.25 / M,
                    output_cost: 2 / M,
                    cache_read_cost: 0.0125 / M,
                    batch_input_cost: 0.125 / M,
                    batch_output_cost: 1 / M,
                },
                {
                    model_name: 'gpt-5-nano',
                    input_cost: 0.05 / M,
                    output_cost: 0.4 / M,
                    cache_read_cost: 0.0025 / M,
                    batch_input_cost: 0.025 / M,
                    batch_output_cost: 0.2 / M,
                },
                {model_name: 'gpt-image-1.5', input_cost: 0, output_cost: 0},
                {model_name: 'chatgpt-image-latest', input_cost: 0, output_cost: 0},
            ],
        },

        // ── 2025-10: GPT-5 Pro + search ────────────────────────────────
        {
            name: 'openai-2025-10',
            version: '2025-10',
            effective_from: '2025-10-06',
            models: [
                {
                    model_name: 'gpt-5-pro',
                    input_cost: 15 / M,
                    output_cost: 120 / M,
                    batch_input_cost: 7.5 / M,
                    batch_output_cost: 60 / M,
                },
                {
                    model_name: 'gpt-5-search-api',
                    input_cost: 1.25 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 0.0625 / M,
                    batch_input_cost: 0.625 / M,
                    batch_output_cost: 5 / M,
                },
            ],
        },

        // ── 2025-11: GPT-5.1 family launch ─────────────────────────────
        {
            name: 'openai-2025-11',
            version: '2025-11',
            effective_from: '2025-11-13',
            models: [
                {
                    model_name: 'gpt-5.1',
                    input_cost: 1.25 / M,
                    output_cost: 10 / M,
                    cache_read_cost: 0.0625 / M,
                    batch_input_cost: 0.625 / M,
                    batch_output_cost: 5 / M,
                },
            ],
        },

        // ── 2025-12: GPT-5.2 family launch ─────────────────────────────
        {
            name: 'openai-2025-12',
            version: '2025-12',
            effective_from: '2025-12-11',
            models: [
                {
                    model_name: 'gpt-5.2',
                    input_cost: 1.75 / M,
                    output_cost: 14 / M,
                    cache_read_cost: 0.0875 / M,
                    batch_input_cost: 0.875 / M,
                    batch_output_cost: 7 / M,
                },
                {
                    model_name: 'gpt-5.2-pro',
                    input_cost: 21 / M,
                    output_cost: 168 / M,
                    batch_input_cost: 10.5 / M,
                    batch_output_cost: 84 / M,
                },
                {model_name: 'tts-1-1106', input_cost: 0, output_cost: 0},
                {model_name: 'tts-1-hd-1106', input_cost: 0, output_cost: 0},
            ],
        },
    ],

    model_ids: [
        // ── GPT-4 dated variants ────────────────────────────────────────
        {
            model_id: 'gpt-4-0613',
            family: 'gpt-4',
            kind: 'chat',
            release_date: '2023-06-13',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-4-0125-preview',
            family: 'gpt-4',
            kind: 'chat',
            release_date: '2024-01-25',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-4-1106-preview',
            family: 'gpt-4',
            kind: 'chat',
            release_date: '2023-11-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-4-turbo-preview',
            family: 'gpt-4',
            kind: 'chat',
            release_date: '2024-01-25',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },

        // ── GPT-4 Turbo dated variants ──────────────────────────────────
        {
            model_id: 'gpt-4-turbo-2024-04-09',
            family: 'gpt-4-turbo',
            kind: 'chat',
            release_date: '2024-04-09',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-04',
        },

        // ── GPT-3.5 Turbo dated variants ────────────────────────────────
        {
            model_id: 'gpt-3.5-turbo-0125',
            family: 'gpt-3.5-turbo',
            kind: 'chat',
            release_date: '2024-01-25',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-3.5-turbo-1106',
            family: 'gpt-3.5-turbo',
            kind: 'chat',
            release_date: '2023-11-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-3.5-turbo-16k',
            family: 'gpt-3.5-turbo',
            kind: 'chat',
            release_date: '2023-06-13',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },
        {
            model_id: 'gpt-3.5-turbo-instruct-0914',
            family: 'gpt-3.5-turbo-instruct',
            kind: 'completion',
            release_date: '2023-09-14',
            shutdown_date: null,
            pricing_snapshot: 'openai-2023-06',
        },

        // ── GPT-4o dated variants ───────────────────────────────────────
        {
            model_id: 'gpt-4o-2024-05-13',
            family: 'gpt-4o',
            kind: 'chat',
            release_date: '2024-05-13',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-05',
        },
        {
            model_id: 'gpt-4o-2024-08-06',
            family: 'gpt-4o',
            kind: 'chat',
            release_date: '2024-08-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-05',
        },
        {
            model_id: 'gpt-4o-2024-11-20',
            family: 'gpt-4o',
            kind: 'chat',
            release_date: '2024-11-20',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-05',
        },
        {
            model_id: 'chatgpt-4o-latest',
            family: 'gpt-4o',
            kind: 'chat',
            release_date: '2024-08-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-05',
        },

        // ── GPT-4o mini dated variants ──────────────────────────────────
        {
            model_id: 'gpt-4o-mini-2024-07-18',
            family: 'gpt-4o-mini',
            kind: 'chat',
            release_date: '2024-07-18',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-07',
        },

        // ── o1 dated variants ───────────────────────────────────────────
        {
            model_id: 'o1-2024-12-17',
            family: 'o1',
            kind: 'reasoning',
            release_date: '2024-12-17',
            shutdown_date: null,
            pricing_snapshot: 'openai-2024-12',
        },

        // ── o1-pro dated variants ───────────────────────────────────────
        {
            model_id: 'o1-pro-2025-03-19',
            family: 'o1-pro',
            kind: 'reasoning',
            release_date: '2025-03-19',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-03',
        },

        // ── o3-mini dated variants ──────────────────────────────────────
        {
            model_id: 'o3-mini-2025-01-31',
            family: 'o3-mini',
            kind: 'reasoning',
            release_date: '2025-01-31',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-01',
        },

        // ── GPT-4.1 dated variants ─────────────────────────────────────
        {
            model_id: 'gpt-4.1-2025-04-14',
            family: 'gpt-4.1',
            kind: 'chat',
            release_date: '2025-04-14',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-04',
        },
        {
            model_id: 'gpt-4.1-mini-2025-04-14',
            family: 'gpt-4.1-mini',
            kind: 'chat',
            release_date: '2025-04-14',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-04',
        },
        {
            model_id: 'gpt-4.1-nano-2025-04-14',
            family: 'gpt-4.1-nano',
            kind: 'chat',
            release_date: '2025-04-14',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-04',
        },

        // ── o3 dated variants ───────────────────────────────────────────
        {
            model_id: 'o3-2025-04-16',
            family: 'o3',
            kind: 'reasoning',
            release_date: '2025-04-16',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-04',
        },

        // ── o4-mini dated variants ──────────────────────────────────────
        {
            model_id: 'o4-mini-2025-04-16',
            family: 'o4-mini',
            kind: 'reasoning',
            release_date: '2025-04-16',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-04',
        },

        // ── o4-mini deep research dated variants ────────────────────────
        {
            model_id: 'o4-mini-deep-research-2025-06-26',
            family: 'o4-mini-deep-research',
            kind: 'reasoning',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },

        // ── GPT-4o search/audio/realtime/transcribe/TTS dated variants ──
        {
            model_id: 'gpt-4o-search-preview-2025-03-11',
            family: 'gpt-4o-search-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-search-preview-2025-03-11',
            family: 'gpt-4o-mini-search-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-audio-preview-2024-12-17',
            family: 'gpt-4o-audio-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-audio-preview-2025-06-03',
            family: 'gpt-4o-audio-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-audio-preview-2024-12-17',
            family: 'gpt-4o-mini-audio-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-realtime-preview-2024-12-17',
            family: 'gpt-4o-realtime-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-realtime-preview-2025-06-03',
            family: 'gpt-4o-realtime-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-realtime-preview-2024-12-17',
            family: 'gpt-4o-mini-realtime-preview',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-transcribe-2025-03-20',
            family: 'gpt-4o-mini-transcribe',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-transcribe-2025-12-15',
            family: 'gpt-4o-mini-transcribe',
            kind: 'chat',
            release_date: '2025-12-15',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-tts-2025-03-20',
            family: 'gpt-4o-mini-tts',
            kind: 'chat',
            release_date: '2025-06-26',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-4o-mini-tts-2025-12-15',
            family: 'gpt-4o-mini-tts',
            kind: 'chat',
            release_date: '2025-12-15',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },

        // ── GPT audio/realtime standalone dated variants ────────────────
        {
            model_id: 'gpt-audio-2025-08-28',
            family: 'gpt-audio',
            kind: 'chat',
            release_date: '2025-08-28',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-audio-mini-2025-10-06',
            family: 'gpt-audio-mini',
            kind: 'chat',
            release_date: '2025-10-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-audio-mini-2025-12-15',
            family: 'gpt-audio-mini',
            kind: 'chat',
            release_date: '2025-12-15',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-realtime-2025-08-28',
            family: 'gpt-realtime',
            kind: 'chat',
            release_date: '2025-08-28',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-realtime-mini-2025-10-06',
            family: 'gpt-realtime-mini',
            kind: 'chat',
            release_date: '2025-10-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },
        {
            model_id: 'gpt-realtime-mini-2025-12-15',
            family: 'gpt-realtime-mini',
            kind: 'chat',
            release_date: '2025-12-15',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-06',
        },

        // ── GPT-5 dated variants ───────────────────────────────────────
        {
            model_id: 'gpt-5-2025-08-07',
            family: 'gpt-5',
            kind: 'chat',
            release_date: '2025-08-07',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-08',
            aliases: ['gpt-5-chat-latest', 'gpt-5-codex'],
        },
        {
            model_id: 'gpt-5-search-api-2025-10-14',
            family: 'gpt-5-search-api',
            kind: 'chat',
            release_date: '2025-10-14',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-10',
        },
        {
            model_id: 'gpt-5-mini-2025-08-07',
            family: 'gpt-5-mini',
            kind: 'chat',
            release_date: '2025-08-07',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-08',
        },
        {
            model_id: 'gpt-5-nano-2025-08-07',
            family: 'gpt-5-nano',
            kind: 'chat',
            release_date: '2025-08-07',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-08',
        },
        {
            model_id: 'gpt-5-pro-2025-10-06',
            family: 'gpt-5-pro',
            kind: 'chat',
            release_date: '2025-10-06',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-10',
        },

        // ── GPT-5.1 dated variants ─────────────────────────────────────
        {
            model_id: 'gpt-5.1-2025-11-13',
            family: 'gpt-5.1',
            kind: 'chat',
            release_date: '2025-11-13',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-11',
            aliases: ['gpt-5.1-chat-latest', 'gpt-5.1-codex', 'gpt-5.1-codex-max', 'gpt-5.1-codex-mini'],
        },

        // ── GPT-5.2 dated variants ─────────────────────────────────────
        {
            model_id: 'gpt-5.2-2025-12-11',
            family: 'gpt-5.2',
            kind: 'chat',
            release_date: '2025-12-11',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-12',
            aliases: ['gpt-5.2-chat-latest', 'gpt-5.2-codex'],
        },
        {
            model_id: 'gpt-5.2-pro-2025-12-11',
            family: 'gpt-5.2-pro',
            kind: 'chat',
            release_date: '2025-12-11',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-12',
        },

        // ── Moderation dated variants ───────────────────────────────────
        {
            model_id: 'omni-moderation-2024-09-26',
            family: 'omni-moderation-latest',
            kind: 'moderation',
            release_date: '2025-03-19',
            shutdown_date: null,
            pricing_snapshot: 'openai-2025-03',
        },
    ],
};
