import {type, type Type} from 'arktype';
import {numberOrNull, stringOrNull} from "../../types";
import {
    ClaudeBase64PDFSource,
    ClaudeBashCodeExecutionOutputBlock,
    ClaudeBashCodeExecutionResultBlock,
    ClaudeBashCodeExecutionToolResultBlock,
    ClaudeBashCodeExecutionToolResultError,
    ClaudeCacheCreation,
    ClaudeCitationCharLocation,
    ClaudeCitationConfig,
    ClaudeCitationContentBlockLocation,
    ClaudeCitationPageLocation,
    ClaudeCitationsDelta,
    ClaudeCitationSearchResultLocation,
    ClaudeCitationsWebSearchResultLocation,
    ClaudeClearToolUses20250919EditResponse,
    ClaudeCodeExecutionOutputBlock,
    ClaudeCodeExecutionResultBlock,
    ClaudeCodeExecutionToolResultBlock,
    ClaudeCodeExecutionToolResultBlockContent,
    ClaudeCodeExecutionToolResultError,
    ClaudeContainer,
    ClaudeContainerUploadBlock,
    ClaudeContentBlock,
    ClaudeContextManagementResponse,
    ClaudeDocumentBlock,
    ClaudeInputJSONDelta,
    ClaudeMCPToolResultBlock,
    ClaudeMCPToolUseBlock,
    ClaudeMessageDeltaUsage,
    ClaudePlainTextSource,
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
    ClaudeSkill,
    ClaudeStopReason,
    ClaudeTextBlock,
    ClaudeTextCitation,
    ClaudeTextDelta,
    ClaudeTextEditorCodeExecutionCreateResultBlock,
    ClaudeTextEditorCodeExecutionStrReplaceResultBlock,
    ClaudeTextEditorCodeExecutionToolResultBlock,
    ClaudeTextEditorCodeExecutionToolResultError,
    ClaudeTextEditorCodeExecutionViewResultBlock,
    ClaudeThinkingBlock,
    ClaudeThinkingDelta,
    ClaudeToolUseBlock,
    ClaudeUsage,
    ClaudeWebFetchBlock,
    ClaudeWebFetchToolResultBlock,
    ClaudeWebFetchToolResultErrorBlock,
    ClaudeWebSearchResultBlock,
    ClaudeWebSearchToolResultBlock,
    ClaudeWebSearchToolResultBlockContent,
    ClaudeWebSearchToolResultError
} from "../types";

export const ClaudeSkillValidator = type({
    skill_id: 'string',
    type: "'anthropic'|'custom'",
    version: 'string'
}) satisfies Type<ClaudeSkill>

export const ClaudeContainerValidator = type({
    id: 'string',
    expires_at: 'string',
    skills: ClaudeSkillValidator.array()
}) satisfies Type<ClaudeContainer>;

export const ClaudeStopReasonValidator = type("'end_turn'|'max_tokens'|'stop_sequence'|'tool_use'|'pause_turn'|'refusal'|'model_context_window_exceeded'") satisfies Type<ClaudeStopReason>;

export const ClaudeCacheCreationValidator = type({
    ephemeral_1h_input_tokens: 'number',
    ephemeral_5m_input_tokens: 'number'
}) satisfies Type<ClaudeCacheCreation>;

export const ClaudeServerToolUsageValidator = type({
    web_fetch_requests: 'number',
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
    file_id: stringOrNull,
    start_char_index: 'number',
    type: "'char_location'"
}) satisfies Type<ClaudeCitationCharLocation>;

export const ClaudeCitationPageLocationValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_page_number: 'number',
    file_id: stringOrNull,
    start_page_number: 'number',
    type: "'page_location'"
}) satisfies Type<ClaudeCitationPageLocation>;

