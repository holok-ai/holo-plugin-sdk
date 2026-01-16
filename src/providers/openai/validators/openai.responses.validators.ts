import {type, type Type} from 'arktype';
import {stringOrNull} from '../../types';
import {
    OpenAIResponseErrorEvent,
    OpenAIResponseTextDeltaEvent,
    OpenAIResponseTextDeltaEventLogprob,
    OpenAIResponseTextDeltaEventLogprobTopLogprob,
    OpenAIResponseTextDoneEvent,
    OpenAIResponseTextDoneEventLogprob,
    OpenAIResponseTextDoneEventLogprobTopLogprob,
    OpenAIResponseRefusalDeltaEvent,
    OpenAIResponseRefusalDoneEvent,
    OpenAIResponseOutputItemAddedEvent,
    OpenAIResponseOutputItemDoneEvent,
    OpenAIResponseContentPartAddedEvent,
    OpenAIResponseContentPartAddedEventReasoningText,
    OpenAIResponseContentPartDoneEvent,
    OpenAIResponseContentPartDoneEventReasoningText,
    OpenAIResponseReasoningTextDeltaEvent,
    OpenAIResponseReasoningTextDoneEvent,
    OpenAIResponseReasoningSummaryTextDeltaEvent,
    OpenAIResponseReasoningSummaryTextDoneEvent,
    OpenAIResponseFunctionCallArgumentsDeltaEvent,
    OpenAIResponseFunctionCallArgumentsDoneEvent,
    OpenAIResponseCustomToolCallInputDeltaEvent,
    OpenAIResponseCustomToolCallInputDoneEvent,
    OpenAIResponseFileSearchCallInProgressEvent,
    OpenAIResponseFileSearchCallSearchingEvent,
    OpenAIResponseFileSearchCallCompletedEvent,
    OpenAIResponseWebSearchCallInProgressEvent,
    OpenAIResponseWebSearchCallSearchingEvent,
    OpenAIResponseWebSearchCallCompletedEvent,
    OpenAIResponseCodeInterpreterCallInProgressEvent,
    OpenAIResponseCodeInterpreterCallInterpretingEvent,
    OpenAIResponseCodeInterpreterCallCompletedEvent,
    OpenAIResponseCodeInterpreterCallCodeDeltaEvent,
    OpenAIResponseCodeInterpreterCallCodeDoneEvent,
    OpenAIResponseAudioDeltaEvent,
    OpenAIResponseAudioDoneEvent,
    OpenAIResponseAudioTranscriptDeltaEvent,
    OpenAIResponseAudioTranscriptDoneEvent,
    OpenAIResponseMcpCallArgumentsDeltaEvent,
    OpenAIResponseMcpCallArgumentsDoneEvent,
    OpenAIResponseMcpCallCompletedEvent,
    OpenAIResponseMcpCallFailedEvent,
    OpenAIResponseMcpCallInProgressEvent,
    OpenAIResponseMcpListToolsCompletedEvent,
    OpenAIResponseMcpListToolsFailedEvent,
    OpenAIResponseMcpListToolsInProgressEvent,
    OpenAIResponseImageGenCallCompletedEvent,
    OpenAIResponseImageGenCallGeneratingEvent,
    OpenAIResponseImageGenCallInProgressEvent,
    OpenAIResponseImageGenCallPartialImageEvent,
    OpenAIResponseReasoningSummaryPartAddedEvent,
    OpenAIResponseReasoningSummaryPartAddedEventPart,
    OpenAIResponseReasoningSummaryPartDoneEvent,
    OpenAIResponseReasoningSummaryPartDoneEventPart,
    OpenAIResponseOutputTextAnnotationAddedEvent,
    OpenAIResponseCreatedEvent,
    OpenAIResponseQueuedEvent,
    OpenAIResponseInProgressEvent,
    OpenAIResponseCompletedEvent,
    OpenAIResponseFailedEvent,
    OpenAIResponseIncompleteEvent,
    OpenAIResponseConversationParam,
    OpenAIResponseCustomToolCall,
    OpenAIResponseCustomToolCallOutput,
    OpenAIResponseError,
    OpenAIResponseFileSearchToolCall,
    OpenAIResponseFileSearchToolCallResult,
    OpenAIResponseFunctionCallOutputItem,
    OpenAIResponseFunctionCallOutputItemList,
    OpenAIResponseFunctionToolCall,
    OpenAIResponseFunctionToolCallItem,
    OpenAIResponseFunctionToolCallOutputItem,
    OpenAIResponseFunctionWebSearch,
    OpenAIResponseFunctionWebSearchFind,
    OpenAIResponseFunctionWebSearchOpenPage,
    OpenAIResponseFunctionWebSearchSearch,
    OpenAIResponseFunctionWebSearchSearchSource,
    OpenAIResponseIncludable,
    OpenAIResponseInputContent,
    OpenAIResponseInputFile,
    OpenAIResponseInputFileContent,
    OpenAIResponseInputImage,
    OpenAIResponseInputImageContent,
    OpenAIResponseInputText,
    OpenAIResponseInputTextContent,
    OpenAIResponseOutputMessage,
    OpenAIResponseOutputRefusal,
    OpenAIResponseOutputText,
    OpenAIResponseOutputTextContainerFileCitation,
    OpenAIResponseOutputTextFileCitation,
    OpenAIResponseOutputTextFilePath,
    OpenAIResponseOutputTextLogprob,
    OpenAIResponseOutputTextLogprobTopLogprob,
    OpenAIResponseOutputTextURLCitation,
    OpenAIResponseStatus,
    OpenAIToolChoiceOptions,
    OpenAIComputerTool,
    OpenAICustomTool,
    OpenAIFileSearchTool,
    OpenAIFileSearchToolRankingOptions,
    OpenAIFileSearchToolRankingOptionsHybridSearch,
    OpenAIFunctionTool,
    OpenAIWebSearchPreviewTool,
    OpenAIWebSearchPreviewToolUserLocation,
    OpenAIWebSearchTool,
    OpenAIWebSearchToolFilters,
    OpenAIWebSearchToolUserLocation,
    OpenAIToolChoiceAllowed,
    OpenAIToolChoiceCustom,
    OpenAIToolChoiceFunction,
    OpenAIToolChoiceMcp,
    OpenAIToolChoiceTypes,
    OpenAIResponseCodeInterpreterToolCall,
    OpenAIResponseCodeInterpreterToolCallLogs,
    OpenAIResponseCodeInterpreterToolCallImage,
    OpenAIResponseComputerToolCall,
    OpenAIResponseComputerToolCallClick,
    OpenAIResponseComputerToolCallPendingSafetyCheck,
    OpenAIResponseReasoningItem,
    OpenAIResponseReasoningItemSummary,
    OpenAIResponseReasoningItemContent,
    OpenAIResponseUsage,
    OpenAIResponseUsageInputTokensDetails,
    OpenAIResponseUsageOutputTokensDetails,
    OpenAIResponseComputerToolCallOutputItem,
    OpenAIResponseComputerToolCallOutputItemAcknowledgedSafetyCheck,
    OpenAIResponseComputerToolCallOutputScreenshot,
    OpenAIResponseContent,
    OpenAIResponseContentReasoningTextContent,
    OpenAIEasyInputMessage,
    OpenAIResponsePrompt,
    OpenAIResponseOutputAudio,
    OpenAIResponseInputMessageContentList
} from '../types';

