import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {v4 as uuidv4} from 'uuid';
import {ClaudeUsageTranslator} from '../claude.usage.translators';
import {StreamTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloStreamChunk} from "@holokai/types/holo";
import {Message, RawMessageStartEvent} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeMessageStartEventTranslator extends StreamTranslator<HoloStreamChunk, RawMessageStartEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<RawMessageStartEvent> = {};

    constructor(private readonly usageTranslator: ClaudeUsageTranslator) {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<RawMessageStartEvent>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_start') return [];

        // Must have model; id is optional (generate stable ID if missing)
        if (!source.model) return [];

        // Build message - usage is typically not present at message_start
        // When it is needed, it should have all required fields from the source
        const message: Partial<Message> = pickDefined({
            // Generate stable ID if not present, don't use empty string
            id: source.id ?? uuidv4(),
            model: source.model,
            type: 'message' as const,
            role: 'assistant' as const,
            content: [],  // Claude expects an array
            stop_reason: null,
            stop_sequence: null,
            container: null
            // Omit usage for message_start - it's rarely present and when needed
            // should come through message_delta or message_stop events
        });

        return [{
            type: 'message_start' as const,
            message: message as Message
        }];
    }

    protected async toHoloManyImpl(source: RawMessageStartEvent): Promise<Partial<HoloStreamChunk>[]> {
        // Use the usage translator to convert usage (rarely present on message_start)
        const usage = source.message.usage
            ? await this.usageTranslator.toHolo(source.message.usage)
            : null;

        return [{
            id: source.message.id,
            model: source.message.model,
            delta: {
                provider: 'claude',
                type: 'message_start' as const,
                choice: 0,  // Claude is always single-choice
                delta: {
                    role: 'assistant' as const
                },
                // Include usage if present (uncommon for message_start)
                usage,
                // Carry raw event for lossless round-trip
                provider_delta: source
            }
            // Alternatively: put usage at chunk level for final events only
            // usage: usage as HoloUsage | undefined
        }];
    }
}
