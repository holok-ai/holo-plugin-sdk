import {Application} from "../../cache";

export interface JWTPayload {
    organizationId: string;
    userId?: string;
    appSlugs?: string[];
    appSlug?: string;
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
    userId: string;
    providerName: string;
    app: Application;
}
