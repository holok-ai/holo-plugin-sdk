import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk} from '../../../holo';
import {ClaudeRawMessageDeltaEvent} from '../../types';
import {ClaudeRawMessageDeltaEventValidator} from '../../validators';
import {HoloStreamChunkValidator} from '../../../holo/validators';
import {pickDefined} from '../../../../utils';
import {mapClaudeFinishReason, mapHoloFinishReasonToClaude} from '../../utils/finish.reason.mapper';

@injectable()
export class ClaudeMessageDeltaEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawMessageDeltaEvent> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ClaudeRawMessageDeltaEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawMessageDeltaEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawMessageDeltaEvent>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_delta') return [];

        const stop_reason = mapHoloFinishReasonToClaude(source.finish_reason);  // Mapper handles undefined

        // Build usage only if present, don't fabricate values
        const usage = d.usage
            ? pickDefined({
                input_tokens: d.usage.input_tokens,
                output_tokens: d.usage.output_tokens
            })
            : undefined;

        // Emit only if we actually have something to say
        if (!stop_reason && !usage) return [];

        const event: Partial<ClaudeRawMessageDeltaEvent> = {
            type: 'message_delta' as const,
            delta: {
                container: null,  // Required by validator, always null for message_delta
                stop_reason: stop_reason ?? null,
                stop_sequence: null
            },
            ...(usage ? { usage: usage as any } : {})  // Claude usage type is strict but we have partials
        };
        
        return [event];
    }

    protected async toHoloManyImpl(source: ClaudeRawMessageDeltaEvent): Promise<Partial<HoloStreamChunk>[]> {
        // Build usage only if we have valid values - keep it minimal
        const usage = source.usage
            ? pickDefined({
                input_tokens: source.usage.input_tokens ?? undefined,
                output_tokens: source.usage.output_tokens
            })
            : undefined;

        const chunk: Partial<HoloStreamChunk> = pickDefined({
            delta: {
                provider: ProviderType.CLAUDE,
                type: 'message_delta' as const,
                choice: 0,
                delta: {},  // Semantic no-op; finish_reason/usage carry the meaning
                usage: usage ?? undefined,  // Use undefined instead of null for consistency
                provider_delta: source  // Carry raw event for lossless round-trip
            },
            finish_reason: mapClaudeFinishReason(source.delta.stop_reason)  // Mapper handles null/undefined
        }) as Partial<HoloStreamChunk>;
        
        return [chunk];
    }
}
