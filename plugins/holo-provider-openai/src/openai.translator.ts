import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator} from "@holokai/sdk/provider";
import {
    OpenAIMessageTranslator,
    OpenAIRequestTranslator,
    OpenAIResponseTranslator,
    OpenAIStreamTranslator
} from "./translators";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/sdk";
import {
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionMessageParam
} from "openai/resources/chat/completions/completions";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";

@injectable()
export class OpenAITranslator implements IProviderTranslator {
    constructor(
        private readonly responseTranslator: OpenAIResponseTranslator,
        private readonly requestTranslator: OpenAIRequestTranslator,
        private readonly messageTranslator: OpenAIMessageTranslator,
        private readonly streamTranslator: OpenAIStreamTranslator
    ) {
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
