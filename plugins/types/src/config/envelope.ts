import {ApplicationConfigProps, OrganizationConfigProps} from "./types";

export const HoloConfigAction = {
    NEW: 'NEW',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
} as const;

export type HoloConfigAction = typeof HoloConfigAction[keyof typeof HoloConfigAction];

export const HoloConfigType = {
    ORGANIZATION: 'ORGANIZATION',
    APPLICATION: 'APPLICATION',
    JWT_TOKEN: 'JWT_TOKEN'
} as const;

export type HoloConfigType = typeof HoloConfigType[keyof typeof HoloConfigType];

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

export type OrganizationConfig =
    HoloConfigEnvelope<typeof HoloConfigType.ORGANIZATION, OrganizationConfigProps>;

export type ApplicationConfig =
    HoloConfigEnvelope<typeof HoloConfigType.APPLICATION, ApplicationConfigProps>;

export type JwtTokenConfig =
    HoloConfigEnvelope<typeof HoloConfigType.JWT_TOKEN, JwtTokenConfigData>;

export type HoloConfig = OrganizationConfig | ApplicationConfig | JwtTokenConfig;
