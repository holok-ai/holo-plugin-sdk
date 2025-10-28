# Consolidated Field Surface for Claude Response Types

| Field | Type | Present on | Notes |
|-------|------|------------|-------|
| **id** | `string` | `BetaMessage` (and inside `message` on `message_start`) | Unique identifier of a message |
| **type** | `'message' \| 'message_start' \| 'message_delta' \| 'message_stop' \| 'content_block_start' \| 'content_block_delta' \| 'content_block_stop'` | All union members | Discriminant across message object and all stream events |
| **content** | `Array<BetaContentBlock>` | `BetaMessage` | Final content blocks for the message |
| **model** | `string` | `BetaMessage` | Model name returned with the message |
| **role** | `'assistant'` | `BetaMessage` | Always "assistant" on output messages |
| **stop_reason** | `'end_turn' \| 'max_tokens' \| 'stop_sequence' \| 'tool_use' \| 'pause_turn' \| 'refusal' \| null` | `BetaMessage`; also inside `message_delta.delta.stop_reason` | null at message_start during streaming; non-null by completion |
| **stop_sequence** | `string \| null` | `BetaMessage`; also inside `message_delta.delta.stop_sequence` | Which custom stop sequence matched, if any |
| **container** | `{ id: string; expires_at: string } \| null` | `BetaMessage`; also inside `message_delta.delta.container` | Container execution environment info |
| **usage** | `{ input_tokens: number; output_tokens: number; cache_creation_input_tokens: number \| null; cache_read_input_tokens: number \| null; cache_creation: object \| null; server_tool_use: object \| null; service_tier: string \| null }` | `BetaMessage` | Totals for the request/response |
| **message** | `BetaMessage` | `BetaRawMessageStartEvent` (type: 'message_start') | Carries an initial/empty-content Message at stream start |
| **delta** | `{ container: object \| null; stop_reason: string \| null; stop_sequence: string \| null }` | `BetaRawMessageDeltaEvent` (type: 'message_delta') | Top-level message deltas (not content text) |
| **usage** | `{ output_tokens: number; cache_creation_input_tokens: number \| null; cache_read_input_tokens: number \| null; input_tokens: number \| null; server_tool_use: object \| null }` | `BetaRawMessageDeltaEvent` (type: 'message_delta') | Cumulative output tokens during streaming |
| **index** | `number` | `content_block_start` / `content_block_delta` / `content_block_stop` events | Index of the content block being streamed |
| **content_block** | `BetaTextBlock \| BetaToolUseBlock \| BetaThinkingBlock \| BetaRedactedThinkingBlock \| BetaServerToolUseBlock \| BetaWebSearchToolResultBlock \| BetaCodeExecutionToolResultBlock \| BetaMCPToolUseBlock \| BetaMCPToolResultBlock \| BetaContainerUploadBlock` | `BetaRawContentBlockStartEvent` (type: 'content_block_start') | The block that is beginning |
| **delta** | `BetaTextDelta \| BetaInputJSONDelta \| BetaCitationsDelta \| BetaThinkingDelta \| BetaSignatureDelta` | `BetaRawContentBlockDeltaEvent` (type: 'content_block_delta') | Deltas for text, tool JSON, citations, thinking, or signature |

Absolutely right! Looking at the CLAUDE_RESPONSE_TYPES.md, we need to define the Usage, Delta, and Content Block types in proper markdown table format. Here's what we need to add:

## Usage Structure Breakdown

| Field | Type | Present on | Notes |
|-------|------|------------|-------|
| **input_tokens** | `number` | `BetaMessage.usage`, `BetaRawMessageDeltaEvent.usage` | Input tokens consumed |
| **output_tokens** | `number` | `BetaMessage.usage`, `BetaRawMessageDeltaEvent.usage` | Output tokens generated |
| **cache_creation_input_tokens** | `number \| null` | `BetaMessage.usage`, `BetaRawMessageDeltaEvent.usage` | Tokens used for cache creation |
| **cache_read_input_tokens** | `number \| null` | `BetaMessage.usage`, `BetaRawMessageDeltaEvent.usage` | Tokens read from cache |
| **cache_creation** | `object \| null` | `BetaMessage.usage` | Cache creation details |
| **server_tool_use** | `object \| null` | `BetaMessage.usage`, `BetaRawMessageDeltaEvent.usage` | Server tool usage metrics |
| **service_tier** | `string \| null` | `BetaMessage.usage` | Service tier used ('standard', 'priority', 'batch') |

## Delta Structure Breakdown

### Message-Level Deltas (BetaRawMessageDeltaEvent)

| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| **container** | `object \| null` | Container environment updates | Execution environment changes |
| **stop_reason** | `string \| null` | Completion status updates | Final reason when message completes |
| **stop_sequence** | `string \| null` | Stop sequence updates | Which custom stop sequence matched |

### Content-Level Deltas (BetaRawContentBlockDeltaEvent)

| Delta Type | Fields | Purpose | Notes |
|------------|--------|---------|-------|
| **BetaTextDelta** | `{ type: 'text_delta'; text: string }` | Streaming text content | Incremental text chunks |
| **BetaInputJSONDelta** | `{ type: 'input_json_delta'; partial_json: string }` | Streaming JSON tool input | Partial JSON as string |
| **BetaCitationsDelta** | `{ type: 'citations_delta'; citation: Citation }` | Streaming citation data | Citation information |
| **BetaThinkingDelta** | `{ type: 'thinking_delta'; thinking: string }` | Streaming thinking content | Reasoning text chunks |
| **BetaSignatureDelta** | `{ type: 'signature_delta'; signature: string }` | Streaming signature content | Signature verification data |

