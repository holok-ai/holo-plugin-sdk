# Ollama Streaming Response Format

## Overview
Ollama reuses its existing response types for streaming. Instead of separate "event" types like Claude/OpenAI, 
Ollama streams use `AbortableAsyncIterator<T>` where T is either `ChatResponse` or `GenerateResponse`.

## Stream Response Types

### Chat Streaming
Uses `AbortableAsyncIterator<ChatResponse>` where each chunk is a partial `ChatResponse`:

During streaming (done=false):
```typescript
// Partial<ChatResponse> & { done: boolean }
{
    model?: string;
    created_at?: Date;
    message?: {
        role?: string;
        content?: string;       // Incremental token
        images?: string[];      // Optional images
        tool_calls?: ToolCall[]; // Tool calls can appear in any chunk
    };
    done: false;
}
```

Final chunk (done=true):
```typescript
{
    model: string;
    created_at: Date;
    message: {
        role: 'assistant';
        content: '';  // Usually empty on final
    };
    done: true;
    done_reason: string;  // 'stop' | 'length' | 'load'
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
```

### Generate Streaming
Uses `AbortableAsyncIterator<GenerateResponse>` where each chunk is a partial `GenerateResponse`:

During streaming (done=false):
```typescript
// Partial<GenerateResponse> & { done: boolean }
{
    model?: string;
    created_at?: Date;
    response?: string;  // Incremental token
    done: false;
}
```

Final chunk (done=true):
```typescript
{
    model: string;
    created_at: Date;
    response: '';  // Usually empty on final
    done: true;
    done_reason: string;  // 'stop' | 'length' | 'load'
    context: number[];  // Context for continuation
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
```

## Mapping to Holo Stream Events

### Ollama Chat → Holo

| Ollama Event | Holo Event | Notes |
|--------------|------------|-------|
| Content chunks (done=false) | `content_delta` | Incremental text |
| Final chunk (done=true) | `message_delta` + `message_stop` | Usage stats + completion |

### Ollama Generate → Holo

| Ollama Event | Holo Event | Notes |
|--------------|------------|-------|
| Content chunks (done=false) | `content_delta` | Incremental text |
| Final chunk (done=true) | `message_delta` + `message_stop` | Usage stats + completion |

### Holo → Ollama Streaming

Ollama doesn't support server-sent events in the same way as Claude/OpenAI. Instead:
- Holo `message_start` → No-op (Ollama has no equivalent)
- Holo `content_delta` → Emit as content chunk with done=false
- Holo `message_delta` → Emit usage if present
- Holo `message_stop` → Emit final chunk with done=true

## Key Differences from Other Providers

1. **Single Event Type**: Ollama doesn't have separate event types, just chunks with `done` flag
2. **Incremental Content**: Each chunk contains only the new token, not accumulated content
3. **Stats on Completion**: Usage statistics only appear in the final chunk (done=true)
4. **Tool Calls**: Tool calls can appear in any chunk (both non-final and final)
5. **Simple Structure**: No complex nested events or content blocks

## Implementation Notes

1. **No State Tracking**: All translators are stateless - Ollama has no message_start event
2. **Content Streaming**: Each chunk contains only the new token (incremental)
3. **Usage Mapping**: Map Ollama's token counts to Holo's usage (only in done=true chunks)
4. **Done Reason Mapping**: 
   - 'stop' → 'stop'
   - 'length' → 'length'  
   - 'load' → undefined (model loading, not a completion reason)