export const OpenAIResponseStatusValidator = type("'completed'|'failed'|'in_progress'|'cancelled'|'queued'|'incomplete'") satisfies Type<OpenAIResponseStatus>;

export const OpenAIResponseIncludableValidator = type("'file_search_call.results'|'web_search_call.results'|'web_search_call.action.sources'|'message.input_image.image_url'|'computer_call_output.output.image_url'|'code_interpreter_call.outputs'|'reasoning.encrypted_content'|'message.output_text.logprobs'") satisfies Type<OpenAIResponseIncludable>;

export const OpenAIToolChoiceOptionsValidator = type("'none'|'auto'|'required'") satisfies Type<OpenAIToolChoiceOptions>;

export const OpenAIResponseInputTextValidator = type({
    text: 'string',
    type: "'input_text'"
}) satisfies Type<OpenAIResponseInputText>;

export const OpenAIResponseInputTextContentValidator = type({
    text: 'string',
    type: "'input_text'"
}) satisfies Type<OpenAIResponseInputTextContent>;

export const OpenAIResponseInputImageContentValidator = type({
    type: "'input_image'",
    'detail?': type("'low'|'high'|'auto'").or('null'),
    'file_id?': stringOrNull,
    'image_url?': stringOrNull
}) satisfies Type<OpenAIResponseInputImageContent>;

export const OpenAIResponseInputImageValidator = type({
    detail: "'low'|'high'|'auto'",
    type: "'input_image'",
    'file_id?': stringOrNull,
    'image_url?': stringOrNull
}) satisfies Type<OpenAIResponseInputImage>;

export const OpenAIResponseInputFileContentValidator = type({
    type: "'input_file'",
    'file_data?': stringOrNull,
    'file_id?': stringOrNull,
    'file_url?': stringOrNull,
    'filename?': stringOrNull
}) satisfies Type<OpenAIResponseInputFileContent>;

export const OpenAIResponseInputFileValidator = type({
    type: "'input_file'",
    'file_data?': 'string',
    'file_id?': stringOrNull,
    'file_url?': 'string',
    'filename?': 'string'
}) satisfies Type<OpenAIResponseInputFile>;

export const OpenAIResponseInputContentValidator = OpenAIResponseInputTextValidator
    .or(OpenAIResponseInputImageValidator)
    .or(OpenAIResponseInputFileValidator) satisfies Type<OpenAIResponseInputContent>;

export const OpenAIResponseOutputRefusalValidator = type({
    refusal: 'string',
    type: "'refusal'"
}) satisfies Type<OpenAIResponseOutputRefusal>;

export const OpenAIResponseOutputTextFileCitationValidator = type({
    file_id: 'string',
    filename: 'string',
    index: 'number',
    type: "'file_citation'"
}) satisfies Type<OpenAIResponseOutputTextFileCitation>;

export const OpenAIResponseOutputTextURLCitationValidator = type({
    end_index: 'number',
    start_index: 'number',
    title: 'string',
    type: "'url_citation'",
    url: 'string'
}) satisfies Type<OpenAIResponseOutputTextURLCitation>;

export const OpenAIResponseOutputTextContainerFileCitationValidator = type({
    container_id: 'string',
    end_index: 'number',
    file_id: 'string',
    filename: 'string',
    start_index: 'number',
    type: "'container_file_citation'"
}) satisfies Type<OpenAIResponseOutputTextContainerFileCitation>;

export const OpenAIResponseOutputTextFilePathValidator = type({
    file_id: 'string',
    index: 'number',
    type: "'file_path'"
}) satisfies Type<OpenAIResponseOutputTextFilePath>;

export const OpenAIResponseOutputTextLogprobTopLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number'
}) satisfies Type<OpenAIResponseOutputTextLogprobTopLogprob>;

export const OpenAIResponseOutputTextLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number',
    top_logprobs: OpenAIResponseOutputTextLogprobTopLogprobValidator.array()
}) satisfies Type<OpenAIResponseOutputTextLogprob>;

export const OpenAIResponseOutputTextValidator = type({
    annotations: OpenAIResponseOutputTextFileCitationValidator
        .or(OpenAIResponseOutputTextURLCitationValidator)
        .or(OpenAIResponseOutputTextContainerFileCitationValidator)
        .or(OpenAIResponseOutputTextFilePathValidator).array(),
    text: 'string',
    type: "'output_text'",
    'logprobs?': OpenAIResponseOutputTextLogprobValidator.array()
}) satisfies Type<OpenAIResponseOutputText>;

export const OpenAIResponseOutputMessageValidator = type({
    id: 'string',
    content: OpenAIResponseOutputTextValidator.or(OpenAIResponseOutputRefusalValidator).array(),
    role: "'assistant'",
    status: "'in_progress'|'completed'|'incomplete'",
    type: "'message'"
}) satisfies Type<OpenAIResponseOutputMessage>;

export const OpenAIResponseCustomToolCallValidator = type({
    call_id: 'string',
    input: 'string',
    name: 'string',
    type: "'custom_tool_call'",
    'id?': 'string'
}) satisfies Type<OpenAIResponseCustomToolCall>;

export const OpenAIResponseCustomToolCallOutputValidator = type({
    call_id: 'string',
    output: type('string').or(OpenAIResponseInputTextValidator.or(OpenAIResponseInputImageValidator).or(OpenAIResponseInputFileValidator).array()),
    type: "'custom_tool_call_output'",
    'id?': 'string'
}) satisfies Type<OpenAIResponseCustomToolCallOutput>;

export const OpenAIResponseErrorValidator = type({
    code: "'server_error'|'rate_limit_exceeded'|'invalid_prompt'|'vector_store_timeout'|'invalid_image'|'invalid_image_format'|'invalid_base64_image'|'invalid_image_url'|'image_too_large'|'image_too_small'|'image_parse_error'|'image_content_policy_violation'|'invalid_image_mode'|'image_file_too_large'|'unsupported_image_media_type'|'empty_image_file'|'failed_to_download_image'|'image_file_not_found'",
    message: 'string'
}) satisfies Type<OpenAIResponseError>;

export const OpenAIResponseConversationParamValidator = type({
    id: 'string'
}) satisfies Type<OpenAIResponseConversationParam>;

export const OpenAIResponseFileSearchToolCallResultValidator = type({
    'attributes?': type('Record<string, string | number | boolean>').or('null'),
    'file_id?': 'string',
    'filename?': 'string',
    'score?': 'number',
    'text?': 'string'
}) satisfies Type<OpenAIResponseFileSearchToolCallResult>;

export const OpenAIResponseFileSearchToolCallValidator = type({
    id: 'string',
    queries: 'string[]',
    status: "'in_progress'|'searching'|'completed'|'incomplete'|'failed'",
    type: "'file_search_call'",
    'results?': OpenAIResponseFileSearchToolCallResultValidator.array().or('null')
}) satisfies Type<OpenAIResponseFileSearchToolCall>;

