import {type, type Type} from 'arktype';
import {BetaTool} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import {booleanOrNull, numberOrNull, stringArrayOrNull, stringOrNull, unknownOrNull} from "../../types";
import {
    ClaudeBase64ImageSource,
    ClaudeBase64PDFSource,
    ClaudeBeta,
    ClaudeCacheControlEphemeral,
    ClaudeChatRequest,
    ClaudeCitationCharLocationParam,
    ClaudeCitationContentBlockLocationParam,
    ClaudeCitationPageLocationParam,
    ClaudeCitationsConfigParam,
    ClaudeCitationSearchResultLocationParam,
    ClaudeCitationWebSearchResultLocationParam,
    ClaudeCodeExecutionOutputBlockParam,
    ClaudeCodeExecutionResultBlockParam,
    ClaudeCodeExecutionTool20250522,
    ClaudeCodeExecutionToolResultBlockParam,
    ClaudeCodeExecutionToolResultErrorParam,
    ClaudeContainerUploadBlockParam,
    ClaudeContentBlockParam,
    ClaudeContentBlockSource,
    ClaudeContentBlockSourceContent,
    ClaudeFileDocumentSource,
    ClaudeFileImageSource,
    ClaudeImageBlockParam,
    ClaudeMCPToolUseBlockParam,
    ClaudeMetadata,
    ClaudePlainTextSource,
    ClaudeRedactedThinkingBlockParam,
    ClaudeRequestDocumentBlock,
    ClaudeRequestMCPServerToolConfiguration,
    ClaudeRequestMCPServerURLDefinition,
    ClaudeRequestMCPToolResultBlockParam,
    ClaudeRequestMessage,
    ClaudeSearchResultBlockParam,
    ClaudeServerToolUseBlockParam,
    ClaudeTextBlockParam,
    ClaudeTextCitationParam,
    ClaudeThinkingBlockParam,
    ClaudeThinkingConfigDisabled,
    ClaudeThinkingConfigEnabled,
    ClaudeTool,
    ClaudeToolBash20241022,
    ClaudeToolBash20250124,
    ClaudeToolChoice,
    ClaudeToolChoiceAny,
    ClaudeToolChoiceAuto,
    ClaudeToolChoiceNone,
    ClaudeToolChoiceTool,
    ClaudeToolComputerUse20241022,
    ClaudeToolComputerUse20250124,
    ClaudeToolResultBlockParam,
    ClaudeToolTextEditor20241022,
    ClaudeToolTextEditor20250124,
    ClaudeToolTextEditor20250429,
    ClaudeToolUnion,
    ClaudeToolUseBlockParam,
    ClaudeURLImageSource,
    ClaudeURLPDFSource,
    ClaudeWebSearchResultBlockParam,
    ClaudeWebSearchTool20250305,
    ClaudeWebSearchTool20250305UserLocation,
    ClaudeWebSearchToolRequestError,
    ClaudeWebSearchToolResultBlockParam,
    ClaudeWebSearchToolResultBlockParamContent,
    ClaudeWebSearchToolResultErrorCode
} from "../types";


// Common nullable type utilities
const ClaudeCitationsConfigParamValidator = type({
    'enabled?': 'boolean'
}) satisfies Type<ClaudeCitationsConfigParam>;

const ClaudeCitationCharLocationParamValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_char_index: 'number',
    start_char_index: 'number',
    type: "'char_location'"
}) satisfies Type<ClaudeCitationCharLocationParam>;

const ClaudeCitationPageLocationParamValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_page_number: 'number',
    start_page_number: 'number',
    type: "'page_location'"
}) satisfies Type<ClaudeCitationPageLocationParam>;

const ClaudeCitationContentBlockLocationParamValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_block_index: 'number',
    start_block_index: 'number',
    type: "'content_block_location'"
}) satisfies Type<ClaudeCitationContentBlockLocationParam>;

