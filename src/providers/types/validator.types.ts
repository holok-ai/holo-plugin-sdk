import {Request} from 'express';
import {type} from "arktype";
import logger from "../../utils/logger";
import {ProviderType, RequestType} from "./index";

export const stringOrNull = type('string | null');
export const numberOrNull = type('number | null');
export const unknownOrNull = type('unknown | null');
export const stringArrayOrNull = type('string[] | null');
export const booleanOrNull = type('boolean | null');

export const validateRequest = <TResult>(
    req: Request,
    requestType: RequestType,
    providerType: ProviderType,
    validator: (requestBody: any, requestType: RequestType) => TResult | type.errors
): TResult => {
    const result = validator(req.body, requestType);

    if (result instanceof type.errors) {
        logger.error(`${providerType} request validation failed`, {
            errors: result.summary,
            input: req
        });
        throw new Error(`Invalid ${providerType} request: ${result.summary}`);
    }

    return result;
};
