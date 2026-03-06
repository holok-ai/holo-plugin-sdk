import {BaseEntity} from "./base";

export interface Prompt extends BaseEntity {
    name: string;
    organization_id: string;
    provider_id: string;
    provider: string;
    model?: string;
    system_prompt?: string;
    user_prompt: string;
    output_schema?: Record<string, any>;
    parameters: Record<string, any>;
    prompt_type: 'GUARD' | 'APPLICATION' | 'EVALUATOR';
    active: boolean;
}
