import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClaudeRawContentBlockDeltaEvent} from '../../types';
import {HoloStreamChunk} from "@holokai/sdk";
import {BaseStreamTranslator} from "@holokai/sdk/provider";

@injectable()
export class ClaudeContentBlockDeltaEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawContentBlockDeltaEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawContentBlockDeltaEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawContentBlockDeltaEvent>[]> {
        const out: Partial<ClaudeRawContentBlockDeltaEvent>[] = [];
        const d = source.delta;
        if (!d) return out;

        // 1) Text → Claude text_delta
        if (d.type === 'content_delta' && typeof d.delta?.content === 'string') {
            out.push({
                type: 'content_block_delta' as const,
                index: d.index ?? 0,  // Preserve index: 0
                delta: {
                    type: 'text_delta' as const,
                    text: d.delta.content
                }
            });
        }

        // 2) Tool arg fragments → pass-through raw Claude event(s) from provider_delta
        // Only process if provider is Claude to avoid mixing provider events
        if (d.type === 'message_delta' && d.provider === 'claude' && d.provider_delta) {
            const rawList = Array.isArray(d.provider_delta) ? d.provider_delta : [d.provider_delta];

            for (const raw of rawList) {
                const ev = raw;
                // Only forward input_json_delta events (tool arg fragments)
                if (ev.type === 'content_block_delta' && ev.delta?.type === 'input_json_delta') {
                    out.push(ev);  // Lossless pass-through
                }
            }
        }

        return out;
    }

    protected async toHoloManyImpl(source: ClaudeRawContentBlockDeltaEvent): Promise<Partial<HoloStreamChunk>[]> {
        const out: Partial<HoloStreamChunk>[] = [];

        if (source.delta.type === 'text_delta' && source.delta.text) {
            out.push({
                delta: {
                    provider: 'claude',
                    type: 'content_delta' as const,
                    index: source.index,
                    delta: {
                        // Omitting role for cleaner deltas - it's implied by context
                        content: source.delta.text
                    },
                    // Carry raw event for lossless round-trip
                    provider_delta: source
                }
            });
        }

        if (source.delta.type === 'input_json_delta' && source.delta.partial_json) {
            // Tool argument fragments - downstream accumulation required
            out.push({
                delta: {
                    provider: 'claude',
                    type: 'message_delta' as const,
                    index: source.index,
                    delta: {
                        // Empty delta - the real content is in provider_delta
                    },
                    // Carry raw event for proper processing
                    provider_delta: source
                }
            });
        }

        // Future: Handle other delta types (citations_delta, thinking_delta, etc.)
        // For now, we only process text and tool argument deltas

        return out;
    }
}
