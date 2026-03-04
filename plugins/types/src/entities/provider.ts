import {BaseEntity} from "./base";

export interface Provider extends BaseEntity {
    organization_id: string;
    name: string;
    type: string;
    description?: string;
    config: Record<string, any>;
    api_credential_id?: string;
    enabled: boolean;
    available: boolean;
    deleted: boolean;
    active: boolean;
}
