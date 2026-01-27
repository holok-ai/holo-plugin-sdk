import {BaseEntity} from "./base";

export interface Provider extends BaseEntity {
    organization_id: string;
    name: string;
    type: string;
    description?: string;
    config: Record<string, any>;
    status?: { enabled?: boolean };
}