import 'reflect-metadata';
import {ClaudeRequestMessage} from "../types";
import {ClaudeContentTranslator} from "./claude.content.translators";
import {createStableId} from "../utils/stable-id.js";
import {injectable} from 'tsyringe';
import {HoloContent, HoloMessage} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class ClaudeMessageTranslator extends BaseTranslator<HoloMessage, ClaudeRequestMessage> {
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<ClaudeRequestMessage> = {};

    constructor(private readonly contentTranslator: ClaudeContentTranslator) {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<ClaudeRequestMessage>> {
        const role: ClaudeRequestMessage["role"] = source.role === 'assistant' ? 'assistant' : 'user';
        const hasToolCalls = !!(source.role === 'assistant' && source.tool_calls?.length);

        // Simple, no-tools path: plain string content from non-tool roles
        if (typeof source.content === 'string' && source.role !== 'tool' && !hasToolCalls) {
            return {role, content: source.content};
        }

        // Build block content
        const contentBlocks: any[] = [];

        // Translate Holo structured content (once)
        let translatedBlocks: any[] | undefined;
        if (Array.isArray(source.content) && source.content.length) {
            translatedBlocks = await Promise.all(source.content.map(c => this.contentTranslator.fromHolo(c)));
            contentBlocks.push(...translatedBlocks);
        } else if (typeof source.content === 'string' && (hasToolCalls || source.role === 'tool')) {
            contentBlocks.push({type: 'text', text: source.content});
        }

        // Assistant tool uses → tool_use blocks
        if (source.role === 'assistant' && source.tool_calls?.length) {
            source.tool_calls.forEach((tc, idx) => {
                const id = tc.id ?? createStableId(`${tc.function.name}#${idx}`, tc.function.arguments);
                contentBlocks.push({
                    type: 'tool_use',
                    id,
                    name: tc.function.name,
                    input: tc.function.arguments
                });
            });
        }

        // Tool role → tool_result block
        if (source.role === 'tool' && source.tool_call_id) {
            const toolResult: any = {
                type: 'tool_result',
                tool_use_id: source.tool_call_id,
            };

            // Reuse translatedBlocks if we already computed them
            if (Array.isArray(source.content) && source.content.length) {
                toolResult.content = translatedBlocks ?? await Promise.all(source.content.map(c => this.contentTranslator.fromHolo(c)));
            } else if (typeof source.content === 'string') {
                toolResult.content = source.content;
            }
            contentBlocks.push(toolResult);
        }

        return {role, ...(contentBlocks.length ? {content: contentBlocks} : {})};
    }

    protected async toHoloImpl(source: ClaudeRequestMessage): Promise<Partial<HoloMessage>> {
        // Default: map unknown roles to 'user' (Claude schema already restricts role)
        let role: HoloMessage["role"] = source.role === 'assistant' ? 'assistant' : 'user';

        if (typeof source.content === 'string') {
            return {role, content: source.content};
        }

        if (!Array.isArray(source.content)) {
            return {role, content: ''};
        }

        const contentBlocks: HoloContent[] = [];
        const tool_calls: NonNullable<HoloMessage["tool_calls"]> = [];

        for (const block of source.content) {
            const type = (block as any).type;

            if (type === 'text' || type === 'image') {
                const holoContent = await this.contentTranslator.toHolo(block);
                if ('type' in (holoContent as object)) {
                    contentBlocks.push(holoContent as HoloContent);
                }
            } else if (type === 'tool_use') {
                const b = block as any;
                tool_calls.push({
                    id: b.id,
                    type: 'function',
                    function: {name: b.name, arguments: b.input}
                });
            } else if (type === 'tool_result') {
                // Policy: tool_result wins - this becomes a Holo tool message
                // Any other content blocks in the same Claude message are ignored
                // This assumes Claude messages don't mix tool_result with assistant content
                const b = block as any;
                const content = typeof b.content === 'string' ? b.content : '';
                return {
                    role: 'tool',
                    tool_call_id: b.tool_use_id,
                    content
                };
            }
        }

        let content: HoloMessage['content'] = '';
        if (contentBlocks.length === 1 && contentBlocks[0].type === 'text') {
            content = (contentBlocks[0] as any).text;
        } else if (contentBlocks.length) {
            content = contentBlocks;
        }

        return {
            role,
            content,
            ...(tool_calls.length ? {tool_calls} : {})
        };
    }
}
