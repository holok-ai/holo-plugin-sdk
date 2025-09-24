import 'reflect-metadata';
import {injectable} from "tsyringe";
import {HoloMessage, HoloRequest, IProviderTranslator, OpenAIChatRequest, OpenAIRequestMessage} from "../types";
import {type} from "arktype";
import {OpenAIMessageTranslator, OpenAIRequestTranslator} from "./translators";

@injectable()
export class OpenAITranslator implements IProviderTranslator {
    constructor() {
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<OpenAIChatRequest> | type.errors> {
        return OpenAIRequestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: OpenAIChatRequest): Promise<Partial<HoloRequest> | type.errors> {
        return OpenAIRequestTranslator.toHolo(request);
    }

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<OpenAIRequestMessage>[]> {
        return OpenAIMessageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: OpenAIRequestMessage[]): Promise<Partial<HoloMessage>[]> {
        return OpenAIMessageTranslator.toHoloArray(messages);
    }
}
