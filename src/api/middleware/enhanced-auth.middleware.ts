import {NextFunction, Response} from 'express';
import jwt from 'jsonwebtoken';
import {env} from '../../env';
import {HttpApiRequest} from '../types';
import logger from '../../utils/logger';
import {TokenService} from '../../admin/services';

type Options = {
    useCache?: boolean;
    optional?: boolean;
};

export const makeAuthMiddleware = (tokenService: TokenService, opts: Options = {}) =>
    async function authenticateJWTInternal(req: HttpApiRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            let token = req.headers['x-api-key'] as string | undefined;
            if (!token) {
                const h = req.headers.authorization;
                if (h?.startsWith('Bearer ')) token = h.slice(7).trim();
            }

            if (!token) {
                logger.warn('Authentication failed: No token provided', {
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                if (opts.optional) return next();
                res.status(401).json({error: 'Access denied. No token provided.'});
                return;
            }

            let urlSlugs: string[] | null = null;

            if (opts.useCache !== false) {
                urlSlugs = await tokenService.getUrlSlugs(token, true);
                if (!urlSlugs) {
                    logger.warn('Token refresh failed', {token: token.slice(0, 10) + '...'});
                    if (opts.optional) return next();
                    res.status(403).json({error: 'Token refresh failed.'});
                    return;
                }

                const appId = (req.params as any).appId as string | undefined;
                if (appId && !urlSlugs.includes(appId)) {
                    logger.warn('Access denied: appId not in urlSlugs', {
                        appId,
                        urlSlugsCount: urlSlugs.length,
                        path: req.path,
                        method: req.method,
                        ip: req.ip,
                    });
                    if (opts.optional) return next();
                    res.status(403).json({error: `Access denied for application: ${appId}`});
                    return;
                }
            }

            const decoded = jwt.verify(token, env.jwtConfig.secret, {
                algorithms: [env.jwtConfig.algorithm],
            }) as any; // your JWTPayload type here

            (req as any).user = decoded;
            if (urlSlugs) (req as any).urlSlugs = urlSlugs;

            logger.debug('User authenticated successfully', {
                userId: decoded.userId,
                email: decoded.email,
                appId: (req.params as any).appId,
                urlSlugsCount: urlSlugs?.length || 0,
                path: req.path,
                method: req.method,
            });

            next();
        } catch (error) {
            logger.warn('Authentication failed: Invalid token', {
                error: (error as Error).message,
                path: req.path,
                method: req.method,
                ip: req.ip,
            });
            if (opts.optional) return next();
            res.status(403).json({error: 'Invalid token.'});
        }
    };
