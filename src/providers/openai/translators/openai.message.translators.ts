import 'reflect-metadata';
import {OpenAIContentTranslator} from "./openai.content.translators";
import {HoloMessage, HoloMessageValidator} from "../../holo";
import {OpenAIRequestMessage} from "../types";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";
import {OpenAIRequestMessageValidator} from "../validators";
import {createStableId} from "../../utils/stable-id";
import {safeParse} from "../../utils/safe.parse";

@injectable()
export class OpenAIMessageTranslator extends BaseTranslator<HoloMessage, OpenAIRequestMessage> {
    protected holoValidator = HoloMessageValidator;
    protected providerValidator = OpenAIRequestMessageValidator;
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<OpenAIRequestMessage> = {};

    constructor(private readonly contentTranslator: OpenAIContentTranslator) {
        super();
    }

    public async flattenText(parts: OpenAIRequestMessage["content"]): Promise<string> {
        if (!Array.isArray(parts)) return typeof parts === 'string' ? parts : '';
        const holoBlocks = await this.contentTranslator.toHoloArray(parts as any[]);
        return holoBlocks.filter(b => (b as any).type === 'text').map(b => (b as any).text).join('\n');
    }

    protected async fromHoloImpl(holoMessage: HoloMessage): Promise<Partial<OpenAIRequestMessage>> {
        let content: OpenAIRequestMessage["content"] | undefined;

        if (typeof holoMessage.content === 'string') {
            content = holoMessage.content;
        } else if (Array.isArray(holoMessage.content)) {
            const parts = await this.contentTranslator.fromHoloArray(holoMessage.content);
            content = parts.length > 0 ? parts : undefined; // keep undefined if empty
        }

        switch (holoMessage.role) {
            case 'assistant': {
                const tool_calls =
                    holoMessage.tool_calls?.map((tc, i) => ({
                        id: tc.id ?? createStableId(`fn:${tc.function.name}#${i}`, tc.function.arguments),
                        type: 'function' as const,
                        function: {
                            name: tc.function.name,
                            arguments: JSON.stringify(tc.function.arguments ?? {})
                        }
                    }));

                return pickDefined({
                    role: 'assistant' as const,
                    content,
                    ...(tool_calls && tool_calls.length ? {tool_calls} : {})
                }) as Partial<OpenAIRequestMessage>;
            }

            case 'tool': {
                return pickDefined({
                    role: 'tool' as const,
                    content: typeof content === 'string' ? content : JSON.stringify(content ?? ''),
                    tool_call_id: holoMessage.tool_call_id
                }) as Partial<OpenAIRequestMessage>;
            }

            default: { // 'user'
                return pickDefined({
                    role: 'user' as const,
                    content,
                    name: holoMessage.name
                }) as Partial<OpenAIRequestMessage>;
            }
        }
    }

    protected async toHoloImpl(openaiMessage: OpenAIRequestMessage): Promise<Partial<HoloMessage>> {
        if (openaiMessage.role === 'system') return {};

        let content: HoloMessage["content"] | undefined;
        if (typeof openaiMessage.content === 'string') {
            content = openaiMessage.content;
        } else if (Array.isArray(openaiMessage.content)) {
            // Map parts, including 'refusal' → text
            const mapped = await Promise.all(
                openaiMessage.content.map(async (part) => {
                    if ((part as any).type === 'refusal') {
                        // Normalize refusal into text
                        return {type: 'text', text: (part as any).refusal};
                    }
                    // Delegate standard parts (text, image, etc.)
                    return this.contentTranslator.toHolo(part as any);
                })
            );

            // Drop empties and collapse to string if single text
            const nonEmpty = mapped.filter(obj => Object.keys(obj ?? {}).length > 0);
            if (nonEmpty.length === 1 && (nonEmpty[0] as any).type === 'text') {
                content = (nonEmpty[0] as any).text;
            } else if (nonEmpty.length > 0) {
                content = nonEmpty as unknown as HoloMessage["content"];
            } else {
                content = undefined;
            }
        }

        switch (openaiMessage.role) {
            case 'assistant': {
                const tool_calls = openaiMessage.tool_calls?.map(tc => {
                    // Handle union type: only process function tool calls
                    if (tc.type === 'function') {
                        return {
                            id: tc.id,
                            type: 'function' as const,
                            function: {
                                name: tc.function.name,
                                arguments: safeParse(tc.function.arguments)
                            }
                        };
                    }
                    // Skip custom tool calls for now (not supported in Holo)
                    return null;
                }).filter((tc): tc is NonNullable<typeof tc> => tc !== null);

                return pickDefined({
                    role: 'assistant' as const,
                    content,
                    ...(tool_calls && tool_calls.length ? {tool_calls} : {})
                }) as Partial<HoloMessage>;
            }

            case 'tool': {
                return pickDefined({
                    role: 'tool' as const,
                    content,
                    tool_call_id: openaiMessage.tool_call_id
                }) as Partial<HoloMessage>;
            }

            default: { // 'user'
                return pickDefined({
                    role: 'user' as const,
                    content,
                    name: openaiMessage.name
                }) as Partial<HoloMessage>;
            }
        }
    }
}
