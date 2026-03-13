import type {PricingDataset} from '@holokai/types/plugin';

const M = 1_000_000;

export const GEMINI_PRICING_DATASET: PricingDataset = {
    name: 'Google Gemini',
    version: '2026-03',
    pricing_snapshots: [
        // ── 2024-02: Gemini 1.0 / 1.5 Pro launch ──────────────────────
        {
            name: 'gemini-2024-02',
            version: '2024-02',
            effective_from: '2024-02-15',
            models: [
                {
                    model_name: 'gemini-1.5-pro',
                    input_cost: 3.50 / M,
                    output_cost: 10.50 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 7.00 / M,
                    extended_output_cost: 21.00 / M,
                },
                {
                    model_name: 'gemini-1.0-pro',
                    input_cost: 0.50 / M,
                    output_cost: 1.50 / M,
                },
            ],
        },

        // ── 2024-05: Gemini 1.5 Flash launch ──────────────────────────
        {
            name: 'gemini-2024-05',
            version: '2024-05',
            effective_from: '2024-05-24',
            models: [
                {
                    model_name: 'gemini-1.5-flash',
                    input_cost: 0.35 / M,
                    output_cost: 1.05 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 0.70 / M,
                    extended_output_cost: 2.10 / M,
                },
                {
                    model_name: 'gemini-1.5-flash-8b',
                    input_cost: 0.0375 / M,
                    output_cost: 0.15 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 0.075 / M,
                    extended_output_cost: 0.30 / M,
                },
            ],
        },

        // ── 2024-10: Gemini 1.5 price cuts ─────────────────────────────
        {
            name: 'gemini-2024-10',
            version: '2024-10',
            effective_from: '2024-10-01',
            models: [
                {
                    model_name: 'gemini-1.5-pro',
                    input_cost: 1.25 / M,
                    output_cost: 5.00 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 2.50 / M,
                    extended_output_cost: 10.00 / M,
                },
                {
                    model_name: 'gemini-1.5-flash',
                    input_cost: 0.075 / M,
                    output_cost: 0.30 / M,
                    context_threshold: 128_000,
                    extended_input_cost: 0.15 / M,
                    extended_output_cost: 0.60 / M,
                },
            ],
        },

        // ── 2025-02: Gemini 2.0 Flash launch ───────────────────────────
        {
            name: 'gemini-2025-02',
            version: '2025-02',
            effective_from: '2025-02-05',
            models: [
                {
                    model_name: 'gemini-2.0-flash',
                    input_cost: 0.10 / M,
                    output_cost: 0.40 / M,
                },
                {
                    model_name: 'gemini-2.0-flash-lite',
                    input_cost: 0.08 / M,
                    output_cost: 0.30 / M,
                },
            ],
        },

        // ── 2025-03: Gemini 2.5 Pro/Flash launch ───────────────────────
        {
            name: 'gemini-2025-03',
            version: '2025-03',
            effective_from: '2025-03-25',
            models: [
                {
                    model_name: 'gemini-2.5-pro',
                    input_cost: 1.25 / M,
                    output_cost: 10.00 / M,
                    token_costs: {thinking: 10.00 / M},
                    context_threshold: 200_000,
                    extended_input_cost: 2.50 / M,
                    extended_output_cost: 15.00 / M,
                },
                {
                    model_name: 'gemini-2.5-flash',
                    input_cost: 0.15 / M,
                    output_cost: 0.60 / M,
                    token_costs: {thinking: 0.60 / M},
                },
            ],
        },

        // ── 2025-06: Gemini 2.5 Flash price update + Lite ──────────────
        {
            name: 'gemini-2025-06',
            version: '2025-06',
            effective_from: '2025-06-17',
            models: [
                {
                    model_name: 'gemini-2.5-flash',
                    input_cost: 0.30 / M,
                    output_cost: 2.50 / M,
                },
                {
                    model_name: 'gemini-2.5-flash-lite',
                    input_cost: 0.10 / M,
                    output_cost: 0.40 / M,
                },
            ],
        },

        // ── 2026-01: Gemini 3 launch ───────────────────────────────────
        {
            name: 'gemini-2026-01',
            version: '2026-01',
            effective_from: '2026-01-15',
            models: [
                {
                    model_name: 'gemini-3-pro',
                    input_cost: 2.00 / M,
                    output_cost: 12.00 / M,
                    context_threshold: 200_000,
                    extended_input_cost: 4.00 / M,
                    extended_output_cost: 18.00 / M,
                },
                {
                    model_name: 'gemini-3-flash',
                    input_cost: 0.50 / M,
                    output_cost: 3.00 / M,
                },
                {
                    model_name: 'gemini-3.1-flash-lite',
                    input_cost: 0.25 / M,
                    output_cost: 1.50 / M,
                },
            ],
        },
    ],

    model_ids: [
        // ── Gemini 1.0 ─────────────────────────────────────────────────
        {
            model_id: 'gemini-1.0-pro-001',
            family: 'gemini-1.0-pro',
            kind: 'chat',
            release_date: '2024-02-15',
            shutdown_date: '2025-02-15',
            pricing_snapshot: 'gemini-2024-02',
        },
        {
            model_id: 'gemini-1.0-pro-002',
            family: 'gemini-1.0-pro',
            kind: 'chat',
            release_date: '2024-04-09',
            shutdown_date: '2025-02-15',
            pricing_snapshot: 'gemini-2024-02',
        },

        // ── Gemini 1.5 Pro ─────────────────────────────────────────────
        {
            model_id: 'gemini-1.5-pro-001',
            family: 'gemini-1.5-pro',
            kind: 'chat',
            release_date: '2024-02-15',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2024-02',
        },
        {
            model_id: 'gemini-1.5-pro-002',
            family: 'gemini-1.5-pro',
            kind: 'chat',
            release_date: '2024-09-24',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2024-02',
        },

        // ── Gemini 1.5 Flash ───────────────────────────────────────────
        {
            model_id: 'gemini-1.5-flash-001',
            family: 'gemini-1.5-flash',
            kind: 'chat',
            release_date: '2024-05-24',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2024-05',
        },
        {
            model_id: 'gemini-1.5-flash-002',
            family: 'gemini-1.5-flash',
            kind: 'chat',
            release_date: '2024-09-24',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2024-05',
        },

        // ── Gemini 1.5 Flash 8B ────────────────────────────────────────
        {
            model_id: 'gemini-1.5-flash-8b-001',
            family: 'gemini-1.5-flash-8b',
            kind: 'chat',
            release_date: '2024-10-03',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2024-05',
        },

        // ── Gemini 2.0 Flash ───────────────────────────────────────────
        {
            model_id: 'gemini-2.0-flash-001',
            family: 'gemini-2.0-flash',
            kind: 'chat',
            release_date: '2025-02-05',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2025-02',
        },

        // ── Gemini 2.5 Pro ─────────────────────────────────────────────
        {
            model_id: 'gemini-2.5-pro-preview-05-06',
            family: 'gemini-2.5-pro',
            kind: 'chat',
            release_date: '2025-05-06',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2025-03',
        },

        // ── Gemini 2.5 Flash ───────────────────────────────────────────
        {
            model_id: 'gemini-2.5-flash-preview-04-17',
            family: 'gemini-2.5-flash',
            kind: 'chat',
            release_date: '2025-04-17',
            shutdown_date: null,
            pricing_snapshot: 'gemini-2025-03',
        },
    ],
};
