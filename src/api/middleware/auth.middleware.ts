import {NextFunction, Response} from 'express';
import {HttpApiRequest} from '../types';
import logger from '../../utils/logger';


export const authMiddleware = async (
    req: HttpApiRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // Extract authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        if (process.env.NODE_ENV === 'development') {
            logger.warn('No authorization header provided in development mode');
            return next();
        }
        res.status(401).json({
            success: false,
            error: {
                message: 'Authorization header required',
                code: 'MISSING_AUTH_HEADER'
            },
            timestamp: new Date().toISOString()
        });
        return;
    }

    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);

        // In production, validate the token against your auth service
        // For now, we'll just do a simple check
        if (token === process.env.API_TOKEN || process.env.NODE_ENV === 'development') {
            return next();
        }
    }

    res.status(401).json({
        success: false,
        error: {
            message: 'Invalid authorization format',
            code: 'INVALID_AUTH_FORMAT'
        },
        timestamp: new Date().toISOString()
    });
    return;
}
