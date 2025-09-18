import jwt from 'jsonwebtoken';
import { env } from '../env';
import { AdminJWTPayload, TokenRefreshRequest, TokenRefreshResponse } from '../types';
import logger from '../utils/logger';

export class TokenRefreshService {
  private static instance: TokenRefreshService;

  private constructor() {}

  public static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }

  public async refreshToken(originalToken: string): Promise<string[] | null> {
    try {
      if (!env.mokuUrl) {
        logger.error('MOKU_URL not configured for token refresh');
        return null;
      }

      const refreshUrl = `${env.mokuUrl}/api/auth/token/refresh`;

      logger.debug('Attempting token refresh', {
        url: refreshUrl,
        originalTokenLength: originalToken.length
      });

      const requestBody: TokenRefreshRequest = {
        apiKey: originalToken
      };

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        logger.warn('Token refresh failed', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const data = await response.json() as TokenRefreshResponse;

      if (!data.accessToken) {
        logger.warn('Token refresh response missing accessToken');
        return null;
      }

      // Validate and extract urlSlugs from the new JWT
      return this.extractUrlSlugs(data.accessToken);

    } catch (error) {
      logger.error('Token refresh error', {
        error: (error as Error).message,
        name: (error as Error).name
      });
      return null;
    }
  }

  private extractUrlSlugs(accessToken: string): string[] | null {
    try {
      // Verify the token with the same secret used for the original token
      const decoded = jwt.verify(accessToken, env.jwtConfig.secret, {
        algorithms: [env.jwtConfig.algorithm]
      }) as AdminJWTPayload;

      if (!decoded.urlSlugs || !Array.isArray(decoded.urlSlugs)) {
        logger.warn('Invalid JWT structure: missing or invalid urlSlugs', {
          hasUrlSlugs: !!decoded.urlSlugs,
          urlSlugsType: typeof decoded.urlSlugs
        });
        return null;
      }

      logger.debug('Successfully extracted urlSlugs', {
        urlSlugsCount: decoded.urlSlugs.length,
        urlSlugs: decoded.urlSlugs
      });

      return decoded.urlSlugs;

    } catch (error) {
      logger.error('Failed to extract urlSlugs from access token', {
        error: (error as Error).message,
        tokenLength: accessToken.length
      });
      return null;
    }
  }
}

export default TokenRefreshService.getInstance();
