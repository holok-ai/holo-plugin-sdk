import {
    BetaBase64ImageSource,
    BetaCacheControlEphemeral,
    BetaCitationCharLocationParam,
    BetaCitationContentBlockLocationParam,
    BetaCitationPageLocationParam,
    BetaCitationsConfigParam,
    BetaCitationSearchResultLocationParam,
    BetaCitationWebSearchResultLocationParam,
    BetaCodeExecutionOutputBlockParam,
    BetaCodeExecutionResultBlockParam,
    BetaCodeExecutionTool20250522,
    BetaCodeExecutionToolResultBlockParam,
    BetaCodeExecutionToolResultErrorParam,
    BetaContainerUploadBlockParam,
    BetaContentBlockParam,
    BetaContentBlockSource,
    BetaContentBlockSourceContent,
    BetaFileDocumentSource,
    BetaFileImageSource,
    BetaImageBlockParam,
    BetaMCPToolUseBlockParam,
    BetaMessageParam,
    BetaMessageStreamParams,
    BetaMetadata,
    BetaRedactedThinkingBlockParam,
    BetaRequestDocumentBlock,
    BetaRequestMCPServerToolConfiguration,
    BetaRequestMCPServerURLDefinition,
    BetaRequestMCPToolResultBlockParam,
    BetaSearchResultBlockParam,
    BetaServerToolUseBlockParam,
    BetaTextBlockParam,
    BetaTextCitationParam,
    BetaThinkingBlockParam,
    BetaThinkingConfigDisabled,
    BetaThinkingConfigEnabled,
    BetaTool,
    BetaToolBash20241022,
    BetaToolBash20250124,
    BetaToolChoice,
    BetaToolChoiceAny,
    BetaToolChoiceAuto,
    BetaToolChoiceNone,
    BetaToolChoiceTool,
    BetaToolComputerUse20241022,
    BetaToolComputerUse20250124,
    BetaToolResultBlockParam,
    BetaToolTextEditor20241022,
    BetaToolTextEditor20250124,
    BetaToolTextEditor20250429,
    BetaToolUnion,
    BetaToolUseBlockParam,
    BetaURLImageSource,
    BetaURLPDFSource,
    BetaWebSearchResultBlockParam,
    BetaWebSearchTool20250305,
    BetaWebSearchToolRequestError,
    BetaWebSearchToolResultBlockParam,
    BetaWebSearchToolResultBlockParamContent,
    BetaWebSearchToolResultErrorCode
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import {AnthropicBeta} from "@anthropic-ai/sdk/resources/beta/beta";

// Claude type aliases - export our own interfaces
export type ClaudeBeta = AnthropicBeta;
export type ClaudeCitationsConfigParam = BetaCitationsConfigParam;
export type ClaudeCitationCharLocationParam = BetaCitationCharLocationParam;
export type ClaudeCitationPageLocationParam = BetaCitationPageLocationParam;
export type ClaudeCitationContentBlockLocationParam = BetaCitationContentBlockLocationParam;
export type ClaudeCitationWebSearchResultLocationParam = BetaCitationWebSearchResultLocationParam;
export type ClaudeCitationSearchResultLocationParam = BetaCitationSearchResultLocationParam;
export type ClaudeTextCitationParam = BetaTextCitationParam;
export type ClaudeCacheControlEphemeral = BetaCacheControlEphemeral;
export type ClaudeBase64ImageSource = BetaBase64ImageSource;
export type ClaudeURLImageSource = BetaURLImageSource;
export type ClaudeFileImageSource = BetaFileImageSource;
export type ClaudeContainerUploadBlockParam = BetaContainerUploadBlockParam;
export type ClaudeTextBlockParam = BetaTextBlockParam;
export type ClaudeImageBlockParam = BetaImageBlockParam;
export type ClaudeToolUseBlockParam = BetaToolUseBlockParam;
export type ClaudeSearchResultBlockParam = BetaSearchResultBlockParam;
export type ClaudeContentBlockSourceContent = BetaContentBlockSourceContent;
export type ClaudeToolResultBlockParam = BetaToolResultBlockParam;
export type ClaudeContentBlockSource = BetaContentBlockSource;
export type ClaudeURLPDFSource = BetaURLPDFSource;
export type ClaudeFileDocumentSource = BetaFileDocumentSource;
export type ClaudeThinkingBlockParam = BetaThinkingBlockParam;
export type ClaudeWebSearchResultBlockParam = BetaWebSearchResultBlockParam;
export type ClaudeRequestDocumentBlock = BetaRequestDocumentBlock;
export type ClaudeRedactedThinkingBlockParam = BetaRedactedThinkingBlockParam;
export type ClaudeServerToolUseBlockParam = BetaServerToolUseBlockParam;
export type ClaudeWebSearchToolResultErrorCode = BetaWebSearchToolResultErrorCode;
export type ClaudeWebSearchToolRequestError = BetaWebSearchToolRequestError;
export type ClaudeWebSearchToolResultBlockParamContent = BetaWebSearchToolResultBlockParamContent;
export type ClaudeWebSearchToolResultBlockParam = BetaWebSearchToolResultBlockParam;
export type ClaudeCodeExecutionOutputBlockParam = BetaCodeExecutionOutputBlockParam;
export type ClaudeCodeExecutionResultBlockParam = BetaCodeExecutionResultBlockParam;
export type ClaudeCodeExecutionToolResultErrorParam = BetaCodeExecutionToolResultErrorParam;
export type ClaudeCodeExecutionToolResultBlockParam = BetaCodeExecutionToolResultBlockParam;
export type ClaudeMCPToolUseBlockParam = BetaMCPToolUseBlockParam;
export type ClaudeRequestMCPToolResultBlockParam = BetaRequestMCPToolResultBlockParam;
export type ClaudeContentBlockParam = BetaContentBlockParam;
export type ClaudeTool = BetaTool;
export type ClaudeToolBash20241022 = BetaToolBash20241022;
export type ClaudeToolBash20250124 = BetaToolBash20250124;
export type ClaudeToolChoiceAny = BetaToolChoiceAny;
export type ClaudeToolChoiceAuto = BetaToolChoiceAuto;
export type ClaudeToolChoiceNone = BetaToolChoiceNone;
export type ClaudeToolChoiceTool = BetaToolChoiceTool;
export type ClaudeToolChoice = BetaToolChoice;
export type ClaudeToolComputerUse20241022 = BetaToolComputerUse20241022;
export type ClaudeToolComputerUse20250124 = BetaToolComputerUse20250124;
export type ClaudeToolTextEditor20241022 = BetaToolTextEditor20241022;
export type ClaudeToolTextEditor20250124 = BetaToolTextEditor20250124;
export type ClaudeToolTextEditor20250429 = BetaToolTextEditor20250429;
export type ClaudeCodeExecutionTool20250522 = BetaCodeExecutionTool20250522;
export type ClaudeWebSearchTool20250305 = BetaWebSearchTool20250305;
export type ClaudeWebSearchTool20250305UserLocation = BetaWebSearchTool20250305.UserLocation;
export type ClaudeToolUnion = BetaToolUnion;
export type ClaudeRequestMessage = BetaMessageParam;
export type ClaudeRequestMCPServerToolConfiguration = BetaRequestMCPServerToolConfiguration;
export type ClaudeRequestMCPServerURLDefinition = BetaRequestMCPServerURLDefinition;
export type ClaudeMetadata = BetaMetadata;
export type ClaudeThinkingConfigEnabled = BetaThinkingConfigEnabled;
export type ClaudeThinkingConfigDisabled = BetaThinkingConfigDisabled;
export type ClaudeChatRequest = BetaMessageStreamParams;
