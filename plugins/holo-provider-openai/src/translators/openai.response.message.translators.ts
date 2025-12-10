import 'reflect-metadata';
import {OpenAIChatCompletionMessage} from "../types";
import {injectable} from 'tsyringe';
import {createStableId, HoloContent, HoloMessage, pickDefined, safeParse} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class OpenAIResponseMessageTranslator extends BaseTranslator<HoloMessage, OpenAIChatCompletionMessage> {
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionMessage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<OpenAIChatCompletionMessage>> {
        if (source.role !== 'assistant') return {};

        // Gather text content (if any)
        let text: string | undefined;
        if (typeof source.content === 'string') {
            const t = source.content.trim();
            text = t.length ? t : undefined;
        } else if (Array.isArray(source.content)) {
            const joined = (source.content as HoloContent[])
                .filter(c => c.type === 'text')
                .map(c => c.text)
                .join('\n')
                .trim();
            text = joined.length ? joined : undefined;
        }

        // Tool calls
        const tool_calls = source.tool_calls?.length
            ? source.tool_calls.map((tc, i) => ({
                id: tc.id ?? createStableId(`fn:${tc.function.name}#${i}`, tc.function.arguments),
                type: 'function' as const,
                function: {
                    name: tc.function.name,
                    arguments: JSON.stringify(tc.function.arguments ?? {})
                }
            }))
            : undefined;

        // If there are tool calls but no text, set content=null (common OpenAI shape)
        const content: string | null = text ?? (tool_calls ? null : '');

        return pickDefined({
            role: 'assistant',
            content,
            tool_calls
        }) as Partial<OpenAIChatCompletionMessage>;
    }

    protected async toHoloImpl(source: OpenAIChatCompletionMessage): Promise<Partial<HoloMessage>> {
        // Collect tool calls from either modern tool_calls[] or legacy function_call
        const tool_calls: HoloMessage["tool_calls"] = [];

        if (Array.isArray(source.tool_calls) && source.tool_calls.length) {
            for (const tc of source.tool_calls) {
                // Handle union type: only process function tool calls
                if (tc.type === 'function') {
                    tool_calls.push({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: safeParse(tc.function.arguments)
                        }
                    });
                }
                // Skip custom tool calls (not supported in Holo)
            }
        } else if (source.function_call) {
            // Legacy pathway — keep stable id consistent with other path
            tool_calls.push({
                id: createStableId(`fn:${source.function_call.name}`, safeParse(source.function_call.arguments)),
                type: 'function',
                function: {
                    name: source.function_call.name,
                    arguments: safeParse(source.function_call.arguments)
                }
            });
        }

        // Content: OpenAI sends string|null; map null -> ''
        const content: HoloMessage['content'] = source.content ?? '';

        return pickDefined({
            role: 'assistant',
            content,
            tool_calls: tool_calls.length ? tool_calls : undefined
        }) as Partial<HoloMessage>;
    }
}
