import 'reflect-metadata';
import {injectable} from "tsyringe";
import {IProviderTranslator, ProviderChatRequest, ProviderMessage, ProviderType} from "../types";
import {OpenAITranslator} from "../openai";
import {ClaudeTranslator} from "../claude";
import {OllamaTranslator} from "../ollama/ollama.translator";
import {ArkErrors} from "arktype";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "./index";

@injectable()
export class HoloTranslater {
    private translators = new Map<ProviderType, IProviderTranslator>();

    constructor(
        openAITranslator: OpenAITranslator,
        claudeTranslator: ClaudeTranslator,
        ollamaTranslator: OllamaTranslator
    ) {
        this.translators.set(ProviderType.OPENAI, openAITranslator);
        this.translators.set(ProviderType.CLAUDE, claudeTranslator);
        this.translators.set(ProviderType.PERPLEXITY, openAITranslator);
        this.translators.set(ProviderType.OLLAMA, ollamaTranslator);
    }

    getTranslator(providerType: ProviderType): IProviderTranslator {
        const provider = this.translators.get(providerType);
        if (!provider) {
            throw new Error(`No translator found for provider type: ${providerType}`);
        }
        return provider;
    }

    async fromHoloResponse(response: HoloResponse, to: ProviderType): Promise<unknown> {
        return this.getTranslator(to).fromHoloResponse(response);
    }

    async toHoloResponse(response: unknown, from: ProviderType): Promise<Partial<HoloResponse>> {
        return this.getTranslator(from).toHoloResponse(response as any);
    }

    async fromHoloRequest(request: HoloRequest, to: ProviderType): Promise<Partial<ProviderChatRequest> | ArkErrors> {
        return this.getTranslator(to).fromHoloRequest(request);
    }

    async toHoloRequest(request: ProviderChatRequest, from: ProviderType): Promise<Partial<HoloRequest> | ArkErrors> {
        return this.getTranslator(from).toHoloRequest(request);
    }

    async fromHoloMessages(messages: HoloMessage[], from: ProviderType) {
        return this.getTranslator(from).fromHoloMessages(messages);
    }

    async toHoloMessages(messages: ProviderMessage[], to: ProviderType) {
        return this.getTranslator(to).toHoloMessages(messages);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[], to: ProviderType): Promise<unknown> {
        return this.getTranslator(to).fromHoloStreamChunks(chunks);
    }
}
