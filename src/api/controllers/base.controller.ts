import {Response} from 'express';
import {ApiResponse} from "../types";
import {ClassLogger} from "../../types/class.logger";

export abstract class BaseController extends ClassLogger {
    protected handleError(
        res: Response,
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

    protected success<T>(res: Response, data: T, statusCode: number = 200): void {
        res.status(statusCode).json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    }

    protected hasRequiredFields(fields: Record<string, any>, requiredFields: string[], res: ApiResponse): boolean {
        const missing = requiredFields.filter(field => !fields[field]);
        if (missing.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    message: `Missing required fields: ${missing.join(', ')}`,
                    code: 'VALIDATION_ERROR'
                },
                timestamp: new Date().toISOString()
            });
            return false;
        }
        return true;
    }
}
