import 'reflect-metadata';
import {ClaudeResponseContentTranslator} from "./claude.response.content.translators";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {createStableId, pickDefined} from "@holokai/sdk";
import type {HoloContent, HoloMessage} from "@holokai/types/holo";
import {Message} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeResponseMessageTranslator extends BaseTranslator<HoloMessage, Message> {
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<Message> = {};

    constructor(private readonly responseContentTranslator: ClaudeResponseContentTranslator) {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<Message>> {
        if (source.role !== 'assistant') {
            return {};
        }

        const content: Message["content"] = [];

        if (typeof source.content === 'string') {
            content.push({type: 'text', text: source.content, citations: null});
        } else if (Array.isArray(source.content)) {
            const blocks = await this.responseContentTranslator.fromHoloArray(source.content);
            content.push(...blocks);
        }

        if (source.tool_calls?.length) {
            source.tool_calls.forEach((tc, idx) => {
                content.push({
                    type: 'tool_use',
                    id: tc.id ?? createStableId(`${tc.function.name}#${idx}`, tc.function.arguments),
                    name: tc.function.name,
                    input: tc.function.arguments || {}
                });
            });
        }

        if (!content.length) {
            // Empty text block to satisfy provider schema requirements
            content.push({type: 'text', text: '', citations: null});
        }

        return {role: 'assistant', content};
    }

    protected async toHoloImpl(source: Message): Promise<Partial<HoloMessage>> {
        const contentBlocks: HoloContent[] = [];
        const tool_calls: HoloMessage["tool_calls"] = [];

        for (const block of source.content || []) {
            if (block.type === 'text') {
                const holoContent = await this.responseContentTranslator.toHolo(block);
                if ('type' in holoContent) {
                    contentBlocks.push(holoContent as HoloContent);
                }
            } else if (block.type === 'tool_use') {
                tool_calls.push({
                    id: block.id,
                    type: 'function',
                    function: {
                        name: block.name,
                        arguments: typeof block.input === 'object' && block.input !== null
                            ? block.input as Record<string, unknown>
                            : {}
                    }
                });
            }
            // Handle other block types as needed (server_tool_use, thinking, etc.)
        }

        let content: HoloMessage['content'] = '';
        if (contentBlocks.length === 1 && contentBlocks[0].type === 'text') {
            content = contentBlocks[0].text;
        } else if (contentBlocks.length) {
            content = contentBlocks;
        }

        return pickDefined({
            role: 'assistant',
            content,
            tool_calls: tool_calls.length ? tool_calls : undefined
        }) as Partial<HoloMessage>;
    }
}
