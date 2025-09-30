import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator} from "../types";
import {
    OpenAIMessageTranslator,
    OpenAIRequestTranslator,
    OpenAIResponseTranslator
} from "./translators";
import {OpenAIChatRequest, OpenAIRequestMessage, OpenAIResponse} from "./types";
import {HoloMessage, HoloRequest, HoloResponse} from "../holo";

@injectable()
export class OpenAITranslator implements IProviderTranslator {
    constructor(
        private readonly responseTranslator: OpenAIResponseTranslator,
        private readonly requestTranslator: OpenAIRequestTranslator,
        private readonly messageTranslator: OpenAIMessageTranslator
    ) {
    }

    async toHoloResponse(response: OpenAIResponse): Promise<Partial<HoloResponse>> {
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
}
