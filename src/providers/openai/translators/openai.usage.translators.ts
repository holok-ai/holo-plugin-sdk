import 'reflect-metadata';
import {OpenAICompletionUsage} from "../types";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";
import {HoloUsage} from "@holokai/sdk";
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class OpenAIUsageTranslator extends BaseTranslator<HoloUsage, OpenAICompletionUsage> {
    protected holoDefaults: Partial<HoloUsage> = {};
    protected providerDefaults: Partial<OpenAICompletionUsage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloUsage): Promise<Partial<OpenAICompletionUsage>> {
        return pickDefined({
            prompt_tokens: source.input_tokens,
            completion_tokens: source.output_tokens,
            total_tokens: source.total_tokens,
            // OpenAI-specific fields omitted
        }) as Partial<OpenAICompletionUsage>;
    }

    protected async toHoloImpl(source: OpenAICompletionUsage): Promise<Partial<HoloUsage>> {
        return pickDefined({
            input_tokens: source.prompt_tokens,
            output_tokens: source.completion_tokens,
            total_tokens: source.total_tokens,
            // OpenAI doesn't provide cache or service tier info in usage - omit these fields
        }) as Partial<HoloUsage>;
    }
}