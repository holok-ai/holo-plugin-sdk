import 'reflect-metadata';
import {injectable} from "tsyringe";
import type {IProviderTranslator} from "@holokai/types/provider";
import {
    OpenAIContentTranslator,
    OpenAIImageContentTranslator,
    OpenAIMessageTranslator,
    OpenAIRequestTranslator,
    OpenAIResponseMessageTranslator,
    OpenAIResponseTranslator,
    OpenAIStreamTranslator,
    OpenAITextContentTranslator,
    OpenAIToolChoiceTranslator,
    OpenAIToolTranslator,
    OpenAIUsageTranslator
} from "./translators";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/types/holo";
import {
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionMessageParam
} from "openai/resources/chat/completions/completions";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {
    OpenAIContentDeltaTranslator,
    OpenAIMessageDeltaTranslator,
    OpenAIMessageStartTranslator,
    OpenAIMessageStopTranslator
} from "./translators/streaming";

@injectable()
export class OpenAITranslator implements IProviderTranslator {
    constructor(
        private readonly responseTranslator: OpenAIResponseTranslator,
        private readonly requestTranslator: OpenAIRequestTranslator,
        private readonly messageTranslator: OpenAIMessageTranslator,
        private readonly streamTranslator: OpenAIStreamTranslator
    ) {
    }

    static instance(): IProviderTranslator {
        const textContentTranslator = new OpenAITextContentTranslator();
        const imageContentTranslator = new OpenAIImageContentTranslator();
        const contentTranslator = new OpenAIContentTranslator(textContentTranslator, imageContentTranslator);
        const messageTranslator = new OpenAIMessageTranslator(contentTranslator);

        const toolTranslator = new OpenAIToolTranslator();
        const toolChoiceTranslator = new OpenAIToolChoiceTranslator();
        const requestTranslator = new OpenAIRequestTranslator(messageTranslator, toolTranslator, toolChoiceTranslator);

        const usageTranslator = new OpenAIUsageTranslator();
        const responseMessageTranslator = new OpenAIResponseMessageTranslator();
        const responseTranslator = new OpenAIResponseTranslator(responseMessageTranslator, usageTranslator);

        const messageStartTranslator = new OpenAIMessageStartTranslator();
        const contentDeltaTranslator = new OpenAIContentDeltaTranslator();
        const messageDeltaTranslator = new OpenAIMessageDeltaTranslator();
        const messageStopTranslator = new OpenAIMessageStopTranslator();

        const streamTranslator = new OpenAIStreamTranslator(
            messageStartTranslator,
            contentDeltaTranslator,
            messageDeltaTranslator,
            messageStopTranslator
        );

        return new OpenAITranslator(
            responseTranslator,
            requestTranslator,
            messageTranslator,
            streamTranslator
        );
    }

    async fromHoloResponse(response: HoloResponse): Promise<Partial<ChatCompletion | ChatCompletionChunk>> {
        return this.responseTranslator.fromHolo(response);
    }

    async toHoloResponse(response: ChatCompletion | ChatCompletionChunk): Promise<Partial<HoloResponse>> {
        return this.responseTranslator.toHolo(response);
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<ChatCompletionCreateParamsBase>> {
        return this.requestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: ChatCompletionCreateParamsBase): Promise<Partial<HoloRequest>> {
        return this.requestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<ChatCompletionMessageParam>[]> {
        return this.messageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: ChatCompletionMessageParam[]): Promise<Partial<HoloMessage>[]> {
        return this.messageTranslator.toHoloArray(messages);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown> {
        return this.streamTranslator.fromHoloManyArray(chunks);
    }
}
