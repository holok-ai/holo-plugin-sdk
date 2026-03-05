import {BaseEntity} from "./base";

export interface Evaluator extends BaseEntity {
    name: string;
    description?: string | null;
    prompt_id?: string | null;
    parameters: Record<string, any>;
    evaluator_type: string;
    enabled: boolean;
    available: boolean;
    deleted?: boolean;
    active?: boolean;
}
