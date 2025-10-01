import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ArkErrors} from 'arktype';
import {v4 as uuidv4} from 'uuid';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloFinishReason, HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {OpenAIChatCompletionChunk} from '../../types';
import {OpenAIChatCompletionChunkValidator} from '../../validators';
import {pickDefined} from '../../../../utils';

@injectable()
export class OpenAIMessageStopTranslator extends BaseStreamTranslator<HoloStreamChunk, OpenAIChatCompletionChunk> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = OpenAIChatCompletionChunkValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionChunk> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: OpenAIChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // Emit a message_stop per choice that has a finish_reason
        for (const ch of source.choices) {
            if (!ch.finish_reason) continue;

            const choiceIndex = Number.isInteger(ch.index) && ch.index >= 0 ? ch.index : 0;

            results.push(pickDefined({
                id: source.id,
                model: source.model,
                created: source.created * 1000, // sec → ms
                delta: {
                    provider: 'openai' as const,
                    type: 'message_stop' as const,
                    choice: choiceIndex,
                    delta: {},
                    provider_delta: source // Full raw chunk for lossless replay & validation
                },
                finish_reason: this.mapOpenAIFinishReason(ch.finish_reason)
                // Note: do not set done here; leave it to orchestrator
            }) as Partial<HoloStreamChunk>);
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<OpenAIChatCompletionChunk>[]> {
        const logger = this.mlog(this.fromHoloManyImpl);
        const d = source.delta;
        if (!d || d.type !== 'message_stop') return [];

        // Fast pass-through if we already have an OpenAI chunk
        if (d.provider === 'openai' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        const createdSec = source.created
            ? Math.floor(source.created / 1000) // ms → sec
            : Math.floor(Date.now() / 1000);
        const id = source.id || this.providerDefaults.id || uuidv4();
        const model = source.model || this.providerDefaults.model;

        if (!id || !model) {
            logger.warn('OpenAIMessageStopTranslator: id or model missing; orchestrator should supply via providerDefaults');
        }

        const choiceIndex = d.choice !== undefined && Number.isInteger(d.choice) && d.choice >= 0 ? d.choice : 0;

        return [pickDefined({
            id,
            object: 'chat.completion.chunk' as const,
            created: createdSec,
            model,
            choices: [{
                index: choiceIndex,
                delta: {},
                finish_reason: this.mapHoloFinishReasonToOpenAI(source.finish_reason)
            }],
            system_fingerprint: this.providerDefaults.system_fingerprint,
            service_tier: this.providerDefaults.service_tier
        }) as Partial<OpenAIChatCompletionChunk>];
    }

    private mapOpenAIFinishReason(
        reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call'
    ): HoloFinishReason {
        // 1:1 mapping; do not invent defaults
        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            case 'function_call':
                return 'function_call';
        }
    }

    private mapHoloFinishReasonToOpenAI(
        reason?: HoloFinishReason | null
    ): 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null {
        if (!reason) return null; // Better than forcing 'stop'

        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            case 'function_call':
                return 'function_call';
            default:
                return null;
        }
    }
}
