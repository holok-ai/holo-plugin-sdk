import {NextFunction, RequestHandler, Response} from 'express';
import {HoloApiRequest} from '../types';
import {AuthService, extractAppSlug, extractToken} from "../../services/auth/auth.service";
import {HoloError} from '@holokai/sdk';

type AuthOptions = {
    useCache?: boolean;
    optional?: boolean;
    allowJwt?: boolean;
    allowHoloToken?: boolean;
    allowAnonymous?: boolean;
    providerFamily?: string;
};

export function makeAuthMiddleware(authService: AuthService, opts: AuthOptions = {}): RequestHandler {
    const {
        useCache = true,
        optional = false,
        allowJwt = true,
        allowHoloToken = true,
        allowAnonymous = false,
        providerFamily,
    } = opts;

    return async function authenticate(req: HoloApiRequest, _res: Response, next: NextFunction): Promise<void> {
        const token = extractToken(req);
        const clientIdentifier = req.headers['x-client-user'] as string | undefined;
        const appSlug = extractAppSlug(req);

        try {
            if (token?.startsWith('holo_') && allowHoloToken) {
                req.auth = await authService.authenticateHoloToken(token, appSlug, providerFamily);
            } else if (token && !token.startsWith('holo_') && allowJwt) {
                req.auth = await authService.authenticateJwt(token, appSlug, providerFamily, useCache);
            } else if (appSlug && allowAnonymous) {
                req.auth = await authService.authenticateAnonymous(appSlug, providerFamily);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            next(HoloError.forbidden(errorMessage));
            return;
        }

        if (!req.auth && !optional) {
            next(HoloError.unauthorized('Authentication required'));
            return;
        }

        if (req.auth && clientIdentifier) {
            req.auth.clientIdentifier = clientIdentifier;
        }

        next();
    };
}
