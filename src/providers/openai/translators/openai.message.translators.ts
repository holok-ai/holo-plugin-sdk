import {FieldTranslator, Guard, TranslateFunc} from "../../translators";
import {HoloMessage, HoloMessageValidator, HoloRequest} from "../../holo";
import {OpenAIContentTranslator} from "./openai.content.translators";
import {OpenAIChatRequest, OpenAIRequestMessage} from "../types";

export const fromHoloMessageContentTranslator: TranslateFunc<HoloMessage, OpenAIRequestMessage> =
    async (holoMessage: HoloMessage): Promise<Partial<OpenAIRequestMessage>> => {
        let content: any;

        if (typeof holoMessage.content === 'string') {
            content = holoMessage.content;
        } else if (Array.isArray(holoMessage.content)) {
            const contentParts = await OpenAIContentTranslator.fromHoloArray(holoMessage.content);
            content = contentParts.length > 0 ? contentParts : holoMessage.content;
        }


        if (holoMessage.role === 'assistant') {
            const assistantMessage: any = {
                role: 'assistant',
                content
            };

            if (holoMessage.tool_calls && holoMessage.tool_calls.length > 0) {
                assistantMessage.tool_calls = holoMessage.tool_calls.map(tc => ({
                    id: tc.id || `call_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'function' as const,
                    function: {
                        name: tc.function.name,
                        arguments: JSON.stringify(tc.function.arguments)
                    }
                }));
            }

            return assistantMessage;
        }

        if (holoMessage.role === 'tool') {
            return {
                role: 'tool',
                content: typeof content === 'string' ? content : JSON.stringify(content),
                tool_call_id: holoMessage.tool_call_id || ''
            };
        }

        return {
            role: 'user',
            content,
            ...(holoMessage.name && {name: holoMessage.name})
        };
    };

export const toHoloMessageTranslator: TranslateFunc<OpenAIRequestMessage, HoloMessage> =
    async (openaiMessage: OpenAIRequestMessage): Promise<Partial<HoloMessage>> => {
        const baseMessage: Partial<HoloMessage> = {
            role: openaiMessage.role as 'user' | 'assistant' | 'tool'
        };

        if (openaiMessage.role === 'system') {
            return {};
        }

        if (typeof openaiMessage.content === 'string') {
            baseMessage.content = openaiMessage.content;
        } else if (Array.isArray(openaiMessage.content)) {
            const holoContent = await OpenAIContentTranslator.toHoloArray(openaiMessage.content as any[]);
            if (holoContent.length === 1 && holoContent[0]?.type === 'text') {
                baseMessage.content = (holoContent[0] as any).text;
            } else {
                baseMessage.content = holoContent;
            }
        }

        if (openaiMessage.role === 'assistant' && 'tool_calls' in openaiMessage && openaiMessage.tool_calls) {
            baseMessage.tool_calls = openaiMessage.tool_calls.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments || '{}')
                }
            }));
        }

        if (openaiMessage.role === 'tool') {
            baseMessage.tool_call_id = (openaiMessage as any).tool_call_id;
        }

        if ('name' in openaiMessage && openaiMessage.name) {
            baseMessage.name = openaiMessage.name;
        }

        return baseMessage;
    };

export const portableMessageOnlyGuard = new Guard<HoloMessage>(
    "portableMessageOnly",
    (message) => {
        return message.role === 'user' || message.role === 'assistant' || message.role === 'tool';
    }
);

export const OpenAIMessageTranslator = new FieldTranslator<HoloMessage, OpenAIRequestMessage>(
    HoloMessageValidator,
    {} as any,
    [fromHoloMessageContentTranslator],
    [toHoloMessageTranslator],
    [portableMessageOnlyGuard]
);

export const fromHoloMessagesWithSystemTranslator: TranslateFunc<HoloRequest, OpenAIChatRequest> =
    async (holoRequest: HoloRequest): Promise<Partial<OpenAIChatRequest>> => {
        const messages: OpenAIRequestMessage[] = [];

        if (holoRequest.system) {
            messages.push({
                role: 'system',
                content: holoRequest.system
            });
        }

        if (holoRequest.messages && holoRequest.messages.length > 0) {
            const openaiMessages = await Promise.all(
                holoRequest.messages.map(async (message) =>
                    await OpenAIMessageTranslator.fromHolo(message)
                )
            );

            const validMessages = openaiMessages.filter(msg => Object.keys(msg).length > 0) as OpenAIRequestMessage[];
            messages.push(...validMessages);
        }

        return {messages};
    };

export const toHoloMessagesWithSystemTranslator: TranslateFunc<OpenAIChatRequest, HoloRequest> =
    async (openaiRequest: OpenAIChatRequest): Promise<Partial<HoloRequest>> => {
        if (!openaiRequest.messages || openaiRequest.messages.length === 0) {
            return {};
        }

        let system: string | undefined;
        const regularMessages: OpenAIRequestMessage[] = [];

        for (const message of openaiRequest.messages) {
            if (message.role === 'system') {
                if (!system && typeof message.content === 'string') {
                    system = message.content;
                }
            } else {
                regularMessages.push(message);
            }
        }

        const holoMessages = await Promise.all(
            regularMessages.map(async (message) =>
                await OpenAIMessageTranslator.toHolo(message)
            )
        );

        const validMessages = holoMessages.filter(msg => Object.keys(msg).length > 0) as HoloMessage[];

        const result: Partial<HoloRequest> = {messages: validMessages};
        if (system) {
            result.system = system;
        }

        return result;
    };
