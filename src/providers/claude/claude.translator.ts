import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClaudeChatRequest, ClaudeRequestMessage, HoloMessage, HoloRequest, IProviderTranslator,} from "../types";
import logger from "../../utils/logger";
import {ClaudeMessageTranslator, ClaudeRequestTranslator} from "./translators";


@injectable()
export class ClaudeTranslator implements IProviderTranslator {
    constructor() {
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        logger.debug('translating holo request to claude request', request);
        return ClaudeRequestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
        logger.debug('translating claude request to holo request', request);
        return ClaudeRequestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<ClaudeRequestMessage>[]> {
        return ClaudeMessageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: ClaudeRequestMessage[]): Promise<Partial<HoloMessage>[]> {
        return ClaudeMessageTranslator.toHoloArray(messages);
    }
}
