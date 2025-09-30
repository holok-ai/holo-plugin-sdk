import {
    ClaudeRawContentBlockDeltaEvent,
    ClaudeRawContentBlockStartEvent,
    ClaudeRawContentBlockStopEvent,
    ClaudeRawMessageDeltaEvent,
    ClaudeRawMessageStartEvent,
    ClaudeRawMessageStopEvent,
    ClaudeResponseMessage,
    ClaudeTextBlock,
    ClaudeTextDelta,
    ClaudeUsage
} from './types';
import {
    ClaudeRawContentBlockDeltaEventValidator,
    ClaudeRawContentBlockStartEventValidator,
    ClaudeRawContentBlockStopEventValidator,
    ClaudeRawMessageDeltaEventValidator,
    ClaudeRawMessageStartEventValidator,
    ClaudeRawMessageStopEventValidator,
    ClaudeResponseMessageValidator,
    ClaudeTextBlockValidator,
    ClaudeTextDeltaValidator,
    ClaudeUsageValidator
} from './validators';

export class ClaudeResponseFactory {
    static streamResponseMessage(text: string | string[] = '') {
        const messages = [];
        const responseMessage = this.createResponseMessage(text);

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

    static createResponseMessage(text: string | string[] = ''): ClaudeResponseMessage {
        return ClaudeResponseMessageValidator.assert({
            id: 'msg_placeholder_id',
            container: null,
            content: this.createTextMessages(text),
            model: '',
            role: 'assistant',
            stop_reason: null,
            stop_sequence: null,
            type: 'message',
            usage: this.createUsage()
        });
    }

    static createTextMessages(text: string | string[]): ClaudeTextBlock[] {
        if (Array.isArray(text)) {
            const results = text.map(t => this.createTextMessage(t))
            return results;
        }
        return [this.createTextMessage(text)];
    }

    static createTextMessage(text: string) {
        return ClaudeTextBlockValidator.assert({
            citations: [],
            type: 'text',
            text
        });
    }

    static createUsage(): ClaudeUsage {
        return ClaudeUsageValidator.assert({
            cache_creation: null,
            cache_creation_input_tokens: null,
            cache_read_input_tokens: null,
            input_tokens: 0,
            output_tokens: 0,
            server_tool_use: null,
            service_tier: null
        })
    }

    static createRawContentBlockStartEvent(text: string = '', index: number = 0): ClaudeRawContentBlockStartEvent {
        return ClaudeRawContentBlockStartEventValidator.assert({
            content_block: this.createTextMessage(text),
            index,
            type: 'content_block_start'
        });
    }

    static createRawContentBlockDeltaEvent(text: string = '', index: number = 0): ClaudeRawContentBlockDeltaEvent {
        return ClaudeRawContentBlockDeltaEventValidator.assert({
            delta: this.createTextDelta(text),
            index,
            type: 'content_block_delta'
        });
    }

    static createRawContentBlockStopEvent(index: number = 0): ClaudeRawContentBlockStopEvent {
        return ClaudeRawContentBlockStopEventValidator.assert({
            index,
            type: 'content_block_stop'
        });
    }

    static createTextDelta(text: string): ClaudeTextDelta {
        return ClaudeTextDeltaValidator.assert({
            text,
            type: 'text_delta'
        });
    }

    static createRawMessageStartEvent(message: ClaudeResponseMessage): ClaudeRawMessageStartEvent {
        return ClaudeRawMessageStartEventValidator.assert({
            message,
            type: 'message_start'
        });
    }

    static createRawMessageDeltaEvent(): ClaudeRawMessageDeltaEvent {
        return ClaudeRawMessageDeltaEventValidator.assert({
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

    static createRawMessageStopEvent(): ClaudeRawMessageStopEvent {
        return ClaudeRawMessageStopEventValidator.assert({
            type: 'message_stop'
        });
    }
}
