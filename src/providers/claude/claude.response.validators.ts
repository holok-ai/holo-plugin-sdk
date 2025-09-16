import {type, type Type} from 'arktype';
import {numberOrNull, stringOrNull} from "../types/validator.types";
import {
    ClaudeCacheCreation,
    ClaudeCitationCharLocation,
    ClaudeCitationContentBlockLocation,
    ClaudeCitationPageLocation,
    ClaudeCitationsDelta,
    ClaudeCitationSearchResultLocation,
    ClaudeCitationsWebSearchResultLocation,
    ClaudeCodeExecutionOutputBlock,
    ClaudeCodeExecutionResultBlock,
    ClaudeCodeExecutionToolResultBlock,
    ClaudeCodeExecutionToolResultBlockContent,
    ClaudeCodeExecutionToolResultError,
    ClaudeContainer,
    ClaudeContainerUploadBlock,
    ClaudeContentBlock,
    ClaudeInputJSONDelta,
    ClaudeMCPToolResultBlock,
    ClaudeMCPToolUseBlock,
    ClaudeMessageDeltaUsage,
    ClaudeRawContentBlockDelta,
    ClaudeRawContentBlockDeltaEvent,
    ClaudeRawContentBlockStartEvent,
    ClaudeRawContentBlockStopEvent,
    ClaudeRawMessageDeltaEvent,
    ClaudeRawMessageStartEvent,
    ClaudeRawMessageStopEvent,
    ClaudeRawMessageStreamEvent,
    ClaudeRedactedThinkingBlock,
    ClaudeResponse,
    ClaudeResponseMessage,
    ClaudeServerToolUsage,
    ClaudeServerToolUseBlock,
    ClaudeSignatureDelta,
    ClaudeStopReason,
    ClaudeTextBlock,
    ClaudeTextCitation,
    ClaudeTextDelta,
    ClaudeThinkingBlock,
    ClaudeThinkingDelta,
    ClaudeToolUseBlock,
    ClaudeUsage,
    ClaudeWebSearchResultBlock,
    ClaudeWebSearchToolResultBlock,
    ClaudeWebSearchToolResultBlockContent,
    ClaudeWebSearchToolResultError
} from "./types";

export const ClaudeContainerValidator = type({
    id: 'string',
    expires_at: 'string'
}) satisfies Type<ClaudeContainer>;

export const ClaudeStopReasonValidator = type("'end_turn'|'max_tokens'|'stop_sequence'|'tool_use'|'pause_turn'|'refusal'") satisfies Type<ClaudeStopReason>;

export const ClaudeCacheCreationValidator = type({
    ephemeral_1h_input_tokens: 'number',
    ephemeral_5m_input_tokens: 'number'
}) satisfies Type<ClaudeCacheCreation>;

export const ClaudeServerToolUsageValidator = type({
    web_search_requests: 'number'
}) satisfies Type<ClaudeServerToolUsage>;

export const ClaudeUsageValidator = type({
    cache_creation: ClaudeCacheCreationValidator.or('null'),
    cache_creation_input_tokens: numberOrNull,
    cache_read_input_tokens: numberOrNull,
    input_tokens: 'number',
    output_tokens: 'number',
    server_tool_use: ClaudeServerToolUsageValidator.or('null'),
    service_tier: "'standard'|'priority'|'batch'|null"
}) satisfies Type<ClaudeUsage>;

export const ClaudeMessageDeltaUsageValidator = type({
    cache_creation_input_tokens: numberOrNull,
    cache_read_input_tokens: numberOrNull,
    input_tokens: numberOrNull,
    output_tokens: 'number',
    server_tool_use: ClaudeServerToolUsageValidator.or('null')
}) satisfies Type<ClaudeMessageDeltaUsage>;

export const ClaudeCitationCharLocationValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_char_index: 'number',
    start_char_index: 'number',
    type: "'char_location'"
}) satisfies Type<ClaudeCitationCharLocation>;

export const ClaudeCitationPageLocationValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_page_number: 'number',
    start_page_number: 'number',
    type: "'page_location'"
}) satisfies Type<ClaudeCitationPageLocation>;

export const ClaudeCitationContentBlockLocationValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_block_index: 'number',
    start_block_index: 'number',
    type: "'content_block_location'"
}) satisfies Type<ClaudeCitationContentBlockLocation>;

export const ClaudeCitationsWebSearchResultLocationValidator = type({
    cited_text: 'string',
    encrypted_index: 'string',
    title: stringOrNull,
    type: "'web_search_result_location'",
    url: 'string'
}) satisfies Type<ClaudeCitationsWebSearchResultLocation>;