export const OpenAIResponseFunctionCallOutputItemValidator = OpenAIResponseInputTextContentValidator
    .or(OpenAIResponseInputImageContentValidator)
    .or(OpenAIResponseInputFileContentValidator) satisfies Type<OpenAIResponseFunctionCallOutputItem>;

export const OpenAIResponseFunctionCallOutputItemListValidator = OpenAIResponseFunctionCallOutputItemValidator.array() satisfies Type<OpenAIResponseFunctionCallOutputItemList>;

export const OpenAIResponseFunctionToolCallValidator = type({
    arguments: 'string',
    call_id: 'string',
    name: 'string',
    type: "'function_call'",
    'id?': 'string',
    'status?': "'in_progress'|'completed'|'incomplete'"
}) satisfies Type<OpenAIResponseFunctionToolCall>;

export const OpenAIResponseFunctionToolCallItemValidator = type({
    id: 'string',
    arguments: 'string',
    call_id: 'string',
    name: 'string',
    type: "'function_call'",
    'status?': "'in_progress'|'completed'|'incomplete'"
}) satisfies Type<OpenAIResponseFunctionToolCallItem>;

export const OpenAIResponseFunctionToolCallOutputItemValidator = type({
    id: 'string',
    call_id: 'string',
    output: type('string').or(OpenAIResponseInputTextValidator.or(OpenAIResponseInputImageValidator).or(OpenAIResponseInputFileValidator).array()),
    type: "'function_call_output'",
    'status?': "'in_progress'|'completed'|'incomplete'"
}) satisfies Type<OpenAIResponseFunctionToolCallOutputItem>;

export const OpenAIResponseFunctionWebSearchSearchSourceValidator = type({
    type: "'url'",
    url: 'string'
}) satisfies Type<OpenAIResponseFunctionWebSearchSearchSource>;

export const OpenAIResponseFunctionWebSearchSearchValidator = type({
    query: 'string',
    type: "'search'",
    'sources?': OpenAIResponseFunctionWebSearchSearchSourceValidator.array()
}) satisfies Type<OpenAIResponseFunctionWebSearchSearch>;

export const OpenAIResponseFunctionWebSearchOpenPageValidator = type({
    type: "'open_page'",
    url: 'string'
}) satisfies Type<OpenAIResponseFunctionWebSearchOpenPage>;

export const OpenAIResponseFunctionWebSearchFindValidator = type({
    pattern: 'string',
    type: "'find'",
    url: 'string'
}) satisfies Type<OpenAIResponseFunctionWebSearchFind>;

export const OpenAIResponseFunctionWebSearchValidator = type({
    id: 'string',
    status: "'in_progress'|'searching'|'completed'|'failed'",
    type: "'web_search_call'"
}) satisfies Type<OpenAIResponseFunctionWebSearch>;

export const OpenAIComputerToolValidator = type({
    display_height: 'number',
    display_width: 'number',
    environment: "'windows'|'mac'|'linux'|'ubuntu'|'browser'",
    type: "'computer_use_preview'"
}) satisfies Type<OpenAIComputerTool>;

const CustomToolInputFormatTextValidator = type({
    type: "'text'"
});

const CustomToolInputFormatGrammarValidator = type({
    definition: 'string',
    syntax: "'lark'|'regex'",
    type: "'grammar'"
});

const CustomToolInputFormatValidator = CustomToolInputFormatTextValidator.or(CustomToolInputFormatGrammarValidator);

export const OpenAICustomToolValidator = type({
    name: 'string',
    type: "'custom'",
    'description?': 'string',
    'format?': CustomToolInputFormatValidator
}) satisfies Type<OpenAICustomTool>;

const ComparisonFilterValidator = type({
    key: 'string',
    type: "'eq'|'ne'|'gt'|'gte'|'lt'|'lte'",
    value: type('string').or('number').or('boolean').or(type('string').or('number').array())
});

const CompoundFilterValidator: any = type({
    filters: type('unknown[]'),
    type: "'and'|'or'"
});

const FileSearchFilterValidator = ComparisonFilterValidator.or(CompoundFilterValidator).or('null');

export const OpenAIFileSearchToolRankingOptionsHybridSearchValidator = type({
    embedding_weight: 'number',
    text_weight: 'number'
}) satisfies Type<OpenAIFileSearchToolRankingOptionsHybridSearch>;

export const OpenAIFileSearchToolRankingOptionsValidator = type({
    'hybrid_search?': OpenAIFileSearchToolRankingOptionsHybridSearchValidator,
    'ranker?': "'auto'|'default-2024-11-15'",
    'score_threshold?': 'number'
}) satisfies Type<OpenAIFileSearchToolRankingOptions>;

export const OpenAIFileSearchToolValidator = type({
    type: "'file_search'",
    vector_store_ids: 'string[]',
    'filters?': FileSearchFilterValidator,
    'max_num_results?': 'number',
    'ranking_options?': OpenAIFileSearchToolRankingOptionsValidator
}) satisfies Type<OpenAIFileSearchTool>;

export const OpenAIFunctionToolValidator = type({
    name: 'string',
    parameters: type('Record<string, unknown>').or('null'),
    strict: type('boolean').or('null'),
    type: "'function'",
    'description?': stringOrNull
}) satisfies Type<OpenAIFunctionTool>;

export const OpenAIWebSearchPreviewToolUserLocationValidator = type({
    type: "'approximate'",
    'city?': stringOrNull,
    'country?': stringOrNull,
    'region?': stringOrNull,
    'timezone?': stringOrNull
}) satisfies Type<OpenAIWebSearchPreviewToolUserLocation>;

export const OpenAIWebSearchPreviewToolValidator = type({
    type: "'web_search_preview'|'web_search_preview_2025_03_11'",
    'search_context_size?': "'low'|'medium'|'high'",
    'user_location?': OpenAIWebSearchPreviewToolUserLocationValidator.or('null')
}) satisfies Type<OpenAIWebSearchPreviewTool>;

export const OpenAIWebSearchToolFiltersValidator = type({
    'allowed_domains?': type('string[]').or('null')
}) satisfies Type<OpenAIWebSearchToolFilters>;

export const OpenAIWebSearchToolUserLocationValidator = type({
    'city?': stringOrNull,
    'country?': stringOrNull,
    'region?': stringOrNull,
    'timezone?': stringOrNull
}) satisfies Type<OpenAIWebSearchToolUserLocation>;

export const OpenAIWebSearchToolValidator = type({
    type: "'web_search'|'web_search_2025_08_26'",
    'filters?': OpenAIWebSearchToolFiltersValidator.or('null'),
    'search_context_size?': "'low'|'medium'|'high'",
    'user_location?': OpenAIWebSearchToolUserLocationValidator.or('null')
}) satisfies Type<OpenAIWebSearchTool>;

export const OpenAIToolChoiceAllowedValidator = type({
    mode: "'auto'|'required'",
    tools: type('Record<string, unknown>').array(),
    type: "'allowed_tools'"
}) satisfies Type<OpenAIToolChoiceAllowed>;

export const OpenAIToolChoiceCustomValidator = type({
    name: 'string',
    type: "'custom'"
}) satisfies Type<OpenAIToolChoiceCustom>;

