import 'reflect-metadata';
import {ClaudeChatRequestDefaults} from "../validators";
import {ClaudeMessageTranslator} from "./claude.message.translators";
import {ClaudeToolChoiceTranslator, ClaudeToolTranslator} from "./claude.tool.translators";
import {ClaudeChatRequest, ClaudeRequestMessage, ClaudeTool, ClaudeToolChoice} from "../types";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";
import {
    HoloMessage,
    HoloRequest,
    HoloRequestDefaults,
    HoloResponseFormat,
    HoloTool,
    HoloToolChoice
} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class ClaudeRequestTranslator extends BaseTranslator<HoloRequest, ClaudeChatRequest> {
    protected holoDefaults: Partial<HoloRequest> = HoloRequestDefaults;
    protected providerDefaults: Partial<ClaudeChatRequest> = ClaudeChatRequestDefaults;

    constructor(
        private readonly messageTranslator: ClaudeMessageTranslator,
        private readonly toolTranslator: ClaudeToolTranslator,
        private readonly toolChoiceTranslator: ClaudeToolChoiceTranslator
    ) {
        super();
    }

    private buildSystemFromResponseFormat(system?: string, rf?: HoloResponseFormat): string | undefined {
        if (!rf) return system;
        const parts: string[] = [];
        if (system?.trim()) parts.push(system.trim());

        if (rf.type === "json_schema") {
            parts.push(
                `You must respond with valid JSON that matches this exact schema: ${JSON.stringify(rf.schema)}.`
            );
            if (rf.strict) {
                parts.push("You must strictly adhere to this schema with no additional properties.");
            }
        } else if (rf.type === "json_object") {
            parts.push("You must respond with a valid JSON object.");
        }
        return parts.length ? parts.join(" ") : undefined;
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<ClaudeChatRequest>> {
        const [messages, tools, tool_choice] = await Promise.all([
            source.messages ? this.messageTranslator.fromHoloArray(source.messages) : Promise.resolve<ClaudeRequestMessage[] | undefined>(undefined),
            source.tools ? this.toolTranslator.fromHoloArray(source.tools) : Promise.resolve<ClaudeTool[] | undefined>(undefined),
            source.tool_choice ? this.toolChoiceTranslator.fromHolo(source.tool_choice) : Promise.resolve<ClaudeToolChoice | undefined>(undefined),
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
        }) as Partial<ClaudeChatRequest>;
    }

    protected async toHoloImpl(source: ClaudeChatRequest): Promise<Partial<HoloRequest>> {
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
}
