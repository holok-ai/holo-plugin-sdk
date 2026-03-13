import 'reflect-metadata';
import {GeminiContentTranslator} from "./gemini.content.translator";
import {injectable} from 'tsyringe';
import type {HoloContent, HoloMessage} from "@holokai/types/holo";
import {BaseTranslator} from "@holokai/sdk/provider";
import type {Content, Part} from "@google/genai";

@injectable()
export class GeminiMessageTranslator extends BaseTranslator<HoloMessage, Content> {
    protected holoDefaults: Partial<HoloMessage> = {};
    protected providerDefaults: Partial<Content> = {};

    constructor(private readonly contentTranslator: GeminiContentTranslator) {
        super();
    }

    protected async fromHoloImpl(source: HoloMessage): Promise<Partial<Content>> {
        const role = source.role === 'assistant' ? 'model' : 'user';
        const parts: Part[] = [];

        if (typeof source.content === 'string' && source.content.length) {
            parts.push({text: source.content});
        } else if (Array.isArray(source.content) && source.content.length) {
            const translated = await Promise.all(source.content.map(c => this.contentTranslator.fromHolo(c)));
            parts.push(...translated as Part[]);
        }

        if (source.role === 'assistant' && source.tool_calls?.length) {
            for (const tc of source.tool_calls) {
                parts.push({
                    functionCall: {
                        name: tc.function.name,
                        args: tc.function.arguments as Record<string, unknown> || {}
                    }
                });
            }
        }

        if (source.role === 'tool') {
            const responseContent = typeof source.content === 'string'
                ? source.content
                : JSON.stringify(source.content);
            return {
                role: 'user',
                parts: [{
                    functionResponse: {
                        name: source.tool_call_id || 'unknown',
                        response: {content: responseContent}
                    }
                }]
            };
        }

        return {role, parts};
    }

    protected async toHoloImpl(source: Content): Promise<Partial<HoloMessage>> {
        const role: HoloMessage["role"] = source.role === 'model' ? 'assistant' : 'user';
        const contentBlocks: HoloContent[] = [];
        const tool_calls: NonNullable<HoloMessage["tool_calls"]> = [];

        for (const part of source.parts || []) {
            if (part.text !== undefined) {
                const holoContent = await this.contentTranslator.toHolo(part);
                if ('type' in (holoContent as object)) {
                    contentBlocks.push(holoContent as HoloContent);
                }
            } else if (part.inlineData || part.fileData) {
                const holoContent = await this.contentTranslator.toHolo(part);
                if ('type' in (holoContent as object)) {
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
            } else if (part.functionResponse) {
                const content = typeof part.functionResponse.response === 'string'
                    ? part.functionResponse.response
                    : JSON.stringify(part.functionResponse.response);
                return {
                    role: 'tool',
                    tool_call_id: part.functionResponse.name || '',
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