export const OpenAIToolChoiceFunctionValidator = type({
    name: 'string',
    type: "'function'"
}) satisfies Type<OpenAIToolChoiceFunction>;

export const OpenAIToolChoiceMcpValidator = type({
    server_label: 'string',
    type: "'mcp'",
    'name?': stringOrNull
}) satisfies Type<OpenAIToolChoiceMcp>;

export const OpenAIToolChoiceTypesValidator = type({
    type: "'file_search'|'web_search_preview'|'computer_use_preview'|'web_search_preview_2025_03_11'|'image_generation'|'code_interpreter'|'mcp'"
}) satisfies Type<OpenAIToolChoiceTypes>;

export const OpenAIResponseCodeInterpreterToolCallLogsValidator = type({
    logs: 'string',
    type: "'logs'"
}) satisfies Type<OpenAIResponseCodeInterpreterToolCallLogs>;

export const OpenAIResponseCodeInterpreterToolCallImageValidator = type({
    type: "'image'",
    url: 'string'
}) satisfies Type<OpenAIResponseCodeInterpreterToolCallImage>;

export const OpenAIResponseCodeInterpreterToolCallValidator = type({
    id: 'string',
    code: stringOrNull,
    container_id: 'string',
    outputs: OpenAIResponseCodeInterpreterToolCallLogsValidator.or(OpenAIResponseCodeInterpreterToolCallImageValidator).array().or('null'),
    status: "'in_progress'|'completed'|'incomplete'|'interpreting'|'failed'",
    type: "'code_interpreter_call'"
}) satisfies Type<OpenAIResponseCodeInterpreterToolCall>;

export const OpenAIResponseComputerToolCallPendingSafetyCheckValidator = type({
    id: 'string',
    'code?': stringOrNull,
    'message?': stringOrNull
}) satisfies Type<OpenAIResponseComputerToolCallPendingSafetyCheck>;

const ComputerActionClickValidator = type({
    button: "'left'|'right'|'wheel'|'back'|'forward'",
    type: "'click'",
    x: 'number',
    y: 'number'
});

const ComputerActionDoubleClickValidator = type({
    type: "'double_click'",
    x: 'number',
    y: 'number'
});

const ComputerActionDragValidator = type({
    path: type({x: 'number', y: 'number'}).array(),
    type: "'drag'"
});

const ComputerActionKeypressValidator = type({
    keys: 'string[]',
    type: "'keypress'"
});

const ComputerActionMoveValidator = type({
    type: "'move'",
    x: 'number',
    y: 'number'
});

const ComputerActionScreenshotValidator = type({
    type: "'screenshot'"
});

const ComputerActionScrollValidator = type({
    scroll_x: 'number',
    scroll_y: 'number',
    type: "'scroll'",
    x: 'number',
    y: 'number'
});

const ComputerActionTypeValidator = type({
    text: 'string',
    type: "'type'"
});

const ComputerActionWaitValidator = type({
    type: "'wait'"
});

const ComputerActionValidator = ComputerActionClickValidator
    .or(ComputerActionDoubleClickValidator)
    .or(ComputerActionDragValidator)
    .or(ComputerActionKeypressValidator)
    .or(ComputerActionMoveValidator)
    .or(ComputerActionScreenshotValidator)
    .or(ComputerActionScrollValidator)
    .or(ComputerActionTypeValidator)
    .or(ComputerActionWaitValidator);

export const OpenAIResponseComputerToolCallClickValidator = ComputerActionClickValidator satisfies Type<OpenAIResponseComputerToolCallClick>;

export const OpenAIResponseComputerToolCallValidator = type({
    id: 'string',
    action: ComputerActionValidator,
    call_id: 'string',
    pending_safety_checks: OpenAIResponseComputerToolCallPendingSafetyCheckValidator.array(),
    status: "'in_progress'|'completed'|'incomplete'",
    type: "'computer_call'"
}) satisfies Type<OpenAIResponseComputerToolCall>;

export const OpenAIResponseReasoningItemSummaryValidator = type({
    text: 'string',
    type: "'summary_text'"
}) satisfies Type<OpenAIResponseReasoningItemSummary>;

export const OpenAIResponseReasoningItemContentValidator = type({
    text: 'string',
    type: "'reasoning_text'"
}) satisfies Type<OpenAIResponseReasoningItemContent>;

export const OpenAIResponseReasoningItemValidator = type({
    id: 'string',
    summary: OpenAIResponseReasoningItemSummaryValidator.array(),
    type: "'reasoning'",
    'content?': OpenAIResponseReasoningItemContentValidator.array(),
    'encrypted_content?': stringOrNull,
    'status?': "'in_progress'|'completed'|'incomplete'"
}) satisfies Type<OpenAIResponseReasoningItem>;

export const OpenAIResponseUsageInputTokensDetailsValidator = type({
    cached_tokens: 'number'
}) satisfies Type<OpenAIResponseUsageInputTokensDetails>;

export const OpenAIResponseUsageOutputTokensDetailsValidator = type({
    reasoning_tokens: 'number'
}) satisfies Type<OpenAIResponseUsageOutputTokensDetails>;

export const OpenAIResponseUsageValidator = type({
    input_tokens: 'number',
    input_tokens_details: OpenAIResponseUsageInputTokensDetailsValidator,
    output_tokens: 'number',
    output_tokens_details: OpenAIResponseUsageOutputTokensDetailsValidator,
    total_tokens: 'number'
}) satisfies Type<OpenAIResponseUsage>;

export const OpenAIResponseComputerToolCallOutputScreenshotValidator = type({
    type: "'computer_screenshot'",
    'file_id?': 'string',
    'image_url?': 'string'
}) satisfies Type<OpenAIResponseComputerToolCallOutputScreenshot>;

export const OpenAIResponseComputerToolCallOutputItemAcknowledgedSafetyCheckValidator = type({
    id: 'string',
    'code?': stringOrNull,
    'message?': stringOrNull
}) satisfies Type<OpenAIResponseComputerToolCallOutputItemAcknowledgedSafetyCheck>;

export const OpenAIResponseComputerToolCallOutputItemValidator = type({
    id: 'string',
    call_id: 'string',
    output: OpenAIResponseComputerToolCallOutputScreenshotValidator,
    type: "'computer_call_output'",
    'acknowledged_safety_checks?': OpenAIResponseComputerToolCallOutputItemAcknowledgedSafetyCheckValidator.array(),
    'status?': "'in_progress'|'completed'|'incomplete'"
}) satisfies Type<OpenAIResponseComputerToolCallOutputItem>;

export const OpenAIResponseContentReasoningTextContentValidator = type({
    text: 'string',
    type: "'reasoning_text'"
}) satisfies Type<OpenAIResponseContentReasoningTextContent>;

export const OpenAIResponseContentValidator = OpenAIResponseInputTextValidator
    .or(OpenAIResponseInputImageValidator)
    .or(OpenAIResponseInputFileValidator)
    .or(OpenAIResponseOutputTextValidator)
    .or(OpenAIResponseOutputRefusalValidator)
    .or(OpenAIResponseContentReasoningTextContentValidator) satisfies Type<OpenAIResponseContent>;

