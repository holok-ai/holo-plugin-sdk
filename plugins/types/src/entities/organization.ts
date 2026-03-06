import {BaseEntity} from "./base";

export interface Organization extends BaseEntity {
    name: string;
    slug: string;
    description?: string;
    domain: string;
    settings?: Record<string, any>;
    subscription_tier: string;
    max_users: number;
    max_applications: number;
    max_monthly_requests: number;
    active: boolean;
    timezone: string;
    tenant_id?: string;
    byok_enabled: boolean;
}
