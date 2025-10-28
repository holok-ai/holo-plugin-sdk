import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {HoloStreamChunk} from '../../../holo';
import {ClaudeRawMessageStopEvent} from '../../types';
import {ClaudeRawMessageStopEventValidator} from '../../validators';
import {HoloStreamChunkValidator} from '../../../holo/validators';
import {ArkErrors} from 'arktype';
import {BaseStreamTranslator} from "../../../base.stream.translator";

@injectable()
export class ClaudeMessageStopEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawMessageStopEvent> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ClaudeRawMessageStopEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawMessageStopEvent> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawMessageStopEvent>[]> {
        const d = source.delta;
        if (!d) return [];

        // Pass-through if we already have a valid Claude stop event as provider_delta
        if (d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors) && validated.type === 'message_stop') {
                return [validated];
            }
        }

        // Otherwise emit only when Holo says message_stop
        if (d.type === 'message_stop') {
            return [{type: 'message_stop' as const}];
        }

        return [];
    }

    protected async toHoloManyImpl(source: ClaudeRawMessageStopEvent): Promise<Partial<HoloStreamChunk>[]> {
        return [{
            delta: {
                provider: ProviderType.CLAUDE,
                type: 'message_stop' as const,
                delta: {},
                provider_delta: source, // carry raw event for lossless round-trip
            },
            done: true
        }];
    }
}
