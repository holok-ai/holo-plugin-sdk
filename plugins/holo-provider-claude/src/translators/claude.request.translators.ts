import 'reflect-metadata';
import {ClaudeMessageTranslator} from "./claude.message.translators";
import {ClaudeToolChoiceTranslator, ClaudeToolTranslator} from "./claude.tool.translators";
import {injectable} from 'tsyringe';
import {HoloRequestDefaults, pickDefined} from "@holokai/sdk";
import type {HoloMessage, HoloRequest, HoloResponseFormat, HoloTool, HoloToolChoice} from "@holokai/types/holo";
import {BaseTranslator} from "@holokai/sdk/provider";
import {MessageParam, MessageStreamParams, Tool, ToolChoice} from "@anthropic-ai/sdk/resources/messages/messages";

// Claude request defaults
const MessageStreamParamsDefaults: Partial<MessageStreamParams> = {
    max_tokens: 4096
};

@injectable()
export class ClaudeRequestTranslator extends BaseTranslator<HoloRequest, MessageStreamParams> {
    protected holoDefaults: Partial<HoloRequest> = HoloRequestDefaults;
    protected providerDefaults: Partial<MessageStreamParams> = MessageStreamParamsDefaults;

    constructor(
        private readonly messageTranslator: ClaudeMessageTranslator,
        private readonly toolTranslator: ClaudeToolTranslator,
        private readonly toolChoiceTranslator: ClaudeToolChoiceTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<MessageStreamParams>> {
        const [messages, tools, tool_choice] = await Promise.all([
            source.messages ? this.messageTranslator.fromHoloArray(source.messages) : Promise.resolve<MessageParam[] | undefined>(undefined),
            source.tools ? this.toolTranslator.fromHoloArray(source.tools) : Promise.resolve<Tool[] | undefined>(undefined),
            source.tool_choice ? this.toolChoiceTranslator.fromHolo(source.tool_choice) : Promise.resolve<ToolChoice | undefined>(undefined),
        ]);

        const system = this.buildSystemFromResponseFormat(source.system, source.response_format);

        return pickDefined({
            model: source.model,
            stream: source.stream,
            max_tokens: source.max_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            top_k: source.top_k,
            stop_sequences: source.stop_sequences,
            system,
            service_tier:
                source.service_tier === "auto" ? "auto" :
                    source.service_tier === "standard_only" ? "standard_only" : undefined,
            metadata: source.metadata?.user_id ? {user_id: source.metadata.user_id} : undefined,
            messages: messages && messages.length ? messages : undefined,
            tools: tools && tools.length ? tools : undefined,
            tool_choice: tool_choice,
        }) as Partial<MessageStreamParams>;
    }

    protected async toHoloImpl(source: MessageStreamParams): Promise<Partial<HoloRequest>> {
        const [messages, tools, tool_choice] = await Promise.all([
            source.messages ? this.messageTranslator.toHoloArray(source.messages) : Promise.resolve<HoloMessage[] | undefined>(undefined),
            source.tools ? this.toolTranslator.toHoloArray(source.tools) : Promise.resolve<HoloTool[] | undefined>(undefined),
            source.tool_choice ? this.toolChoiceTranslator.toHolo(source.tool_choice) : Promise.resolve<HoloToolChoice | undefined>(undefined),
        ]);

        return pickDefined({
            model: source.model,
            stream: source.stream,
            max_tokens: source.max_tokens,
            temperature: source.temperature,
            top_p: source.top_p,
            top_k: source.top_k,
            stop_sequences: source.stop_sequences,
            system: Array.isArray(source.system)
                ? source.system
                    .map(b => (b.type === 'text' ? b.text : ''))
                    .filter(Boolean)
                    .join('\n')
                : (typeof source.system === 'string' ? source.system : undefined),
            service_tier: source.service_tier,
            metadata: source.metadata?.user_id ? {user_id: source.metadata.user_id} : undefined,
            messages: messages && messages.length ? messages : undefined,
            tools: tools && tools.length ? tools : undefined,
            tool_choice: tool_choice,
        }) as Partial<HoloRequest>;
    }

    private buildSystemFromResponseFormat(system?: string, rf?: HoloResponseFormat): string | undefined {
        if (!rf) return system;
        const parts: string[] = [];
        if (system?.trim()) parts.push(system.trim());

        if (rf.type === "json_schema") {
            const schemaStr = JSON.stringify(rf.schema, null, 2);
            parts.push(
                `CRITICAL: You MUST respond with ONLY valid JSON that exactly matches this schema. Do not include any text before or after the JSON.\n\nSchema:\n${schemaStr}`
            );
            if (rf.strict) {
                parts.push("\nSTRICT MODE: No additional properties allowed. Every field must match the schema exactly.");
            }
            parts.push("\nYour entire response must be parseable JSON with no additional commentary, explanation, or markdown formatting.");
        } else if (rf.type === "json_object") {
            parts.push("You must respond with a valid JSON object. Do not include any text before or after the JSON.");
        }
        return parts.length ? parts.join(" ") : undefined;
    }
}
