import 'reflect-metadata';
import {HoloUsage, HoloUsageValidator} from "../../holo";
import {ClaudeUsage} from "../types";
import {ClaudeUsageValidator} from "../validators";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class ClaudeUsageTranslator extends BaseTranslator<HoloUsage, ClaudeUsage> {
    protected holoValidator = HoloUsageValidator;
    protected providerValidator = ClaudeUsageValidator;
    protected holoDefaults: Partial<HoloUsage> = {};
    protected providerDefaults: Partial<ClaudeUsage> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloUsage): Promise<Partial<ClaudeUsage>> {
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

    protected async toHoloImpl(source: ClaudeUsage): Promise<Partial<HoloUsage>> {
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
