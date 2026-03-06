import logger from "../utils/logger";
import {ArkErrors} from "arktype";

export class AdminConfigError extends Error {
    constructor(message: string, errors: ArkErrors) {
        super(message);

        logger.error(errors.summary);
    }
}
