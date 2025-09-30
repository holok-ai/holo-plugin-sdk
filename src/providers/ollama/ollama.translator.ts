import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator, ProviderResponse, RequestType} from "../types";
import {ArkErrors, type} from "arktype";
import {OllamaChatRequestTranslator, OllamaGenerateRequestTranslator} from "./translators";
import {OllamaMessageTranslator} from "./translators/ollama.message.translators";
import {HoloMessage, HoloRequest, HoloResponse} from "../holo";
import {OllamaChatRequest, OllamaGenerateRequest, OllamaMessage} from "./types";
import {ClassLogger} from '../../types/class.logger';
import {OllamaGenerateRequestValidator} from "./validators";

@injectable()
export class OllamaTranslator extends ClassLogger implements IProviderTranslator {
    constructor(
        private ollamaGenerateRequestTranslator: OllamaGenerateRequestTranslator,
        private ollamaChatRequestTranslator: OllamaChatRequestTranslator,
        private ollamaMessageTranslator: OllamaMessageTranslator,
    ) {
        super();
    }

    toHoloResponse(_response: ProviderResponse): Promise<Partial<HoloResponse>> {
        throw new Error('Method not implemented.');
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<OllamaChatRequest> | type.errors> {
        this.log.info(request.request_type)
        if (request.request_type === RequestType.GENERATE) {
            return this.ollamaGenerateRequestTranslator.fromHolo(request);
        }
        return this.ollamaChatRequestTranslator.fromHolo(request);
    }

    async toHoloRequest(request: OllamaChatRequest | OllamaGenerateRequest): Promise<Partial<HoloRequest> | type.errors> {
        if (!(OllamaGenerateRequestValidator(request) instanceof ArkErrors)) {
            return this.ollamaGenerateRequestTranslator.toHolo(request as OllamaGenerateRequest);
        }
        return this.ollamaChatRequestTranslator.toHolo(request);
    }

    fromHoloMessages(messages: HoloMessage[]): Promise<Partial<OllamaMessage>[]> {
        return this.ollamaMessageTranslator.fromHoloArray(messages);
    }

    toHoloMessages(messages: OllamaMessage[]): Promise<Partial<HoloMessage>[]> {
        return this.ollamaMessageTranslator.toHoloArray(messages);
    }

}
