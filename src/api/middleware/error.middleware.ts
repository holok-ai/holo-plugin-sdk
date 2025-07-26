import {NextFunction, Request, Response} from "express";
import logger from "../../utils/logger";

// Error handling middleware
interface AppError extends Error {
    status?: number;
}

export const errorMiddleware = async (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction)
    : Promise<void> => {
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            code: err.name || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
        },
        timestamp: new Date().toISOString()
    });
};
