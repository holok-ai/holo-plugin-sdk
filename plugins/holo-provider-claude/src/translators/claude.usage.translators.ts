import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloUsage} from "@holokai/types/holo";
import {Usage} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeUsageTranslator extends BaseTranslator<HoloUsage, Usage> {
    protected holoDefaults: Partial<HoloUsage> = {};
    protected providerDefaults: Partial<Usage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloUsage): Promise<Partial<Usage>> {
        return pickDefined({
            input_tokens: source.input_tokens,
            output_tokens: source.output_tokens,
            cache_read_input_tokens: source.cache_read_tokens,
            cache_creation_input_tokens: source.cache_write_tokens,
            service_tier: ['standard', 'priority', 'batch'].includes(source.service_tier || '')
                ? source.service_tier as 'standard' | 'priority' | 'batch'
                : null,
            cache_creation: null, // Typically not provided from Holo
            server_tool_use: null, // Typically not provided from Holo
        });
    }

    protected async toHoloImpl(source: Usage): Promise<Partial<HoloUsage>> {
        return pickDefined({
            input_tokens: source.input_tokens,
            output_tokens: source.output_tokens,
            total_tokens: source.input_tokens && source.output_tokens
                ? source.input_tokens + source.output_tokens
                : undefined,
            cache_read_tokens: source.cache_read_input_tokens || undefined,
            cache_write_tokens: source.cache_creation_input_tokens || undefined,
            service_tier: source.service_tier || undefined,
        }) as Partial<HoloUsage>;
    }
}