## Content Block Structure Breakdown

### Core Content Blocks

| Content Block Type | Fields | Purpose | Notes |
|-------------------|--------|---------|-------|
| **BetaTextBlock** | `{ type: 'text'; text: string; citations: Array<Citation> \| null }` | Standard text content | Main text output with optional citations |
| **BetaThinkingBlock** | `{ type: 'thinking'; thinking: string; signature: string }` | Reasoning/thinking content | **Claude-only**: Internal reasoning with verification |
| **BetaRedactedThinkingBlock** | `{ type: 'redacted_thinking'; data: string }` | Redacted thinking content | **Claude-only**: Censored reasoning output |

### Tool-Related Content Blocks

| Content Block Type | Fields | Purpose | Notes |
|-------------------|--------|---------|-------|
| **BetaToolUseBlock** | `{ type: 'tool_use'; id: string; name: string; input: unknown }` | Tool usage | Standard tool invocation |
| **BetaServerToolUseBlock** | `{ type: 'server_tool_use'; id: string; name: 'web_search' \| 'code_execution'; input: unknown }` | Server-side tool usage | **Claude-only**: Built-in server tools |
| **BetaMCPToolUseBlock** | `{ type: 'mcp_tool_use'; id: string; name: string; server_name: string; input: unknown }` | MCP tool usage | **Claude-only**: Model Context Protocol tools |
| **BetaMCPToolResultBlock** | `{ type: 'mcp_tool_result'; tool_use_id: string; content: string \| Array<Block>; is_error?: boolean }` | MCP tool results | **Claude-only**: MCP tool responses |

### Search and Web-Related Content Blocks

| Content Block Type | Fields | Purpose | Notes |
|-------------------|--------|---------|-------|
| **BetaWebSearchResultBlock** | `{ type: 'web_search_result'; title: string; encrypted_content: string; url: string; page_age: string \| null }` | Web search results | **Claude-only**: Individual search result |
| **BetaWebSearchToolResultBlock** | `{ type: 'web_search_tool_result'; content: Array<WebSearchResultBlock> \| WebSearchToolResultError; tool_use_id: string }` | Web search tool results | **Claude-only**: Complete search response |

### Code Execution Content Blocks

| Content Block Type | Fields | Purpose | Notes |
|-------------------|--------|---------|-------|
| **BetaCodeExecutionOutputBlock** | `{ type: 'code_execution_output'; file_id: string }` | Code execution output file | **Claude-only**: File-based execution output |
| **BetaCodeExecutionResultBlock** | `{ type: 'code_execution_result'; content: Array<CodeExecutionOutputBlock>; return_code: number; stderr: string; stdout: string }` | Code execution results | **Claude-only**: Complete execution result |
| **BetaCodeExecutionToolResultBlock** | `{ type: 'code_execution_tool_result'; content: CodeExecutionResultBlock \| CodeExecutionToolResultError; tool_use_id: string }` | Code execution tool results | **Claude-only**: Tool-wrapped execution |

### Container and Upload Content Blocks

| Content Block Type | Fields | Purpose | Notes |
|-------------------|--------|---------|-------|
| **BetaContainerUploadBlock** | `{ type: 'container_upload'; file_id: string }` | Container file uploads | **Claude-only**: File uploaded to execution container |

## Citation Types Breakdown

| Citation Type | Fields | Purpose | Notes |
|---------------|--------|---------|-------|
| **CharLocation** | `{ type: 'char_location'; cited_text: string; document_index: number; document_title: string \| null; start_char_index: number; end_char_index: number }` | Character-level citations | Precise character range in document |
| **PageLocation** | `{ type: 'page_location'; cited_text: string; document_index: number; document_title: string \| null; start_page_number: number; end_page_number: number }` | Page-level citations | Page range in document |
| **ContentBlockLocation** | `{ type: 'content_block_location'; cited_text: string; document_index: number; document_title: string \| null; start_block_index: number; end_block_index: number }` | Content block citations | Block range in structured content |
| **WebSearchResultLocation** | `{ type: 'web_search_result_location'; cited_text: string; encrypted_index: string; title: string \| null; url: string }` | Web search citations | Citation from web search results |
| **SearchResultLocation** | `{ type: 'search_result_location'; cited_text: string; search_result_index: number; source: string; title: string \| null; start_block_index: number; end_block_index: number }` | General search citations | Citation from search results |

## Notes and Caveats

- **Streaming lifecycle**: `message_start` → many `content_block_*` events → `message_delta` → `message_stop`
- **Container field**: Unique to Claude, contains execution environment information
- **Container Execution**: File upload and execution environment support
- **Thinking blocks**: Claude-specific reasoning capabilities with signature verification
- **Server tool usage**: Includes web search and code execution server-side tools
- **MCP integration**: Model Context Protocol tools with server names
- **Citations**: Advanced citation tracking across different content types
- **Service tiers**: Supports 'standard', 'priority', 'batch' service levels

Key differences from OpenAI: container field, thinking blocks, server tools, MCP integration, and advanced citation capabilities.
