import {HoloMessage, HoloMessageValidator, HoloRequest} from "../../holo";
import {ClaudeChatRequest, ClaudeRequestMessage} from "../types";
import {ClaudeMessageValidator} from "../validators";
import {ClaudeContentTranslator} from "./claude.content.translators";
import {createStableId} from "../util/stable-id";
import {FieldTranslator, TranslateFunc, TranslatorGuard} from "../../types";
import logger from "../../../utils/logger";

export const ClaudeMessageRoleTranslator = new FieldTranslator<HoloMessage, ClaudeRequestMessage>(
    HoloMessageValidator,
    ClaudeMessageValidator,
    [async (holoMessage: HoloMessage): Promise<Partial<ClaudeRequestMessage>> => {
        return {
            // Claude only accepts 'user' | 'assistant' - tool messages become user messages
            role: holoMessage.role === 'assistant' ? 'assistant' : 'user'
        }
    }],
    [async (claudeMessage: ClaudeRequestMessage): Promise<Partial<HoloMessage>> => ({
        // Holo supports 'tool', but Claude never emits it; keep only 'assistant'|'user'
        role: claudeMessage.role === 'assistant' ? 'assistant' : 'user'
    })],
    {
        name: 'ClaudeMessageRoleTranslator'
    }
);

export const fromHoloMessageContentTranslator: TranslateFunc<HoloMessage, ClaudeRequestMessage> =
    async (holoMessage: HoloMessage): Promise<Partial<ClaudeRequestMessage>> => {
        const hasToolCalls = !!(holoMessage.role === 'assistant' && holoMessage.tool_calls?.length);

        // Only fast-return on plain-string *when not a tool message and no tool_calls*
        if (typeof holoMessage.content === 'string' && holoMessage.role !== 'tool' && !hasToolCalls) {
            return {content: holoMessage.content};
        }

        const content: any[] = [];

        // Structured portable content → Claude content blocks
        if (Array.isArray(holoMessage.content) && holoMessage.content.length) {
            const blocks = await ClaudeContentTranslator.fromHoloArray(holoMessage.content);
            content.push(...blocks);
        } else if (typeof holoMessage.content === 'string' && (hasToolCalls || holoMessage.role === 'tool')) {
            // If we can't fast-return because there are tool_calls or it's a tool message,
            // wrap the plain string as a text block so we can continue appending additional blocks.
            content.push({type: 'text', text: holoMessage.content});
        }

        // assistant tool_calls → append tool_use blocks (deterministic ids with index)
        if (holoMessage.role === 'assistant' && holoMessage.tool_calls?.length) {
            holoMessage.tool_calls.forEach((tc, idx) => {
                const id = tc.id ?? createStableId(`${tc.function.name}#${idx}`, tc.function.arguments);
                content.push({
                    type: 'tool_use' as const,
                    id,
                    name: tc.function.name,
                    input: tc.function.arguments
                });
            });
        }

        // tool message → add tool_result block
        if (holoMessage.role === 'tool' && holoMessage.tool_call_id) {
            const toolResult: any = {
                type: 'tool_result' as const,
                tool_use_id: holoMessage.tool_call_id,
            };

            if (Array.isArray(holoMessage.content) && holoMessage.content.length) {
                toolResult.content = await ClaudeContentTranslator.fromHoloArray(holoMessage.content);
            } else if (typeof holoMessage.content === 'string') {
                toolResult.content = holoMessage.content; // Claude accepts string here
            }
            content.push(toolResult);
        }

        return content.length ? {content} : {};
    };

