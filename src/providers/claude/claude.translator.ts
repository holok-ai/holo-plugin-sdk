import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator,} from "../types";
import logger from "../../utils/logger";
import {ClaudeMessageTranslator, ClaudeRequestTranslator} from "./translators";
import {ClaudeResponseTranslator} from "./translators/claude.response.translators";
import {ClaudeChatRequest, ClaudeRequestMessage, ClaudeResponse} from "./types";
import {HoloMessage, HoloRequest, HoloResponse} from "../holo";


@injectable()
export class ClaudeTranslator implements IProviderTranslator {
    constructor(
        private readonly requestTranslator: ClaudeRequestTranslator,
        private readonly messageTranslator: ClaudeMessageTranslator,
        private readonly responseTranslator: ClaudeResponseTranslator
    ) {
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        logger.debug('translating holo request to claude request', request);
        return this.requestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
        logger.debug('translating claude request to holo request', request);
        return this.requestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<ClaudeRequestMessage>[]> {
        return this.messageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: ClaudeRequestMessage[]): Promise<Partial<HoloMessage>[]> {
        return this.messageTranslator.toHoloArray(messages);
    }

    async toHoloResponse(message: ClaudeResponse): Promise<Partial<HoloResponse>> {
        return this.responseTranslator.toHolo(message);
    }
}
