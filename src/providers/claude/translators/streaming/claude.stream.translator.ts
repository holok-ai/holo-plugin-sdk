import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ArkErrors} from 'arktype';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {ClaudeRawMessageStreamEvent} from '../../types';
import {ClaudeRawMessageStreamEventValidator} from '../../validators';
import {ClaudeMessageStartEventTranslator} from './claude.message.start.event.translator';
import {ClaudeMessageDeltaEventTranslator} from './claude.message.delta.event.translator';
import {ClaudeMessageStopEventTranslator} from './claude.message.stop.event.translator';
import {ClaudeContentBlockStartEventTranslator} from './claude.content.block.start.event.translator';
import {ClaudeContentBlockDeltaEventTranslator} from './claude.content.block.delta.event.translator';
import {ClaudeContentBlockStopEventTranslator} from './claude.content.block.stop.event.translator';
import {mapHoloFinishReasonToClaude} from '../../utils/finish.reason.mapper';

@injectable()
export class ClaudeStreamTranslator extends BaseStreamTranslator<HoloStreamChunk, ClaudeRawMessageStreamEvent> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ClaudeRawMessageStreamEventValidator;
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
        if (d.provider === 'claude' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                // It's already a valid Claude event, pass it through
                return [validated];
            }
        }

        // Route based on delta type for efficiency
        switch (d.type) {
            case 'message_start':
                // Only message_start translator handles this
                return this.messageStartTranslator.fromHoloMany(source);
                
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
                // Message stop produces message_stop (and potentially content_block_stop if needed)
                const stopResults: Partial<ClaudeRawMessageStreamEvent>[] = [];
                
                // Content block stops would be synthesized at a higher layer if needed
                // For now, just handle message stop
                stopResults.push(...await this.messageStopTranslator.fromHoloMany(source));
                
                return stopResults;
                
            default:
                return [];
        }
    }
}