const ClaudeCitationWebSearchResultLocationParamValidator = type({
    cited_text: 'string',
    encrypted_index: 'string',
    title: stringOrNull,
    type: "'web_search_result_location'",
    url: 'string'
}) satisfies Type<ClaudeCitationWebSearchResultLocationParam>;

const ClaudeCitationSearchResultLocationParamValidator = type({
    cited_text: 'string',
    end_block_index: 'number',
    search_result_index: 'number',
    source: 'string',
    start_block_index: 'number',
    title: stringOrNull,
    type: "'search_result_location'"
}) satisfies Type<ClaudeCitationSearchResultLocationParam>;

export const ClaudeTextCitationParamValidator =
    ClaudeCitationCharLocationParamValidator
        .or(ClaudeCitationPageLocationParamValidator)
        .or(ClaudeCitationContentBlockLocationParamValidator)
        .or(ClaudeCitationWebSearchResultLocationParamValidator)
        .or(ClaudeCitationSearchResultLocationParamValidator) satisfies Type<ClaudeTextCitationParam>;

const ClaudeCacheControlEphemeralValidator = type({
    type: "'ephemeral'",
    'ttl?': "'5m'|'1h'"
}) satisfies Type<ClaudeCacheControlEphemeral>;

const cache_control = ClaudeCacheControlEphemeralValidator.or('null');

// Source schemas
const ClaudeBase64ImageSourceValidator = type({
    type: "'base64'",
    data: 'string',
    media_type: "'image/jpeg'|'image/png'|'image/gif'|'image/webp'",
}) satisfies Type<ClaudeBase64ImageSource>;

const ClaudeURLImageSourceValidator = type({
    type: "'url'",
    url: 'string'
}) satisfies Type<ClaudeURLImageSource>;

const ClaudeFileImageSourceValidator = type({
    type: "'file'",
    file_id: 'string'
}) satisfies Type<ClaudeFileImageSource>;

