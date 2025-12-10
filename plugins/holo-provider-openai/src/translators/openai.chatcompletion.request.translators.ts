import {OpenAIMessageTranslator} from "./openai.message.translators";
import {OpenAIToolChoiceTranslator, OpenAIToolTranslator} from "./openai.tool.translators";
import {
    OpenAIChatCompletionTool,
    OpenAIChatCompletionToolChoiceOption,
    OpenAIChatRequest,
    OpenAIRequestMessage,
    OpenAIResponseFormat
} from "../types";
import {injectable} from 'tsyringe';
import {HoloMessage, HoloRequest, HoloResponseFormat, HoloTool, HoloToolChoice, pickDefined} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

/**
 * OpenAI Request Translator
 *
 * Validator alignment requirements:
 * - OpenAIChatRequestValidator should include max_completion_tokens? and safety_identifier?
 * - Legacy max_tokens? and user? can be accepted for backward compatibility
 * - HoloRequestValidator remains unchanged
 */
@injectable()
export class OpenAIRequestTranslator extends BaseTranslator<HoloRequest, OpenAIChatRequest> {
    protected holoDefaults: Partial<HoloRequest> = {};
    protected providerDefaults: Partial<OpenAIChatRequest> = {};

    constructor(
        private readonly messageTranslator: OpenAIMessageTranslator,
        private readonly toolTranslator: OpenAIToolTranslator,
        private readonly toolChoiceTranslator: OpenAIToolChoiceTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<OpenAIChatRequest>> {
        // Map service tier (only 'auto' | 'default' forwarded to OpenAI, 'standard_only' dropped)
        const serviceTierMap: Record<string, 'auto' | 'default'> = {
            'auto': 'auto',
            'default': 'default'
        };
        const mappedServiceTier = source.service_tier ? serviceTierMap[source.service_tier] : undefined;

        // Handle response format
        let response_format: OpenAIResponseFormat | undefined;
        if (source.response_format) {
            const format = source.response_format;
            if (format.type === 'json_object') {
                response_format = {type: 'json_object'};
            } else if (format.type === 'json_schema') {
                response_format = {
                    type: 'json_schema',
                    json_schema: {
                        name: 'holo',
                        schema: format.schema,
                        ...(format.strict !== undefined && {strict: format.strict})
                    }
                };
            }
        }

        //deprecated max_tokens and user
        const result = pickDefined({
            model: source.model,
            max_completion_tokens: source.max_tokens,
            //max_tokens: source.max_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            frequency_penalty: source.frequency_penalty,
            presence_penalty: source.presence_penalty,
            seed: source.seed,
            stream: source.stream,
            service_tier: mappedServiceTier,
            safety_identifier: source.metadata?.user_id,
            //user: source.metadata?.user_id,
            stop: source.stop_sequences,
            response_format

        }) as Partial<OpenAIChatRequest>;

        // Handle messages and system (build locally, then assign)
        const messages: NonNullable<OpenAIChatRequest["messages"]> = [];
        if (source.system) {
            messages.push({
                role: 'system',
                content: source.system
            });
        }
        if (source.messages?.length) {
            const openaiMessages = await Promise.all(
                source.messages.map(async (message) =>
                    await this.messageTranslator.fromHolo(message)
                )
            );
            const validMessages = openaiMessages.filter(msg => Object.keys(msg).length > 0) as NonNullable<OpenAIChatRequest["messages"]>;
            if (validMessages.length > 0) {
                messages.push(...validMessages);
            }
        }
        if (messages.length) {
            result.messages = messages;
        }

        // Handle tools
        if (source.tools?.length) {
            const mapped = await Promise.all(
                source.tools.map(tool => this.toolTranslator.fromHolo(tool))
            );
            const validTools = mapped.filter(tool => Object.keys(tool).length > 0);
            if (validTools.length > 0) {
                result.tools = validTools as OpenAIChatCompletionTool[];
            }
        }

        // Handle tool choice
        if (source.tool_choice) {
            const toolChoice = await this.toolChoiceTranslator.fromHolo(source.tool_choice);
            if (Object.keys(toolChoice).length > 0) {
                result.tool_choice = toolChoice as OpenAIChatCompletionToolChoiceOption;
            }
        }

        return result as Partial<OpenAIChatRequest>;
    }

    protected async toHoloImpl(source: OpenAIChatRequest): Promise<Partial<HoloRequest>> {
        // Handle stop sequences
        const stopSequences = source.stop ?
            (Array.isArray(source.stop) ? source.stop : [source.stop]) :
            undefined;

        // Handle metadata: prefer safety_identifier, fallback to user
        const metadata = source.safety_identifier
            ? {user_id: source.safety_identifier}
            : (source.user ? {user_id: source.user} : undefined);

        // Handle response format
        let response_format: HoloResponseFormat | undefined;
        if (source.response_format) {
            const format = source.response_format;
            if (format.type === 'json_object') {
                response_format = {type: 'json_object'};
            } else if (format.type === 'json_schema' && format.json_schema.schema) {
                response_format = {
                    type: 'json_schema',
                    schema: format.json_schema.schema,
                    ...(typeof format.json_schema.strict === 'boolean' && {strict: format.json_schema.strict})
                };
            }
        }

        const result = pickDefined({
            model: source.model,
            max_tokens: source.max_completion_tokens ?? source.max_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            frequency_penalty: source.frequency_penalty,
            presence_penalty: source.presence_penalty,
            seed: source.seed,
            stream: source.stream,
            stop_sequences: stopSequences,
            metadata,
            response_format,
        }) as Partial<HoloRequest>;

        // Handle messages and system
        if (source.messages?.length) {
            let system: string | undefined;
            const regular: OpenAIRequestMessage[] = [];

            for (const message of source.messages) {
                if (message.role === 'system' && system == null) {
                    if (typeof message.content === 'string') {
                        system = message.content;
                    } else if (Array.isArray(message.content)) {
                        system = await this.messageTranslator.flattenText(message.content);
                    }
                } else {
                    regular.push(message);
                }
            }

            if (regular.length) {
                const holoMessages = await Promise.all(regular.map(m => this.messageTranslator.toHolo(m)));
                const validMessages = holoMessages.filter(m => Object.keys(m).length > 0);
                if (validMessages.length) {
                    result.messages = validMessages as HoloMessage[];
                }
            }

            if (system) {
                result.system = system;
            }
        }

        // Handle tools
        if (source.tools?.length) {
            const mapped = await Promise.all(
                source.tools.map(tool => this.toolTranslator.toHolo(tool))
            );
            const validTools = mapped.filter(tool => Object.keys(tool).length > 0);
            if (validTools.length) {
                result.tools = validTools as HoloTool[];
            }
        }

        // Handle tool choice
        if (source.tool_choice) {
            const toolChoice = await this.toolChoiceTranslator.toHolo(source.tool_choice);
            if (Object.keys(toolChoice).length > 0) {
                result.tool_choice = toolChoice as HoloToolChoice;
            }
        }

        return result as Partial<HoloRequest>;
    }
}