export const ClaudeCitationContentBlockLocationValidator = type({
    cited_text: 'string',
    document_index: 'number',
    document_title: stringOrNull,
    end_block_index: 'number',
    file_id: stringOrNull,
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
    name: "'web_search'|'web_fetch'|'code_execution'|'bash_code_execution'|'text_editor_code_execution'",
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

export const ClaudeBase64PDFSourceValidator = type({
    data: 'string',
    media_type: "'application/pdf'",
    type: "'base64'"
}) satisfies Type<ClaudeBase64PDFSource>;

export const ClaudePlainTextSourceValidator = type({
    data: 'string',
    media_type: "'text/plain'",
    type: "'text'"
}) satisfies Type<ClaudePlainTextSource>;

export const ClaudeCitationConfigValidator = type({
    enabled: 'boolean'
}) satisfies Type<ClaudeCitationConfig>;

export const ClaudeDocumentBlockValidator = type({
    citations: ClaudeCitationConfigValidator.or('null'),
    source: ClaudeBase64PDFSourceValidator.or(ClaudePlainTextSourceValidator),
    title: stringOrNull,
    type: "'document'"
}) satisfies Type<ClaudeDocumentBlock>;

export const ClaudeWebFetchToolResultErrorBlockValidator = type({
    error_code: "'invalid_tool_input'|'url_too_long'|'url_not_allowed'|'url_not_accessible'|'unsupported_content_type'|'too_many_requests'|'max_uses_exceeded'|'unavailable'",
    type: "'web_fetch_tool_result_error'"
}) satisfies Type<ClaudeWebFetchToolResultErrorBlock>;

export const ClaudeWebFetchBlockValidator = type({
    content: ClaudeDocumentBlockValidator,
    retrieved_at: stringOrNull,
    type: "'web_fetch_result'",
    url: 'string'
}) satisfies Type<ClaudeWebFetchBlock>;

export const ClaudeWebFetchToolResultBlockValidator = type({
    content: ClaudeWebFetchToolResultErrorBlockValidator.or(ClaudeWebFetchBlockValidator),
    tool_use_id: 'string',
    type: "'web_fetch_tool_result'"
}) satisfies Type<ClaudeWebFetchToolResultBlock>;

export const ClaudeBashCodeExecutionOutputBlockValidator = type({
    file_id: 'string',
    type: "'bash_code_execution_output'"
}) satisfies Type<ClaudeBashCodeExecutionOutputBlock>;

export const ClaudeBashCodeExecutionResultBlockValidator = type({
    content: ClaudeBashCodeExecutionOutputBlockValidator.array(),
    return_code: 'number',
    stderr: 'string',
    stdout: 'string',
    type: "'bash_code_execution_result'"
}) satisfies Type<ClaudeBashCodeExecutionResultBlock>;

export const ClaudeBashCodeExecutionToolResultErrorValidator = type({
    error_code: "'invalid_tool_input'|'unavailable'|'too_many_requests'|'execution_time_exceeded'|'output_file_too_large'",
    type: "'bash_code_execution_tool_result_error'"
}) satisfies Type<ClaudeBashCodeExecutionToolResultError>;

export const ClaudeBashCodeExecutionToolResultBlockValidator = type({
    content: ClaudeBashCodeExecutionToolResultErrorValidator.or(ClaudeBashCodeExecutionResultBlockValidator),
    tool_use_id: 'string',
    type: "'bash_code_execution_tool_result'"
}) satisfies Type<ClaudeBashCodeExecutionToolResultBlock>;

export const ClaudeTextEditorCodeExecutionViewResultBlockValidator = type({
    content: 'string',
    file_type: "'text'|'image'|'pdf'",
    num_lines: numberOrNull,
    start_line: numberOrNull,
    total_lines: numberOrNull,
    type: "'text_editor_code_execution_view_result'"
}) satisfies Type<ClaudeTextEditorCodeExecutionViewResultBlock>;

export const ClaudeTextEditorCodeExecutionCreateResultBlockValidator = type({
    is_file_update: 'boolean',
    type: "'text_editor_code_execution_create_result'"
}) satisfies Type<ClaudeTextEditorCodeExecutionCreateResultBlock>;

export const ClaudeTextEditorCodeExecutionStrReplaceResultBlockValidator = type({
    lines: type('string').array().or('null'),
    new_lines: numberOrNull,
    new_start: numberOrNull,
    old_lines: numberOrNull,
    old_start: numberOrNull,
    type: "'text_editor_code_execution_str_replace_result'"
}) satisfies Type<ClaudeTextEditorCodeExecutionStrReplaceResultBlock>;

export const ClaudeTextEditorCodeExecutionToolResultErrorValidator = type({
    error_code: "'invalid_tool_input'|'unavailable'|'too_many_requests'|'execution_time_exceeded'|'file_not_found'",
    error_message: stringOrNull,
    type: "'text_editor_code_execution_tool_result_error'"
}) satisfies Type<ClaudeTextEditorCodeExecutionToolResultError>;

export const ClaudeTextEditorCodeExecutionToolResultBlockValidator = type({
    content: ClaudeTextEditorCodeExecutionToolResultErrorValidator
        .or(ClaudeTextEditorCodeExecutionViewResultBlockValidator)
        .or(ClaudeTextEditorCodeExecutionCreateResultBlockValidator)
        .or(ClaudeTextEditorCodeExecutionStrReplaceResultBlockValidator),
    tool_use_id: 'string',
    type: "'text_editor_code_execution_tool_result'"
}) satisfies Type<ClaudeTextEditorCodeExecutionToolResultBlock>;

export const ClaudeContentBlockValidator = ClaudeTextBlockValidator
    .or(ClaudeThinkingBlockValidator)
    .or(ClaudeRedactedThinkingBlockValidator)
    .or(ClaudeToolUseBlockValidator)
    .or(ClaudeServerToolUseBlockValidator)
    .or(ClaudeWebSearchToolResultBlockValidator)
    .or(ClaudeWebFetchToolResultBlockValidator)
    .or(ClaudeCodeExecutionToolResultBlockValidator)
    .or(ClaudeBashCodeExecutionToolResultBlockValidator)
    .or(ClaudeTextEditorCodeExecutionToolResultBlockValidator)
    .or(ClaudeMCPToolUseBlockValidator)
    .or(ClaudeMCPToolResultBlockValidator)
    .or(ClaudeContainerUploadBlockValidator) satisfies Type<ClaudeContentBlock>;

export const ClaudeClearToolUses20250919EditResponseValidator = type({
    cleared_input_tokens: 'number',
    cleared_tool_uses: 'number',
    type: "'clear_tool_uses_20250919'"
}) satisfies Type<ClaudeClearToolUses20250919EditResponse>;

export const ClaudeContextManagementResponseValidator = type({
    applied_edits: ClaudeClearToolUses20250919EditResponseValidator.array()
}) satisfies Type<ClaudeContextManagementResponse>;

export const ClaudeResponseMessageValidator = type({
    id: 'string',
    container: ClaudeContainerValidator.or('null'),
    content: ClaudeContentBlockValidator.array(),
    context_management: ClaudeContextManagementResponseValidator.or('null'),
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
    message: ClaudeResponseMessageValidator,
    type: "'message_start'"
}) satisfies Type<ClaudeRawMessageStartEvent>;

export const ClaudeRawMessageDeltaEventValidator = type({
    context_management: ClaudeContextManagementResponseValidator.or('null'),
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
    ClaudeRawMessageStreamEventValidator.or(ClaudeResponseMessageValidator) satisfies Type<ClaudeResponse>;