const ClaudeContainerUploadBlockValidator = type({
    file_id: 'string',
    type: "'container_upload'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeContainerUploadBlockParam>;

const ClaudeBase64PDFSourceValidator = type({
    type: "'base64'",
    data: 'string',
    media_type: "'application/pdf'"
}) satisfies Type<ClaudeBase64PDFSource>;

export const ClaudeTextBlockParamValidator = type({
    type: "'text'",
    text: 'string',
    'cache_control?': cache_control,
    'citations?': ClaudeTextCitationParamValidator.array().or('null')
}) satisfies Type<ClaudeTextBlockParam>;

export const ClaudeImageBlockParamValidator = type({
    source:
        ClaudeBase64ImageSourceValidator
            .or(ClaudeURLImageSourceValidator)
            .or(ClaudeFileImageSourceValidator),
    type: "'image'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeImageBlockParam>;

export const ClaudeToolUseBlockParamValidator = type({
    type: "'tool_use'",
    id: 'string',
    name: 'string',
    input: 'unknown',
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolUseBlockParam>;

export const ClaudeSearchResultBlockParamValidator = type({
    content: ClaudeTextBlockParamValidator.array(),
    source: 'string',
    title: 'string',
    type: "'search_result'",
    'cache_control?': cache_control,
    'citations?': ClaudeCitationsConfigParamValidator
}) satisfies Type<ClaudeSearchResultBlockParam>;

const ClaudeContentBlockSourceContentValidator =
    ClaudeTextBlockParamValidator.or(ClaudeImageBlockParamValidator) satisfies Type<ClaudeContentBlockSourceContent>;

const ClaudeTextImageSearchResultBlockParamValidator =
    ClaudeTextBlockParamValidator
        .or(ClaudeImageBlockParamValidator)
        .or(ClaudeSearchResultBlockParamValidator);

const ClaudeToolResultBlockParamValidator = type({
    tool_use_id: 'string',
    type: "'tool_result'",
    'cache_control?': cache_control,
    'content?': type('string')
        .or(ClaudeTextImageSearchResultBlockParamValidator.array()),
    'is_error?': 'boolean'
}) satisfies Type<ClaudeToolResultBlockParam>;

const ClaudeContentBlockSourceValidator = type({
    content: ClaudeContentBlockSourceContentValidator.array().or('string'),
    type: "'content'"
}) satisfies Type<ClaudeContentBlockSource>;

const ClaudePlainTextSourceValidator = type({
    data: 'string',
    media_type: "'text/plain'",
    type: "'text'"
}) satisfies Type<ClaudePlainTextSource>;

const ClaudeURLPDFSourceValidator = type({
    type: "'url'",
    url: 'string'
}) satisfies Type<ClaudeURLPDFSource>;

const ClaudeFileDocumentSourceValidator = type({
    type: "'file'",
    file_id: 'string'
}) satisfies Type<ClaudeFileDocumentSource>;

export const ClaudeThinkingBlockParamValidator = type({
    signature: 'string',
    thinking: 'string',
    type: "'thinking'"
}) satisfies Type<ClaudeThinkingBlockParam>;

const ClaudeWebSearchResultBlockParamValidator = type({
    type: "'web_search_result'",
    title: 'string',
    encrypted_content: 'string',
    url: 'string',
    'page_age?': stringOrNull
}) satisfies Type<ClaudeWebSearchResultBlockParam>;

const ClaudeRequestDocumentBlockValidator = type({
    type: "'document'",
    source:
        ClaudeBase64PDFSourceValidator
            .or(ClaudePlainTextSourceValidator)
            .or(ClaudeContentBlockSourceValidator)
            .or(ClaudeURLPDFSourceValidator)
            .or(ClaudeFileDocumentSourceValidator),
    'cache_control?': cache_control,
    'citations?': ClaudeCitationsConfigParamValidator,
    'context?': stringOrNull,
    'title?': stringOrNull
}) satisfies Type<ClaudeRequestDocumentBlock>;

const ClaudeRedactedThinkingBlockParamValidator = type({
    data: 'string',
    type: "'redacted_thinking'"
}) satisfies Type<ClaudeRedactedThinkingBlockParam>;

const ClaudeServerToolUseBlockParamValidator = type({
    id: 'string',
    input: 'unknown',
    name: "'web_search'|'code_execution'",
    type: "'server_tool_use'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeServerToolUseBlockParam>;

const ClaudeWebSearchToolResultErrorCodeValidator =
    type("'invalid_tool_input'|'unavailable'|'max_uses_exceeded'|'too_many_requests'|'query_too_long'") satisfies Type<ClaudeWebSearchToolResultErrorCode>;

const ClaudeWebSearchToolRequestErrorValidator = type({
    error_code: ClaudeWebSearchToolResultErrorCodeValidator,
    type: "'web_search_tool_result_error'"
}) satisfies Type<ClaudeWebSearchToolRequestError>;

const ClaudeCodeExecutionToolResultErrorCodeValidator = type("'invalid_tool_input'|'unavailable'|'too_many_requests'|'execution_time_exceeded'");

const ClaudeCodeExecutionToolResultErrorParamValidator = type({
    error_code: ClaudeCodeExecutionToolResultErrorCodeValidator,
    type: "'code_execution_tool_result_error'"
}) satisfies Type<ClaudeCodeExecutionToolResultErrorParam>

const ClaudeWebSearchToolResultBlockParamContentValidator =
    ClaudeWebSearchResultBlockParamValidator.array()
        .or(ClaudeWebSearchToolRequestErrorValidator) satisfies Type<ClaudeWebSearchToolResultBlockParamContent>;

const ClaudeWebSearchToolResultBlockParamValidator = type({
    content: ClaudeWebSearchToolResultBlockParamContentValidator,
    tool_use_id: 'string',
    type: "'web_search_tool_result'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeWebSearchToolResultBlockParam>;

const ClaudeCodeExecutionOutputBlockParamValidator = type({
    file_id: 'string',
    type: "'code_execution_output'"
}) satisfies Type<ClaudeCodeExecutionOutputBlockParam>;

const ClaudeCodeExecutionResultBlockParamValidator = type({
    content: ClaudeCodeExecutionOutputBlockParamValidator.array(),
    return_code: 'number',
    stderr: 'string',
    stdout: 'string',
    type: "'code_execution_result'"
}) satisfies Type<ClaudeCodeExecutionResultBlockParam>;

const ClaudeCodeExecutionToolResultBlockParamValidator = type({
    content: ClaudeCodeExecutionToolResultErrorParamValidator.or(ClaudeCodeExecutionResultBlockParamValidator),
    tool_use_id: 'string',
    type: "'code_execution_tool_result'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeCodeExecutionToolResultBlockParam>;

const ClaudeMCPToolUseBlockParamValidator = type({
    id: 'string',
    input: 'unknown',
    name: 'string',
    server_name: 'string',
    type: "'mcp_tool_use'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeMCPToolUseBlockParam>;

const ClaudeRequestMCPToolResultBlockParamValidator = type({
    tool_use_id: 'string',
    type: "'mcp_tool_result'",
    'cache_control?': cache_control,
    'content?': type('string').or(ClaudeTextBlockParamValidator.array()),
    'is_error?': 'boolean'
}) satisfies Type<ClaudeRequestMCPToolResultBlockParam>;

export const ClaudeContentBlockParamValidator =
    ClaudeTextBlockParamValidator
        .or(ClaudeImageBlockParamValidator)
        .or(ClaudeRequestDocumentBlockValidator)
        .or(ClaudeSearchResultBlockParamValidator)
        .or(ClaudeThinkingBlockParamValidator)
        .or(ClaudeRedactedThinkingBlockParamValidator)
        .or(ClaudeToolUseBlockParamValidator)
        .or(ClaudeToolResultBlockParamValidator)
        .or(ClaudeServerToolUseBlockParamValidator)
        .or(ClaudeWebSearchToolResultBlockParamValidator)
        .or(ClaudeCodeExecutionToolResultBlockParamValidator)
        .or(ClaudeMCPToolUseBlockParamValidator)
        .or(ClaudeRequestMCPToolResultBlockParamValidator)
        .or(ClaudeContainerUploadBlockValidator) satisfies Type<ClaudeContentBlockParam>;

const ClaudeToolInputSchemaValidator = type({
    type: "'object'",
    'properties?': unknownOrNull,
    'required?': stringArrayOrNull
}) satisfies Type<BetaTool.InputSchema>;

export const ClaudeToolValidator = type({
    input_schema: ClaudeToolInputSchemaValidator,
    name: 'string',
    'cache_control?': cache_control,
    'description?': 'string',
    'type?': "'custom' | null"
}) satisfies Type<ClaudeTool>;

const ClaudeToolBash20241022Validator = type({
    name: "'bash'",
    type: "'bash_20241022'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolBash20241022>;

const ClaudeToolBash20250124Validator = type({
    name: "'bash'",
    type: "'bash_20250124'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolBash20250124>;

const ClaudeToolChoiceAnyValidator = type({
    type: "'any'",
    'disable_parallel_tool_use?': 'boolean'
}) satisfies Type<ClaudeToolChoiceAny>;

const ClaudeToolChoiceAutoValidator = type({
    type: "'auto'",
    'disable_parallel_tool_use?': 'boolean'
}) satisfies Type<ClaudeToolChoiceAuto>;

const ClaudeToolChoiceNoneValidator = type({
    type: "'none'"
}) satisfies Type<ClaudeToolChoiceNone>;

const ClaudeToolChoiceToolValidator = type({
    name: 'string',
    type: "'tool'",
    'disable_parallel_tool_use?': 'boolean'
}) satisfies Type<ClaudeToolChoiceTool>;

export const ClaudeToolChoiceValidator = ClaudeToolChoiceAutoValidator
    .or(ClaudeToolChoiceAnyValidator)
    .or(ClaudeToolChoiceToolValidator)
    .or(ClaudeToolChoiceNoneValidator) satisfies Type<ClaudeToolChoice>;

const ClaudeToolComputerUse20241022Validator = type({
    display_height_px: 'number',
    display_width_px: 'number',
    name: "'computer'",
    type: "'computer_20241022'",
    'cache_control?': cache_control,
    'display_number?': numberOrNull
}) satisfies Type<ClaudeToolComputerUse20241022>;

const ClaudeToolComputerUse20250124Validator = type({
    display_height_px: 'number',
    display_width_px: 'number',
    name: "'computer'",
    type: "'computer_20250124'",
    'cache_control?': cache_control,
    'display_number?': numberOrNull
}) satisfies Type<ClaudeToolComputerUse20250124>;

const ClaudeToolTextEditor20241022Validator = type({
    name: "'str_replace_editor'",
    type: "'text_editor_20241022'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolTextEditor20241022>;

const ClaudeToolTextEditor20250124Validator = type({
    name: "'str_replace_editor'",
    type: "'text_editor_20250124'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolTextEditor20250124>;

const ClaudeToolTextEditor20250429Validator = type({
    name: "'str_replace_based_edit_tool'",
    type: "'text_editor_20250429'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeToolTextEditor20250429>;

const ClaudeCodeExecutionTool20250522Validator = type({
    name: "'code_execution'",
    type: "'code_execution_20250522'",
    'cache_control?': cache_control
}) satisfies Type<ClaudeCodeExecutionTool20250522>;

const ClaudeWebSearchTool20250305UserLocationValidator = type({
    type: "'approximate'",
    'city?': stringOrNull,
    'country?': stringOrNull,
    'region?': stringOrNull,
    'timezone?': stringOrNull
}) satisfies Type<ClaudeWebSearchTool20250305UserLocation>;

const ClaudeWebSearchTool20250305Validator = type({
    name: "'web_search'",
    type: "'web_search_20250305'",
    'allowed_domains?': stringArrayOrNull,
    'blocked_domains?': stringArrayOrNull,
    'cache_control?': cache_control,
    'max_uses?': numberOrNull,
    'user_location?': ClaudeWebSearchTool20250305UserLocationValidator.or('null')
}) satisfies Type<ClaudeWebSearchTool20250305>;

export const ClaudeToolUnionValidator = ClaudeToolValidator
    .or(ClaudeToolBash20241022Validator)
    .or(ClaudeToolBash20250124Validator)
    .or(ClaudeCodeExecutionTool20250522Validator)
    .or(ClaudeToolComputerUse20241022Validator)
    .or(ClaudeToolComputerUse20250124Validator)
    .or(ClaudeToolTextEditor20241022Validator)
    .or(ClaudeToolTextEditor20250124Validator)
    .or(ClaudeToolTextEditor20250429Validator)
    .or(ClaudeWebSearchTool20250305Validator) satisfies Type<ClaudeToolUnion>;

// Tool choice schema
export const ClaudeMessageValidator = type({
    content: type('string').or(ClaudeContentBlockParamValidator.array()),
    role: "'user'|'assistant'"
}).brand('ClaudeMessageValidator') satisfies Type<ClaudeRequestMessage>;

const ClaudeRequestMCPServerToolConfigurationValidator = type({
    'allowed_tools?': stringArrayOrNull,
    'enabled?': booleanOrNull
}) satisfies Type<ClaudeRequestMCPServerToolConfiguration>;

export const ClaudeRequestMCPServerURLDefinitionValidator = type({
    name: 'string',
    type: "'url'",
    url: 'string',
    'authorization_token?': stringOrNull,
    'tool_configuration?': ClaudeRequestMCPServerToolConfigurationValidator.or('null')
}) satisfies Type<ClaudeRequestMCPServerURLDefinition>;

export const ClaudeMetadataValidator = type({
    'user_id?': 'string | null',
}) satisfies Type<ClaudeMetadata>;

export const ClaudeThinkingConfigEnabledValidator = type({
    budget_tokens: 'number',
    type: "'enabled'"
}) satisfies Type<ClaudeThinkingConfigEnabled>;

export const ClaudeThinkingConfigDisabledValidator = type({
    type: "'disabled'"
}) satisfies Type<ClaudeThinkingConfigDisabled>;

const ClaudeBetaValidator = type('string')
    .or('"message-batches-2024-09-24"')
    .or('"prompt-caching-2024-07-31"')
    .or('"computer-use-2024-10-22"')
    .or('"computer-use-2025-01-24"')
    .or('"pdfs-2024-09-25"')
    .or('"token-counting-2024-11-01"')
    .or('"token-efficient-tools-2025-02-19"')
    .or('"output-128k-2025-02-19"')
    .or('"files-api-2025-04-14"')
    .or('"mcp-client-2025-04-04"')
    .or('"dev-full-thinking-2025-05-14"')
    .or('"interleaved-thinking-2025-05-14"')
    .or('"code-execution-2025-05-22"')
    .or('"extended-cache-ttl-2025-04-11"') satisfies Type<ClaudeBeta>;

export type ClaudeOnlyChatRequestFields = readonly['container', 'mcp_servers', 'thinking', 'betas'];
export type ClaudeOnlyChatRequest = Pick<ClaudeChatRequest, ClaudeOnlyChatRequestFields[number]>;
export type ClaudeSharedChatRequest = Omit<ClaudeChatRequest, ClaudeOnlyChatRequestFields[number]>;

// Common fields that exist across all providers
export const ClaudeSharedRequestValidator = type({
    // Required fields
    model: 'string',
    messages: ClaudeMessageValidator.array(),

    // Common optional fields
    'temperature?': 'number',
    'top_p?': 'number',
    'stream?': type('boolean'),
    'system?': type('string').or(ClaudeTextBlockParamValidator.array()),

    // Beta-specific fields
    'tools?': ClaudeToolUnionValidator.array(),
    'tool_choice?': ClaudeToolChoiceValidator,
    'metadata?': ClaudeMetadataValidator,
    max_tokens: type('number'),
    'top_k?': 'number',
    'service_tier?': "'auto'|'standard_only'",
    'stop_sequences?': 'string[]',
}) satisfies Type<ClaudeSharedChatRequest>;

// Fields unique to Anthropic
export const ClaudeOnlyRequestValidator = type({
    'container?': stringOrNull, // Container execution environment
    'mcp_servers?': ClaudeRequestMCPServerURLDefinitionValidator.array(), // Model Context Protocol servers
    'thinking?': ClaudeThinkingConfigEnabledValidator.or(ClaudeThinkingConfigDisabledValidator), // Thinking/reasoning capabilities
    'betas?': ClaudeBetaValidator.array(), // Beta feature flags
}) satisfies Type<ClaudeOnlyChatRequest>;

// Main MessageCreateParamsBase schema for beta endpoint
export const ClaudeChatRequestValidator = type.merge(
    ClaudeSharedRequestValidator,
    ClaudeOnlyRequestValidator
).brand('ClaudeChatRequestValidator') satisfies Type<ClaudeChatRequest>;

export const defaultClaudeChatRequestValues: Partial<ClaudeChatRequest> = {
    max_tokens: 4096,
    stream: false
};

export const ClaudeChatRequestWithDefaults = ClaudeChatRequestValidator.pipe((val) => ({...defaultClaudeChatRequestValues, ...val}));
