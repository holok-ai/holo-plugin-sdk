import 'reflect-metadata';
import {injectable} from 'tsyringe';
import type {HoloStreamChunk} from "@holokai/types/holo";
import {StreamTranslator} from "@holokai/sdk/provider";
import {RawMessageStopEvent} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeMessageStopEventTranslator extends StreamTranslator<HoloStreamChunk, RawMessageStopEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<RawMessageStopEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<RawMessageStopEvent>[]> {
        const d = source.delta;
        if (!d) return [];

        // Pass-through if we already have a valid Claude stop event as provider_delta
        if (d.provider_delta) {
            if (d.provider_delta.type === 'message_stop') {
                return [d.provider_delta];
            }
        }

        // Otherwise emit only when Holo says message_stop
        if (d.type === 'message_stop') {
            return [{type: 'message_stop' as const}];
        }

        return [];
    }

    protected async toHoloManyImpl(source: RawMessageStopEvent): Promise<Partial<HoloStreamChunk>[]> {
        return [{
            delta: {
                provider: 'claude',
                type: 'message_stop' as const,
                delta: {},
                provider_delta: source, // carry raw event for lossless round-trip
            },
            done: true
        }];
    }
}
