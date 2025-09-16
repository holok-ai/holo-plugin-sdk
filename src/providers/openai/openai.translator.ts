import {ITranslator} from '../base.translator.interface';
import {OpenAIChatRequest, HoloRequest, HoloRequestValidator, OpenAIResponse, HoloResponse, HoloResponseValidator} from "../types";
import logger from "../../utils/logger";
import {OpenAIChatRequestValidator} from "./openai.request.validators";
import {OpenAIResponseValidator} from "./openai.response.validators";
import {type} from "arktype";
import {translate} from "../translators";
import {fromHoloRequestTranslators} from "./translators/openai.request.translators";
import {toHoloResponseTranslators} from "./translators/openai.response.translators";
import {toHoloRequestTranslators} from "./translators/openai.request.reverse.translators";
import {fromHoloResponseTranslators} from "./translators/openai.response.reverse.translators";

// Create the main translation pipelines using the parallel translate function
const holoToOpenAIRequest = translate(
    HoloRequestValidator,
    OpenAIChatRequestValidator,
    fromHoloRequestTranslators
);

// Response translation pipeline
const openaiToHoloResponse = translate(
    OpenAIResponseValidator,
    HoloResponseValidator,
    toHoloResponseTranslators
);

// Reverse request translation using parallel translators
const openaiToHoloRequest = translate(
    OpenAIChatRequestValidator,
    HoloRequestValidator,
    toHoloRequestTranslators
);

// Reverse response translation using parallel translators
const holoToOpenAIResponse = translate(
    HoloResponseValidator,
    OpenAIResponseValidator,
    fromHoloResponseTranslators
);

export class OpenAITranslator implements ITranslator {
    fromHoloChatRequest(request: HoloRequest): OpenAIChatRequest | type.errors {
        logger.debug('translating holo request to openai request', request);
        return holoToOpenAIRequest(request);
    }

    toHoloChatRequest(request: OpenAIChatRequest): HoloRequest | type.errors {
        logger.debug('translating openai request to holo request', request);
        return openaiToHoloRequest(request);
    }

    fromOpenAIResponse(response: OpenAIResponse): HoloResponse | type.errors {
        logger.debug('translating openai response to holo response', response);
        return openaiToHoloResponse(response);
    }

    toOpenAIResponse(response: HoloResponse): OpenAIResponse | type.errors {
        logger.debug('translating holo response to openai response', response);
        return holoToOpenAIResponse(response);
    }
}
