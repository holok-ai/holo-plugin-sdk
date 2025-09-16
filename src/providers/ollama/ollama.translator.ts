import {ITranslator} from '../base.translator.interface';
import {OllamaChatRequest, HoloRequest, HoloRequestValidator, OllamaResponse, HoloResponse, HoloResponseValidator} from "../types";
import logger from "../../utils/logger";
import {OllamaChatRequestValidator} from "./ollama.request.validators";
import {OllamaResponseValidator} from "./ollama.response.validators";
import {type} from "arktype";
import {translate} from "../translators";
import {fromHoloRequestTranslators} from "./ollama.request.translators";
import {toHoloResponseTranslators} from "./ollama.response.translators";
import {toHoloRequestTranslators} from "./ollama.request.reverse.translators";
import {fromHoloResponseTranslators} from "./ollama.response.reverse.translators";

// Create the main translation pipelines using the parallel translate function
const holoToOllamaRequest = translate(
    HoloRequestValidator,
    OllamaChatRequestValidator,
    fromHoloRequestTranslators
);

// Response translation pipeline
const ollamaToHoloResponse = translate(
    OllamaResponseValidator,
    HoloResponseValidator,
    toHoloResponseTranslators
);

// Reverse request translation using parallel translators
const ollamaToHoloRequest = translate(
    OllamaChatRequestValidator,
    HoloRequestValidator,
    toHoloRequestTranslators
);

// Reverse response translation using parallel translators
const holoToOllamaResponse = translate(
    HoloResponseValidator,
    OllamaResponseValidator,
    fromHoloResponseTranslators
);

export class OllamaTranslator implements ITranslator {
    fromHoloChatRequest(request: HoloRequest): OllamaChatRequest | type.errors {
        logger.debug('translating holo request to ollama request', request);
        return holoToOllamaRequest(request);
    }

    toHoloChatRequest(request: OllamaChatRequest): HoloRequest | type.errors {
        logger.debug('translating ollama request to holo request', request);
        return ollamaToHoloRequest(request);
    }

    fromOllamaResponse(response: OllamaResponse): HoloResponse | type.errors {
        logger.debug('translating ollama response to holo response', response);
        return ollamaToHoloResponse(response);
    }

    toOllamaResponse(response: HoloResponse): OllamaResponse | type.errors {
        logger.debug('translating holo response to ollama response', response);
        return holoToOllamaResponse(response);
    }
}