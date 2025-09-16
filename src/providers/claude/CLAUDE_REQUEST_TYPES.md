# Consolidated Field Surface for Claude Request Types

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **model** | `string` | **Required** | Model identifier (e.g., "claude-3-sonnet-20240229") |
| **messages** | `Array<ClaudeMessage>` | **Required** | Array of conversation messages |
| **max_tokens** | `number` | **Required** | Maximum tokens to generate |
| **temperature** | `number` | Optional | Randomness (0.0 - 1.0, sometimes 2.0) |
| **top_p** | `number` | Optional | Nucleus sampling (0.0 - 1.0) |
| **top_k** | `number` | Optional | Top-K sampling |
| **stream** | `boolean` | Optional | Enable streaming response |
| **system** | `string \| Array<ClaudeTextBlockParam>` | Optional | System prompt/instructions |
| **tools** | `Array<ClaudeToolUnion>` | Optional | Available tools/functions |
| **tool_choice** | `ClaudeToolChoice` | Optional | Tool selection strategy |
| **metadata** | `ClaudeMetadata` | Optional | Request metadata |
| **service_tier** | `'auto' \| 'standard_only'` | Optional | Service tier selection |
| **stop_sequences** | `Array<string>` | Optional | Custom stop sequences |
| **container** | `string \| null` | Optional | **Claude-only**: Container execution environment |
| **mcp_servers** | `Array<ClaudeRequestMCPServerURLDefinition>` | Optional | **Claude-only**: Model Context Protocol servers |
| **thinking** | `ClaudeThinkingConfigEnabled \| ClaudeThinkingConfigDisabled` | Optional | **Claude-only**: Thinking/reasoning capabilities |
| **betas** | `Array<ClaudeBeta>` | Optional | **Claude-only**: Beta feature flags |

## Message Structure Breakdown

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **role** | `'user' \| 'assistant'` | **Required** | Message role |
| **content** | `string \| Array<ClaudeContentBlockParam>` | **Required** | Message content |

## Content Block Types

| Content Block Type | Fields | Purpose |
|-------------------|--------|---------|
| **text** | `{ type: 'text'; text: string; cache_control?: object; citations?: Array<Citation> }` | Plain text content |
| **image** | `{ type: 'image'; source: ImageSource; cache_control?: object }` | Image content (base64, URL, or file) |
| **document** | `{ type: 'document'; source: DocumentSource; cache_control?: object; citations?: object; context?: string; title?: string }` | PDF or text documents |
| **thinking** | `{ type: 'thinking'; thinking: string; signature: string }` | **Claude-only**: Reasoning content |
| **redacted_thinking** | `{ type: 'redacted_thinking'; data: string }` | **Claude-only**: Redacted reasoning |
| **tool_use** | `{ type: 'tool_use'; id: string; name: string; input: unknown; cache_control?: object }` | Tool usage |
| **tool_result** | `{ type: 'tool_result'; tool_use_id: string; content?: string \| Array<Block>; is_error?: boolean; cache_control?: object }` | Tool results |
| **server_tool_use** | `{ type: 'server_tool_use'; id: string; name: 'web_search' \| 'code_execution'; input: unknown; cache_control?: object }` | **Claude-only**: Server-side tools |
| **search_result** | `{ type: 'search_result'; content: Array<TextBlock>; source: string; title: string; cache_control?: object; citations?: object }` | **Claude-only**: Search results |
| **mcp_tool_use** | `{ type: 'mcp_tool_use'; id: string; name: string; server_name: string; input: unknown; cache_control?: object }` | **Claude-only**: MCP tool usage |
| **mcp_tool_result** | `{ type: 'mcp_tool_result'; tool_use_id: string; content?: string \| Array<TextBlock>; is_error?: boolean; cache_control?: object }` | **Claude-only**: MCP tool results |
| **container_upload** | `{ type: 'container_upload'; file_id: string; cache_control?: object }` | **Claude-only**: Container file uploads |

## Tool Types Breakdown

