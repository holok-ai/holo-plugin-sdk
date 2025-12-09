import type {
    ComputerTool,
    CustomTool,
    EasyInputMessage,
    FileSearchTool,
    FunctionTool,
    Response,
    ResponseAudioDeltaEvent,
    ResponseAudioDoneEvent,
    ResponseAudioTranscriptDeltaEvent,
    ResponseAudioTranscriptDoneEvent,
    ResponseCodeInterpreterCallCodeDeltaEvent,
    ResponseCodeInterpreterCallCodeDoneEvent,
    ResponseCodeInterpreterCallCompletedEvent,
    ResponseCodeInterpreterCallInProgressEvent,
    ResponseCodeInterpreterCallInterpretingEvent,
    ResponseCodeInterpreterToolCall,
    ResponseCompletedEvent,
    ResponseComputerToolCall,
    ResponseComputerToolCallOutputItem,
    ResponseComputerToolCallOutputScreenshot,
    ResponseContent,
    ResponseContentPartAddedEvent,
    ResponseContentPartDoneEvent,
    ResponseConversationParam,
    ResponseCreatedEvent,
    ResponseCreateParams,
    ResponseCreateParamsBase,
    ResponseCreateParamsNonStreaming,
    ResponseCreateParamsStreaming,
    ResponseCustomToolCall,
    ResponseCustomToolCallInputDeltaEvent,
    ResponseCustomToolCallInputDoneEvent,
    ResponseCustomToolCallOutput,
    ResponseError,
    ResponseErrorEvent,
    ResponseFailedEvent,
    ResponseFileSearchCallCompletedEvent,
    ResponseFileSearchCallInProgressEvent,
    ResponseFileSearchCallSearchingEvent,
    ResponseFileSearchToolCall,
    ResponseFunctionCallArgumentsDeltaEvent,
    ResponseFunctionCallArgumentsDoneEvent,
    ResponseFunctionCallOutputItem,
    ResponseFunctionCallOutputItemList,
    ResponseFunctionToolCall,
    ResponseFunctionToolCallItem,
    ResponseFunctionToolCallOutputItem,
    ResponseFunctionWebSearch,
    ResponseImageGenCallCompletedEvent,
    ResponseImageGenCallGeneratingEvent,
    ResponseImageGenCallInProgressEvent,
    ResponseImageGenCallPartialImageEvent,
    ResponseIncludable,
    ResponseIncompleteEvent,
    ResponseInProgressEvent,
    ResponseInput,
    ResponseInputContent,
    ResponseInputFile,
    ResponseInputFileContent,
    ResponseInputImage,
    ResponseInputImageContent,
    ResponseInputItem,
    ResponseInputMessageContentList,
    ResponseInputText,
    ResponseInputTextContent,
    ResponseMcpCallArgumentsDeltaEvent,
    ResponseMcpCallArgumentsDoneEvent,
    ResponseMcpCallCompletedEvent,
    ResponseMcpCallFailedEvent,
    ResponseMcpCallInProgressEvent,
    ResponseMcpListToolsCompletedEvent,
    ResponseMcpListToolsFailedEvent,
    ResponseMcpListToolsInProgressEvent,
    ResponseOutputAudio,
    ResponseOutputItem,
    ResponseOutputItemAddedEvent,
    ResponseOutputItemDoneEvent,
    ResponseOutputMessage,
    ResponseOutputRefusal,
    ResponseOutputText,
    ResponseOutputTextAnnotationAddedEvent,
    ResponsePrompt,
    ResponseQueuedEvent,
    ResponseReasoningItem,
    ResponseReasoningSummaryPartAddedEvent,
    ResponseReasoningSummaryPartDoneEvent,
    ResponseReasoningSummaryTextDeltaEvent,
    ResponseReasoningSummaryTextDoneEvent,
    ResponseReasoningTextDeltaEvent,
    ResponseReasoningTextDoneEvent,
    ResponseRefusalDeltaEvent,
    ResponseRefusalDoneEvent,
    ResponseRetrieveParams,
    ResponseRetrieveParamsBase,
    ResponseRetrieveParamsNonStreaming,
    ResponseRetrieveParamsStreaming,
    ResponseStatus,
    ResponseStreamEvent,
    ResponseTextConfig,
    ResponseTextDeltaEvent,
    ResponseTextDoneEvent,
    ResponseUsage,
    ResponseWebSearchCallCompletedEvent,
    ResponseWebSearchCallInProgressEvent,
    ResponseWebSearchCallSearchingEvent,
    Tool,
    ToolChoiceAllowed,
    ToolChoiceCustom,
    ToolChoiceFunction,
    ToolChoiceMcp,
    ToolChoiceOptions,
    ToolChoiceTypes,
    WebSearchPreviewTool,
    WebSearchTool
} from 'openai/resources/responses/responses';

