import {BaseEntity} from "./base";

export interface Model extends BaseEntity {
    organization_id: string;
    name: string;
    description?: string;
    capabilities: Record<string, any>;
    parameters: Record<string, any>;
    metadata: Record<string, any>;
    status: { enabled: boolean; available: boolean };
}
