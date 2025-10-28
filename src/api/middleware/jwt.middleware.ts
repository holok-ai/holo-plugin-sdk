import {NextFunction, Response} from 'express';
import {HttpApiRequest} from '../types';
import logger from '../../utils/logger';
import {TokenService} from '../../admin/services';
import {ProviderType} from "../../providers/types";

type Options = {
    useCache?: boolean;
    optional?: boolean;
};

export const makeJwtAuthMiddleware = (tokenService: TokenService, opts: Options = {}) =>
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


            const appSlugs = await tokenService.getAppSlugs(token, opts.useCache ?? true);
            if (!appSlugs) {
                logger.warn('No url slugs found for token.')
                if (opts.optional) return next();
                res.status(403).json({error: 'Token refresh failed.'});
                return;
            }

            const {appSlug, provider} = req.params;
            if (appSlug && !appSlugs.includes(appSlug)) {
                logger.warn('Access denied: appSlug not in urlSlugs', {
                    appSlug,
                    urlSlugsCount: appSlugs.length,
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                });
                if (opts.optional) return next();
                res.status(403).json({error: `Access denied for application: ${appSlug}`});
                return;
            }

            const auth = {
                ...tokenService.decodeToken(token),
                ...(appSlug && {appSlug}),
                ...(provider && {providerType: provider.toUpperCase() as ProviderType}),
                ...(appSlugs && {appSlugs}),
            };

            logger.debug(`User authenticated successfully: ${JSON.stringify(auth)}`);

            req.auth = auth;


            logger.debug('User authenticated successfully', {
                userId: auth.userId,
                appSlug,
                appSlugsCount: appSlugs?.length || 0,
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
