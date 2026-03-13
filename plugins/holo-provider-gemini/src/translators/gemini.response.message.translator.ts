import 'reflect-metadata';
import {GeminiResponseContentTranslator} from "./gemini.response.content.translator";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloContent, HoloMessage} from "@holokai/types/holo";
import type {Content, Part} from "@google/genai";

@injectable()
export class GeminiResponseMessageTranslator extends BaseTranslator<HoloMessage, Content> {
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<Content> = {};

    constructor(private readonly responseContentTranslator: GeminiResponseContentTranslator) {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<Content>> {
        if (source.role !== 'assistant') {
            return {};
        }

        const parts: Part[] = [];

        if (typeof source.content === 'string') {
            parts.push({text: source.content});
        } else if (Array.isArray(source.content)) {
            const blocks = await this.responseContentTranslator.fromHoloArray(source.content);
            parts.push(...blocks as Part[]);
        }

        if (source.tool_calls?.length) {
            for (const tc of source.tool_calls) {
                parts.push({
                    functionCall: {
                        name: tc.function.name,
                        args: tc.function.arguments as Record<string, unknown> || {}
                    }
                });
            }
        }

        if (!parts.length) {
            parts.push({text: ''});
        }

        return {role: 'model', parts};
    }

    protected async toHoloImpl(source: Content): Promise<Partial<HoloMessage>> {
        const contentBlocks: HoloContent[] = [];
        const tool_calls: HoloMessage["tool_calls"] = [];

        for (const part of source.parts || []) {
            if (part.text !== undefined) {
                const holoContent = await this.responseContentTranslator.toHolo(part);
                if ('type' in holoContent) {
                    contentBlocks.push(holoContent as HoloContent);
                }
            } else if (part.functionCall) {
                tool_calls.push({
                    id: part.functionCall.name || '',
                    type: 'function',
                    function: {
                        name: part.functionCall.name || '',
                        arguments: part.functionCall.args as Record<string, unknown> || {}
                    }
                });
            }
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
