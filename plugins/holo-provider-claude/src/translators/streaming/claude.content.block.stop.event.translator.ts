import 'reflect-metadata';

import {injectable} from 'tsyringe';
import {StreamTranslator} from "@holokai/sdk/provider";
import type {HoloStreamChunk} from "@holokai/types/holo";
import {RawContentBlockStopEvent} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeContentBlockStopEventTranslator extends StreamTranslator<HoloStreamChunk, RawContentBlockStopEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<RawContentBlockStopEvent> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: RawContentBlockStopEvent): Promise<Partial<HoloStreamChunk>[]> {
        return [{
            // id/model typically carried by orchestrator from message_start
            delta: {
                provider: 'claude',
                type: 'message_delta' as const,
                index: source.index, // which block just stopped
                delta: {},           // no content change
                provider_delta: source
            }
        }];
    }

    protected async fromHoloManyImpl(
        source: HoloStreamChunk
    ): Promise<Partial<RawContentBlockStopEvent>[]> {
        const {delta} = source;
        const pd = delta?.provider_delta;

        // Only pass through if it's a valid Claude stop event
        if (delta?.provider === 'claude' && pd) {

            if (pd.type === 'content_block_stop') {
                return [pd];
            }
        }

        return [];
    }
}