export const OpenAIEasyInputMessageValidator = type({
    content: type('string').or(OpenAIResponseInputContentValidator.array()),
    role: "'user'|'assistant'|'system'|'developer'",
    'type?': "'message'"
}) satisfies Type<OpenAIEasyInputMessage>;

export const OpenAIResponsePromptValidator = type({
    id: 'string',
    'variables?': type('Record<string, string>').or('null'),
    'version?': stringOrNull
}) satisfies Type<OpenAIResponsePrompt>;

export const OpenAIResponseOutputAudioValidator = type({
    data: 'string',
    transcript: 'string',
    type: "'output_audio'"
}) satisfies Type<OpenAIResponseOutputAudio>;

export const OpenAIResponseInputMessageContentListValidator = OpenAIResponseInputContentValidator.array() satisfies Type<OpenAIResponseInputMessageContentList>;

export const OpenAIResponseOutputItemValidator = OpenAIResponseOutputMessageValidator
    .or(OpenAIResponseFileSearchToolCallValidator)
    .or(OpenAIResponseFunctionToolCallValidator)
    .or(OpenAIResponseFunctionWebSearchValidator)
    .or(OpenAIResponseComputerToolCallValidator)
    .or(OpenAIResponseReasoningItemValidator)
    .or(OpenAIResponseCodeInterpreterToolCallValidator)
    .or(OpenAIResponseCustomToolCallValidator);

export const OpenAIResponseInputItemValidator = OpenAIEasyInputMessageValidator
    .or(OpenAIResponseOutputMessageValidator)
    .or(OpenAIResponseFileSearchToolCallValidator)
    .or(OpenAIResponseComputerToolCallValidator)
    .or(OpenAIResponseFunctionWebSearchValidator)
    .or(OpenAIResponseFunctionToolCallValidator)
    .or(OpenAIResponseReasoningItemValidator)
    .or(OpenAIResponseCodeInterpreterToolCallValidator)
    .or(OpenAIResponseCustomToolCallOutputValidator)
    .or(OpenAIResponseCustomToolCallValidator);

export const OpenAIResponseInputValidator = OpenAIResponseInputItemValidator.array();

const OpenAIToolCodeInterpreterToolAutoValidator = type({
    type: "'auto'",
    'file_ids?': type('string[]'),
    'memory_limit?': type("'1g'|'4g'|'16g'|'64g'").or('null')
});

export const OpenAIToolCodeInterpreterValidator = type({
    container: type('string').or(OpenAIToolCodeInterpreterToolAutoValidator),
    type: "'code_interpreter'"
});

export const OpenAIToolImageGenerationValidator = type({
    type: "'image_generation'"
});

export const OpenAIToolLocalShellValidator = type({
    type: "'local_shell'"
});

export const OpenAIToolMcpValidator = type({
    server_label: 'string',
    type: "'mcp'",
    'allowed_tools?': type('string[]').or(type('Record<string, unknown>')).or('null'),
    'authorization?': 'string',
    'connector_id?': type("'connector_dropbox'|'connector_gmail'|'connector_googlecalendar'|'connector_googledrive'|'connector_microsoftteams'|'connector_outlookcalendar'|'connector_outlookemail'|'connector_sharepoint'"),
    'headers?': type('Record<string, string>').or('null'),
    'require_approval?': type('Record<string, unknown>').or("'always'").or("'never'").or('null'),
    'server_description?': 'string',
    'server_url?': 'string'
});

export const OpenAIToolValidator = OpenAIFunctionToolValidator
    .or(OpenAIFileSearchToolValidator)
    .or(OpenAIComputerToolValidator)
    .or(OpenAIWebSearchToolValidator)
    .or(OpenAIToolMcpValidator)
    .or(OpenAIToolCodeInterpreterValidator)
    .or(OpenAIToolImageGenerationValidator)
    .or(OpenAIToolLocalShellValidator)
    .or(OpenAICustomToolValidator)
    .or(OpenAIWebSearchPreviewToolValidator);

const ResponseFormatTextValidator = type({
    type: "'text'"
});

const ResponseFormatJSONObjectValidator = type({
    type: "'json_object'"
});

const ResponseFormatTextJSONSchemaConfigValidator = type({
    name: 'string',
    schema: type('Record<string, unknown>'),
    type: "'json_schema'",
    'description?': 'string',
    'strict?': type('boolean').or('null')
});

const ResponseFormatTextConfigValidator = ResponseFormatTextValidator
    .or(ResponseFormatTextJSONSchemaConfigValidator)
    .or(ResponseFormatJSONObjectValidator);

export const OpenAIResponseTextConfigValidator = type({
    'format?': ResponseFormatTextConfigValidator,
    'verbosity?': type("'low'|'medium'|'high'").or('null')
});

export const OpenAIResponseIncompleteDetailsValidator = type({
    reason: "'max_output_tokens'|'content_filter'"
});

export const OpenAIResponseConversationValidator = type({
    id: 'string'
});

export const OpenAIResponseValidator = type({
    id: 'string',
    created_at: 'number',
    output_text: 'string',
    error: OpenAIResponseErrorValidator.or('null'),
    incomplete_details: OpenAIResponseIncompleteDetailsValidator.or('null'),
    instructions: type('string').or(OpenAIResponseInputItemValidator.array()).or('null'),
    metadata: type('Record<string, string>').or('null'),
    model: 'string',
    object: "'response'",
    output: OpenAIResponseOutputItemValidator.array(),
    parallel_tool_calls: 'boolean',
    temperature: type('number').or('null'),
    tool_choice: OpenAIToolChoiceOptionsValidator
        .or(OpenAIToolChoiceAllowedValidator)
        .or(OpenAIToolChoiceTypesValidator)
        .or(OpenAIToolChoiceFunctionValidator)
        .or(OpenAIToolChoiceMcpValidator)
        .or(OpenAIToolChoiceCustomValidator),
    tools: OpenAIToolValidator.array(),
    top_p: type('number').or('null'),
    'background?': type('boolean').or('null'),
    'conversation?': OpenAIResponseConversationValidator.or('null'),
    'max_output_tokens?': type('number').or('null'),
    'previous_response_id?': stringOrNull,
    'prompt?': OpenAIResponsePromptValidator.or('null'),
    'prompt_cache_key?': 'string',
    'reasoning?': type('Record<string, unknown>').or('null'),
    'safety_identifier?': 'string',
    'service_tier?': type("'auto'|'default'|'flex'|'scale'|'priority'").or('null'),
    'status?': OpenAIResponseStatusValidator,
    'text?': OpenAIResponseTextConfigValidator,
    'truncation?': type("'auto'|'disabled'").or('null'),
    'usage?': OpenAIResponseUsageValidator,
    'user?': 'string'
});

export const OpenAIResponseCreateParamsStreamOptionsValidator = type({
    'include_obfuscation?': 'boolean'
});

