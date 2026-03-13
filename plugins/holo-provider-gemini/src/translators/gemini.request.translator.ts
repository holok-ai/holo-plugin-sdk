import 'reflect-metadata';
import {GeminiMessageTranslator} from "./gemini.message.translator";
import {GeminiToolChoiceTranslator, GeminiToolTranslator} from "./gemini.tool.translator";
import {injectable} from 'tsyringe';
import {HoloRequestDefaults, pickDefined} from "@holokai/sdk";
import type {HoloMessage, HoloRequest, HoloResponseFormat, HoloTool, HoloToolChoice} from "@holokai/types/holo";
import {BaseTranslator} from "@holokai/sdk/provider";
import type {Content, FunctionCallingConfig, FunctionDeclaration, GenerateContentConfig} from "@google/genai";

interface GeminiRequest {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
}

const GeminiRequestDefaults: Partial<GeminiRequest> = {};

@injectable()
export class GeminiRequestTranslator extends BaseTranslator<HoloRequest, GeminiRequest> {
    protected holoDefaults: Partial<HoloRequest> = HoloRequestDefaults;
    protected providerDefaults: Partial<GeminiRequest> = GeminiRequestDefaults;

    constructor(
        private readonly messageTranslator: GeminiMessageTranslator,
        private readonly toolTranslator: GeminiToolTranslator,
        private readonly toolChoiceTranslator: GeminiToolChoiceTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloRequest): Promise<Partial<GeminiRequest>> {
        const [contents, functionDeclarations, functionCallingConfig] = await Promise.all([
            source.messages ? this.messageTranslator.fromHoloArray(source.messages) : Promise.resolve<Content[] | undefined>(undefined),
            source.tools ? this.toolTranslator.fromHoloArray(source.tools) : Promise.resolve<FunctionDeclaration[] | undefined>(undefined),
            source.tool_choice ? this.toolChoiceTranslator.fromHolo(source.tool_choice) : Promise.resolve<FunctionCallingConfig | undefined>(undefined),
        ]);

        const config: GenerateContentConfig = {};

        if (source.system) {
            config.systemInstruction = source.system;
        }

        if (source.max_tokens !== undefined) {
            config.maxOutputTokens = source.max_tokens;
        }
        if (source.temperature !== undefined) {
            config.temperature = source.temperature;
        }
        if (source.top_p !== undefined) {
            config.topP = source.top_p;
        }
        if (source.top_k !== undefined) {
            config.topK = source.top_k;
        }
        if (source.stop_sequences?.length) {
            config.stopSequences = source.stop_sequences;
        }

        if (functionDeclarations?.length) {
            config.tools = [{functionDeclarations}];
        }

        if (functionCallingConfig) {
            config.toolConfig = {functionCallingConfig};
        }

        if (source.response_format) {
            this.applyResponseFormat(config, source.response_format);
        }

        return pickDefined({
            model: source.model,
            contents: contents && contents.length ? contents as Content[] : undefined,
            config: Object.keys(config).length ? config : undefined
        }) as Partial<GeminiRequest>;
    }

    protected async toHoloImpl(source: GeminiRequest): Promise<Partial<HoloRequest>> {
        const [messages, tools, tool_choice] = await Promise.all([
            source.contents ? this.messageTranslator.toHoloArray(source.contents) : Promise.resolve<HoloMessage[] | undefined>(undefined),
            source.config?.tools?.[0]?.functionDeclarations
                ? this.toolTranslator.toHoloArray(source.config.tools[0].functionDeclarations)
                : Promise.resolve<HoloTool[] | undefined>(undefined),
            source.config?.toolConfig?.functionCallingConfig
                ? this.toolChoiceTranslator.toHolo(source.config.toolConfig.functionCallingConfig)
                : Promise.resolve<HoloToolChoice | undefined>(undefined),
        ]);

        const system = typeof source.config?.systemInstruction === 'string'
            ? source.config.systemInstruction
            : undefined;

        return pickDefined({
            model: source.model,
            max_tokens: source.config?.maxOutputTokens,
            temperature: source.config?.temperature,
            top_p: source.config?.topP,
            top_k: source.config?.topK,
            stop_sequences: source.config?.stopSequences,
            system,
            messages: messages && messages.length ? messages : undefined,
            tools: tools && tools.length ? tools : undefined,
            tool_choice: tool_choice
        }) as Partial<HoloRequest>;
    }

    private applyResponseFormat(config: GenerateContentConfig, rf: HoloResponseFormat): void {
        if (rf.type === 'json_schema') {
            config.responseMimeType = 'application/json';
            config.responseSchema = rf.schema as any;
        } else if (rf.type === 'json_object') {
            config.responseMimeType = 'application/json';
        }
    }
}
