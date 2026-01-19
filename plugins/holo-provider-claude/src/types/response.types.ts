// Claude type aliases (map to Beta SDK types)
import type {
    BetaContentBlock,
    BetaMessage,
    BetaRawContentBlockDeltaEvent,
    BetaRawContentBlockStartEvent,
    BetaRawContentBlockStopEvent,
    BetaRawMessageDeltaEvent,
    BetaRawMessageStartEvent,
    BetaRawMessageStopEvent,
    BetaRawMessageStreamEvent,
    BetaStopReason,
    BetaTextBlock,
    BetaTextDelta,
    BetaUsage
} from "@anthropic-ai/sdk/resources/beta/messages/messages";

export type ClaudeStopReason = BetaStopReason;
export type ClaudeUsage = BetaUsage;
export type ClaudeTextBlock = BetaTextBlock;
export type ClaudeContentBlock = BetaContentBlock;
export type ClaudeResponseMessage = BetaMessage;
export type ClaudeTextDelta = BetaTextDelta;
export type ClaudeRawMessageStartEvent = BetaRawMessageStartEvent;
export type ClaudeRawMessageDeltaEvent = BetaRawMessageDeltaEvent;
export type ClaudeRawMessageStopEvent = BetaRawMessageStopEvent;
export type ClaudeRawContentBlockStartEvent = BetaRawContentBlockStartEvent;
export type ClaudeRawContentBlockDeltaEvent = BetaRawContentBlockDeltaEvent;
export type ClaudeRawContentBlockStopEvent = BetaRawContentBlockStopEvent;
export type ClaudeRawMessageStreamEvent = BetaRawMessageStreamEvent;
export type ClaudeResponse = ClaudeRawMessageStreamEvent | ClaudeResponseMessage;
