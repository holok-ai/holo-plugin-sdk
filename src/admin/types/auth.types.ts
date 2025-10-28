import {ProviderType} from "../../providers/types";

export interface JWTPayload {
    organizationId: string;
    userId?: string;
    appSlugs?: string[];
    appSlug?: string;
    providerType?: ProviderType;
    iat?: number;
    exp?: number;
}

export interface TokenRefreshRequest {
    apiKey: string;
}

export interface TokenRefreshResponse {
    accessToken: string;
}

export interface Auth {
    organizationId: string;
    userId?: string;
    urlSlugs?: string[];
    urlSlug?: string;
}
