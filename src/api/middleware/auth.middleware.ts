import {NextFunction, Response} from 'express';
import jwt from 'jsonwebtoken';
import {env} from '../../env';
import {JWTPayload} from '../../types';
import {HttpApiRequest} from '../types';
import logger from '../../utils/logger';

export const authenticateJWT = (req: HttpApiRequest, res: Response, next: NextFunction): void => {
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
            res.status(401).json({error: 'Access denied. No token provided.'});
            return;
        }

        // Verify the token
        const decoded = jwt.verify(token, env.jwtConfig.secret, {
            algorithms: [env.jwtConfig.algorithm]
        }) as JWTPayload;

        // Attach user to request
        req.user = decoded;

        logger.debug(`User authenticated successfully: ${JSON.stringify(decoded)}`);

        next();
    } catch (error) {
        logger.warn('Authentication failed: Invalid token', {
            error: (error as Error).message,
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        res.status(403).json({error: 'Invalid token.'});
    }
};

export const optionalAuth = (req: HttpApiRequest, _res: Response, next: NextFunction): void => {
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

        // Verify the token if present
        const decoded = jwt.verify(token, env.jwtConfig.secret, {
            algorithms: [env.jwtConfig.algorithm]
        }) as JWTPayload;

        // Attach user to request
        req.user = decoded;

        logger.debug('Optional auth: User authenticated successfully', {
            userId: decoded.userId,
            email: decoded.email,
            path: req.path,
            method: req.method
        });

        next();
    } catch (error) {
        logger.debug('Optional auth: Invalid token, continuing without authentication', {
            error: (error as Error).message,
            path: req.path,
            method: req.method
        });
        // Continue without authentication for optional auth
        next();
    }
};
