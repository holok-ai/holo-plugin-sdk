import {NextFunction, Request, Response} from "express";
import logger from "../../utils/logger";
import {HoloError} from '@holokai/sdk';

export const errorMiddleware = async (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> => {
    const isHoloError = err instanceof HoloError;
    const statusCode = isHoloError ? err.statusCode : 500;
    const code = isHoloError ? err.code : 'internal_error';

    logger.error(`${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        statusCode,
        code,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            code,
            ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
        },
        timestamp: new Date().toISOString()
    });
};