export const ClaudeCitationSearchResultLocationValidator = type({
    cited_text: 'string',
    end_block_index: 'number',
    search_result_index: 'number',
    source: 'string',
    start_block_index: 'number',
    title: stringOrNull,
    type: "'search_result_location'"
}) satisfies Type<ClaudeCitationSearchResultLocation>;

export const ClaudeTextCitationValidator = ClaudeCitationCharLocationValidator
    .or(ClaudeCitationPageLocationValidator)
    .or(ClaudeCitationContentBlockLocationValidator)
    .or(ClaudeCitationsWebSearchResultLocationValidator)
    .or(ClaudeCitationSearchResultLocationValidator) satisfies Type<ClaudeTextCitation>;

export const ClaudeTextBlockValidator = type({
    citations: ClaudeTextCitationValidator.array().or('null'),
    text: 'string',
    type: "'text'"
}) satisfies Type<ClaudeTextBlock>;

export const ClaudeThinkingBlockValidator = type({
    signature: 'string',
    thinking: 'string',
    type: "'thinking'"
}) satisfies Type<ClaudeThinkingBlock>;

export const ClaudeRedactedThinkingBlockValidator = type({
    data: 'string',
    type: "'redacted_thinking'"
}) satisfies Type<ClaudeRedactedThinkingBlock>;

export const ClaudeToolUseBlockValidator = type({
    id: 'string',
    input: 'unknown',
    name: 'string',
    type: "'tool_use'"
}) satisfies Type<ClaudeToolUseBlock>;

export const ClaudeServerToolUseBlockValidator = type({
    id: 'string',
    input: 'unknown',
    name: "'web_search'|'code_execution'",
    type: "'server_tool_use'"
}) satisfies Type<ClaudeServerToolUseBlock>;

export const ClaudeWebSearchResultBlockValidator = type({
    encrypted_content: 'string',
    page_age: stringOrNull,
    title: 'string',
    type: "'web_search_result'",
    url: 'string'
}) satisfies Type<ClaudeWebSearchResultBlock>;

export const ClaudeWebSearchToolResultErrorValidator = type({
    error_code: "'invalid_tool_input'|'unavailable'|'max_uses_exceeded'|'too_many_requests'|'query_too_long'",
    type: "'web_search_tool_result_error'"
}) satisfies Type<ClaudeWebSearchToolResultError>;

export const ClaudeWebSearchToolResultBlockContentValidator = ClaudeWebSearchToolResultErrorValidator
    .or(ClaudeWebSearchResultBlockValidator.array()) satisfies Type<ClaudeWebSearchToolResultBlockContent>;

export const ClaudeWebSearchToolResultBlockValidator = type({
    content: ClaudeWebSearchToolResultBlockContentValidator,
    tool_use_id: 'string',
    type: "'web_search_tool_result'"
}) satisfies Type<ClaudeWebSearchToolResultBlock>;

export const ClaudeCodeExecutionOutputBlockValidator = type({
    file_id: 'string',
    type: "'code_execution_output'"
}) satisfies Type<ClaudeCodeExecutionOutputBlock>;

export const ClaudeCodeExecutionResultBlockValidator = type({
    content: ClaudeCodeExecutionOutputBlockValidator.array(),
    return_code: 'number',
    stderr: 'string',
    stdout: 'string',
    type: "'code_execution_result'"
}) satisfies Type<ClaudeCodeExecutionResultBlock>;

export const ClaudeCodeExecutionToolResultErrorValidator = type({
    error_code: "'invalid_tool_input'|'unavailable'|'too_many_requests'|'execution_time_exceeded'",
    type: "'code_execution_tool_result_error'"
}) satisfies Type<ClaudeCodeExecutionToolResultError>;

export const ClaudeCodeExecutionToolResultBlockContentValidator = ClaudeCodeExecutionToolResultErrorValidator
    .or(ClaudeCodeExecutionResultBlockValidator) satisfies Type<ClaudeCodeExecutionToolResultBlockContent>;

export const ClaudeCodeExecutionToolResultBlockValidator = type({
    content: ClaudeCodeExecutionToolResultBlockContentValidator,
    tool_use_id: 'string',
    type: "'code_execution_tool_result'"
}) satisfies Type<ClaudeCodeExecutionToolResultBlock>;

export const ClaudeMCPToolUseBlockValidator = type({
    id: 'string',
    input: 'unknown',
    name: 'string',
    server_name: 'string',
    type: "'mcp_tool_use'"
}) satisfies Type<ClaudeMCPToolUseBlock>;

export const ClaudeMCPToolResultBlockValidator = type({
    content: type('string').or(ClaudeTextBlockValidator.array()),
    is_error: 'boolean',
    tool_use_id: 'string',
    type: "'mcp_tool_result'"
}) satisfies Type<ClaudeMCPToolResultBlock>;

