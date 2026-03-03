import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import type {HoloContent} from "@holokai/types/holo";
import {ContentBlock} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeResponseContentTranslator extends BaseTranslator<HoloContent, ContentBlock> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<ContentBlock> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<ContentBlock>> {
        // For response-side synthesis, we only handle text content since 
        // Claude responses don't include image blocks in the same way as requests
        if (source.type === 'text') {
            return {
                type: 'text',
                text: source.text,
                citations: null
            };
        }
        // Other Holo content types (image) are not supported in Claude response blocks
        return {};
    }

    protected async toHoloImpl(source: ContentBlock): Promise<Partial<HoloContent>> {
        switch (source.type) {
            case 'text':
                return {type: 'text', text: source.text};

            case 'tool_use':
                // Handled at the message layer (mapped to Holo tool_calls[]).
                return {};

            // Claude-only response blocks we intentionally drop per mapping:
            // 'thinking', 'redacted_thinking', 'server_tool_use', 'web_search_tool_result',
            // 'code_execution_tool_result', 'mcp_tool_use', 'mcp_tool_result', 
            // 'container_upload', etc.
            default:
                return {};
        }
    }
}