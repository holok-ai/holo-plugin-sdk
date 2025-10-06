import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {ClaudeRawContentBlockStartEvent} from '../../types';
import {ClaudeRawContentBlockStartEventValidator} from '../../validators';
import {pickDefined} from '../../../../utils';

@injectable()
export class ClaudeContentBlockStartEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawContentBlockStartEvent> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ClaudeRawContentBlockStartEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawContentBlockStartEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawContentBlockStartEvent>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_delta') return [];

        const tcs = d.delta?.tool_calls ?? [];
        if (!tcs.length) return [];

        // Handle multiple tool calls - emit one content_block_start per call
        return tcs
            .filter(tc => tc.function?.name)
            .map((tc, i) => {
                // Prefer provided index; otherwise fall back to i
                const index = (typeof d.index === 'number') ? d.index : i;

                // Build content block without any type casts
                const contentBlock = pickDefined({
                    type: 'tool_use' as const,
                    name: tc.function!.name,
                    input: {}, // shell; args fragments arrive later
                    id: tc.id
                }) as Partial<ClaudeRawContentBlockStartEvent['content_block']>;

                return pickDefined({
                    type: 'content_block_start' as const,
                    index,
                    content_block: contentBlock
                }) as Partial<ClaudeRawContentBlockStartEvent>;
            });
    }

    protected async toHoloManyImpl(source: ClaudeRawContentBlockStartEvent): Promise<Partial<HoloStreamChunk>[]> {
        const cb = source.content_block;

        // Only emit for tool_use starts; ignore text/image/etc. starts
        if (cb.type !== 'tool_use') return [];

        // Content block events don't have id/model at top level
        // These would typically be carried from the message_start event in a streaming context
        const chunk: Partial<HoloStreamChunk> = {
            // id and model are not available on content_block_start events
            // The streaming orchestrator would need to maintain these from message_start
            delta: {
                provider: ProviderType.CLAUDE,
                type: 'message_delta' as const,
                index: source.index,
                delta: {
                    role: 'assistant' as const,  // Tool-use shells are authored by the assistant
                    tool_calls: [{
                        id: cb.id,
                        type: 'function' as const,
                        function: {
                            name: cb.name,
                            arguments: {}  // Shell; args fragments arrive later
                        }
                    }]
                },
                provider_delta: source  // Carry raw event for lossless round-trip
            }
        };

        return [chunk];
    }
}
