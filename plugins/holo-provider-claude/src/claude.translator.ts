import 'reflect-metadata';
import {injectable} from "tsyringe";
import {
    ClaudeContentBlockDeltaEventTranslator,
    ClaudeContentBlockStartEventTranslator,
    ClaudeContentBlockStopEventTranslator,
    ClaudeContentTranslator,
    ClaudeMessageDeltaEventTranslator,
    ClaudeMessageStartEventTranslator,
    ClaudeMessageStopEventTranslator,
    ClaudeMessageTranslator,
    ClaudeRequestTranslator,
    ClaudeResponseContentTranslator,
    ClaudeResponseMessageTranslator,
    ClaudeResponseTranslator,
    ClaudeStreamTranslator,
    ClaudeToolChoiceTranslator,
    ClaudeToolTranslator,
    ClaudeUsageTranslator
} from "./translators";
import {ClaudeChatRequest, ClaudeRequestMessage, ClaudeResponse} from "./types";
import {IProviderTranslator} from "@holokai/sdk/provider";
import {ClassLogger, HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/sdk";


@injectable()
export class ClaudeTranslator extends ClassLogger implements IProviderTranslator {
    constructor(
        private readonly requestTranslator: ClaudeRequestTranslator,
        private readonly messageTranslator: ClaudeMessageTranslator,
        private readonly responseTranslator: ClaudeResponseTranslator,
        private readonly streamTranslator: ClaudeStreamTranslator
    ) {
        super();
    }

    static instance(): IProviderTranslator {
        const contentTranslator = new ClaudeContentTranslator();
        const toolTranslator = new ClaudeToolTranslator();
        const toolChoiceTranslator = new ClaudeToolChoiceTranslator();
        const messageTranslator = new ClaudeMessageTranslator(contentTranslator);
        const requestTranslator = new ClaudeRequestTranslator(messageTranslator, toolTranslator, toolChoiceTranslator);

        const responseContentTranslator = new ClaudeResponseContentTranslator();
        const usageTranslator = new ClaudeUsageTranslator();
        const responseMessageTranslator = new ClaudeResponseMessageTranslator(responseContentTranslator);
        const responseTranslator = new ClaudeResponseTranslator(responseMessageTranslator, usageTranslator);

        const messageStartTranslator = new ClaudeMessageStartEventTranslator(usageTranslator);
        const messageDeltaTranslator = new ClaudeMessageDeltaEventTranslator();
        const messageStopTranslator = new ClaudeMessageStopEventTranslator();
        const contentBlockStartTranslator = new ClaudeContentBlockStartEventTranslator();
        const contentBlockDeltaTranslator = new ClaudeContentBlockDeltaEventTranslator();
        const contentBlockStopTranslator = new ClaudeContentBlockStopEventTranslator();

        const streamTranslator = new ClaudeStreamTranslator(
            messageStartTranslator,
            messageDeltaTranslator,
            messageStopTranslator,
            contentBlockStartTranslator,
            contentBlockDeltaTranslator,
            contentBlockStopTranslator
        );

        return new ClaudeTranslator(
            requestTranslator,
            messageTranslator,
            responseTranslator,
            streamTranslator
        );
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
