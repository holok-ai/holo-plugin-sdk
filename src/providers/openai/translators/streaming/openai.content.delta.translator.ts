import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ArkErrors} from 'arktype';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {OpenAIChatCompletionChunk} from '../../types';
import {OpenAIChatCompletionChunkValidator} from '../../validators';
import {pickDefined} from '../../../../utils';
import {v4 as uuidv4} from 'uuid';

@injectable()
export class OpenAIContentDeltaTranslator extends BaseStreamTranslator<HoloStreamChunk, OpenAIChatCompletionChunk> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = OpenAIChatCompletionChunkValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionChunk> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: OpenAIChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // Process each choice (OpenAI supports n>1)
        for (const choice of source.choices) {
            const content = typeof choice.delta?.content === 'string' ? choice.delta.content : '';

            // Skip only if no content (OpenAI streams null during tool_calls/refusal)
            if (content.length === 0) continue;

            const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0 ? choice.index : 0;

            results.push(pickDefined({
                id: source.id,
                model: source.model,
                created: source.created * 1000, // sec -> ms
                delta: {
                    provider: 'openai' as const,
                    type: 'content_delta' as const,
                    choice: choiceIndex,
                    delta: {
                        content: content
                    },
                    // Lean provider_delta: store only per-choice data
                    provider_delta: pickDefined({
                        id: source.id,
                        model: source.model,
                        created: source.created,
                        choices: [{
                            index: choice.index,
                            delta: { content },
                            finish_reason: null
                        }],
                        object: 'chat.completion.chunk',
                        system_fingerprint: source.system_fingerprint,
                        service_tier: source.service_tier
                    })
                }
            }) as Partial<HoloStreamChunk>);
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<OpenAIChatCompletionChunk>[]> {
        const d = source.delta;
        if (!d || d.type !== 'content_delta') return [];

        // Fast pass-through for OpenAI→OpenAI streaming
        if (d.provider === 'openai' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        const content = d.delta?.content;
        if (typeof content !== 'string' || content.length === 0) return [];

        const choiceIndex = d.choice !== undefined && Number.isInteger(d.choice) && d.choice >= 0 ? d.choice : 0;

        return [pickDefined({
            id: source.id || this.providerDefaults.id || uuidv4(),
            object: 'chat.completion.chunk' as const,
            created: source.created
                ? Math.floor(source.created / 1000)  // ms -> sec
                : Math.floor(Date.now() / 1000),
            model: source.model || this.providerDefaults.model,
            choices: [{
                index: choiceIndex,
                delta: {
                    content: content
                },
                finish_reason: null
            }]
        }) as Partial<OpenAIChatCompletionChunk>];
    }
}
