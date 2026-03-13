import 'reflect-metadata';
import {injectable} from "tsyringe";
import {
    GeminiContentTranslator,
    GeminiContentDeltaTranslator,
    GeminiMessageDeltaTranslator,
    GeminiMessageStartTranslator,
    GeminiMessageStopTranslator,
    GeminiMessageTranslator,
    GeminiRequestTranslator,
    GeminiResponseContentTranslator,
    GeminiResponseMessageTranslator,
    GeminiResponseTranslator,
    GeminiStreamTranslator,
    GeminiToolChoiceTranslator,
    GeminiToolTranslator,
    GeminiUsageTranslator
} from "./translators";
import type {IProviderTranslator} from "@holokai/types/provider";
import {ClassLogger} from "@holokai/sdk";
import type {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/types/holo";
import type {Content, GenerateContentConfig, GenerateContentResponse} from "@google/genai";

interface GeminiRequest {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
}

@injectable()
export class GeminiTranslator extends ClassLogger implements IProviderTranslator {
    constructor(
        private readonly requestTranslator: GeminiRequestTranslator,
        private readonly messageTranslator: GeminiMessageTranslator,
        private readonly responseTranslator: GeminiResponseTranslator,
        private readonly streamTranslator: GeminiStreamTranslator
    ) {
        super();
    }

    static instance(): IProviderTranslator {
        const contentTranslator = new GeminiContentTranslator();
        const toolTranslator = new GeminiToolTranslator();
        const toolChoiceTranslator = new GeminiToolChoiceTranslator();
        const messageTranslator = new GeminiMessageTranslator(contentTranslator);
        const requestTranslator = new GeminiRequestTranslator(messageTranslator, toolTranslator, toolChoiceTranslator);

        const responseContentTranslator = new GeminiResponseContentTranslator();
        const usageTranslator = new GeminiUsageTranslator();
        const responseMessageTranslator = new GeminiResponseMessageTranslator(responseContentTranslator);
        const responseTranslator = new GeminiResponseTranslator(responseMessageTranslator, usageTranslator);

        const messageStartTranslator = new GeminiMessageStartTranslator(usageTranslator);
        const messageDeltaTranslator = new GeminiMessageDeltaTranslator(usageTranslator);
        const messageStopTranslator = new GeminiMessageStopTranslator();
        const contentDeltaTranslator = new GeminiContentDeltaTranslator();

        const streamTranslator = new GeminiStreamTranslator(
            messageStartTranslator,
            messageDeltaTranslator,
            messageStopTranslator,
            contentDeltaTranslator
        );

        return new GeminiTranslator(
            requestTranslator,
            messageTranslator,
            responseTranslator,
            streamTranslator
        );
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<GeminiRequest>> {
        return this.requestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: GeminiRequest): Promise<Partial<HoloRequest>> {
        return this.requestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<Content>[]> {
        return this.messageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: Content[]): Promise<Partial<HoloMessage>[]> {
        return this.messageTranslator.toHoloArray(messages);
    }

    async fromHoloResponse(message: HoloResponse): Promise<Partial<GenerateContentResponse>> {
        return this.responseTranslator.fromHolo(message);
    }

    async toHoloResponse(message: GenerateContentResponse): Promise<Partial<HoloResponse>> {
        return this.responseTranslator.toHolo(message);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown> {
        return this.streamTranslator.fromHoloManyArray(chunks);
    }
}
