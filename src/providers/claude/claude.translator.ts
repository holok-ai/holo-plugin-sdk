import {ClaudeChatRequest, HoloRequest,} from "../types";
import logger from "../../utils/logger";
import {ClaudeRequestTranslator} from "./translators";
import {IProviderTranslator} from "../types";


export class ClaudeTranslator implements IProviderTranslator {
    fromHoloChatRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        logger.debug('translating holo request to claude request', request);
        return ClaudeRequestTranslator.fromHolo(request);
    }

    toHoloChatRequest(request: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
        logger.debug('translating claude request to holo request', request);
        return ClaudeRequestTranslator.toHolo(request);
    }
}