export type OpenAIResponseStatus = ResponseStatus;
export type OpenAIResponseIncludable = ResponseIncludable;
export type OpenAIToolChoiceOptions = ToolChoiceOptions;
export type OpenAIResponseInputText = ResponseInputText;
export type OpenAIResponseInputTextContent = ResponseInputTextContent;
export type OpenAIResponseInputImageContent = ResponseInputImageContent;
export type OpenAIResponseInputImage = ResponseInputImage;
export type OpenAIResponseInputFileContent = ResponseInputFileContent;
export type OpenAIResponseInputFile = ResponseInputFile;
export type OpenAIResponseInputContent = ResponseInputContent;
export type OpenAIResponseOutputRefusal = ResponseOutputRefusal;
export type OpenAIResponseOutputText = ResponseOutputText;
export type OpenAIResponseOutputTextFileCitation = ResponseOutputText.FileCitation;
export type OpenAIResponseOutputTextURLCitation = ResponseOutputText.URLCitation;
export type OpenAIResponseOutputTextContainerFileCitation = ResponseOutputText.ContainerFileCitation;
export type OpenAIResponseOutputTextFilePath = ResponseOutputText.FilePath;
export type OpenAIResponseOutputTextLogprob = ResponseOutputText.Logprob;
export type OpenAIResponseOutputTextLogprobTopLogprob = ResponseOutputText.Logprob.TopLogprob;
export type OpenAIResponseOutputMessage = ResponseOutputMessage;
export type OpenAIResponseCustomToolCall = ResponseCustomToolCall;
export type OpenAIResponseCustomToolCallOutput = ResponseCustomToolCallOutput;
export type OpenAIResponseError = ResponseError;
export type OpenAIResponseConversationParam = ResponseConversationParam;
export type OpenAIResponseFileSearchToolCall = ResponseFileSearchToolCall;
export type OpenAIResponseFileSearchToolCallResult = ResponseFileSearchToolCall.Result;
export type OpenAIResponseFunctionCallOutputItem = ResponseFunctionCallOutputItem;
export type OpenAIResponseFunctionCallOutputItemList = ResponseFunctionCallOutputItemList;
export type OpenAIResponseFunctionToolCall = ResponseFunctionToolCall;
export type OpenAIResponseFunctionToolCallItem = ResponseFunctionToolCallItem;
export type OpenAIResponseFunctionToolCallOutputItem = ResponseFunctionToolCallOutputItem;
export type OpenAIResponseFunctionWebSearch = ResponseFunctionWebSearch;
export type OpenAIResponseFunctionWebSearchSearch = ResponseFunctionWebSearch.Search;
export type OpenAIResponseFunctionWebSearchSearchSource = ResponseFunctionWebSearch.Search.Source;
export type OpenAIResponseFunctionWebSearchOpenPage = ResponseFunctionWebSearch.OpenPage;
export type OpenAIResponseFunctionWebSearchFind = ResponseFunctionWebSearch.Find;
export type OpenAIResponseCodeInterpreterToolCall = ResponseCodeInterpreterToolCall;
export type OpenAIResponseCodeInterpreterToolCallLogs = ResponseCodeInterpreterToolCall.Logs;
export type OpenAIResponseCodeInterpreterToolCallImage = ResponseCodeInterpreterToolCall.Image;
export type OpenAIResponseComputerToolCall = ResponseComputerToolCall;
export type OpenAIResponseComputerToolCallClick = ResponseComputerToolCall.Click;
export type OpenAIResponseComputerToolCallDoubleClick = ResponseComputerToolCall.DoubleClick;
export type OpenAIResponseComputerToolCallDrag = ResponseComputerToolCall.Drag;
export type OpenAIResponseComputerToolCallKeypress = ResponseComputerToolCall.Keypress;
export type OpenAIResponseComputerToolCallMove = ResponseComputerToolCall.Move;
export type OpenAIResponseComputerToolCallScreenshot = ResponseComputerToolCall.Screenshot;
export type OpenAIResponseComputerToolCallScroll = ResponseComputerToolCall.Scroll;
export type OpenAIResponseComputerToolCallType = ResponseComputerToolCall.Type;
export type OpenAIResponseComputerToolCallWait = ResponseComputerToolCall.Wait;
export type OpenAIResponseComputerToolCallPendingSafetyCheck = ResponseComputerToolCall.PendingSafetyCheck;
export type OpenAIResponseReasoningItem = ResponseReasoningItem;
export type OpenAIResponseOutputAudio = ResponseOutputAudio;
export type OpenAIResponseOutputItem = ResponseOutputItem;
export type OpenAIResponseReasoningItemSummary = ResponseReasoningItem.Summary;
export type OpenAIResponseReasoningItemContent = ResponseReasoningItem.Content;
export type OpenAITool = Tool;
export type OpenAIToolMcp = Tool.Mcp;
export type OpenAIToolMcpMcpToolFilter = Tool.Mcp.McpToolFilter;
export type OpenAIToolMcpMcpToolApprovalFilter = Tool.Mcp.McpToolApprovalFilter;
export type OpenAIToolMcpMcpToolApprovalFilterAlways = Tool.Mcp.McpToolApprovalFilter.Always;
export type OpenAIToolMcpMcpToolApprovalFilterNever = Tool.Mcp.McpToolApprovalFilter.Never;
export type OpenAIToolCodeInterpreter = Tool.CodeInterpreter;
export type OpenAIToolCodeInterpreterCodeInterpreterToolAuto = Tool.CodeInterpreter.CodeInterpreterToolAuto;
export type OpenAIToolImageGeneration = Tool.ImageGeneration;
export type OpenAIToolImageGenerationInputImageMask = Tool.ImageGeneration.InputImageMask;
export type OpenAIToolLocalShell = Tool.LocalShell;
export type OpenAIToolChoiceAllowed = ToolChoiceAllowed;
export type OpenAIToolChoiceCustom = ToolChoiceCustom;
export type OpenAIToolChoiceFunction = ToolChoiceFunction;
export type OpenAIToolChoiceMcp = ToolChoiceMcp;
export type OpenAIToolChoiceTypes = ToolChoiceTypes;
export type OpenAIWebSearchPreviewTool = WebSearchPreviewTool;
export type OpenAIWebSearchTool = WebSearchTool;
export type OpenAIComputerTool = ComputerTool;
export type OpenAICustomTool = CustomTool;
export type OpenAIFunctionTool = FunctionTool;
export type OpenAIFileSearchTool = FileSearchTool;
export type OpenAIFileSearchToolRankingOptions = FileSearchTool.RankingOptions;
export type OpenAIFileSearchToolRankingOptionsHybridSearch = FileSearchTool.RankingOptions.HybridSearch;
export type OpenAIResponse = Response;
export type OpenAIResponseIncompleteDetails = Response.IncompleteDetails;
export type OpenAIResponseUsage = ResponseUsage;
export type OpenAIResponseTextConfig = ResponseTextConfig;
export type OpenAIResponseInput = ResponseInput;
export type OpenAIResponseInputMessageContentList = ResponseInputMessageContentList;
export type OpenAIResponseInputItem = ResponseInputItem;
export type OpenAIEasyInputMessage = EasyInputMessage;
export type OpenAIResponseUsageInputTokensDetails = ResponseUsage.InputTokensDetails;
export type OpenAIResponseUsageOutputTokensDetails = ResponseUsage.OutputTokensDetails;
export type OpenAIWebSearchPreviewToolUserLocation = WebSearchPreviewTool.UserLocation;
export type OpenAIWebSearchToolFilters = WebSearchTool.Filters;
export type OpenAIWebSearchToolUserLocation = WebSearchTool.UserLocation;
export type OpenAIResponseComputerToolCallOutputItem = ResponseComputerToolCallOutputItem;
export type OpenAIResponseComputerToolCallOutputScreenshot = ResponseComputerToolCallOutputScreenshot;
export type OpenAIResponseComputerToolCallOutputItemAcknowledgedSafetyCheck = ResponseComputerToolCallOutputItem.AcknowledgedSafetyCheck;
export type OpenAIResponseContent = ResponseContent;
export type OpenAIResponseContentReasoningTextContent = ResponseContent.ReasoningTextContent;
export type OpenAIResponsePrompt = ResponsePrompt;
export type OpenAIResponseCreateParams = ResponseCreateParams;
export type OpenAIResponseCreateParamsBase = ResponseCreateParamsBase;
export type OpenAIResponseCreateParamsNonStreaming = ResponseCreateParamsNonStreaming;
export type OpenAIResponseCreateParamsStreaming = ResponseCreateParamsStreaming;
export type OpenAIResponseCreateParamsStreamOptions = ResponseCreateParams.StreamOptions;
export type OpenAIResponseRetrieveParams = ResponseRetrieveParams;
export type OpenAIResponseRetrieveParamsBase = ResponseRetrieveParamsBase;
export type OpenAIResponseRetrieveParamsNonStreaming = ResponseRetrieveParamsNonStreaming;
export type OpenAIResponseRetrieveParamsStreaming = ResponseRetrieveParamsStreaming;
export type OpenAIResponseStreamEvent = ResponseStreamEvent;
export type OpenAIResponseAudioDeltaEvent = ResponseAudioDeltaEvent;
export type OpenAIResponseAudioDoneEvent = ResponseAudioDoneEvent;
export type OpenAIResponseAudioTranscriptDeltaEvent = ResponseAudioTranscriptDeltaEvent;
export type OpenAIResponseAudioTranscriptDoneEvent = ResponseAudioTranscriptDoneEvent;
export type OpenAIResponseCodeInterpreterCallCodeDeltaEvent = ResponseCodeInterpreterCallCodeDeltaEvent;
export type OpenAIResponseCodeInterpreterCallCodeDoneEvent = ResponseCodeInterpreterCallCodeDoneEvent;
export type OpenAIResponseCodeInterpreterCallCompletedEvent = ResponseCodeInterpreterCallCompletedEvent;
export type OpenAIResponseCodeInterpreterCallInProgressEvent = ResponseCodeInterpreterCallInProgressEvent;
export type OpenAIResponseCodeInterpreterCallInterpretingEvent = ResponseCodeInterpreterCallInterpretingEvent;
export type OpenAIResponseCompletedEvent = ResponseCompletedEvent;
export type OpenAIResponseContentPartAddedEvent = ResponseContentPartAddedEvent;
export type OpenAIResponseContentPartAddedEventReasoningText = ResponseContentPartAddedEvent.ReasoningText;
export type OpenAIResponseContentPartDoneEvent = ResponseContentPartDoneEvent;
export type OpenAIResponseContentPartDoneEventReasoningText = ResponseContentPartDoneEvent.ReasoningText;
export type OpenAIResponseCreatedEvent = ResponseCreatedEvent;
export type OpenAIResponseCustomToolCallInputDeltaEvent = ResponseCustomToolCallInputDeltaEvent;
export type OpenAIResponseCustomToolCallInputDoneEvent = ResponseCustomToolCallInputDoneEvent;
export type OpenAIResponseErrorEvent = ResponseErrorEvent;
export type OpenAIResponseFailedEvent = ResponseFailedEvent;
export type OpenAIResponseFileSearchCallCompletedEvent = ResponseFileSearchCallCompletedEvent;
export type OpenAIResponseFileSearchCallInProgressEvent = ResponseFileSearchCallInProgressEvent;
export type OpenAIResponseFileSearchCallSearchingEvent = ResponseFileSearchCallSearchingEvent;
export type OpenAIResponseFunctionCallArgumentsDeltaEvent = ResponseFunctionCallArgumentsDeltaEvent;
export type OpenAIResponseFunctionCallArgumentsDoneEvent = ResponseFunctionCallArgumentsDoneEvent;
export type OpenAIResponseImageGenCallCompletedEvent = ResponseImageGenCallCompletedEvent;
export type OpenAIResponseImageGenCallGeneratingEvent = ResponseImageGenCallGeneratingEvent;
export type OpenAIResponseImageGenCallInProgressEvent = ResponseImageGenCallInProgressEvent;
export type OpenAIResponseImageGenCallPartialImageEvent = ResponseImageGenCallPartialImageEvent;
export type OpenAIResponseInProgressEvent = ResponseInProgressEvent;
export type OpenAIResponseIncompleteEvent = ResponseIncompleteEvent;
export type OpenAIResponseMcpCallArgumentsDeltaEvent = ResponseMcpCallArgumentsDeltaEvent;
export type OpenAIResponseMcpCallArgumentsDoneEvent = ResponseMcpCallArgumentsDoneEvent;
export type OpenAIResponseMcpCallCompletedEvent = ResponseMcpCallCompletedEvent;
export type OpenAIResponseMcpCallFailedEvent = ResponseMcpCallFailedEvent;
export type OpenAIResponseMcpCallInProgressEvent = ResponseMcpCallInProgressEvent;
export type OpenAIResponseMcpListToolsCompletedEvent = ResponseMcpListToolsCompletedEvent;
export type OpenAIResponseMcpListToolsFailedEvent = ResponseMcpListToolsFailedEvent;
export type OpenAIResponseMcpListToolsInProgressEvent = ResponseMcpListToolsInProgressEvent;
export type OpenAIResponseOutputItemAddedEvent = ResponseOutputItemAddedEvent;
export type OpenAIResponseOutputItemDoneEvent = ResponseOutputItemDoneEvent;
export type OpenAIResponseOutputTextAnnotationAddedEvent = ResponseOutputTextAnnotationAddedEvent;
export type OpenAIResponseQueuedEvent = ResponseQueuedEvent;
export type OpenAIResponseReasoningSummaryPartAddedEvent = ResponseReasoningSummaryPartAddedEvent;
export type OpenAIResponseReasoningSummaryPartAddedEventPart = ResponseReasoningSummaryPartAddedEvent.Part;
export type OpenAIResponseReasoningSummaryPartDoneEvent = ResponseReasoningSummaryPartDoneEvent;
export type OpenAIResponseReasoningSummaryPartDoneEventPart = ResponseReasoningSummaryPartDoneEvent.Part;
export type OpenAIResponseReasoningSummaryTextDeltaEvent = ResponseReasoningSummaryTextDeltaEvent;
export type OpenAIResponseReasoningSummaryTextDoneEvent = ResponseReasoningSummaryTextDoneEvent;
export type OpenAIResponseReasoningTextDeltaEvent = ResponseReasoningTextDeltaEvent;
export type OpenAIResponseReasoningTextDoneEvent = ResponseReasoningTextDoneEvent;
export type OpenAIResponseRefusalDeltaEvent = ResponseRefusalDeltaEvent;
export type OpenAIResponseRefusalDoneEvent = ResponseRefusalDoneEvent;
export type OpenAIResponseTextDeltaEvent = ResponseTextDeltaEvent;
export type OpenAIResponseTextDeltaEventLogprob = ResponseTextDeltaEvent.Logprob;
export type OpenAIResponseTextDeltaEventLogprobTopLogprob = ResponseTextDeltaEvent.Logprob.TopLogprob;
export type OpenAIResponseTextDoneEvent = ResponseTextDoneEvent;
export type OpenAIResponseTextDoneEventLogprob = ResponseTextDoneEvent.Logprob;
export type OpenAIResponseTextDoneEventLogprobTopLogprob = ResponseTextDoneEvent.Logprob.TopLogprob;
export type OpenAIResponseWebSearchCallCompletedEvent = ResponseWebSearchCallCompletedEvent;
export type OpenAIResponseWebSearchCallInProgressEvent = ResponseWebSearchCallInProgressEvent;
export type OpenAIResponseWebSearchCallSearchingEvent = ResponseWebSearchCallSearchingEvent;