export const OpenAIResponseCreateParamsBaseValidator = type({
    input: OpenAIResponseInputValidator,
    model: 'string',
    'background?': type('boolean').or('null'),
    'conversation?': type('string').or(OpenAIResponseConversationParamValidator).or('null'),
    'include?': OpenAIResponseIncludableValidator.array(),
    'instructions?': type('string').or(OpenAIResponseInputItemValidator.array()).or('null'),
    'max_output_tokens?': type('number').or('null'),
    'metadata?': type('Record<string, string>').or('null'),
    'parallel_tool_calls?': type('boolean').or('null'),
    'previous_response_id?': stringOrNull,
    'prompt?': OpenAIResponsePromptValidator.or('null'),
    'prompt_cache_key?': stringOrNull,
    'reasoning?': type('Record<string, unknown>').or('null'),
    'safety_identifier?': stringOrNull,
    'service_tier?': type("'auto'|'default'|'flex'|'scale'|'priority'").or('null'),
    'temperature?': type('number').or('null'),
    'text?': OpenAIResponseTextConfigValidator.or('null'),
    'tool_choice?': OpenAIToolChoiceOptionsValidator
        .or(OpenAIToolChoiceAllowedValidator)
        .or(OpenAIToolChoiceCustomValidator)
        .or(OpenAIToolChoiceFunctionValidator)
        .or(OpenAIToolChoiceMcpValidator)
        .or(OpenAIToolChoiceTypesValidator)
        .or('null'),
    'tools?': OpenAIToolValidator.array().or('null'),
    'top_p?': type('number').or('null'),
    'truncation?': type("'auto'|'disabled'").or('null'),
    'user?': 'string'
});

export const OpenAIResponseCreateParamsNonStreamingValidator = OpenAIResponseCreateParamsBaseValidator.and(type({
    'stream?': type('false').or('null')
}));

export const OpenAIResponseCreateParamsStreamingValidator = OpenAIResponseCreateParamsBaseValidator.and(type({
    stream: 'true',
    'stream_options?': OpenAIResponseCreateParamsStreamOptionsValidator.or('null')
}));

export const OpenAIResponseCreateParamsValidator = OpenAIResponseCreateParamsNonStreamingValidator
    .or(OpenAIResponseCreateParamsStreamingValidator);

// Streaming Event Validators

// ResponseCreatedEvent: response: Response, sequence_number: number, type: 'response.created'
export const OpenAIResponseCreatedEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.created'"
}) satisfies Type<OpenAIResponseCreatedEvent>;

// ResponseQueuedEvent: response: Response, sequence_number: number, type: 'response.queued'
export const OpenAIResponseQueuedEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.queued'"
}) satisfies Type<OpenAIResponseQueuedEvent>;

// ResponseInProgressEvent: response: Response, sequence_number: number, type: 'response.in_progress'
export const OpenAIResponseInProgressEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.in_progress'"
}) satisfies Type<OpenAIResponseInProgressEvent>;

// ResponseCompletedEvent: response: Response, sequence_number: number, type: 'response.completed'
export const OpenAIResponseCompletedEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.completed'"
}) satisfies Type<OpenAIResponseCompletedEvent>;

// ResponseFailedEvent: response: Response, sequence_number: number, type: 'response.failed'
export const OpenAIResponseFailedEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.failed'"
}) satisfies Type<OpenAIResponseFailedEvent>;

// ResponseIncompleteEvent: response: Response, sequence_number: number, type: 'response.incomplete'
export const OpenAIResponseIncompleteEventValidator = type({
    response: OpenAIResponseValidator,
    sequence_number: 'number',
    type: "'response.incomplete'"
}) satisfies Type<OpenAIResponseIncompleteEvent>;

export const OpenAIResponseErrorEventValidator = type({
    code: stringOrNull,
    message: 'string',
    param: stringOrNull,
    sequence_number: 'number',
    type: "'error'"
}) satisfies Type<OpenAIResponseErrorEvent>;

export const OpenAIResponseTextDeltaEventLogprobTopLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number'
}) satisfies Type<OpenAIResponseTextDeltaEventLogprobTopLogprob>;

export const OpenAIResponseTextDeltaEventLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number',
    top_logprobs: OpenAIResponseTextDeltaEventLogprobTopLogprobValidator.array()
}) satisfies Type<OpenAIResponseTextDeltaEventLogprob>;

export const OpenAIResponseTextDeltaEventValidator = type({
    content_index: 'number',
    delta: 'string',
    item_id: 'string',
    logprobs: OpenAIResponseTextDeltaEventLogprobValidator.array(),
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.output_text.delta'"
}) satisfies Type<OpenAIResponseTextDeltaEvent>;

export const OpenAIResponseTextDoneEventLogprobTopLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number'
}) satisfies Type<OpenAIResponseTextDoneEventLogprobTopLogprob>;

export const OpenAIResponseTextDoneEventLogprobValidator = type({
    token: 'string',
    bytes: 'number[]',
    logprob: 'number',
    top_logprobs: OpenAIResponseTextDoneEventLogprobTopLogprobValidator.array()
}) satisfies Type<OpenAIResponseTextDoneEventLogprob>;

export const OpenAIResponseTextDoneEventValidator = type({
    content_index: 'number',
    item_id: 'string',
    logprobs: OpenAIResponseTextDoneEventLogprobValidator.array(),
    output_index: 'number',
    sequence_number: 'number',
    text: 'string',
    type: "'response.output_text.done'"
}) satisfies Type<OpenAIResponseTextDoneEvent>;

export const OpenAIResponseRefusalDeltaEventValidator = type({
    content_index: 'number',
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.refusal.delta'"
}) satisfies Type<OpenAIResponseRefusalDeltaEvent>;

export const OpenAIResponseRefusalDoneEventValidator = type({
    content_index: 'number',
    item_id: 'string',
    output_index: 'number',
    refusal: 'string',
    sequence_number: 'number',
    type: "'response.refusal.done'"
}) satisfies Type<OpenAIResponseRefusalDoneEvent>;

// ResponseOutputItemAddedEvent: item: ResponseOutputItem, output_index: number, sequence_number: number, type: 'response.output_item.added'
export const OpenAIResponseOutputItemAddedEventValidator = type({
    item: OpenAIResponseOutputItemValidator,
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.output_item.added'"
}) satisfies Type<OpenAIResponseOutputItemAddedEvent>;

// ResponseOutputItemDoneEvent: item: ResponseOutputItem, output_index: number, sequence_number: number, type: 'response.output_item.done'
export const OpenAIResponseOutputItemDoneEventValidator = type({
    item: OpenAIResponseOutputItemValidator,
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.output_item.done'"
}) satisfies Type<OpenAIResponseOutputItemDoneEvent>;

// ResponseContentPartAddedEvent.ReasoningText: text: string, type: 'reasoning_text'
export const OpenAIResponseContentPartAddedEventReasoningTextValidator = type({
    text: 'string',
    type: "'reasoning_text'"
}) satisfies Type<OpenAIResponseContentPartAddedEventReasoningText>;

// ResponseContentPartAddedEvent: content_index: number, item_id: string, output_index: number, part: ResponseOutputText | ResponseOutputRefusal | ReasoningText, sequence_number: number, type: 'response.content_part.added'
export const OpenAIResponseContentPartAddedEventValidator = type({
    content_index: 'number',
    item_id: 'string',
    output_index: 'number',
    part: OpenAIResponseOutputTextValidator
        .or(OpenAIResponseOutputRefusalValidator)
        .or(OpenAIResponseContentPartAddedEventReasoningTextValidator),
    sequence_number: 'number',
    type: "'response.content_part.added'"
}) satisfies Type<OpenAIResponseContentPartAddedEvent>;

