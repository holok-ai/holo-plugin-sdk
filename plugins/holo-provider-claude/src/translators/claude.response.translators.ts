import 'reflect-metadata';
import {ClaudeUsageTranslator} from "./claude.usage.translators";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloFinishReason, HoloMessage, HoloResponse} from "@holokai/types/holo";
import {Message, RawMessageStreamEvent} from "@anthropic-ai/sdk/resources/messages/messages";
import {ClaudeResponseMessageTranslator} from "./claude.response.message.translators";

@injectable()
export class ClaudeResponseTranslator extends BaseTranslator<HoloResponse, RawMessageStreamEvent | Message> {
    protected holoDefaults: Partial<HoloResponse> = {};
    protected providerDefaults: Partial<RawMessageStreamEvent | Message> = {};

    constructor(
        private readonly responseMessageTranslator: ClaudeResponseMessageTranslator,
        private readonly usageTranslator: ClaudeUsageTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloResponse): Promise<Partial<RawMessageStreamEvent | Message>> {
        // For Claude, we primarily work with the full response message format
        // Streaming events are handled separately in streaming contexts
        const messageResult = source.messages?.length
            ? await this.responseMessageTranslator.fromHolo(source.messages[0])
            : {
                role: 'assistant' as const,
                content: [{type: 'text', text: ''}]
            };

        const usageResult = source.usage
            ? await this.usageTranslator.fromHolo(source.usage)
            : undefined;

        return pickDefined({
            id: source.id,
            model: source.model,
            type: 'message' as const,
            stop_reason: this.mapFinishReasonFromHolo(source.finish_reason) || null,
            usage: usageResult,
            ...messageResult
        }) as Partial<Message>;
    }

    protected async toHoloImpl(source: RawMessageStreamEvent | Message): Promise<Partial<HoloResponse>> {
        // Handle streaming events vs full response messages
        if ('type' in source && source.type === 'message') {
            // Full response message
            const responseMessage = source as Message;

            // Convert Claude response message back to Holo message using message translator
            const holoMessage = await this.responseMessageTranslator.toHolo(responseMessage);
            const messages = Object.keys(holoMessage).length ? [holoMessage as HoloMessage] : [];

            // Convert usage back to Holo if present
            const usage = responseMessage.usage
                ? await this.usageTranslator.toHolo(responseMessage.usage)
                : undefined;

            return pickDefined({
                id: responseMessage.id,
                model: responseMessage.model,
                messages,
                finish_reason: this.mapFinishReasonToHolo(responseMessage.stop_reason as string),
                usage
            }) as Partial<HoloResponse>;
        } else {
            // Streaming event - for now, return minimal response
            // Streaming events are typically handled in streaming contexts
            return {};
        }
    }

    private mapFinishReasonFromHolo(reason?: HoloFinishReason | null): Message["stop_reason"] | undefined {
        switch (reason) {
            case 'stop':
                return 'end_turn';
            case 'length':
                return 'max_tokens';
            case 'tool_calls':
            case 'function_call':
                return 'tool_use';
            case 'content_filter':
                return 'refusal';
            default:
                return undefined;
        }
    }

    private mapFinishReasonToHolo(reason?: string): HoloFinishReason | null {
        switch (reason) {
            case 'end_turn':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'tool_use':
                return 'tool_calls';
            case 'refusal':
                return 'content_filter';
            default:
                return null;
        }
    }
}
