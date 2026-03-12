export interface JWTPayload {
    userId?: string;
    email?: string;
    appSlugs?: string[];
    organizationId: string;
    sub: string;
    iss: string;
    iat: number;
    exp: number;
}

export interface TokenRefreshRequest {
    apiKey: string;
}

export interface TokenRefreshResponse {
    accessToken: string;
}