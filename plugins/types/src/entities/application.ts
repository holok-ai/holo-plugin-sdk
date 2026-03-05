import {BaseEntity} from "./base";

export interface Application extends BaseEntity {
    name: string;
    provider_id: string;
    model_id: string;
    system_prompt: string;
    url_slug: string;
    active?: boolean;
    organization_id: string;
    team_id?: string;
}
