import {BaseEntity} from './base';

export interface HoloToken extends BaseEntity {
    organization_id: string;
    user_id?: string;
    application_id?: string;
    token_type: 'user' | 'application';
    key_hash: string;
    key_prefix: string;
    key_suffix: string;
    name?: string;
    expires_at?: Date;
    last_used_at?: Date;
    active: boolean;
}
