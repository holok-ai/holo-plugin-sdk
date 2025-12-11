import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {OpenAIChatCompletionChunk} from '../../types';
import {OpenAIMessageStartTranslator} from './openai.message.start.translator';
import {OpenAIContentDeltaTranslator} from './openai.content.delta.translator';
import {OpenAIMessageDeltaTranslator} from './openai.message.delta.translator';
import {OpenAIMessageStopTranslator} from './openai.message.stop.translator';
import {HoloStreamChunk} from "@holokai/sdk";
import {StreamTranslator} from "@holokai/sdk/provider";

@injectable()
export class OpenAIStreamTranslator extends StreamTranslator<HoloStreamChunk, OpenAIChatCompletionChunk> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionChunk> = {};

    constructor(
        private readonly messageStartTranslator: OpenAIMessageStartTranslator,
        private readonly contentDeltaTranslator: OpenAIContentDeltaTranslator,
        private readonly messageDeltaTranslator: OpenAIMessageDeltaTranslator,
        private readonly messageStopTranslator: OpenAIMessageStopTranslator
    ) {
        super();
    }

    protected async toHoloManyImpl(source: OpenAIChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // 1. Check for message_start (first chunk with role)
        const hasRole = source.choices.some(c => c.delta?.role);
        if (hasRole) {
            results.push(...await this.messageStartTranslator.toHoloMany(source));
        }

        // 2. Check for content deltas
        const hasContent = source.choices.some(c => c.delta?.content);
        if (hasContent) {
            results.push(...await this.contentDeltaTranslator.toHoloMany(source));
        }

        // 3. Check for tool calls or usage (both go through message_delta)
        const hasToolCalls = source.choices.some(c => c.delta?.tool_calls);
        if (hasToolCalls || source.usage) {
            results.push(...await this.messageDeltaTranslator.toHoloMany(source));
        }

        // 4. Check for finish_reason
        const hasFinishReason = source.choices.some(c => c.finish_reason);
        if (hasFinishReason) {
            results.push(...await this.messageStopTranslator.toHoloMany(source));
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<OpenAIChatCompletionChunk>[]> {
        const d = source.delta;
        if (!d) return [];

        // Fast pass-through for OpenAI→OpenAI streaming
        if (d.provider === 'openai' && d.provider_delta) {
            return [d.provider_delta];
        }

        // Route based on delta type
        switch (d.type) {
            case 'message_start':
                return this.messageStartTranslator.fromHoloMany(source);

            case 'content_delta':
                return this.contentDeltaTranslator.fromHoloMany(source);

            case 'message_delta':
                return this.messageDeltaTranslator.fromHoloMany(source);

            case 'message_stop':
                return this.messageStopTranslator.fromHoloMany(source);

            default:
                return [];
        }
    }
}
