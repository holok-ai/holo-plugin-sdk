import {OpenAIChatRequest, HoloRequest, OpenAIResponse, HoloResponse} from "../types";
import logger from "../../utils/logger";
import {type} from "arktype";
import {OpenAIRequestTranslator} from "./translators";
import {IProviderTranslator} from "../types";

export class OpenAITranslator implements IProviderTranslator {
    async fromHoloChatRequest(request: HoloRequest): Promise<Partial<OpenAIChatRequest> | type.errors> {
        logger.debug('translating holo request to openai request', request);
        try {
            const result = await OpenAIRequestTranslator.fromHolo(request);
            return result;
        } catch (error) {
            logger.error('Error translating holo to openai request', error);
            return {}
        }
    }

    async toHoloChatRequest(request: OpenAIChatRequest): Promise<Partial<HoloRequest> | type.errors> {
        logger.debug('translating openai request to holo request', request);
        try {
            const result = await OpenAIRequestTranslator.toHolo(request);
            return result;
        } catch (error) {
            logger.error('Error translating openai to holo request', error);
            return {}
        }
    }

    fromOpenAIResponse(response: OpenAIResponse): HoloResponse | type.errors {
        logger.debug('translating openai response to holo response', response);
        // TODO: Implement response translation with new architecture
        throw new Error('Response translation not yet implemented with new architecture');
    }

    toOpenAIResponse(response: HoloResponse): OpenAIResponse | type.errors {
        logger.debug('translating holo response to openai response', response);
        // TODO: Implement response translation with new architecture
        throw new Error('Response translation not yet implemented with new architecture');
    }
}
