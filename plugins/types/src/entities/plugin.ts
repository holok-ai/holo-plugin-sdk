import {BaseEntity} from "./base";

export interface ProtocolDefinition {
    name: string;
    capability: string;
    path?: string;
}

export interface Plugin extends BaseEntity {
    family: string;
    name: string;
    version: string;
    is_latest: boolean;
    active: boolean;
}
