import {HoloRequest} from "../../types";
import {Translator} from "../../translators";

type OpenAIChatRequest = any;

export const fromHoloMessagesTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (!source.messages) return {};

    const messages = source.messages.map(message => {
        const openaiMessage: any = {
            role: message.role,
            content: message.content
        };

        if (message.name) {
            openaiMessage.name = message.name;
        }

        if (message.tool_calls && message.tool_calls.length > 0) {
            openaiMessage.tool_calls = message.tool_calls.map(toolCall => ({
                id: toolCall.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                type: 'function',
                function: {
                    name: toolCall.name,
                    arguments: typeof toolCall.arguments === 'string'
                        ? toolCall.arguments
                        : JSON.stringify(toolCall.arguments)
                }
            }));
        }

        if (message.tool_call_id) {
            openaiMessage.tool_call_id = message.tool_call_id;
        }

        if (message.images && message.images.length > 0) {
            const textPart = {
                type: 'text',
                text: message.content || ''
            };

            const imageParts = message.images.map(image => ({
                type: 'image_url',
                image_url: {
                    url: image.startsWith('data:') || image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`,
                    detail: 'auto'
                }
            }));

            openaiMessage.content = [textPart, ...imageParts];
        }

        if (message.audio) {
            openaiMessage.audio = message.audio;
        }

        return openaiMessage;
    });

    return {messages};
};

export const fromHoloToolsTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (!source.tools) return {};

    const tools = source.tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            strict: false
        }
    }));

    return {tools};
};

export const fromHoloToolChoiceTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (!source.tool_choice) return {};

    let tool_choice: any;
    if (typeof source.tool_choice === 'string') {
        switch (source.tool_choice) {
            case 'auto':
                tool_choice = 'auto';
                break;
            case 'none':
                tool_choice = 'none';
                break;
            case 'required':
                tool_choice = 'required';
                break;
            default:
                tool_choice = 'auto';
                break;
        }
    } else if (source.tool_choice.type === 'specific') {
        tool_choice = {
            type: 'function',
            function: {
                name: source.tool_choice.name
            }
        };
    } else {
        tool_choice = 'auto';
    }

    return {tool_choice};
};

export const fromHoloResponseFormatTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (!source.response_format) return {};

    let response_format: any;
    switch (source.response_format.type) {
        case 'text':
            response_format = {type: 'text'};
            break;
        case 'json_object':
            response_format = {type: 'json_object'};
            break;
        case 'json_schema':
            response_format = {
                type: 'json_schema',
                json_schema: {
                    name: source.response_format.schema?.name || 'response_schema',
                    description: source.response_format.schema?.description,
                    schema: source.response_format.schema,
                    strict: source.response_format.strict || false
                }
            };
            break;
        default:
            response_format = {type: 'text'};
            break;
    }

    return {response_format};
};

export const fromHoloUserTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (source.metadata?.user_id) {
        return {user: source.metadata.user_id};
    }
    return {};
};

export const fromHoloStopTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (source.stop_sequences && source.stop_sequences.length > 0) {
        return {
            stop: source.stop_sequences.length === 1
                ? source.stop_sequences[0]
                : source.stop_sequences
        };
    }
    return {};
};

export const fromHoloMaxTokensTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (source.max_tokens !== undefined) {
        return {max_completion_tokens: source.max_tokens};
    }
    return {};
};

export const fromHoloStreamOptionsTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (source.stream === true) {
        return {
            stream_options: {
                include_usage: true
            }
        };
    }
    return {};
};

export const fromHoloMetadataTranslator: Translator<HoloRequest, OpenAIChatRequest> = (source) => {
    if (!source.metadata) return {};

    const metadata: Record<string, string> = {};
    let hasMetadata = false;

    Object.entries(source.metadata).forEach(([key, value]) => {
        if (key !== 'user_id' && typeof value === 'string') {
            metadata[key] = value;
            hasMetadata = true;
        }
    });

    return hasMetadata ? {metadata} : {};
};

export const fromHoloRequestTranslators: Translator<HoloRequest, OpenAIChatRequest>[] = [
    fromHoloMessagesTranslator,
    fromHoloToolsTranslator,
    fromHoloToolChoiceTranslator,
    fromHoloResponseFormatTranslator,
    fromHoloUserTranslator,
    fromHoloStopTranslator,
    fromHoloMaxTokensTranslator,
    fromHoloStreamOptionsTranslator,
    fromHoloMetadataTranslator
];
