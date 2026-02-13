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
            next();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorName = error instanceof Error ? error.name : 'Error';

            logger.warn(`Authentication failed: ${errorMessage}`, {
                errorType: errorName,
                errorMessage,
                path: req.path,
                method: req.method,
                ip: req.ip,
                provider: providerFamily,
                hasAuthHeader: !!req.headers.authorization,
                hasApiKey: !!req.headers['x-api-key'],
                ...(process.env.NODE_ENV === 'development' && error instanceof Error ? {stack: error.stack} : {})
            });

            if (opts.optional) {
                next();
                return;
            }

            res.status(403).json({
                error: 'Authentication failed',
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' ? {details: errorName} : {})
            });
        }
    };
