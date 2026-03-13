import type {PricingDataset} from '@holokai/types/plugin';

const M = 1_000_000;

// Standard Anthropic pricing modifiers (Claude 3+):
//   cache_read  = 0.1x input
//   cache_write = 1.25x input (5-min TTL tier)
//   batch       = 0.5x
function withCache(input: number, output: number) {
    return {
        cache_read_cost: input * 0.1,
        cache_write_cost: input * 1.25,
        batch_input_cost: input * 0.5,
        batch_output_cost: output * 0.5,
    };
}

export const CLAUDE_PRICING_DATASET: PricingDataset = {
    name: 'Anthropic Claude',
    version: '2026-03',
    pricing_snapshots: [
        // ── 2023-03: Claude 1 / Instant family ─────────────────────────
        {
            name: 'claude-2023-03',
            version: '2023-03',
            effective_from: '2023-03-14',
            models: [
                {
                    model_name: 'claude-1.x-family',
                    input_cost: 11.02 / M,
                    output_cost: 32.68 / M,
                },
                {
                    model_name: 'claude-instant-1.x-family',
                    input_cost: 1.63 / M,
                    output_cost: 5.51 / M,
                },
            ],
        },

        // ── 2023-07: Claude 2 launch ────────────────────────────────────
        {
            name: 'claude-2023-07',
            version: '2023-07',
            effective_from: '2023-07-11',
            models: [
                {
                    model_name: 'claude-2.0',
                    input_cost: 11.02 / M,
                    output_cost: 32.68 / M,
                },
            ],
        },

        // ── 2023-11: Claude 2.1 ────────────────────────────────────────
        {
            name: 'claude-2023-11',
            version: '2023-11',
            effective_from: '2023-11-21',
            models: [
                {
                    model_name: 'claude-2.1',
                    input_cost: 8.00 / M,
                    output_cost: 24.00 / M,
                },
            ],
        },

        // ── 2024-03: Claude 3 family ────────────────────────────────────
        {
            name: 'claude-2024-03',
            version: '2024-03',
            effective_from: '2024-03-04',
            models: [
                {
                    model_name: 'claude-3-opus',
                    input_cost: 15.00 / M,
                    output_cost: 75.00 / M,
                    ...withCache(15.00 / M, 75.00 / M),
                },
                {
                    model_name: 'claude-3-sonnet',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
                {
                    model_name: 'claude-3-haiku',
                    input_cost: 0.25 / M,
                    output_cost: 1.25 / M,
                    ...withCache(0.25 / M, 1.25 / M),
                },
            ],
        },

        // ── 2024-06: Claude 3.5 Sonnet ──────────────────────────────────
        {
            name: 'claude-2024-06',
            version: '2024-06',
            effective_from: '2024-06-21',
            models: [
                {
                    model_name: 'claude-3.5-sonnet',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },

        // ── 2024-10: Claude 3.5 Sonnet v2 ──────────────────────────────
        {
            name: 'claude-2024-10',
            version: '2024-10',
            effective_from: '2024-10-22',
            models: [
                {
                    model_name: 'claude-3.5-sonnet-v2',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },

        // ── 2024-12: Claude 3.5 Haiku ───────────────────────────────────
        {
            name: 'claude-2024-12',
            version: '2024-12',
            effective_from: '2024-12-03',
            models: [
                {
                    model_name: 'claude-3.5-haiku',
                    input_cost: 0.80 / M,
                    output_cost: 4.00 / M,
                    ...withCache(0.80 / M, 4.00 / M),
                },
            ],
        },

        // ── 2025-02: Claude 3.7 Sonnet ──────────────────────────────────
        {
            name: 'claude-2025-02',
            version: '2025-02',
            effective_from: '2025-02-24',
            models: [
                {
                    model_name: 'claude-3.7-sonnet',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    token_costs: {thinking: 15.00 / M},
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },

        // ── 2025-05: Claude 4 launch ────────────────────────────────────
        {
            name: 'claude-2025-05',
            version: '2025-05',
            effective_from: '2025-05-22',
            models: [
                {
                    model_name: 'claude-opus-4',
                    input_cost: 15.00 / M,
                    output_cost: 75.00 / M,
                    ...withCache(15.00 / M, 75.00 / M),
                },
                {
                    model_name: 'claude-sonnet-4',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 6.00 / M,
                    extended_output_cost: 22.50 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },

        // ── 2025-08: Claude Opus 4.1 ────────────────────────────────────
        {
            name: 'claude-2025-08',
            version: '2025-08',
            effective_from: '2025-08-05',
            models: [
                {
                    model_name: 'claude-opus-4.1',
                    input_cost: 15.00 / M,
                    output_cost: 75.00 / M,
                    ...withCache(15.00 / M, 75.00 / M),
                },
            ],
        },

        // ── 2025-09: Claude Sonnet 4.5 ──────────────────────────────────
        {
            name: 'claude-2025-09',
            version: '2025-09',
            effective_from: '2025-09-29',
            models: [
                {
                    model_name: 'claude-sonnet-4.5',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 6.00 / M,
                    extended_output_cost: 22.50 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },

        // ── 2025-10: Claude Haiku 4.5 ───────────────────────────────────
        {
            name: 'claude-2025-10',
            version: '2025-10',
            effective_from: '2025-10-15',
            models: [
                {
                    model_name: 'claude-haiku-4.5',
                    input_cost: 1.00 / M,
                    output_cost: 5.00 / M,
                    ...withCache(1.00 / M, 5.00 / M),
                },
            ],
        },

        // ── 2025-11: Claude Opus 4.5 ────────────────────────────────────
        {
            name: 'claude-2025-11',
            version: '2025-11',
            effective_from: '2025-11-24',
            models: [
                {
                    model_name: 'claude-opus-4.5',
                    input_cost: 5.00 / M,
                    output_cost: 25.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 10.00 / M,
                    extended_output_cost: 37.50 / M,
                    ...withCache(5.00 / M, 25.00 / M),
                },
            ],
        },

        // ── 2026-02-05: Claude Opus 4.6 ─────────────────────────────────
        {
            name: 'claude-2026-02-opus',
            version: '2026-02-05',
            effective_from: '2026-02-05',
            models: [
                {
                    model_name: 'claude-opus-4.6',
                    input_cost: 5.00 / M,
                    output_cost: 25.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 10.00 / M,
                    extended_output_cost: 37.50 / M,
                    ...withCache(5.00 / M, 25.00 / M),
                },
            ],
        },

        // ── 2026-02-17: Claude Sonnet 4.6 ───────────────────────────────
        {
            name: 'claude-2026-02-sonnet',
            version: '2026-02-17',
            effective_from: '2026-02-17',
            models: [
                {
                    model_name: 'claude-sonnet-4.6',
                    input_cost: 3.00 / M,
                    output_cost: 15.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 6.00 / M,
                    extended_output_cost: 22.50 / M,
                    ...withCache(3.00 / M, 15.00 / M),
                },
            ],
        },
    ],

    model_ids: [
        // ── Claude 1.x family ───────────────────────────────────────────
        {
            model_id: 'claude-1.0',
            family: 'claude-1.x-family',
            kind: 'chat',
            release_date: '2023-03-14',
            shutdown_date: '2024-11-06',
            pricing_snapshot: 'claude-2023-03',
            aliases: ['claude-1.1', 'claude-1.2', 'claude-1.3'],
        },

        // ── Claude Instant 1.x family ───────────────────────────────────
        {
            model_id: 'claude-instant-1.0',
            family: 'claude-instant-1.x-family',
            kind: 'chat',
            release_date: '2023-03-14',
            shutdown_date: '2024-11-06',
            pricing_snapshot: 'claude-2023-03',
            aliases: ['claude-instant-1.1', 'claude-instant-1.2'],
        },

        // ── Claude 2.x ─────────────────────────────────────────────────
        {
            model_id: 'claude-2.0',
            family: 'claude-2.0',
            kind: 'chat',
            release_date: '2023-07-11',
            shutdown_date: '2025-07-21',
            pricing_snapshot: 'claude-2023-07',
        },
        {
            model_id: 'claude-2.1',
            family: 'claude-2.1',
            kind: 'chat',
            release_date: '2023-11-21',
            shutdown_date: '2025-07-21',
            pricing_snapshot: 'claude-2023-11',
        },

        // ── Claude 3 family ─────────────────────────────────────────────
        {
            model_id: 'claude-3-opus-20240229',
            family: 'claude-3-opus',
            kind: 'chat',
            release_date: '2024-03-04',
            shutdown_date: '2026-01-05',
            pricing_snapshot: 'claude-2024-03',
        },
        {
            model_id: 'claude-3-sonnet-20240229',
            family: 'claude-3-sonnet',
            kind: 'chat',
            release_date: '2024-03-04',
            shutdown_date: '2025-07-21',
            pricing_snapshot: 'claude-2024-03',
        },
        {
            model_id: 'claude-3-haiku-20240307',
            family: 'claude-3-haiku',
            kind: 'chat',
            release_date: '2024-03-13',
            shutdown_date: '2026-04-20',
            pricing_snapshot: 'claude-2024-03',
        },

        // ── Claude 3.5 Sonnet ───────────────────────────────────────────
        {
            model_id: 'claude-3-5-sonnet-20240620',
            family: 'claude-3.5-sonnet',
            kind: 'chat',
            release_date: '2024-06-21',
            shutdown_date: '2025-10-28',
            pricing_snapshot: 'claude-2024-06',
        },
        {
            model_id: 'claude-3-5-sonnet-20241022',
            family: 'claude-3.5-sonnet-v2',
            kind: 'chat',
            release_date: '2024-10-22',
            shutdown_date: '2025-10-28',
            pricing_snapshot: 'claude-2024-10',
        },

        // ── Claude 3.5 Haiku ────────────────────────────────────────────
        {
            model_id: 'claude-3-5-haiku-20241022',
            family: 'claude-3.5-haiku',
            kind: 'chat',
            release_date: '2024-12-03',
            shutdown_date: '2026-02-19',
            pricing_snapshot: 'claude-2024-12',
        },

        // ── Claude 3.7 Sonnet ───────────────────────────────────────────
        {
            model_id: 'claude-3-7-sonnet-20250219',
            family: 'claude-3.7-sonnet',
            kind: 'chat',
            release_date: '2025-02-24',
            shutdown_date: '2026-02-19',
            pricing_snapshot: 'claude-2025-02',
        },

        // ── Claude 4 ───────────────────────────────────────────────────
        {
            model_id: 'claude-opus-4-20250514',
            family: 'claude-opus-4',
            kind: 'chat',
            release_date: '2025-05-22',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-05',
        },
        {
            model_id: 'claude-sonnet-4-20250514',
            family: 'claude-sonnet-4',
            kind: 'chat',
            release_date: '2025-05-22',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-05',
        },

        // ── Claude Opus 4.1 ────────────────────────────────────────────
        {
            model_id: 'claude-opus-4-1-20250805',
            family: 'claude-opus-4.1',
            kind: 'chat',
            release_date: '2025-08-05',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-08',
        },

        // ── Claude Sonnet 4.5 ──────────────────────────────────────────
        {
            model_id: 'claude-sonnet-4-5',
            family: 'claude-sonnet-4.5',
            kind: 'chat',
            release_date: '2025-09-29',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-09',
            aliases: ['claude-sonnet-4-5-20250929'],
        },

        // ── Claude Haiku 4.5 ───────────────────────────────────────────
        {
            model_id: 'claude-haiku-4-5',
            family: 'claude-haiku-4.5',
            kind: 'chat',
            release_date: '2025-10-15',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-10',
            aliases: ['claude-haiku-4-5-20251001'],
        },

        // ── Claude Opus 4.5 ────────────────────────────────────────────
        {
            model_id: 'claude-opus-4-5-20251101',
            family: 'claude-opus-4.5',
            kind: 'chat',
            release_date: '2025-11-24',
            shutdown_date: null,
            pricing_snapshot: 'claude-2025-11',
        },

        // ── Claude Opus 4.6 ────────────────────────────────────────────
        {
            model_id: 'claude-opus-4-6',
            family: 'claude-opus-4.6',
            kind: 'chat',
            release_date: '2026-02-05',
            shutdown_date: null,
            pricing_snapshot: 'claude-2026-02-opus',
        },

        // ── Claude Sonnet 4.6 ──────────────────────────────────────────
        {
            model_id: 'claude-sonnet-4-6',
            family: 'claude-sonnet-4.6',
            kind: 'chat',
            release_date: '2026-02-17',
            shutdown_date: null,
            pricing_snapshot: 'claude-2026-02-sonnet',
        },
    ],
};
