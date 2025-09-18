import {IProviderTranslator} from '../base.translator.interface';
import {ClaudeChatRequest, HoloRequest,} from "../types";
import logger from "../../utils/logger";
import {ClaudeRequestTranslator} from "./translators/claude.request.translators";


export class ClaudeTranslator implements IProviderTranslator {
    fromHoloChatRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        logger.debug('translating holo request to claude request', request);
        return ClaudeRequestTranslator.fromHolo(request) as ClaudeChatRequest;
    }

    toHoloChatRequest(request: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
        logger.debug('translating claude request to holo request', request);
        return ClaudeRequestTranslator.toHolo(request);
    }
}
