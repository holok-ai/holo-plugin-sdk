import 'reflect-metadata';
import {injectable} from "tsyringe";
import {
    HoloMessage,
    HoloRequest,
    IProviderTranslator,
    ProviderChatRequest,
    ProviderMessage,
    ProviderType
} from "./types";
import {OpenAITranslator} from "./openai";
import {ClaudeTranslator} from "./claude";
import {OllamaTranslator} from "./ollama/ollama.translator";
import {ArkErrors} from "arktype";

export * from './claude/claude.translator';


@injectable()
export class HoloTranslater {
    private translators = new Map<ProviderType, IProviderTranslator>();

    constructor(
        openAITranslator: OpenAITranslator,
        claudeTranslator: ClaudeTranslator,
        ollamaTranslator: OllamaTranslator,
    ) {
        this.translators.set(ProviderType.OPENAI, openAITranslator);
        this.translators.set(ProviderType.CLAUDE, claudeTranslator);
        this.translators.set(ProviderType.ANTHROPIC, claudeTranslator);
        this.translators.set(ProviderType.PERPLEXITY, openAITranslator);
        this.translators.set(ProviderType.OLLAMA, ollamaTranslator);
    }

    async getTranslator(providerType: ProviderType): Promise<IProviderTranslator> {
        const provider = this.translators.get(providerType);
        if (!provider) {
            throw new Error(`No translator found for provider type: ${providerType}`);
        }
        return provider;
    }

    async fromHoloRequest(request: HoloRequest, to: ProviderType): Promise<Partial<ProviderChatRequest> | ArkErrors> {
        const translator = await this.getTranslator(to);
        return translator.fromHoloRequest(request);
    }

    async toHoloRequest(request: ProviderChatRequest, from: ProviderType): Promise<Partial<HoloRequest> | ArkErrors> {
        const translator = await this.getTranslator(from);
        return translator.toHoloRequest(request);
    }

    async fromHoloMessages(messages: HoloMessage[], from: ProviderType) {
        const translator = await this.getTranslator(from);
        return translator.fromHoloMessages(messages);
    }

    async toHoloMessages(messages: ProviderMessage[], to: ProviderType) {
        const translator = await this.getTranslator(to);
        return translator.toHoloMessages(messages);
    }
}
