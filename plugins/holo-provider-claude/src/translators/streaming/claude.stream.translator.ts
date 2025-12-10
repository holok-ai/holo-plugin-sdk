import 'reflect-metadata';

import {injectable} from 'tsyringe';
import {ClaudeRawMessageStreamEvent} from '../../types';
import {ClaudeMessageStartEventTranslator} from './claude.message.start.event.translator';
import {ClaudeMessageDeltaEventTranslator} from './claude.message.delta.event.translator';
import {ClaudeMessageStopEventTranslator} from './claude.message.stop.event.translator';
import {ClaudeContentBlockStartEventTranslator} from './claude.content.block.start.event.translator';
import {ClaudeContentBlockDeltaEventTranslator} from './claude.content.block.delta.event.translator';
import {ClaudeContentBlockStopEventTranslator} from './claude.content.block.stop.event.translator';
import {mapHoloFinishReasonToClaude} from '../../utils/finish.reason.mapper.js';
import {BaseStreamTranslator} from "@holokai/sdk/provider";
import {HoloStreamChunk} from "@holokai/sdk";

@injectable()
export class ClaudeStreamTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawMessageStreamEvent> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ClaudeRawMessageStreamEvent> = {};

    constructor(
        private readonly messageStartTranslator: ClaudeMessageStartEventTranslator,
        private readonly messageDeltaTranslator: ClaudeMessageDeltaEventTranslator,
        private readonly messageStopTranslator: ClaudeMessageStopEventTranslator,
        private readonly contentBlockStartTranslator: ClaudeContentBlockStartEventTranslator,
        private readonly contentBlockDeltaTranslator: ClaudeContentBlockDeltaEventTranslator,
        private readonly contentBlockStopTranslator: ClaudeContentBlockStopEventTranslator,
    ) {
        super();
    }

    protected async toHoloManyImpl(source: ClaudeRawMessageStreamEvent): Promise<Partial<HoloStreamChunk>[]> {
        switch (source.type) {
            case 'message_start':
                return this.messageStartTranslator.toHoloMany(source);
            case 'message_delta':
                return this.messageDeltaTranslator.toHoloMany(source);
            case 'message_stop':
                return this.messageStopTranslator.toHoloMany(source);
            case 'content_block_start':
                return this.contentBlockStartTranslator.toHoloMany(source);
            case 'content_block_delta':
                return this.contentBlockDeltaTranslator.toHoloMany(source);
            case 'content_block_stop':
                return this.contentBlockStopTranslator.toHoloMany(source);
            default:
                return [];
        }
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeRawMessageStreamEvent>[]> {
        const d = source.delta;
        if (!d) return [];

        // Fast pass-through for Claude→Claude streaming
        // If we already have a validated Claude event, just return it
        const hasClaudeProviderDelta = d.provider === 'claude' && d.provider_delta;
        if (hasClaudeProviderDelta) {
            // It's already a valid Claude event, pass it through
            return [d.provider_delta];
        }

        // Detect cross-provider translation (OpenAI/Ollama → Claude)
        // Native Claude streams have provider_delta populated with raw Claude events
        // Cross-provider translations don't have provider_delta (only normalized Holo data)
        // Note: d.provider is always CLAUDE when translating TO Claude (set by factory)
        const isCrossProviderTranslation = !d.provider_delta;

        // Route based on delta type for efficiency
        switch (d.type) {
            case 'message_start':
                // For non-Claude sources, synthesize content_block_start after message_start
                const messageStartResults: Partial<ClaudeRawMessageStreamEvent>[] =
                    await this.messageStartTranslator.fromHoloMany(source);

                if (isCrossProviderTranslation) {
                    // Synthesize content_block_start[0] for text content
                    messageStartResults.push({
                        type: 'content_block_start',
                        index: 0,
                        content_block: {
                            type: 'text',
                            text: ''
                        }
                    } as Partial<ClaudeRawMessageStreamEvent>);
                }

                return messageStartResults;

            case 'message_delta':
                // Message delta can produce multiple event types:
                // - message_delta (for finish_reason/usage)
                // - content_block_start (for tool call shells)
                // - content_block_delta (for tool argument fragments)
                // - message_stop (if finish_reason indicates completion)
                const results: Partial<ClaudeRawMessageStreamEvent>[] = [];

                // Order matters: start → delta → stop
                results.push(...await this.messageDeltaTranslator.fromHoloMany(source));
                results.push(...await this.contentBlockStartTranslator.fromHoloMany(source));
                results.push(...await this.contentBlockDeltaTranslator.fromHoloMany(source));

                // Only emit message_stop if finish_reason maps to a valid Claude stop reason
                const claudeStopReason = mapHoloFinishReasonToClaude(source.finish_reason);
                if (claudeStopReason !== undefined && claudeStopReason !== null) {
                    results.push(...await this.messageStopTranslator.fromHoloMany(source));
                }

                return results;

            case 'content_delta':
                // Content delta only produces content_block_delta events
                return this.contentBlockDeltaTranslator.fromHoloMany(source);

            case 'message_stop':
                // For non-Claude sources, synthesize content_block_stop before message_stop
                const stopResults: Partial<ClaudeRawMessageStreamEvent>[] = [];

                if (isCrossProviderTranslation) {
                    // Synthesize content_block_stop[0] to close the text content block
                    stopResults.push({
                        type: 'content_block_stop',
                        index: 0
                    } as Partial<ClaudeRawMessageStreamEvent>);
                }

                stopResults.push(...await this.messageStopTranslator.fromHoloMany(source));

                return stopResults;

            default:
                return [];
        }
    }
}
