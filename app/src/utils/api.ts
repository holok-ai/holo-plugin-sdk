import {NextFunction, RequestHandler, Response} from 'express';
import {ClassLogger} from "@holokai/sdk";
import {HoloApiRequest} from '../api/types';

export interface ApiResponse<T = any> extends Response {
    json: (body: T) => this;
}

export function asyncHandler(
    fn: (req: HoloApiRequest, res: ApiResponse, next: NextFunction) => Promise<void>
): RequestHandler {
    return (req, res, next) => {
        fn(req as HoloApiRequest, res as ApiResponse, next).catch(next);
    };
}

export abstract class BaseController extends ClassLogger {
    protected handleError(
        res: ApiResponse,
        error: Error,
        message: string = 'Internal server error',
        statusCode: number = 500
    ): void {
        const logger = this.mlog(this.handleError);
        logger.error(`${message}: ${JSON.stringify(error.message, null, 2)}`, {
            methodName: 'handleError'
        });
        res.status(statusCode).json({
            success: false,
            error: {
                message,
                code: error.name || 'INTERNAL_ERROR',
                ...(process.env.NODE_ENV === 'development' && {stack: error.stack})
            },
            timestamp: new Date().toISOString()
        });
    }
}
