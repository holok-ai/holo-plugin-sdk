import {BaseEntity} from "./base";

export interface Model extends BaseEntity {
    name: string;
    access_model?: string;
    provider_id: string;
    organization_id: string;
    version: string;
    description?: string;
    context_length?: number;
    modalities?: any[];
    parameters: Record<string, any>;
    metadata: Record<string, any>;
    pricing_per_tokens?: Record<string, any>;
    benchmarks?: Record<string, any>;
    customization?: Record<string, any>;
    enabled: boolean;
    available: boolean;
    deleted: boolean;
    active: boolean;
}
