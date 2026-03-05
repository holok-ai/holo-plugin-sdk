import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {v4 as uuidv4} from 'uuid';
import {pickDefined} from '@holokai/sdk';
import {HoloStreamChunk} from '@holokai/types/holo';
import {StreamTranslator} from "@holokai/sdk/provider";
import {ChatCompletionChunk} from "openai/resources/chat/completions/completions";

@injectable()
export class OpenAIMessageStartTranslator extends StreamTranslator<HoloStreamChunk, ChatCompletionChunk> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ChatCompletionChunk> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: ChatCompletionChunk): Promise<Partial<HoloStreamChunk>[]> {
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
                    provider: 'openai',
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

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ChatCompletionChunk>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_start') return [];

        // Fast pass-through if we already carry an OpenAI chunk
        if (d.provider === 'OPENAI' && d.provider_delta) {
            return [d.provider_delta];
        }

        const id = source.id || this.providerDefaults.id || uuidv4();
        const createdSec = source.created
            ? Math.floor(source.created / 1000) // ms → sec
            : Math.floor(Date.now() / 1000);
        const model = source.model || this.providerDefaults.model;

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
        }) as Partial<ChatCompletionChunk>];
    }
}
