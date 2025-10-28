import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator, RequestType} from "../types";
import {ArkErrors, type} from "arktype";
import {
    OllamaChatRequestTranslator,
    OllamaGenerateRequestTranslator,
    OllamaMessageTranslator,
    OllamaChatResponseTranslator,
    OllamaGenerateResponseTranslator,
    OllamaStreamTranslator
} from "./translators";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "../holo";
import {OllamaChatRequest, OllamaChatResponse, OllamaGenerateRequest, OllamaGenerateResponse, OllamaMessage, OllamaResponse} from "./types";
import {ClassLogger} from '../../types/class.logger';
import {OllamaChatResponseValidator, OllamaGenerateRequestValidator} from "./validators";

@injectable()
export class OllamaTranslator extends ClassLogger implements IProviderTranslator {
    constructor(
        private ollamaGenerateRequestTranslator: OllamaGenerateRequestTranslator,
        private ollamaChatRequestTranslator: OllamaChatRequestTranslator,
        private ollamaMessageTranslator: OllamaMessageTranslator,
        private ollamaChatResponseTranslator: OllamaChatResponseTranslator,
        private ollamaGenerateResponseTranslator: OllamaGenerateResponseTranslator,
        private ollamaStreamTranslator: OllamaStreamTranslator
    ) {
        super();
    }

    async fromHoloResponse(response: HoloResponse): Promise<Partial<OllamaResponse>> {
        // Default to Chat response
        return this.ollamaChatResponseTranslator.fromHolo(response);
    }

    async toHoloResponse(response: OllamaResponse): Promise<Partial<HoloResponse>> {
        // Check if it's a Generate response (has 'response' field) or Chat response (has 'message' field)
        if (OllamaChatResponseValidator(response) instanceof ArkErrors) {
            return this.ollamaGenerateResponseTranslator.toHolo(response as OllamaGenerateResponse);
        } else {
            return this.ollamaChatResponseTranslator.toHolo(response as OllamaChatResponse);
        }
    }

    async fromHoloRequest(request: HoloRequest): Promise<Partial<OllamaChatRequest> | type.errors> {
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

    async fromHoloMessages(messages: HoloMessage[]): Promise<Partial<OllamaMessage>[]> {
        return this.ollamaMessageTranslator.fromHoloArray(messages);
    }

    async toHoloMessages(messages: OllamaMessage[]): Promise<Partial<HoloMessage>[]> {
        return this.ollamaMessageTranslator.toHoloArray(messages);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown> {
        return this.ollamaStreamTranslator.fromHoloManyArray(chunks);
    }
}
