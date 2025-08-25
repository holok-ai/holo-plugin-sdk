import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../env';
import { JWTPayload } from '../../types/auth.types';
import { HttpApiRequest } from '../types';
import logger from '../../utils/logger';
import cacheService from '../../services/cache.service';
import tokenRefreshService from '../../services/token-refresh.service';

export const authenticateJWTWithCache = (req: HttpApiRequest, res: Response, next: NextFunction): void => {
  authenticateJWTInternal(req, res, next, true);
};

export const authenticateJWT = (req: HttpApiRequest, res: Response, next: NextFunction): void => {
  authenticateJWTInternal(req, res, next, false);
};

const authenticateJWTInternal = async (
  req: HttpApiRequest, 
  res: Response, 
  next: NextFunction,
  useCache: boolean
): Promise<void> => {
  try {
    // Try to extract token from x-api-key header first
    let token = req.headers['x-api-key'] as string;
    
    // If not found in x-api-key, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    let urlSlugs: string[] | null = null;

    if (useCache) {
      // Check cache for token first
      urlSlugs = cacheService.getTokenUrlSlugs(token) || null;
      
      if (urlSlugs) {
        logger.debug('Token found in cache', { 
          token: token.substring(0, 10) + '...', 
          urlSlugsCount: urlSlugs.length 
        });
      } else {
        logger.debug('Token not found in cache, attempting refresh', { 
          token: token.substring(0, 10) + '...' 
        });
        
        // Token not in cache, refresh it
        urlSlugs = await tokenRefreshService.refreshToken(token);
        
        if (urlSlugs) {
          // Cache the result
          const cached = cacheService.setTokenUrlSlugs(token, urlSlugs);
          logger.debug('Token refreshed and cached', { 
            cached,
            urlSlugsCount: urlSlugs.length 
          });
        } else {
          logger.warn('Token refresh failed', {
            token: token.substring(0, 10) + '...'
          });
          res.status(403).json({ error: 'Token refresh failed.' });
          return;
        }
      }

      // Check if appId is in urlSlugs
      const appId = req.params.appId;
      if (appId && urlSlugs && !urlSlugs.includes(appId)) {
        logger.warn('Access denied: appId not in urlSlugs', {
          appId,
          urlSlugs,
          token: token.substring(0, 10) + '...',
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        res.status(403).json({ error: `Access denied for application: ${appId}` });
        return;
      }
    }

    // Verify the original token (for backward compatibility and to get user info)
    const decoded = jwt.verify(token, env.jwtConfig.secret, {
      algorithms: [env.jwtConfig.algorithm]
    }) as JWTPayload;

    // Attach user and urlSlugs to request
    req.user = decoded;
    if (urlSlugs) {
      req.urlSlugs = urlSlugs;
    }
    
    logger.debug('User authenticated successfully', {
      userId: decoded.userId,
      email: decoded.email,
      appId: req.params.appId,
      urlSlugsCount: urlSlugs?.length || 0,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: (error as Error).message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({ error: 'Invalid token.' });
  }
};

export const optionalAuthWithCache = async (req: HttpApiRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try to extract token from x-api-key header first
    let token = req.headers['x-api-key'] as string;
    
    // If not found in x-api-key, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // If no token, continue without authentication
    if (!token) {
      next();
      return;
    }

    // Use the same logic as authenticateJWTWithCache but don't fail if it doesn't work
    try {
      await new Promise<void>((resolve, reject) => {
        authenticateJWTInternal(req, res, (error?: any) => {
          if (error) reject(error);
          else resolve();
        }, true);
      });
    } catch (error) {
      logger.debug('Optional auth: Authentication failed, continuing without authentication', {
        error: (error as Error).message,
        path: req.path,
        method: req.method
      });
      // Clear any partial auth data and continue
      delete req.user;
      delete req.urlSlugs;
    }

    next();
  } catch (error) {
    logger.debug('Optional auth: Error during authentication, continuing without authentication', {
      error: (error as Error).message,
      path: req.path,
      method: req.method
    });
    // Continue without authentication for optional auth
    next();
  }
};