import {pickDefined} from '@holokai/sdk';
import type {IResponseFactory} from '@holokai/types/provider';
import type {HoloErrorCode} from '@holokai/types/holo';
import {ErrorResponse} from '@anthropic-ai/sdk/resources/shared';
import {
    Message,
    RawContentBlockDeltaEvent,
    RawContentBlockStartEvent,
    RawContentBlockStopEvent,
    RawMessageDeltaEvent,
    RawMessageStartEvent,
    RawMessageStopEvent,
    TextBlock,
    TextDelta,
    Usage
} from "@anthropic-ai/sdk/resources/messages/messages";

export type ClaudeResponseTypes =
    'timeout_error'
    | 'invalid_request_error'
    | 'not_found_error'
    | 'overloaded_error'
    | 'permission_error'
    | 'rate_limit_error'
    | 'authentication_error'
    | 'billing_error'
    | 'api_error';

export class ClaudeResponseFactory implements IResponseFactory {

    static streamResponseMessage(text: string | string[] = '') {
        const messages = [];
        const responseMessage = this.createResponseMessage(text) as Message;

        // Start with message_start event
        messages.push(this.createRawMessageStartEvent(responseMessage));

        // Add content_block_start event
        messages.push(this.createRawContentBlockStartEvent(''));

        // Add content deltas for each text block
        if (Array.isArray(text)) {
            text.forEach(t => {
                messages.push(this.createRawContentBlockDeltaEvent(t));
            });
        } else {
            messages.push(this.createRawContentBlockDeltaEvent(text));
        }

        // End with content_block_stop
        messages.push(this.createRawContentBlockStopEvent());

        // Add message_delta and message_stop
        messages.push(this.createRawMessageDeltaEvent());
        messages.push(this.createRawMessageStopEvent());

        return messages;
    }

    static createResponseMessage(text: string | string[] = ''): Partial<Message> {
        return pickDefined({
            id: 'msg_placeholder_id',
            container: null,
            content: this.createTextMessages(text) as TextBlock[],
            context_management: null,
            model: '',
            role: 'assistant',
            stop_reason: null,
            stop_sequence: null,
            type: 'message',
            usage: this.createUsage() as Usage
        });
    }

    static createTextMessages(text: string | string[]): Partial<TextBlock>[] {
        if (Array.isArray(text)) {
            return text.map(t => this.createTextMessage(t));
        }
        return [this.createTextMessage(text)];
    }

    static createTextMessage(text: string): Partial<TextBlock> {
        return pickDefined({
            citations: [],
            type: 'text',
            text
        });
    }

    static createUsage(): Partial<Usage> {
        return pickDefined({
            cache_creation: null,
            cache_creation_input_tokens: null,
            cache_read_input_tokens: null,
            input_tokens: 0,
            output_tokens: 0,
            server_tool_use: null,
            service_tier: null
        })
    }

    static createRawContentBlockStartEvent(text: string = '', index: number = 0): Partial<RawContentBlockStartEvent> {
        return pickDefined({
            content_block: this.createTextMessage(text) as TextBlock,
            index,
            type: 'content_block_start'
        });
    }

    static createRawContentBlockDeltaEvent(text: string = '', index: number = 0): Partial<RawContentBlockDeltaEvent> {
        return pickDefined({
            delta: this.createTextDelta(text) as TextDelta,
            index,
            type: 'content_block_delta'
        });
    }

    static createRawContentBlockStopEvent(index: number = 0): Partial<RawContentBlockStopEvent> {
        return pickDefined({
            index,
            type: 'content_block_stop'
        });
    }

    static createTextDelta(text: string): Partial<TextDelta> {
        return pickDefined({
            text,
            type: 'text_delta'
        });
    }

    static createRawMessageStartEvent(message: Message): Partial<RawMessageStartEvent> {
        return pickDefined({
            message,
            type: 'message_start'
        });
    }

    static createRawMessageDeltaEvent(): Partial<RawMessageDeltaEvent> {
        return pickDefined({
            delta: {
                container: null,
                stop_reason: 'end_turn',
                stop_sequence: null
            },
            type: 'message_delta',
            usage: {
                cache_creation_input_tokens: null,
                cache_read_input_tokens: null,
                input_tokens: null,
                output_tokens: 1,
                server_tool_use: null
            }
        });
    }

    static createRawMessageStopEvent(): Partial<RawMessageStopEvent> {
        return pickDefined({
            type: 'message_stop'
        });
    }

    static instance(): ClaudeResponseFactory {
        return new ClaudeResponseFactory();
    }

    mapHoloCode(code: HoloErrorCode): ClaudeResponseTypes {
        switch (code) {
            case 'guard_failure':
                return 'invalid_request_error';
        }
    }

    createError(message: string, code: HoloErrorCode): ErrorResponse {
        return {
            request_id: null,
            type: 'error',
            error: {
                type: this.mapHoloCode(code),
                message
            }
        };
    }
}
