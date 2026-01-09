export interface JWTPayload {
    organizationId: string;
    userId?: string;
    appSlugs?: string[];
    appSlug?: string;
    providerName?: string;
    providerType?: string;
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
