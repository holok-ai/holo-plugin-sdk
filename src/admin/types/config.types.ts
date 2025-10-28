import {Application, Organization} from "../../cache";

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

export interface OrganizationConfig {
    configType: HoloConfigType.ORGANIZATION,
    action: HoloConfigAction,
    data: Organization[]
}

export interface ApplicationConfig {
    configType: HoloConfigType.APPLICATION,
    action: HoloConfigAction,
    data: Application[]
}

export interface JwtTokenConfig {
    configType: HoloConfigType.JWT_TOKEN,
    action: HoloConfigAction,
    data: JwtTokenConfigData[]
}


export type HoloConfig = OrganizationConfig | ApplicationConfig | JwtTokenConfig;
