import {ITranslator} from '../base.translator.interface';
import {ClaudeChatRequest, HoloRequest, HoloRequestValidator, ClaudeResponse, HoloResponse, HoloResponseValidator} from "../types";
import logger from "../../utils/logger";
import {ClaudeChatRequestValidator} from "./claude.request.validators";
import {ClaudeResponseValidator} from "./claude.response.validators";
import {type} from "arktype";
import {translate} from "../translators";
import {fromHoloRequestTranslators} from "./translators/claude.request.translators";
import {toHoloResponseTranslators} from "./translators/claude.response.translators";
import {toHoloRequestTranslators} from "./translators/claude.request.reverse.translators";
import {fromHoloResponseTranslators} from "./translators/claude.response.reverse.translators";

// Create the main translation pipelines using the parallel translate function
const holoToClaudeRequest = translate(
    HoloRequestValidator,
    ClaudeChatRequestValidator,
    fromHoloRequestTranslators
);

const claudeToHoloResponse = translate(
    ClaudeResponseValidator,
    HoloResponseValidator,
    toHoloResponseTranslators
);

// Reverse request translation using parallel translators
const claudeToHoloRequest = translate(
    ClaudeChatRequestValidator,
    HoloRequestValidator,
    toHoloRequestTranslators
);

// Reverse response translation using parallel translators
const holoToClaudeResponse = translate(
    HoloResponseValidator,
    ClaudeResponseValidator,
    fromHoloResponseTranslators
);

export class ClaudeTranslator implements ITranslator {
    fromHoloChatRequest(request: HoloRequest): ClaudeChatRequest | type.errors {
        logger.debug('translating holo request to claude request', request);
        return holoToClaudeRequest(request);
    }

    toHoloChatRequest(request: ClaudeChatRequest): HoloRequest | type.errors {
        logger.debug('translating claude request to holo request', request);
        return claudeToHoloRequest(request);
    }

    fromClaudeResponse(response: ClaudeResponse): HoloResponse | type.errors {
        logger.debug('translating claude response to holo response', response);
        return claudeToHoloResponse(response);
    }

    toClaudeResponse(response: HoloResponse): ClaudeResponse | type.errors {
        logger.debug('translating holo response to claude response', response);
        return holoToClaudeResponse(response);
    }
}