export const ClaudeContainerUploadBlockValidator = type({
    file_id: 'string',
    type: "'container_upload'"
}) satisfies Type<ClaudeContainerUploadBlock>;

export const ClaudeContentBlockValidator = ClaudeTextBlockValidator
    .or(ClaudeThinkingBlockValidator)
    .or(ClaudeRedactedThinkingBlockValidator)
    .or(ClaudeToolUseBlockValidator)
    .or(ClaudeServerToolUseBlockValidator)
    .or(ClaudeWebSearchToolResultBlockValidator)
    .or(ClaudeCodeExecutionToolResultBlockValidator)
    .or(ClaudeMCPToolUseBlockValidator)
    .or(ClaudeMCPToolResultBlockValidator)
    .or(ClaudeContainerUploadBlockValidator) satisfies Type<ClaudeContentBlock>;

export const ClaudeMessageValidator = type({
    id: 'string',
    container: ClaudeContainerValidator.or('null'),
    content: ClaudeContentBlockValidator.array(),
    model: 'string',
    role: "'assistant'",
    stop_reason: ClaudeStopReasonValidator.or('null'),
    stop_sequence: stringOrNull,
    type: "'message'",
    usage: ClaudeUsageValidator
}) satisfies Type<ClaudeResponseMessage>;

export const ClaudeTextDeltaValidator = type({
    text: 'string',
    type: "'text_delta'"
}) satisfies Type<ClaudeTextDelta>;

export const ClaudeInputJSONDeltaValidator = type({
    partial_json: 'string',
    type: "'input_json_delta'"
}) satisfies Type<ClaudeInputJSONDelta>;

export const ClaudeCitationsDeltaValidator = type({
    citation: ClaudeTextCitationValidator,
    type: "'citations_delta'"
}) satisfies Type<ClaudeCitationsDelta>;

export const ClaudeThinkingDeltaValidator = type({
    thinking: 'string',
    type: "'thinking_delta'"
}) satisfies Type<ClaudeThinkingDelta>;

export const ClaudeSignatureDeltaValidator = type({
    signature: 'string',
    type: "'signature_delta'"
}) satisfies Type<ClaudeSignatureDelta>;

export const ClaudeRawContentBlockDeltaValidator = ClaudeTextDeltaValidator
    .or(ClaudeInputJSONDeltaValidator)
    .or(ClaudeCitationsDeltaValidator)
    .or(ClaudeThinkingDeltaValidator)
    .or(ClaudeSignatureDeltaValidator) satisfies Type<ClaudeRawContentBlockDelta>;

export const ClaudeRawMessageStartEventValidator = type({
    message: ClaudeMessageValidator,
    type: "'message_start'"
}) satisfies Type<ClaudeRawMessageStartEvent>;

export const ClaudeRawMessageDeltaEventValidator = type({
    delta: type({
        container: ClaudeContainerValidator.or('null'),
        stop_reason: ClaudeStopReasonValidator.or('null'),
        stop_sequence: stringOrNull
    }),
    type: "'message_delta'",
    usage: ClaudeMessageDeltaUsageValidator
}) satisfies Type<ClaudeRawMessageDeltaEvent>;

export const ClaudeRawMessageStopEventValidator = type({
    type: "'message_stop'"
}) satisfies Type<ClaudeRawMessageStopEvent>;

export const ClaudeRawContentBlockStartEventValidator = type({
    content_block: ClaudeContentBlockValidator,
    index: 'number',
    type: "'content_block_start'"
}) satisfies Type<ClaudeRawContentBlockStartEvent>;

export const ClaudeRawContentBlockDeltaEventValidator = type({
    delta: ClaudeRawContentBlockDeltaValidator,
    index: 'number',
    type: "'content_block_delta'"
}) satisfies Type<ClaudeRawContentBlockDeltaEvent>;

export const ClaudeRawContentBlockStopEventValidator = type({
    index: 'number',
    type: "'content_block_stop'"
}) satisfies Type<ClaudeRawContentBlockStopEvent>;

export const ClaudeRawMessageStreamEventValidator =
    ClaudeRawMessageStartEventValidator
        .or(ClaudeRawMessageDeltaEventValidator)
        .or(ClaudeRawMessageStopEventValidator)
        .or(ClaudeRawContentBlockStartEventValidator)
        .or(ClaudeRawContentBlockDeltaEventValidator)
        .or(ClaudeRawContentBlockStopEventValidator) satisfies Type<ClaudeRawMessageStreamEvent>;

export const ClaudeResponseValidator =
    ClaudeRawMessageStreamEventValidator.or(ClaudeMessageValidator) satisfies Type<ClaudeResponse>;
