import 'reflect-metadata';
import {injectable} from "tsyringe";
import {HoloMessage, HoloRequest, IProviderTranslator, OllamaChatRequest, OllamaMessage} from "../types";
import {type} from "arktype";
import {OllamaRequestTranslator} from "./translators";
import {OllamaMessageTranslator} from "./translators/ollama.message.translators";

@injectable()
export class OllamaTranslator implements IProviderTranslator {
    constructor() {
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<OllamaChatRequest> | type.errors> {
        return OllamaRequestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: OllamaChatRequest): Promise<Partial<HoloRequest> | type.errors> {
        return OllamaRequestTranslator.toHolo(request);
    }

    fromHoloMessages(messages: HoloMessage[]): Promise<Partial<OllamaMessage>[]> {
        return OllamaMessageTranslator.fromHoloArray(messages);
    }

    toHoloMessages(messages: OllamaMessage[]): Promise<Partial<HoloMessage>[]> {
        return OllamaMessageTranslator.toHoloArray(messages);
    }

}
