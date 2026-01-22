import {NextFunction, Response} from 'express';
import {HttpApiRequest} from '../types';
import logger from '../../utils/logger';
import {AuthService} from "../../admin/services/auth.service";

type Options = {
    useCache?: boolean;
    optional?: boolean;
};

export const makeJwtAuthMiddleware = (authService: AuthService, providerFamily: string, opts: Options = {}) =>
    async function authenticateJWTInternal(req: HttpApiRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            req.auth = await authService.populateAuth(providerFamily, req, opts.useCache ?? true);

            logger.debug(`User authenticated: ${JSON.stringify(req.auth)}`);
            next();
        } catch (error) {
            logger.warn('Authentication failed: Invalid token', {
                error: (error as Error).message,
                path: req.path,
                method: req.method,
                ip: req.ip,
            });
            if (opts.optional) next();
            res.status(403).json({error: 'Invalid token.'});
        }
    };
