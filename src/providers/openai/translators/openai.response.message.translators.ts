import 'reflect-metadata';
import {HoloMessage, HoloMessageValidator} from "../../holo";
import {OpenAIChatCompletionMessage} from "../types";
import {OpenAIChatCompletionMessageValidator} from "../validators";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class OpenAIResponseMessageTranslator extends BaseTranslator<HoloMessage, OpenAIChatCompletionMessage> {
    protected holoValidator = HoloMessageValidator;
    protected providerValidator = OpenAIChatCompletionMessageValidator;
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionMessage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<OpenAIChatCompletionMessage>> {
        if (source.role !== 'assistant') {
            return {};
        }

        let content: string | null = null;
        const tool_calls: OpenAIChatCompletionMessage["tool_calls"] = [];

        // Handle content
        if (typeof source.content === 'string') {
            content = source.content;
        } else if (Array.isArray(source.content)) {
            // For OpenAI responses, concatenate text content
            const textBlocks = source.content.filter(c => c.type === 'text');
            content = textBlocks.length > 0
                ? textBlocks.map(c => (c as any).text).join('\n')
                : '';
        }

        // Handle tool calls
        if (source.tool_calls?.length) {
            source.tool_calls.forEach(tc => {
                tool_calls.push({
                    id: tc.id || '',
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: JSON.stringify(tc.function.arguments || {})
                    }
                });
            });
        }

        return pickDefined({
            role: 'assistant',
            content: content || null,
            tool_calls: tool_calls.length ? tool_calls : null,
            // OpenAI-specific fields not provided from Holo
            refusal: null,
            function_call: null,
            audio: null,
        }) as Partial<OpenAIChatCompletionMessage>;
    }

    protected async toHoloImpl(source: OpenAIChatCompletionMessage): Promise<Partial<HoloMessage>> {
        const tool_calls: HoloMessage["tool_calls"] = [];

        // Handle tool calls
        if (source.tool_calls?.length) {
            source.tool_calls.forEach(tc => {
                tool_calls.push({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    }
                });
            });
        }

        // Handle content
        let content: HoloMessage['content'] = source.content || '';

        return pickDefined({
            role: 'assistant',
            content,
            tool_calls: tool_calls.length ? tool_calls : undefined
        }) as Partial<HoloMessage>;
    }
}
