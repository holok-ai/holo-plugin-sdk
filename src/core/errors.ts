import {HoloErrorCode} from '@holokai/types/holo';

export class HoloError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code: HoloErrorCode = HoloErrorCode.INTERNAL_ERROR
    ) {
        super(message);
        this.name = 'HoloError';
    }

    static notFound(resource: string): HoloError {
        return new HoloError(404, `${resource} not found`, HoloErrorCode.NOT_FOUND);
    }

    static badRequest(message: string): HoloError {
        return new HoloError(400, message, HoloErrorCode.VALIDATION_ERROR);
    }

    static unauthorized(message = 'Unauthorized'): HoloError {
        return new HoloError(401, message, HoloErrorCode.UNAUTHORIZED);
    }

    static forbidden(message = 'Forbidden'): HoloError {
        return new HoloError(403, message, HoloErrorCode.FORBIDDEN);
    }
}