// Claude message → multiple Holo messages (splitting based on content timeline)
export const toHoloMessageArrayTranslator = async (
    claudeMessage: ClaudeRequestMessage
): Promise<HoloMessage[]> => {
    if (typeof claudeMessage.content === 'string') {
        return [{
            role: claudeMessage.role === 'assistant' ? 'assistant' : 'user',
            content: claudeMessage.content
        }];
    }
    if (!Array.isArray(claudeMessage.content)) return [];

    const holoMessages: HoloMessage[] = [];
    let pendingBlocks: any[] = [];
    let mode: 'content' | 'tool' | null = null;

    // track tool_use id -> name for later tool_result name
    const toolUseNameById = new Map<string, string>();

    // Preserve original Claude role when splitting to Holo
    const outRole: 'assistant' | 'user' = claudeMessage.role === 'assistant' ? 'assistant' : 'user';

    const flush = async () => {
        if (!pendingBlocks.length) return;
        if (mode === 'tool') {
            // assistant/user with tool_calls
            const tool_calls = pendingBlocks.map((b: any) => {
                toolUseNameById.set(b.id, b.name);
                return {
                    id: b.id,
                    type: 'function' as const,
                    function: {name: b.name, arguments: b.input}
                };
            });
            holoMessages.push({role: outRole, content: '', tool_calls});
        } else {
            // assistant/user with content
            const hc = await ClaudeContentTranslator.toHoloArray(pendingBlocks);
            if (hc.length === 1 && hc[0]?.type === 'text') {
                holoMessages.push({role: outRole, content: (hc[0] as any).text});
            } else if (hc.length) {
                holoMessages.push({role: outRole, content: hc});
            }
        }
        pendingBlocks = [];
        mode = null;
    };

    for (const block of claudeMessage.content) {
        const t = (block as any).type;
        if (t === 'text' || t === 'image') {
            if (mode === 'tool') await flush();
            mode = 'content';
            pendingBlocks.push(block);
        } else if (t === 'tool_use') {
            if (mode === 'content') await flush();
            mode = 'tool';
            pendingBlocks.push(block);
        } else if (t === 'tool_result') {
            await flush();
            // emit a separate tool message
            const tool_call_id = (block as any).tool_use_id;
            const raw = (block as any).content;

            let content: HoloMessage['content'] = '';
            if (typeof raw === 'string') {
                content = raw;
            } else if (Array.isArray(raw)) {
                const hc = await ClaudeContentTranslator.toHoloArray(raw);
                if (hc.length === 1 && hc[0]?.type === 'text') content = (hc[0] as any).text;
                else content = hc;
            } else {
                content = '';
            }

            const toolMessage: HoloMessage = {
                role: 'tool',
                tool_call_id,
                content
            };
            const toolName = toolUseNameById.get(tool_call_id);
            if (toolName) {
                toolMessage.name = toolName;
            }
            holoMessages.push(toolMessage);
        } else {
            // ignore Claude-only blocks (thinking, citations, etc.)
        }
    }
    await flush();
    return holoMessages;
};

// Guards for message validation
export const portableMessageOnlyGuard = new TranslatorGuard<HoloMessage>(
    "portableMessageOnly",
    async (message) => {
        // Only allow user, assistant, and tool roles (portable)
        return message.role === 'user' || message.role === 'assistant' || message.role === 'tool';
    }
);

export const claudeCompatibleMessageGuard = new TranslatorGuard<ClaudeRequestMessage>(
    "claudeCompatibleMessage",
    async (message) => {
        // Only allow user and assistant roles (Claude doesn't support 'tool' role messages directly)
        return message.role === 'user' || message.role === 'assistant';
    }
);

// Single message translator (for when we know it's 1:1)
export const ClaudeMessageTranslator = new FieldTranslator<HoloMessage, ClaudeRequestMessage>(
    HoloMessageValidator,
    ClaudeMessageValidator,
    [
        // Role translation
        async (holoMessage: HoloMessage): Promise<Partial<ClaudeRequestMessage>> => {
            return await ClaudeMessageRoleTranslator.fromHolo(holoMessage);
        },
        // Content translation (handles ordering and accumulation)
        fromHoloMessageContentTranslator
    ],
    [
        // For reverse, we need to use the array translator and take first result
        async (claudeMessage: ClaudeRequestMessage): Promise<Partial<HoloMessage>> => {
            const holoMessages = await toHoloMessageArrayTranslator(claudeMessage);
            return holoMessages.length > 0 ? holoMessages[0] : {};
        }
    ],
    {
        fromHoloGuards: [portableMessageOnlyGuard],
        toHoloGuards: [claudeCompatibleMessageGuard],
        name: 'ClaudeMessageTranslator'
    }
);

// Messages array translator for HoloRequest.messages[] -> ClaudeChatRequest.messages[]
export const fromHoloMessagesTranslator: TranslateFunc<HoloRequest, ClaudeChatRequest> =
    async (holoRequest: HoloRequest): Promise<Partial<ClaudeChatRequest>> => {
        const messages = holoRequest.messages;
        if (!messages || messages.length === 0) return {};

        const claudeMessages = await Promise.all(
            messages.map(async (message) => {
                try {
                    return await ClaudeMessageTranslator.fromHolo(message);
                } catch (e) {
                    logger.error(`[fromHoloMessagesTranslator] Error translating Holo message: ${(e as Error).message}`);
                    return {};
                }
            })
        );

        // Filter out any failed translations
        const validMessages = claudeMessages.filter(msg => Object.keys(msg).length > 0) as ClaudeRequestMessage[];
        return {messages: validMessages};
    };

// Reverse: ClaudeChatRequest.messages[] -> HoloRequest.messages[]
export const toHoloMessagesTranslator: TranslateFunc<ClaudeChatRequest, HoloRequest> =
    async (claudeRequest: ClaudeChatRequest): Promise<Partial<HoloRequest>> => {
        if (!claudeRequest.messages || claudeRequest.messages.length === 0) return {};

        // Each Claude message can split into multiple Holo messages
        const holoMessageArrays = await Promise.all(
            claudeRequest.messages.map(async (message) =>
                await toHoloMessageArrayTranslator(message)
            )
        );

        // Flatten the array of arrays into a single array
        const allHoloMessages = holoMessageArrays.flat();

        return {messages: allHoloMessages};
    };

// Export the array splitting function for use in response translators
export const claudeMessageToHoloArray = toHoloMessageArrayTranslator;
