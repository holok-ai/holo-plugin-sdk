import 'reflect-metadata';

import {injectable} from 'tsyringe';
import {pickDefined} from '@holokai/sdk';
import type {HoloStreamChunk} from '@holokai/types/holo';
import {StreamTranslator} from "@holokai/sdk/provider";
import {RawContentBlockStartEvent} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeContentBlockStartEventTranslator extends StreamTranslator<HoloStreamChunk, RawContentBlockStartEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<RawContentBlockStartEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<RawContentBlockStartEvent>[]> {
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
                }) as Partial<RawContentBlockStartEvent['content_block']>;

                return pickDefined({
                    type: 'content_block_start' as const,
                    index,
                    content_block: contentBlock
                }) as Partial<RawContentBlockStartEvent>;
            });
    }

    protected async toHoloManyImpl(source: RawContentBlockStartEvent): Promise<Partial<HoloStreamChunk>[]> {
        const cb = source.content_block;

        // Only emit for tool_use starts; ignore text/image/etc. starts
        if (cb.type !== 'tool_use') return [];

        // Content block events don't have id/model at top level
        // These would typically be carried from the message_start event in a streaming context
        const chunk: Partial<HoloStreamChunk> = {
            // id and model are not available on content_block_start events
            // The streaming orchestrator would need to maintain these from message_start
            delta: {
                provider: 'claude',
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
