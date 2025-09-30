import 'reflect-metadata';
import {HoloFinishReason, HoloMessage, HoloResponse, HoloResponseValidator} from "../../holo";
import {OpenAIResponse, OpenAIChatCompletion} from "../types";
import {OpenAIResponseMessageTranslator} from "./openai.response.message.translators";
import {OpenAIUsageTranslator} from "./openai.usage.translators";
import {OpenAIChatCompletionValidator} from "../validators";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class OpenAIResponseTranslator extends BaseTranslator<HoloResponse, OpenAIResponse> {
    protected holoValidator = HoloResponseValidator;
    protected providerValidator = OpenAIChatCompletionValidator; // For non-streaming responses
    protected holoDefaults: Partial<HoloResponse> = {};
    protected providerDefaults: Partial<OpenAIResponse> = {};

    constructor(
        private readonly responseMessageTranslator: OpenAIResponseMessageTranslator,
        private readonly usageTranslator: OpenAIUsageTranslator
    ) {
        super();
    }

    private mapFinishReasonFromHolo(reason?: HoloFinishReason | null): OpenAIChatCompletion["choices"][0]["finish_reason"] {
        switch (reason) {
            case 'stop': return 'stop';
            case 'length': return 'length';
            case 'tool_calls':
            case 'function_call': return 'tool_calls';
            case 'content_filter': return 'content_filter';
            default: return 'stop'; // Default to 'stop' instead of null
        }
    }

    private mapFinishReasonToHolo(reason?: string | null): HoloFinishReason | null {
        switch (reason) {
            case 'stop': return 'stop';
            case 'length': return 'length';
            case 'tool_calls': return 'tool_calls';
            case 'function_call': return 'function_call';
            case 'content_filter': return 'content_filter';
            default: return null;
        }
    }

    protected async fromHoloImpl(source: HoloResponse): Promise<Partial<OpenAIResponse>> {
        // For OpenAI, we work with the full response format
        // Streaming chunks are handled separately in streaming contexts
        const messageResult = source.messages?.length 
            ? await this.responseMessageTranslator.fromHolo(source.messages[0])
            : {
                role: 'assistant' as const,
                content: ''
            };

        const usageResult = source.usage 
            ? await this.usageTranslator.fromHolo(source.usage)
            : undefined;

        // Create a choice object
        const choice = {
            index: 0,
            message: messageResult,
            finish_reason: this.mapFinishReasonFromHolo(source.finish_reason),
            logprobs: null
        };

        // Directly construct the result to match OpenAI response structure
        const result: any = {
            id: source.id || '',
            object: 'chat.completion',
            created: source.created ? Math.floor((source.created as number) / 1000) : Math.floor(Date.now() / 1000),
            model: source.model || '',
            choices: [choice],
            usage: usageResult,
            system_fingerprint: null,
            service_tier: null,
        };

        return pickDefined(result);
    }

    protected async toHoloImpl(source: OpenAIResponse): Promise<Partial<HoloResponse>> {
        // Handle streaming vs non-streaming responses
        if ('choices' in source && source.choices?.length) {
            // Non-streaming response
            const completion = source as OpenAIChatCompletion;
            const choice = completion.choices[0];
            
            if (!choice?.message) {
                return {};
            }

            // Convert OpenAI message back to Holo message using message translator
            const holoMessage = await this.responseMessageTranslator.toHolo(choice.message);
            const messages = Object.keys(holoMessage).length ? [holoMessage as HoloMessage] : [];

            // Convert usage back to Holo if present
            const usage = completion.usage 
                ? await this.usageTranslator.toHolo(completion.usage)
                : undefined;

            return pickDefined({
                id: completion.id,
                model: completion.model,
                messages,
                finish_reason: this.mapFinishReasonToHolo(choice.finish_reason),
                created: completion.created ? completion.created * 1000 : Date.now(),
                usage
            }) as Partial<HoloResponse>;
        } else {
            // Streaming chunk - for now, return minimal response
            // Streaming events are typically handled in streaming contexts
            return {};
        }
    }
}