import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {pickDefined} from "@holokai/sdk";
import {HoloUsage} from "@holokai/types/holo";
import {BaseTranslator} from "@holokai/sdk/provider";
import {CompletionUsage} from "openai/resources/completions";

@injectable()
export class OpenAIUsageTranslator extends BaseTranslator<HoloUsage, CompletionUsage> {
    protected holoDefaults: Partial<HoloUsage> = {};
    protected providerDefaults: Partial<CompletionUsage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloUsage): Promise<Partial<CompletionUsage>> {
        return pickDefined({
            prompt_tokens: source.input_tokens,
            completion_tokens: source.output_tokens,
            total_tokens: source.total_tokens,
            // OpenAI-specific fields omitted
        }) as Partial<CompletionUsage>;
    }

    protected async toHoloImpl(source: CompletionUsage): Promise<Partial<HoloUsage>> {
        return pickDefined({
            input_tokens: source.prompt_tokens,
            output_tokens: source.completion_tokens,
            total_tokens: source.total_tokens,
            // OpenAI doesn't provide cache or service tier info in usage - omit these fields
        }) as Partial<HoloUsage>;
    }
}