// ResponseContentPartDoneEvent.ReasoningText: text: string, type: 'reasoning_text'
export const OpenAIResponseContentPartDoneEventReasoningTextValidator = type({
    text: 'string',
    type: "'reasoning_text'"
}) satisfies Type<OpenAIResponseContentPartDoneEventReasoningText>;

// ResponseContentPartDoneEvent: content_index: number, item_id: string, output_index: number, part: ResponseOutputText | ResponseOutputRefusal | ReasoningText, sequence_number: number, type: 'response.content_part.done'
export const OpenAIResponseContentPartDoneEventValidator = type({
    content_index: 'number',
    item_id: 'string',
    output_index: 'number',
    part: OpenAIResponseOutputTextValidator
        .or(OpenAIResponseOutputRefusalValidator)
        .or(OpenAIResponseContentPartDoneEventReasoningTextValidator),
    sequence_number: 'number',
    type: "'response.content_part.done'"
}) satisfies Type<OpenAIResponseContentPartDoneEvent>;

// ResponseReasoningTextDeltaEvent: content_index: number, delta: string, item_id: string, output_index: number, sequence_number: number, type: 'response.reasoning_text.delta'
export const OpenAIResponseReasoningTextDeltaEventValidator = type({
    content_index: 'number',
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.reasoning_text.delta'"
}) satisfies Type<OpenAIResponseReasoningTextDeltaEvent>;

// ResponseReasoningTextDoneEvent: content_index: number, item_id: string, output_index: number, sequence_number: number, text: string, type: 'response.reasoning_text.done'
export const OpenAIResponseReasoningTextDoneEventValidator = type({
    content_index: 'number',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    text: 'string',
    type: "'response.reasoning_text.done'"
}) satisfies Type<OpenAIResponseReasoningTextDoneEvent>;

// ResponseReasoningSummaryTextDeltaEvent: delta: string, item_id: string, output_index: number, sequence_number: number, summary_index: number, type: 'response.reasoning_summary_text.delta'
export const OpenAIResponseReasoningSummaryTextDeltaEventValidator = type({
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    summary_index: 'number',
    type: "'response.reasoning_summary_text.delta'"
}) satisfies Type<OpenAIResponseReasoningSummaryTextDeltaEvent>;

// ResponseReasoningSummaryTextDoneEvent: item_id: string, output_index: number, sequence_number: number, summary_index: number, text: string, type: 'response.reasoning_summary_text.done'
export const OpenAIResponseReasoningSummaryTextDoneEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    summary_index: 'number',
    text: 'string',
    type: "'response.reasoning_summary_text.done'"
}) satisfies Type<OpenAIResponseReasoningSummaryTextDoneEvent>;

// ResponseFunctionCallArgumentsDeltaEvent: delta: string, item_id: string, output_index: number, sequence_number: number, type: 'response.function_call_arguments.delta'
export const OpenAIResponseFunctionCallArgumentsDeltaEventValidator = type({
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.function_call_arguments.delta'"
}) satisfies Type<OpenAIResponseFunctionCallArgumentsDeltaEvent>;

// ResponseFunctionCallArgumentsDoneEvent: arguments: string, item_id: string, name: string, output_index: number, sequence_number: number, type: 'response.function_call_arguments.done'
export const OpenAIResponseFunctionCallArgumentsDoneEventValidator = type({
    arguments: 'string',
    item_id: 'string',
    name: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.function_call_arguments.done'"
}) satisfies Type<OpenAIResponseFunctionCallArgumentsDoneEvent>;

// ResponseCustomToolCallInputDeltaEvent: delta: string, item_id: string, output_index: number, sequence_number: number, type: 'response.custom_tool_call_input.delta'
export const OpenAIResponseCustomToolCallInputDeltaEventValidator = type({
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.custom_tool_call_input.delta'"
}) satisfies Type<OpenAIResponseCustomToolCallInputDeltaEvent>;

// ResponseCustomToolCallInputDoneEvent: input: string, item_id: string, output_index: number, sequence_number: number, type: 'response.custom_tool_call_input.done'
export const OpenAIResponseCustomToolCallInputDoneEventValidator = type({
    input: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.custom_tool_call_input.done'"
}) satisfies Type<OpenAIResponseCustomToolCallInputDoneEvent>;

// ResponseFileSearchCallInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.file_search_call.in_progress'
export const OpenAIResponseFileSearchCallInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.file_search_call.in_progress'"
}) satisfies Type<OpenAIResponseFileSearchCallInProgressEvent>;

// ResponseFileSearchCallSearchingEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.file_search_call.searching'
export const OpenAIResponseFileSearchCallSearchingEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.file_search_call.searching'"
}) satisfies Type<OpenAIResponseFileSearchCallSearchingEvent>;

// ResponseFileSearchCallCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.file_search_call.completed'
export const OpenAIResponseFileSearchCallCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.file_search_call.completed'"
}) satisfies Type<OpenAIResponseFileSearchCallCompletedEvent>;

// ResponseWebSearchCallInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.web_search_call.in_progress'
export const OpenAIResponseWebSearchCallInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.web_search_call.in_progress'"
}) satisfies Type<OpenAIResponseWebSearchCallInProgressEvent>;

// ResponseWebSearchCallSearchingEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.web_search_call.searching'
export const OpenAIResponseWebSearchCallSearchingEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.web_search_call.searching'"
}) satisfies Type<OpenAIResponseWebSearchCallSearchingEvent>;

// ResponseWebSearchCallCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.web_search_call.completed'
export const OpenAIResponseWebSearchCallCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.web_search_call.completed'"
}) satisfies Type<OpenAIResponseWebSearchCallCompletedEvent>;

// ResponseCodeInterpreterCallInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.code_interpreter_call.in_progress'
export const OpenAIResponseCodeInterpreterCallInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.code_interpreter_call.in_progress'"
}) satisfies Type<OpenAIResponseCodeInterpreterCallInProgressEvent>;

// ResponseCodeInterpreterCallInterpretingEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.code_interpreter_call.interpreting'
export const OpenAIResponseCodeInterpreterCallInterpretingEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.code_interpreter_call.interpreting'"
}) satisfies Type<OpenAIResponseCodeInterpreterCallInterpretingEvent>;

// ResponseCodeInterpreterCallCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.code_interpreter_call.completed'
export const OpenAIResponseCodeInterpreterCallCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.code_interpreter_call.completed'"
}) satisfies Type<OpenAIResponseCodeInterpreterCallCompletedEvent>;

// ResponseCodeInterpreterCallCodeDeltaEvent: delta: string, item_id: string, output_index: number, sequence_number: number, type: 'response.code_interpreter_call_code.delta'
export const OpenAIResponseCodeInterpreterCallCodeDeltaEventValidator = type({
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.code_interpreter_call_code.delta'"
}) satisfies Type<OpenAIResponseCodeInterpreterCallCodeDeltaEvent>;

