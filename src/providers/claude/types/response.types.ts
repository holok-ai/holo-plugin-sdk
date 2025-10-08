// Claude type aliases (map to Beta SDK types)
import type {
    BetaBase64PDFSource,
    BetaBashCodeExecutionOutputBlock,
    BetaBashCodeExecutionResultBlock,
    BetaBashCodeExecutionToolResultBlock,
    BetaBashCodeExecutionToolResultError,
    BetaCacheCreation,
    BetaCitationCharLocation,
    BetaCitationConfig,
    BetaCitationContentBlockLocation,
    BetaCitationPageLocation,
    BetaCitationsDelta,
    BetaCitationSearchResultLocation,
    BetaCitationsWebSearchResultLocation,
    BetaClearToolUses20250919EditResponse,
    BetaCodeExecutionOutputBlock,
    BetaCodeExecutionResultBlock,
    BetaCodeExecutionToolResultBlock,
    BetaCodeExecutionToolResultBlockContent,
    BetaCodeExecutionToolResultError,
    BetaContainer,
    BetaContainerUploadBlock,
    BetaContentBlock,
    BetaContextManagementResponse,
    BetaDocumentBlock,
    BetaInputJSONDelta,
    BetaMCPToolResultBlock,
    BetaMCPToolUseBlock,
    BetaMessage,
    BetaMessageDeltaUsage,
    BetaPlainTextSource,
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
    BetaTextEditorCodeExecutionCreateResultBlock,
    BetaTextEditorCodeExecutionStrReplaceResultBlock,
    BetaTextEditorCodeExecutionToolResultBlock,
    BetaTextEditorCodeExecutionToolResultError,
    BetaTextEditorCodeExecutionViewResultBlock,
    BetaThinkingBlock,
    BetaThinkingDelta,
    BetaToolUseBlock,
    BetaUsage,
    BetaWebFetchBlock,
    BetaWebFetchToolResultBlock,
    BetaWebFetchToolResultErrorBlock,
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
export type ClaudeBase64PDFSource = BetaBase64PDFSource;
export type ClaudePlainTextSource = BetaPlainTextSource;
export type ClaudeCitationConfig = BetaCitationConfig;
export type ClaudeDocumentBlock = BetaDocumentBlock;
export type ClaudeClearToolUses20250919EditResponse = BetaClearToolUses20250919EditResponse;
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
export type ClaudeWebFetchBlock = BetaWebFetchBlock;
export type ClaudeWebFetchToolResultErrorBlock = BetaWebFetchToolResultErrorBlock;
export type ClaudeWebFetchToolResultBlock = BetaWebFetchToolResultBlock;
export type ClaudeCodeExecutionOutputBlock = BetaCodeExecutionOutputBlock;
export type ClaudeCodeExecutionResultBlock = BetaCodeExecutionResultBlock;
export type ClaudeCodeExecutionToolResultError = BetaCodeExecutionToolResultError;
export type ClaudeCodeExecutionToolResultBlockContent = BetaCodeExecutionToolResultBlockContent;
export type ClaudeCodeExecutionToolResultBlock = BetaCodeExecutionToolResultBlock;
export type ClaudeBashCodeExecutionOutputBlock = BetaBashCodeExecutionOutputBlock;
export type ClaudeBashCodeExecutionResultBlock = BetaBashCodeExecutionResultBlock;
export type ClaudeBashCodeExecutionToolResultError = BetaBashCodeExecutionToolResultError;
export type ClaudeBashCodeExecutionToolResultBlockContent = ClaudeBashCodeExecutionToolResultError | ClaudeBashCodeExecutionResultBlock;
export type ClaudeBashCodeExecutionToolResultBlock = BetaBashCodeExecutionToolResultBlock;
export type ClaudeTextEditorCodeExecutionViewResultBlock = BetaTextEditorCodeExecutionViewResultBlock;
export type ClaudeTextEditorCodeExecutionCreateResultBlock = BetaTextEditorCodeExecutionCreateResultBlock;
export type ClaudeTextEditorCodeExecutionStrReplaceResultBlock = BetaTextEditorCodeExecutionStrReplaceResultBlock;
export type ClaudeTextEditorCodeExecutionToolResultError = BetaTextEditorCodeExecutionToolResultError;
export type ClaudeTextEditorCodeExecutionToolResultBlock = BetaTextEditorCodeExecutionToolResultBlock;
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
export type ClaudeContextManagementResponse = BetaContextManagementResponse;
