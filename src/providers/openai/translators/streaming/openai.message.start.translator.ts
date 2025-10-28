import 'reflect-metadata';
import {ProviderType} from '../../../types';
import {injectable} from 'tsyringe';
import {ArkErrors} from 'arktype';
import {v4 as uuidv4} from 'uuid';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {OpenAIChatCompletionChunk} from '../../types';
import {OpenAIChatCompletionChunkValidator} from '../../validators';
import {pickDefined} from '../../../../utils';

@injectable()
export class OpenAIMessageStartTranslator extends BaseStreamTranslator<HoloStreamChunk, OpenAIChatCompletionChunk> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = OpenAIChatCompletionChunkValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionChunk> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: OpenAIChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
        // OpenAI signals start when a choice delta has role
        const roleChoices = source.choices.filter(c => c.delta?.role);
        if (roleChoices.length === 0) return [];

        // Emit one message_start per choice with role (rare but correct for n>1)
        return roleChoices.map(roleChoice => {
            const choiceIndex = Number.isInteger(roleChoice.index) && roleChoice.index >= 0 ? roleChoice.index : 0;

            return pickDefined({
                id: source.id,
                model: source.model,
                created: source.created * 1000, // sec → ms
                delta: {
                    provider: ProviderType.OPENAI,
                    type: 'message_start' as const,
                    choice: choiceIndex,
                    delta: {
                        role: roleChoice.delta!.role // 'assistant' etc.
                    },
                    // Store full source chunk for lossless round-trips
                    provider_delta: source
                }
            }) as Partial<HoloStreamChunk>;
        });
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<OpenAIChatCompletionChunk>[]> {
        const logger = this.mlog(this.fromHoloManyImpl);
        const d = source.delta;
        if (!d || d.type !== 'message_start') return [];

        // Fast pass-through if we already carry an OpenAI chunk
        if (d.provider === 'OPENAI' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        const id = source.id || this.providerDefaults.id || uuidv4();
        const createdSec = source.created
            ? Math.floor(source.created / 1000) // ms → sec
            : Math.floor(Date.now() / 1000);
        const model = source.model || this.providerDefaults.model;

        if (!model) {
            logger.warn('OpenAIMessageStartTranslator: model missing; orchestrator should supply it via providerDefaults');
        }

        const choiceIndex = d.choice !== undefined && Number.isInteger(d.choice) && d.choice >= 0 ? d.choice : 0;

        return [pickDefined({
            id,
            object: 'chat.completion.chunk' as const,
            created: createdSec,
            model,
            choices: [{
                index: choiceIndex,
                delta: {
                    role: d.delta?.role || 'assistant'
                },
                finish_reason: null
            }]
        }) as Partial<OpenAIChatCompletionChunk>];
    }
}
