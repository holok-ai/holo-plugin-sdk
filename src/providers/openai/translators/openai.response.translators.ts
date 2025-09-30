import 'reflect-metadata';
import {HoloFinishReason, HoloMessage, HoloResponse, HoloResponseValidator} from "../../holo";
import {OpenAIChatCompletion, OpenAIResponse} from "../types";
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
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
            case 'function_call':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop'; // Default to 'stop' instead of null
        }
    }

    private mapFinishReasonToHolo(reason?: string | null): HoloFinishReason | null {
        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
                return 'tool_calls';
            case 'function_call':
                return 'function_call';
            case 'content_filter':
                return 'content_filter';
            default:
                return null;
        }
    }

    protected async fromHoloImpl(source: HoloResponse): Promise<Partial<OpenAIResponse>> {
        // Build message (let the message translator decide content null vs empty)
        const message =
            source.messages?.length
                ? await this.responseMessageTranslator.fromHolo(source.messages[0])
                : undefined;

        const usage = source.usage
            ? await this.usageTranslator.fromHolo(source.usage)
            : undefined;

        // Choice
        const choice: OpenAIChatCompletion["choices"][number] = pickDefined({
            index: 0,
            message, // omit if undefined
            finish_reason: this.mapFinishReasonFromHolo(source.finish_reason),
            // logprobs: undefined  // omit unless you actually have it
        }) as any;

        // Only include choices if we have a message
        const choices = message ? [choice] : undefined;

        const createdSec =
            typeof source.created === 'number'
                ? Math.floor(source.created / 1000)
                : Math.floor(Date.now() / 1000);

        // If we ended up without a message/choices and no id/model, return {}
        return pickDefined({
            id: source.id,                         // omit if undefined
            object: 'chat.completion',
            created: createdSec,
            model: source.model,
            choices,
            usage                                  // omit if undefined
        }) as Partial<OpenAIResponse>;
    }

    protected async toHoloImpl(source: OpenAIResponse): Promise<Partial<HoloResponse>> {
        if ('choices' in source && source.choices?.length) {
            const completion = source as OpenAIChatCompletion;
            const choice = completion.choices[0];

            if (!choice?.message) return {};

            const holoMessage = await this.responseMessageTranslator.toHolo(choice.message);
            const messages = Object.keys(holoMessage).length ? [holoMessage as HoloMessage] : undefined;

            const usage = completion.usage
                ? await this.usageTranslator.toHolo(completion.usage)
                : undefined;

            return pickDefined({
                id: completion.id,
                model: completion.model,
                messages, // omit if undefined
                finish_reason: this.mapFinishReasonToHolo(choice.finish_reason),
                created: completion.created ? completion.created * 1000 : Date.now(),
                usage,    // omit if undefined
            }) as Partial<HoloResponse>;
        }

        // Streaming handled elsewhere
        return {};
    }
}
