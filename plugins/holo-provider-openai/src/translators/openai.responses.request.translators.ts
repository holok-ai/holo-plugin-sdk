import {pickDefined} from "@holokai/sdk";
import {HoloContent, HoloMessage, HoloRequest, HoloTool} from "@holokai/types/holo";
import {BaseTranslator} from "@holokai/sdk/provider";
import {
    EasyInputMessage,
    ResponseCreateParams,
    ResponseInput,
    ResponseInputContent,
    Tool
} from "openai/resources/responses/responses";

export class OpenAIResponseRequestTranslator extends BaseTranslator<HoloRequest, ResponseCreateParams> {
    protected holoDefaults: Partial<HoloRequest> = {};
    protected providerDefaults: Partial<ResponseCreateParams> = {};

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<ResponseCreateParams>> {
        const result = pickDefined({
            model: source.model,
            max_output_tokens: source.max_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            stream: source.stream,
            metadata: source.metadata ? {user_id: source.metadata.user_id} : undefined
        }) as Partial<ResponseCreateParams>;

        const inputMessages: EasyInputMessage[] = [];

        if (source.system) {
            inputMessages.push({
                role: 'system',
                content: source.system
            });
        }

        if (source.messages?.length) {
            for (const message of source.messages) {
                if (message.role === 'user' || message.role === 'assistant') {
                    if (typeof message.content === 'string') {
                        inputMessages.push({
                            role: message.role,
                            content: message.content
                        });
                    } else {
                        const mappedContent: ResponseInputContent[] = message.content.map(c => {
                            if (c.type === 'text') {
                                return {type: 'input_text' as const, text: c.text};
                            } else if (c.type === 'image') {
                                return {
                                    type: 'input_image' as const,
                                    image_url: c.url ?? c.data ?? null,
                                    detail: 'auto' as const
                                };
                            }
                            throw new Error(`Unsupported content type: ${(c as HoloContent).type}`);
                        });
                        inputMessages.push({
                            role: message.role,
                            content: mappedContent
                        });
                    }
                }
            }
        }

        if (inputMessages.length > 0) {
            result.input = inputMessages as ResponseInput;
        }

        if (source.tools?.length) {
            result.tools = source.tools.map((tool): Tool => ({
                type: 'function' as const,
                name: tool.name,
                description: tool.description || null,
                parameters: tool.parameters || null,
                strict: null
            }));
        }

        if (source.tool_choice) {
            if (source.tool_choice.type === 'auto') {
                result.tool_choice = 'auto';
            } else if (source.tool_choice.type === 'none') {
                result.tool_choice = 'none';
            } else if (source.tool_choice.type === 'required') {
                result.tool_choice = 'required';
            } else if (source.tool_choice.type === 'specific') {
                result.tool_choice = {
                    type: 'function',
                    name: source.tool_choice.name
                };
            }
        }

        return result;
    }

    protected async toHoloImpl(source: ResponseCreateParams): Promise<Partial<HoloRequest>> {
        const result = pickDefined({
            model: source.model,
            max_tokens: source.max_output_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            stream: source.stream,
            metadata: source.metadata
        }) as Partial<HoloRequest>;

        if (Array.isArray(source.input)) {
            const messages: HoloMessage[] = [];
            let system: string | undefined;

            for (const item of source.input) {
                if ('role' in item) {
                    if (item.role === 'system' && !system) {
                        if (typeof item.content === 'string') {
                            system = item.content;
                        }
                    } else if (item.role === 'user' || item.role === 'assistant') {
                        if (typeof item.content === 'string') {
                            messages.push({
                                role: item.role,
                                content: item.content
                            });
                        } else if (Array.isArray(item.content)) {
                            const mappedContent: HoloContent[] = item.content.map(c => {
                                if ('type' in c && c.type === 'input_text' && 'text' in c) {
                                    return {type: 'text' as const, text: c.text};
                                } else if ('type' in c && c.type === 'input_image' && 'image_url' in c) {
                                    return {type: 'image' as const, url: c.image_url || ''};
                                }
                                throw new Error(`Unsupported OpenAI input content type`);
                            });
                            messages.push({
                                role: item.role,
                                content: mappedContent
                            });
                        }
                    }
                }
            }

            if (system) {
                result.system = system;
            }
            if (messages.length > 0) {
                result.messages = messages;
            }
        } else if (typeof source.input === 'string') {
            result.messages = [{
                role: 'user',
                content: source.input
            }];
        }

        if (source.tools?.length) {
            result.tools = source.tools
                .filter(t => t.type === 'function')
                .map((tool): HoloTool => ({
                    name: tool.name,
                    description: tool.description || '',
                    parameters: tool.parameters || {}
                }));
        }

        if (source.tool_choice) {
            if (typeof source.tool_choice === 'string') {
                if (source.tool_choice === 'auto') {
                    result.tool_choice = {type: 'auto'};
                } else if (source.tool_choice === 'none') {
                    result.tool_choice = {type: 'none'};
                } else if (source.tool_choice === 'required') {
                    result.tool_choice = {type: 'required'};
                }
            } else if ('type' in source.tool_choice && source.tool_choice.type === 'function' && 'name' in source.tool_choice) {
                result.tool_choice = {
                    type: 'specific',
                    name: source.tool_choice.name
                };
            }
        }

        return result;
    }
}
