import 'reflect-metadata';
import {injectable} from "tsyringe";
import {
    ClaudeMessageTranslator,
    ClaudeRequestTranslator,
    ClaudeResponseTranslator,
    ClaudeStreamTranslator
} from "./translators";
import {ClaudeChatRequest, ClaudeRequestMessage, ClaudeResponse} from "./types";
import {IProviderTranslator} from "@holokai/sdk/provider";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/sdk";


@injectable()
export class ClaudeTranslator implements IProviderTranslator {
    constructor(
        private readonly requestTranslator: ClaudeRequestTranslator,
        private readonly messageTranslator: ClaudeMessageTranslator,
        private readonly responseTranslator: ClaudeResponseTranslator,
        private readonly streamTranslator: ClaudeStreamTranslator
    ) {
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        return this.requestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
        return this.requestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<ClaudeRequestMessage>[]> {
        return this.messageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: ClaudeRequestMessage[]): Promise<Partial<HoloMessage>[]> {
        return this.messageTranslator.toHoloArray(messages);
    }

    async fromHoloResponse(message: HoloResponse): Promise<Partial<ClaudeResponse>> {
        return this.responseTranslator.fromHolo(message);
    }

    async toHoloResponse(message: ClaudeResponse): Promise<Partial<HoloResponse>> {
        return this.responseTranslator.toHolo(message);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown> {
        return this.streamTranslator.fromHoloManyArray(chunks);
    }
}
