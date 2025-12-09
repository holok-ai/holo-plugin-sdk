import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {v4 as uuidv4} from 'uuid';
import {OpenAIChatCompletionChunk} from '../../types';
import {pickDefined} from '../../../../utils';
import {safeParse} from '../../../utils/safe.parse';
import {BaseStreamTranslator} from "@holokai/sdk/provider";
import {HoloStreamChunk} from "@holokai/sdk";

@injectable()
export class OpenAIMessageDeltaTranslator extends BaseStreamTranslator<HoloStreamChunk, OpenAIChatCompletionChunk> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionChunk> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: OpenAIChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // Process tool calls - emit one Holo chunk per tool_call delta for clean indexing
        for (const choice of source.choices) {
            const toolCalls = choice.delta?.tool_calls ?? [];
            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                for (const tc of toolCalls) {
                    const rawArgs = tc.function?.arguments;
                    const parsedArgs = safeParse(rawArgs);
                    const toolCallIndex = tc.index ?? 0;

                    // Emit shell when partial JSON; full tool_calls when complete
                    const isPartialJson = rawArgs && Object.keys(parsedArgs).length === 0;

                    results.push(pickDefined({
                        id: source.id,
                        model: source.model,
                        created: source.created * 1000, // sec -> ms
                        delta: {
                            provider: ProviderType.OPENAI,
                            type: 'message_delta' as const,
                            choice: choice.index,
                            index: toolCallIndex,
                            delta: isPartialJson
                                ? {} // Partial fragment → no Holo tool_calls yet
                                : {
                                    tool_calls: [pickDefined({
                                        id: tc.id,
                                        type: tc.type || 'function' as const,
                                        function: pickDefined({
                                            name: tc.function?.name,
                                            arguments: parsedArgs
                                        })
                                    })]
                                },
                            // Store full source chunk for lossless round-trips
                            provider_delta: source
                        }
                    }) as Partial<HoloStreamChunk>);
                }
            }
        }

        // Handle usage data (usually in final chunk)
        if (source.usage) {
            const usage = pickDefined({
                input_tokens: source.usage.prompt_tokens,
                output_tokens: source.usage.completion_tokens,
                total_tokens: source.usage.total_tokens
            });

            if (Object.keys(usage).length > 0) {
                results.push(pickDefined({
                    id: source.id,
                    model: source.model,
                    created: source.created * 1000,
                    delta: {
                        provider: ProviderType.OPENAI,
                        type: 'message_delta' as const,
                        // Omit choice - usage applies to entire completion
                        delta: {},
                        usage: usage,
                        provider_delta: source
                    }
                }) as Partial<HoloStreamChunk>);
            }
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<OpenAIChatCompletionChunk>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_delta') return [];

        // Fast pass-through for OpenAI→OpenAI streaming
        if (d.provider === 'OPENAI' && d.provider_delta) {
            return [d.provider_delta];
        }

        const results: Partial<OpenAIChatCompletionChunk>[] = [];
        const createdSec = source.created
            ? Math.floor(source.created / 1000) // ms -> sec
            : Math.floor(Date.now() / 1000);

        // Handle tool calls
        const toolCalls = d.delta?.tool_calls;
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            results.push(pickDefined({
                id: source.id || this.providerDefaults.id || uuidv4(),
                object: 'chat.completion.chunk' as const,
                created: createdSec,
                model: source.model || this.providerDefaults.model,
                choices: [{
                    index: d.choice ?? 0,
                    delta: {
                        tool_calls: toolCalls.map((tc, i: number) => pickDefined({
                            index: d.index ?? i, // Use provided index or fallback to array index
                            id: tc.id,
                            type: tc.type || 'function' as const,
                            function: tc.function ? pickDefined({
                                name: tc.function.name,
                                arguments: typeof tc.function.arguments === 'object'
                                    ? JSON.stringify(tc.function.arguments)
                                    : tc.function.arguments
                            }) : undefined
                        }))
                    },
                    finish_reason: null
                }]
            }) as Partial<OpenAIChatCompletionChunk>);
        }

        // Handle usage
        if (d.usage) {
            const totalTokens = d.usage.total_tokens
                || (d.usage.input_tokens && d.usage.output_tokens
                    ? d.usage.input_tokens + d.usage.output_tokens
                    : undefined);

            results.push(pickDefined({
                id: source.id || this.providerDefaults.id || uuidv4(),
                object: 'chat.completion.chunk' as const,
                created: createdSec,
                model: source.model || this.providerDefaults.model,
                choices: [], // Empty choices for usage-only chunk (valid per OpenAI)
                usage: pickDefined({
                    prompt_tokens: d.usage.input_tokens,
                    completion_tokens: d.usage.output_tokens,
                    total_tokens: totalTokens
                })
            }) as Partial<OpenAIChatCompletionChunk>);
        }

        return results;
    }
}
