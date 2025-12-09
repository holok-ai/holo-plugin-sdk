import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator} from "../types";
import {
    OpenAIMessageTranslator,
    OpenAIRequestTranslator,
    OpenAIResponseTranslator,
    OpenAIStreamTranslator
} from "./translators";
import {OpenAIChatCompletionResponse, OpenAIChatRequest, OpenAIRequestMessage} from "./types";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "../holo";

@injectable()
export class OpenAITranslator implements IProviderTranslator {
    constructor(
        private readonly responseTranslator: OpenAIResponseTranslator,
        private readonly requestTranslator: OpenAIRequestTranslator,
        private readonly messageTranslator: OpenAIMessageTranslator,
        private readonly streamTranslator: OpenAIStreamTranslator
    ) {
    }

    async fromHoloResponse(response: HoloResponse): Promise<Partial<OpenAIChatCompletionResponse>> {
        return this.responseTranslator.fromHolo(response);
    }

    async toHoloResponse(response: OpenAIChatCompletionResponse): Promise<Partial<HoloResponse>> {
        return this.responseTranslator.toHolo(response);
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<OpenAIChatRequest>> {
        return this.requestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: OpenAIChatRequest): Promise<Partial<HoloRequest>> {
        return this.requestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<OpenAIRequestMessage>[]> {
        return this.messageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: OpenAIRequestMessage[]): Promise<Partial<HoloMessage>[]> {
        return this.messageTranslator.toHoloArray(messages);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown> {
        return this.streamTranslator.fromHoloManyArray(chunks);
    }
}
