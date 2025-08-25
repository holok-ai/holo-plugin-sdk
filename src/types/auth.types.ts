import { Request } from 'express';

export interface JWTPayload {
  organizationId: string;
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
export interface AdminJWTPayload extends JWTPayload {
  urlSlugs: string[];
}

export interface TokenRefreshRequest {
  apiKey: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}