| Tool Type | Fields | Purpose |
|-----------|--------|---------|
| **custom** | `{ name: string; input_schema: JSONSchema; description?: string; cache_control?: object; type?: 'custom' }` | User-defined tools |
| **bash_20241022** | `{ name: 'bash'; type: 'bash_20241022'; cache_control?: object }` | **Claude-only**: Bash execution (old version) |
| **bash_20250124** | `{ name: 'bash'; type: 'bash_20250124'; cache_control?: object }` | **Claude-only**: Bash execution (new version) |
| **computer_20241022** | `{ name: 'computer'; type: 'computer_20241022'; display_width_px: number; display_height_px: number; display_number?: number; cache_control?: object }` | **Claude-only**: Computer use (old version) |
| **computer_20250124** | `{ name: 'computer'; type: 'computer_20250124'; display_width_px: number; display_height_px: number; display_number?: number; cache_control?: object }` | **Claude-only**: Computer use (new version) |
| **text_editor_20241022** | `{ name: 'str_replace_editor'; type: 'text_editor_20241022'; cache_control?: object }` | **Claude-only**: Text editor (old version) |
| **text_editor_20250124** | `{ name: 'str_replace_editor'; type: 'text_editor_20250124'; cache_control?: object }` | **Claude-only**: Text editor (medium version) |
| **text_editor_20250429** | `{ name: 'str_replace_based_edit_tool'; type: 'text_editor_20250429'; cache_control?: object }` | **Claude-only**: Text editor (new version) |
| **code_execution_20250522** | `{ name: 'code_execution'; type: 'code_execution_20250522'; cache_control?: object }` | **Claude-only**: Code execution |
| **web_search_20250305** | `{ name: 'web_search'; type: 'web_search_20250305'; allowed_domains?: Array<string>; blocked_domains?: Array<string>; max_uses?: number; user_location?: UserLocation; cache_control?: object }` | **Claude-only**: Web search |

## Tool Choice Options

| Tool Choice Type | Fields | Behavior |
|-----------------|--------|----------|
| **auto** | `{ type: 'auto'; disable_parallel_tool_use?: boolean }` | Let Claude decide when to use tools |
| **any** | `{ type: 'any'; disable_parallel_tool_use?: boolean }` | Must use at least one tool |
| **none** | `{ type: 'none' }` | Don't use any tools |
| **tool** | `{ type: 'tool'; name: string; disable_parallel_tool_use?: boolean }` | Use specific tool |

## Claude-Only Features

| Feature | Fields | Purpose |
|---------|--------|---------|
| **Container** | `string \| null` | Execution environment identifier |
| **MCP Servers** | `Array<{ name: string; type: 'url'; url: string; authorization_token?: string; tool_configuration?: object }>` | Model Context Protocol server definitions |
| **Thinking Config** | `{ type: 'enabled'; budget_tokens: number } \| { type: 'disabled' }` | Reasoning capabilities configuration |
| **Beta Flags** | Array of strings like `"prompt-caching-2024-07-31"`, `"computer-use-2024-10-22"`, etc. | Beta feature enablement |
| **Cache Control** | `{ type: 'ephemeral'; ttl?: '5m' \| '1h' }` | Content caching configuration |
| **Citations** | Various citation location types | Advanced citation tracking |

## Notes and Caveats

- **Cache Control**: Unique to Claude, allows caching of content blocks and tools for performance
- **Thinking Blocks**: Claude's reasoning capabilities with budget token limits
- **Server Tools**: Built-in web search and code execution capabilities
- **MCP Integration**: Model Context Protocol for external tool integration
- **Beta Features**: Extensive beta program with versioned features
- **Citation Tracking**: Advanced document citation with location tracking
- **Container Execution**: Sandboxed execution environment support
- **Versioned Tools**: Multiple versions of built-in tools (bash, computer use, text editor)

Key architectural difference from OpenAI: Claude's extensive beta ecosystem, advanced caching, thinking capabilities, and built-in server-side tools.
