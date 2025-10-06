import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {v4 as uuidv4} from 'uuid';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk} from '../../../holo';
import {ClaudeRawMessageStartEvent, ClaudeResponseMessage} from '../../types';
import {ClaudeRawMessageStartEventValidator} from '../../validators';
import {HoloStreamChunkValidator} from '../../../holo/validators';
import {pickDefined} from '../../../../utils';
import {ClaudeUsageTranslator} from '../claude.usage.translators';

@injectable()
export class ClaudeMessageStartEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawMessageStartEvent> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ClaudeRawMessageStartEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawMessageStartEvent> = {};

    constructor(private readonly usageTranslator: ClaudeUsageTranslator) {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawMessageStartEvent>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_start') return [];

        // Must have model; id is optional (generate stable ID if missing)
        if (!source.model) return [];

        // Build message - usage is typically not present at message_start
        // When it is needed, it should have all required fields from the source
        const message: Partial<ClaudeResponseMessage> = pickDefined({
            // Generate stable ID if not present, don't use empty string
            id: source.id ?? uuidv4(),
            model: source.model,
            type: 'message' as const,
            role: 'assistant' as const,
            content: [],  // Claude expects an array
            stop_reason: null,
            stop_sequence: null,
            container: null
            // Omit usage for message_start - it's rarely present and when needed
            // should come through message_delta or message_stop events
        });

        return [{
            type: 'message_start' as const,
            message: message as ClaudeResponseMessage
        }];
    }

    protected async toHoloManyImpl(source: ClaudeRawMessageStartEvent): Promise<Partial<HoloStreamChunk>[]> {
        // Use the usage translator to convert usage (rarely present on message_start)
        const usage = source.message.usage
            ? await this.usageTranslator.toHolo(source.message.usage)
            : null;

        return [{
            id: source.message.id,
            model: source.message.model,
            delta: {
                provider: ProviderType.CLAUDE,
                type: 'message_start' as const,
                choice: 0,  // Claude is always single-choice
                delta: {
                    role: 'assistant' as const
                },
                // Include usage if present (uncommon for message_start)
                usage,
                // Carry raw event for lossless round-trip
                provider_delta: source
            }
            // Alternatively: put usage at chunk level for final events only
            // usage: usage as HoloUsage | undefined
        }];
    }
}
