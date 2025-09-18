// Claude type aliases (map to Beta SDK types)
import type {
    BetaCacheCreation,
    BetaCitationCharLocation,
    BetaCitationContentBlockLocation,
    BetaCitationPageLocation,
    BetaCitationsDelta,
    BetaCitationSearchResultLocation,
    BetaCitationsWebSearchResultLocation,
    BetaCodeExecutionOutputBlock,
    BetaCodeExecutionResultBlock,
    BetaCodeExecutionToolResultBlock,
    BetaCodeExecutionToolResultBlockContent,
    BetaCodeExecutionToolResultError,
    BetaContainer,
    BetaContainerUploadBlock,
    BetaContentBlock,
    BetaInputJSONDelta,
    BetaMCPToolResultBlock,
    BetaMCPToolUseBlock,
    BetaMessage,
    BetaMessageDeltaUsage,
    BetaRawContentBlockDelta,
    BetaRawContentBlockDeltaEvent,
    BetaRawContentBlockStartEvent,
    BetaRawContentBlockStopEvent,
    BetaRawMessageDeltaEvent,
    BetaRawMessageStartEvent,
    BetaRawMessageStopEvent,
    BetaRawMessageStreamEvent,
    BetaRedactedThinkingBlock,
    BetaServerToolUsage,
    BetaServerToolUseBlock,
    BetaSignatureDelta,
    BetaStopReason,
    BetaTextBlock,
    BetaTextCitation,
    BetaTextDelta,
    BetaThinkingBlock,
    BetaThinkingDelta,
    BetaToolUseBlock,
    BetaUsage,
    BetaWebSearchResultBlock,
    BetaWebSearchToolResultBlock,
    BetaWebSearchToolResultBlockContent,
    BetaWebSearchToolResultError
} from "@anthropic-ai/sdk/resources/beta/messages/messages";

export type ClaudeContainer = BetaContainer;
export type ClaudeStopReason = BetaStopReason;
export type ClaudeCacheCreation = BetaCacheCreation;
export type ClaudeServerToolUsage = BetaServerToolUsage;
export type ClaudeUsage = BetaUsage;
export type ClaudeMessageDeltaUsage = BetaMessageDeltaUsage;
export type ClaudeCitationCharLocation = BetaCitationCharLocation;
export type ClaudeCitationPageLocation = BetaCitationPageLocation;
export type ClaudeCitationContentBlockLocation = BetaCitationContentBlockLocation;
export type ClaudeCitationsWebSearchResultLocation = BetaCitationsWebSearchResultLocation;
export type ClaudeCitationSearchResultLocation = BetaCitationSearchResultLocation;
export type ClaudeTextCitation = BetaTextCitation;
export type ClaudeTextBlock = BetaTextBlock;
export type ClaudeThinkingBlock = BetaThinkingBlock;
export type ClaudeRedactedThinkingBlock = BetaRedactedThinkingBlock;
export type ClaudeToolUseBlock = BetaToolUseBlock;
export type ClaudeServerToolUseBlock = BetaServerToolUseBlock;
export type ClaudeWebSearchResultBlock = BetaWebSearchResultBlock;
export type ClaudeWebSearchToolResultError = BetaWebSearchToolResultError;
export type ClaudeWebSearchToolResultBlockContent = BetaWebSearchToolResultBlockContent;
export type ClaudeWebSearchToolResultBlock = BetaWebSearchToolResultBlock;
export type ClaudeCodeExecutionOutputBlock = BetaCodeExecutionOutputBlock;
export type ClaudeCodeExecutionResultBlock = BetaCodeExecutionResultBlock;
export type ClaudeCodeExecutionToolResultError = BetaCodeExecutionToolResultError;
export type ClaudeCodeExecutionToolResultBlockContent = BetaCodeExecutionToolResultBlockContent;
export type ClaudeCodeExecutionToolResultBlock = BetaCodeExecutionToolResultBlock;
export type ClaudeMCPToolUseBlock = BetaMCPToolUseBlock;
export type ClaudeMCPToolResultBlock = BetaMCPToolResultBlock;
export type ClaudeContainerUploadBlock = BetaContainerUploadBlock;
export type ClaudeContentBlock = BetaContentBlock;
export type ClaudeResponseMessage = BetaMessage;
export type ClaudeTextDelta = BetaTextDelta;
export type ClaudeInputJSONDelta = BetaInputJSONDelta;
export type ClaudeCitationsDelta = BetaCitationsDelta;
export type ClaudeThinkingDelta = BetaThinkingDelta;
export type ClaudeSignatureDelta = BetaSignatureDelta;
export type ClaudeRawContentBlockDelta = BetaRawContentBlockDelta;
export type ClaudeRawMessageStartEvent = BetaRawMessageStartEvent;
export type ClaudeRawMessageDeltaEvent = BetaRawMessageDeltaEvent;
export type ClaudeRawMessageStopEvent = BetaRawMessageStopEvent;
export type ClaudeRawContentBlockStartEvent = BetaRawContentBlockStartEvent;
export type ClaudeRawContentBlockDeltaEvent = BetaRawContentBlockDeltaEvent;
export type ClaudeRawContentBlockStopEvent = BetaRawContentBlockStopEvent;
export type ClaudeRawMessageStreamEvent = BetaRawMessageStreamEvent;
export type ClaudeResponse = ClaudeRawMessageStreamEvent | ClaudeResponseMessage;
