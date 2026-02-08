import {ApplicationConfigProps, OrganizationConfigProps} from "./types";

export enum HoloConfigAction {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}

export enum HoloConfigType {
    ORGANIZATION = 'ORGANIZATION',
    APPLICATION = 'APPLICATION',
    JWT_TOKEN = 'JWT_TOKEN'
}

export interface JwtTokenConfigData {
    token?: string;
    userId?: string;
    organizationId?: string;

    [key: string]: any;
}

export interface HoloConfigEnvelope<
    TType extends HoloConfigType = HoloConfigType,
    TData = unknown
> {
    configType: TType;
    action: HoloConfigAction;
    data: readonly TData[];
}

// Concrete envelopes
export type OrganizationConfig =
    HoloConfigEnvelope<HoloConfigType.ORGANIZATION, OrganizationConfigProps>;

export type ApplicationConfig =
    HoloConfigEnvelope<HoloConfigType.APPLICATION, ApplicationConfigProps>;

export type JwtTokenConfig =
    HoloConfigEnvelope<HoloConfigType.JWT_TOKEN, JwtTokenConfigData>;

// This is the unified config type used by ConfigService
export type HoloConfig = OrganizationConfig | ApplicationConfig | JwtTokenConfig;