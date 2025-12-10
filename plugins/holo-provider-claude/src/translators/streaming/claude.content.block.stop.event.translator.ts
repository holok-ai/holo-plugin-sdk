import 'reflect-metadata';

import {injectable} from 'tsyringe';
import {ClaudeRawContentBlockStopEvent} from '../../types';
import {BaseStreamTranslator} from "@holokai/sdk/provider";
import {HoloStreamChunk} from "@holokai/sdk";

@injectable()
export class ClaudeContentBlockStopEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawContentBlockStopEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawContentBlockStopEvent> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: ClaudeRawContentBlockStopEvent): Promise<Partial<HoloStreamChunk>[]> {
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
    ): Promise<Partial<ClaudeRawContentBlockStopEvent>[]> {
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
