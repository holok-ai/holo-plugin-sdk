import {BaseEntity} from "./base";

export const PricingSource = {
    PLUGIN: 'plugin',
    ADMIN: 'admin',
    INTERNAL: 'internal',
} as const;

export type PricingSource = typeof PricingSource[keyof typeof PricingSource];

export const CostType = {
    PROVIDER: 'provider',
    INTERNAL: 'internal',
} as const;

export type CostType = typeof CostType[keyof typeof CostType];

export interface PricingPlan extends BaseEntity {
    plugin_family: string;
    name: string;
    description?: string;
    currency: string;
    source: PricingSource;
    is_default: boolean;
    read_only: boolean;
    active: boolean;
}

export interface PricingSheet extends BaseEntity {
    plan_id: string;
    name: string;
    version: string;
    effective_from: string;
    effective_to?: string;
    notes?: string;
}

export interface PricingSheetModel extends BaseEntity {
    sheet_id: string;
    model_name: string;
    input_cost: number;
    output_cost: number;
    cache_read_cost: number;
    cache_write_cost: number;
    batch_input_cost: number;
    batch_output_cost: number;
    context_threshold?: number;
    extended_input_cost?: number;
    extended_output_cost?: number;
    token_costs?: Record<string, number>;
}

export interface CostResult {
    input_cost: number;
    output_cost: number;
    total_cost: number;
    detail: Record<string, { tokens: number; cost: number }>;
}

export interface ProviderResponseCost {
    id: string;
    response_id: string;
    cost_type: CostType;
    pricing_sheet_id?: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
    input_cost: number;
    output_cost: number;
    cache_read_cost: number;
    cache_write_cost: number;
    total_cost: number;
    currency: string;
    metadata?: Record<string, any>;
    created_at: string;
}