// ResponseCodeInterpreterCallCodeDoneEvent: code: string, item_id: string, output_index: number, sequence_number: number, type: 'response.code_interpreter_call_code.done'
export const OpenAIResponseCodeInterpreterCallCodeDoneEventValidator = type({
    code: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.code_interpreter_call_code.done'"
}) satisfies Type<OpenAIResponseCodeInterpreterCallCodeDoneEvent>;

// ResponseAudioDeltaEvent: delta: string, sequence_number: number, type: 'response.audio.delta'
export const OpenAIResponseAudioDeltaEventValidator = type({
    delta: 'string',
    sequence_number: 'number',
    type: "'response.audio.delta'"
}) satisfies Type<OpenAIResponseAudioDeltaEvent>;

// ResponseAudioDoneEvent: sequence_number: number, type: 'response.audio.done'
export const OpenAIResponseAudioDoneEventValidator = type({
    sequence_number: 'number',
    type: "'response.audio.done'"
}) satisfies Type<OpenAIResponseAudioDoneEvent>;

// ResponseAudioTranscriptDeltaEvent: delta: string, sequence_number: number, type: 'response.audio.transcript.delta'
export const OpenAIResponseAudioTranscriptDeltaEventValidator = type({
    delta: 'string',
    sequence_number: 'number',
    type: "'response.audio.transcript.delta'"
}) satisfies Type<OpenAIResponseAudioTranscriptDeltaEvent>;

// ResponseAudioTranscriptDoneEvent: sequence_number: number, type: 'response.audio.transcript.done'
export const OpenAIResponseAudioTranscriptDoneEventValidator = type({
    sequence_number: 'number',
    type: "'response.audio.transcript.done'"
}) satisfies Type<OpenAIResponseAudioTranscriptDoneEvent>;

// ResponseMcpCallArgumentsDeltaEvent: delta: string, item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_call_arguments.delta'
export const OpenAIResponseMcpCallArgumentsDeltaEventValidator = type({
    delta: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_call_arguments.delta'"
}) satisfies Type<OpenAIResponseMcpCallArgumentsDeltaEvent>;

// ResponseMcpCallArgumentsDoneEvent: arguments: string, item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_call_arguments.done'
export const OpenAIResponseMcpCallArgumentsDoneEventValidator = type({
    arguments: 'string',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_call_arguments.done'"
}) satisfies Type<OpenAIResponseMcpCallArgumentsDoneEvent>;

// ResponseMcpCallCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_call.completed'
export const OpenAIResponseMcpCallCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_call.completed'"
}) satisfies Type<OpenAIResponseMcpCallCompletedEvent>;

// ResponseMcpCallFailedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_call.failed'
export const OpenAIResponseMcpCallFailedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_call.failed'"
}) satisfies Type<OpenAIResponseMcpCallFailedEvent>;

// ResponseMcpCallInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_call.in_progress'
export const OpenAIResponseMcpCallInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_call.in_progress'"
}) satisfies Type<OpenAIResponseMcpCallInProgressEvent>;

// ResponseMcpListToolsCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_list_tools.completed'
export const OpenAIResponseMcpListToolsCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_list_tools.completed'"
}) satisfies Type<OpenAIResponseMcpListToolsCompletedEvent>;

// ResponseMcpListToolsFailedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_list_tools.failed'
export const OpenAIResponseMcpListToolsFailedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_list_tools.failed'"
}) satisfies Type<OpenAIResponseMcpListToolsFailedEvent>;

// ResponseMcpListToolsInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.mcp_list_tools.in_progress'
export const OpenAIResponseMcpListToolsInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.mcp_list_tools.in_progress'"
}) satisfies Type<OpenAIResponseMcpListToolsInProgressEvent>;

// ResponseImageGenCallCompletedEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.image_generation_call.completed'
export const OpenAIResponseImageGenCallCompletedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.image_generation_call.completed'"
}) satisfies Type<OpenAIResponseImageGenCallCompletedEvent>;

// ResponseImageGenCallGeneratingEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.image_generation_call.generating'
export const OpenAIResponseImageGenCallGeneratingEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.image_generation_call.generating'"
}) satisfies Type<OpenAIResponseImageGenCallGeneratingEvent>;

// ResponseImageGenCallInProgressEvent: item_id: string, output_index: number, sequence_number: number, type: 'response.image_generation_call.in_progress'
export const OpenAIResponseImageGenCallInProgressEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.image_generation_call.in_progress'"
}) satisfies Type<OpenAIResponseImageGenCallInProgressEvent>;

// ResponseImageGenCallPartialImageEvent: item_id: string, output_index: number, partial_image_b64: string, partial_image_index: number, sequence_number: number, type: 'response.image_generation_call.partial_image'
export const OpenAIResponseImageGenCallPartialImageEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    partial_image_b64: 'string',
    partial_image_index: 'number',
    sequence_number: 'number',
    type: "'response.image_generation_call.partial_image'"
}) satisfies Type<OpenAIResponseImageGenCallPartialImageEvent>;

// ResponseReasoningSummaryPartAddedEvent.Part: text: string, type: 'summary_text'
export const OpenAIResponseReasoningSummaryPartAddedEventPartValidator = type({
    text: 'string',
    type: "'summary_text'"
}) satisfies Type<OpenAIResponseReasoningSummaryPartAddedEventPart>;

// ResponseReasoningSummaryPartAddedEvent: item_id: string, output_index: number, part: Part, sequence_number: number, summary_index: number, type: 'response.reasoning_summary_part.added'
export const OpenAIResponseReasoningSummaryPartAddedEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    part: OpenAIResponseReasoningSummaryPartAddedEventPartValidator,
    sequence_number: 'number',
    summary_index: 'number',
    type: "'response.reasoning_summary_part.added'"
}) satisfies Type<OpenAIResponseReasoningSummaryPartAddedEvent>;

// ResponseReasoningSummaryPartDoneEvent.Part: text: string, type: 'summary_text'
export const OpenAIResponseReasoningSummaryPartDoneEventPartValidator = type({
    text: 'string',
    type: "'summary_text'"
}) satisfies Type<OpenAIResponseReasoningSummaryPartDoneEventPart>;

// ResponseReasoningSummaryPartDoneEvent: item_id: string, output_index: number, part: Part, sequence_number: number, summary_index: number, type: 'response.reasoning_summary_part.done'
export const OpenAIResponseReasoningSummaryPartDoneEventValidator = type({
    item_id: 'string',
    output_index: 'number',
    part: OpenAIResponseReasoningSummaryPartDoneEventPartValidator,
    sequence_number: 'number',
    summary_index: 'number',
    type: "'response.reasoning_summary_part.done'"
}) satisfies Type<OpenAIResponseReasoningSummaryPartDoneEvent>;

// ResponseOutputTextAnnotationAddedEvent: annotation: unknown, annotation_index: number, content_index: number, item_id: string, output_index: number, sequence_number: number, type: 'response.output_text.annotation.added'
export const OpenAIResponseOutputTextAnnotationAddedEventValidator = type({
    annotation: 'unknown',
    annotation_index: 'number',
    content_index: 'number',
    item_id: 'string',
    output_index: 'number',
    sequence_number: 'number',
    type: "'response.output_text.annotation.added'"
}) satisfies Type<OpenAIResponseOutputTextAnnotationAddedEvent>;

