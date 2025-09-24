# Strongly Typed LLMWorkerResponse Using SDK Types

## Issue
Currently, `LLMWorkerResponse.payload` is typed as `any`, which reduces type safety. We should use the official SDK types from each provider instead of defining our own.

## Proposed Solution

### 1. Import SDK Types
Use existing types from the provider SDKs:

```typescript
// From @anthropic-ai/sdk
import type { MessageStreamEvent, Message } from '@anthropic-ai/sdk/resources/messages';

// From openai SDK  
import type { ChatCompletionChunk, ChatCompletion } from 'openai/resources/chat/completions';

// From ollama SDK (if available) or define minimal interfaces based on their API docs
// Since Ollama might not have official TypeScript SDK, we may need to define these
```

### 2. Update LLMWorkerResponse Interface
Modify `LLMWorkerResponse` in `src/types/worker.request.types.ts`:

```typescript
export interface LLMWorkerResponse<T = any> {
    sourceId: string;
    requestId: string;
    provider: Provider;
    workerId: string;
    payload: T;
    fullResponse?: string;
    timestamp?: number;
    metrics?: LLMMetrics;
}

// Provider-specific response types using SDK types
export interface OllamaWorkerResponse extends LLMWorkerResponse<OllamaResponse> {
    provider: Provider.OLLAMA;
}

export interface ClaudeWorkerResponse extends LLMWorkerResponse<MessageStreamEvent | Message> {
    provider: Provider.CLAUDE;
}

export interface OpenAIWorkerResponse extends LLMWorkerResponse<ChatCompletionChunk | ChatCompletion> {
    provider: Provider.OPENAI;
}

export interface PerplexityWorkerResponse extends LLMWorkerResponse<ChatCompletionChunk | ChatCompletion> {
    provider: Provider.PERPLEXITY; // Uses OpenAI-compatible format
}
```

### 3. Handle Ollama Types
Since Ollama may not have official TypeScript SDK, define minimal types based on their API documentation:

```typescript
// Based on Ollama API documentation
export interface OllamaResponse {
    model: string;
    created_at: string;
    done: boolean;
    
    // For chat requests
    message?: {
        role: 'assistant';
        content: string;
    };
    
    // For generate requests  
    response?: string;
    
    // Performance metrics
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
```

### 4. Update Translator Interfaces
```typescript
export interface IRequestTranslator<TRequest = any, TResponse = any> {
    readonly provider: Provider;
    
    translate(workerRequest: LLMWorkerRequest<TRequest>, llmRequest: Omit<LlmRequest, 'id'>): void;
    
    translateResponse(
        workerResponse: LLMWorkerResponse<TResponse>, 
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void;
}
```

### 5. Update Individual Translators
```typescript
export class ClaudeRequestTranslator extends BaseRequestTranslator 
    implements IRequestTranslator<ClaudeWorkerRequest, MessageStreamEvent | Message> {
    
    translateResponse(
        workerResponse: ClaudeWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void {
        this.setCommonResponseFields(workerResponse, llmResponse, requestContext);

        const payload = workerResponse.payload; // Now properly typed!
        
        // Full type safety with Claude SDK types
        if ('type' in payload) {
            switch (payload.type) {
                case 'content_block_delta':
                    llmResponse.response = payload.delta?.text;
                    break;
                case 'message_stop':
                    llmResponse.status = LlmStatus.SUCCESS;
                    break;
                // ... other cases with full type safety
            }
        }
    }
}
```

### 6. Update Provider Implementations
Ensure providers return properly typed responses:

```typescript
// In claude.provider.ts
async processResponse(chunk: MessageStreamEvent): Promise<void> {
    const response: ClaudeWorkerResponse = {
        sourceId: this.sourceId,
        requestId: this.requestId,
        provider: Provider.CLAUDE,
        workerId: process.env.WORKER_ID || 'unknown',
        payload: chunk, // Now properly typed as MessageStreamEvent
    };
    
    await this.onResponseChunk(response);
}
```

## Benefits

1. **Authoritative Types**: Use official SDK types as source of truth
2. **Automatic Updates**: SDK updates bring new type definitions
3. **No Maintenance**: Don't need to manually maintain response type definitions
4. **Perfect Accuracy**: Types exactly match what APIs return
5. **IDE Support**: Full IntelliSense with real SDK types

## Required Dependencies

Check which SDK packages are already installed and their versions:
- `@anthropic-ai/sdk` - for Claude types
- `openai` - for OpenAI/Perplexity types  
- Ollama may need custom types or community package

## Files to Modify

1. `src/types/worker.request.types.ts` - Import SDK types and update interfaces
2. `src/translators/types/index.ts` - Update translator interface
3. `src/translators/providers/*.auditors.ts` - Update all provider translators
4. `src/providers/*.provider.ts` - Ensure typed response creation
5. `package.json` - Verify SDK dependencies are available

## Priority
**High** - This provides the best type safety by using official SDK types as the source of truth.

## Estimation
- **Investigation**: 1 hour (check available SDK types)
- **Implementation**: 2-3 hours
- **Testing**: 1 hour  
- **Total**: 4-5 hours
