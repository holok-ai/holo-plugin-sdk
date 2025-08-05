# Provider Request/Response Translator System Design Document

## Overview

**Brief Description**: A comprehensive translator system that converts provider-specific request and response formats (Ollama, Claude, OpenAI) into standardized internal formats. **Initial implementation will focus exclusively on audit service integration**, with the system designed to be extensible for future use in request/response handling, API endpoints, and other services.

**Problem Statement**: Currently, each LLM provider uses unique request and response formats, creating challenges for the audit service:

**Current Audit Service Issues:**
- LLMWorkerRequest/LLMWorkerResponse payloads vary significantly between providers
- Audit parsers (audit-parsers.ts) contain provider-specific logic that could be better organized  
- Difficult to implement consistent audit metrics extraction across providers
- Hard to maintain uniform audit database schema with varying payload structures
- Code duplication in payload parsing logic across different audit scenarios

**Success Criteria**: 
- **Audit Service Integration**: Successfully replace current audit-parsers.ts with organized translator system
- **Bidirectional Translation**: Both requests and responses can be translated to/from standard formats
- **Performance**: Translation is performant and doesn't introduce significant latency to audit logging
- **Code Organization**: Clean, maintainable translator classes replace scattered parsing logic
- **Extensibility**: System designed for future expansion to request/response handling beyond audit
- **Type Safety**: Full TypeScript support with strong typing throughout
- **TSyringe Integration**: Leverages existing dependency injection patterns
- **Future-Ready**: Architecture supports expansion to API endpoints and other services later

## Architecture

The translator system consists of six main components (with **Phase 1 focusing on audit service integration**):

1. **Standard Format Types** (`/src/translators/types/`) - Unified request and response format definitions
2. **Provider-Specific Translators** (`/src/translators/providers/`) - Individual translator implementations with TSyringe injection
3. **Base Translator** (`/src/translators/providers/base.translator.ts`) - Abstract base class with common functionality  
4. **Translator Registry** (`/src/translators/registry/translator.registry.ts`) - TSyringe-based factory and management system
5. **Translation Service** (`/src/translators/services/translation.service.ts`) - High-level service for coordinating translations
6. **Translation Middleware** (`/src/translators/middleware/`) - Express middleware for automatic request/response translation *(Future Phase)*

**Phase 1 Implementation**: Focus exclusively on components 1-4 for audit service integration, replacing current audit-parsers.ts functionality.

## Current Implementation

### Type System

**Location**: `/src/translators/types/`

```typescript
// Standard format for all requests
export interface StandardLLMRequest {
    // Core identification
    requestId: string;
    provider: Provider;
    type: RequestType;
    
    // Model and content
    model: string;
    messages: StandardMessage[];
    
    // Generation parameters (normalized)
    parameters: {
        maxTokens?: number;
        temperature?: number;
        topP?: number;
        topK?: number;
        stopSequences?: string[];
        stream?: boolean;
    };
    
    // Advanced features (normalized)
    features?: {
        tools?: StandardTool[];
        systemPrompt?: string;
        functionCalling?: boolean;
        thinking?: boolean;
    };
    
    // Request metadata
    metadata: {
        originalFormat: string;
        timestamp: number;
        sourceId: string;
        [key: string]: any;
    };
}

// Standard message format
export interface StandardMessage {
    role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
    content: string | StandardMessageContent[];
    name?: string;
    functionCall?: StandardFunctionCall;
    toolCalls?: StandardToolCall[];
}

// Standard format for all translated responses
export interface StandardLLMResponse {
    // Core identification
    requestId: string;
    provider: Provider;
    model: string;
    
    // Response content
    content: {
        type: 'text' | 'function_call' | 'tool_use' | 'error';
        text?: string;
        functionCall?: StandardFunctionCall;
        toolUse?: StandardToolUse;
    };
    
    // Status and completion
    status: {
        isComplete: boolean;
        finishReason?: 'stop' | 'length' | 'function_call' | 'tool_use' | 'error';
        error?: StandardError;
    };
    
    // Usage metrics (standardized)
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    
    // Timing information
    timing?: {
        startTime: number;
        endTime?: number;
        timeToFirstToken?: number;
        processingTime?: number;
        tokensPerSecond?: number;
    };
    
    // Metadata (preserved from original)
    metadata: {
        originalFormat: string; // Original provider format identifier
        rawResponse?: any;      // Optional: preserve original for debugging
        [key: string]: any;     // Provider-specific metadata
    };
}

// Translator interface contract with bidirectional translation
export interface ITranslator {
    readonly provider: Provider;
    
    // Request translation: Standard → Provider
    translateRequest(request: StandardLLMRequest): any;
    validateRequest(request: StandardLLMRequest): boolean;
    
    // Response translation: Provider → Standard
    translateResponse(response: any): StandardLLMResponse;
    translateStreamChunk(chunk: any): StandardLLMResponse;
    translateError(error: any): StandardLLMResponse;
}

// TSyringe tokens for dependency injection
export const TRANSLATOR_TOKENS = {
    OLLAMA_TRANSLATOR: Symbol('OllamaTranslator'),
    CLAUDE_TRANSLATOR: Symbol('ClaudeTranslator'),
    OPENAI_TRANSLATOR: Symbol('OpenAITranslator'),
    TRANSLATOR_REGISTRY: Symbol('TranslatorRegistry'),
    TRANSLATION_SERVICE: Symbol('TranslationService')
} as const;

// Standard error format
export interface StandardError {
    code: string;
    message: string;
    type: 'validation' | 'authentication' | 'rate_limit' | 'server_error' | 'network' | 'unknown';
    provider: Provider;
    originalError?: any;
}

// Standard function call format
export interface StandardFunctionCall {
    name: string;
    arguments: Record<string, any>;
    id?: string;
}

// Standard tool use format
export interface StandardToolUse {
    name: string;
    input: Record<string, any>;
    id: string;
    type: 'function' | 'code_interpreter' | 'retrieval' | 'custom';
}
```

**Design Principles:**
- **Provider Agnostic**: Standard format works regardless of source provider
- **Comprehensive**: Covers all response types (text, function calls, tools, errors)
- **Extensible**: Easy to add new fields without breaking existing code
- **Backwards Compatible**: Preserves original data in metadata for debugging
- **Type Safe**: Strong TypeScript typing throughout the system
- **Performance Focused**: Minimal transformation overhead

### Core Implementation

#### Base Translator (`/src/translators/providers/base.translator.ts`)

```typescript
import { injectable } from 'tsyringe';
import { ITranslator, StandardLLMRequest, StandardLLMResponse } from '../types';
import logger from '../../utils/logger';

@injectable()
export abstract class BaseTranslator implements ITranslator {
    abstract readonly provider: Provider;
    
    // Request translation methods
    abstract translateRequest(request: StandardLLMRequest): any;
    abstract validateRequest(request: StandardLLMRequest): boolean;
    
    // Response translation methods  
    abstract translateResponse(response: any): StandardLLMResponse;
    abstract translateStreamChunk(chunk: any): StandardLLMResponse;
    abstract translateError(error: any): StandardLLMResponse;
    
    // Common utility methods
    protected createStandardRequest(params: any): StandardLLMRequest {
        return {
            requestId: params.requestId,
            provider: this.provider,
            type: params.type,
            model: params.model,
            messages: this.normalizeMessages(params.messages),
            parameters: this.normalizeParameters(params.parameters),
            features: this.extractFeatures(params),
            metadata: {
                originalFormat: this.provider,
                timestamp: Date.now(),
                sourceId: params.sourceId,
                ...params.metadata
            }
        };
    }
    
    protected createStandardResponse(params: any): StandardLLMResponse {
        // Implementation details...
    }
    
    protected normalizeMessages(messages: any[]): StandardMessage[] {
        // Common message normalization logic
    }
    
    protected normalizeParameters(params: any): StandardLLMRequest['parameters'] {
        // Common parameter normalization
    }
    
    protected extractUsageMetrics(response: any): StandardUsage {
        // Common usage extraction logic
    }
    
    protected calculateTiming(start: number, end: number): StandardTiming {
        // Common timing calculations
    }
}
```

**Key Features:**
- **TSyringe Injectable**: Uses `@injectable()` decorator for dependency injection
- **Bidirectional Translation**: Supports both request and response translation
- **Abstract Base Class**: Enforces consistent interface across all translators
- **Common Utilities**: Shared helper methods for normalization and calculation
- **Error Handling**: Standardized error translation patterns
- **Logging Integration**: Built-in logging for translation operations
- **Validation**: Input validation before translation

#### Provider-Specific Translators

##### Ollama Translator (`/src/translators/providers/ollama.translator.ts`)

```typescript
import { injectable } from 'tsyringe';
import { BaseTranslator } from './base.translator';
import { StandardLLMRequest, StandardLLMResponse } from '../types';
import { Provider } from '../../types';

@injectable()
export class OllamaTranslator extends BaseTranslator {
    readonly provider = Provider.OLLAMA;
    
    // Request translation: Standard → Ollama format
    translateRequest(request: StandardLLMRequest): OllamaGenerateRequest | OllamaChatRequest {
        this.validateRequest(request);
        
        if (request.type === RequestType.GENERATE) {
            return this.translateToGenerate(request);
        } else {
            return this.translateToChat(request);
        }
    }
    
    validateRequest(request: StandardLLMRequest): boolean {
        if (!request.model) throw new Error('Model is required');
        if (!request.messages?.length) throw new Error('Messages are required');
        return true;
    }
    
    // Response translation methods...
    translateResponse(response: OllamaResponse): StandardLLMResponse { /* implementation */ }
    translateStreamChunk(chunk: OllamaStreamChunk): StandardLLMResponse { /* implementation */ }
    translateError(error: OllamaError): StandardLLMResponse { /* implementation */ }
    
    private translateToGenerate(request: StandardLLMRequest): OllamaGenerateRequest {
        return {
            model: request.model,
            prompt: this.messagesToPrompt(request.messages),
            stream: request.parameters.stream ?? true,
            options: {
                temperature: request.parameters.temperature,
                top_p: request.parameters.topP,
                top_k: request.parameters.topK,
                num_predict: request.parameters.maxTokens,
                stop: request.parameters.stopSequences
            }
        };
    }
    
    private translateToChat(request: StandardLLMRequest): OllamaChatRequest {
        return {
            model: request.model,
            messages: request.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            stream: request.parameters.stream ?? true,
            options: {
                temperature: request.parameters.temperature,
                top_p: request.parameters.topP,
                top_k: request.parameters.topK,
                num_predict: request.parameters.maxTokens,
                stop: request.parameters.stopSequences
            }
        };
    }
}
```

**Key Features:**
- **TSyringe Injectable**: Registered for dependency injection
- **Bidirectional Translation**: Standard ↔ Ollama format conversion
- **Generate/Chat Format Support**: Handles both Ollama request/response formats
- **Performance Metrics**: Extracts Ollama-specific timing data (eval_duration, load_duration)
- **Token Counting**: Converts Ollama token counts to standard format
- **Done Flag Handling**: Properly interprets Ollama's completion signals

##### Claude Translator (`/src/translators/providers/claude.translator.ts`)

**Functions:**
- `translateResponse(response: ClaudeResponse): StandardLLMResponse` - Message response translation
- `translateStreamChunk(event: MessageStreamEvent): StandardLLMResponse` - Stream event translation
- `translateError(error: ClaudeError): StandardLLMResponse` - Claude-specific error translation

**Key Features:**
- **Stream Event Handling**: Processes all Claude stream event types (content_block_delta, message_delta, etc.)
- **Tool Use Support**: Translates Claude's tool use format to standard format
- **Content Block Processing**: Handles Claude's content block structure
- **Usage Metrics**: Extracts input/output token counts from Claude responses

##### OpenAI Translator (`/src/translators/providers/openai.translator.ts`)

**Functions:**
- `translateResponse(response: OpenAIResponse): StandardLLMResponse` - Chat completion translation
- `translateStreamChunk(chunk: OpenAIStreamChunk): StandardLLMResponse` - Streaming chunk translation
- `translateError(error: OpenAIError): StandardLLMResponse` - OpenAI-specific error translation

**Key Features:**
- **Function Calling**: Translates OpenAI function calls to standard format
- **Tool Support**: Handles OpenAI's tools format and responses
- **Finish Reasons**: Maps OpenAI finish reasons to standard reasons
- **Delta Processing**: Handles OpenAI's delta content format in streams

### Translation Registry with TSyringe

**Location**: `/src/translators/registry/translator.registry.ts`

```typescript
import { injectable, inject, container } from 'tsyringe';
import { ITranslator, TRANSLATOR_TOKENS } from '../types';
import { Provider } from '../../types';
import logger from '../../utils/logger';

@injectable()
export class TranslatorRegistry {
    private translators = new Map<Provider, ITranslator>();
    
    constructor(
        @inject(TRANSLATOR_TOKENS.OLLAMA_TRANSLATOR) private ollamaTranslator: ITranslator,
        @inject(TRANSLATOR_TOKENS.CLAUDE_TRANSLATOR) private claudeTranslator: ITranslator,
        @inject(TRANSLATOR_TOKENS.OPENAI_TRANSLATOR) private openaiTranslator: ITranslator
    ) {
        this.initializeTranslators();
    }
    
    getTranslator(provider: Provider): ITranslator {
        const translator = this.translators.get(provider);
        if (!translator) {
            throw new Error(`No translator registered for provider: ${provider}`);
        }
        return translator;
    }
    
    // Request translation methods
    translateRequest(provider: Provider, request: StandardLLMRequest): any {
        const translator = this.getTranslator(provider);
        return translator.translateRequest(request);
    }
    
    // Response translation methods
    translateResponse(provider: Provider, response: any): StandardLLMResponse {
        const translator = this.getTranslator(provider);
        return translator.translateResponse(response);
    }
    
    translateStreamChunk(provider: Provider, chunk: any): StandardLLMResponse {
        const translator = this.getTranslator(provider);
        return translator.translateStreamChunk(chunk);
    }
    
    translateError(provider: Provider, error: any): StandardLLMResponse {
        const translator = this.getTranslator(provider);
        return translator.translateError(error);
    }
    
    private initializeTranslators(): void {
        this.translators.set(Provider.OLLAMA, this.ollamaTranslator);
        this.translators.set(Provider.CLAUDE, this.claudeTranslator);
        this.translators.set(Provider.OPENAI, this.openaiTranslator);
        
        logger.info('Translator registry initialized with all providers');
    }
    
    registerCustomTranslator(provider: Provider, translator: ITranslator): void {
        this.translators.set(provider, translator);
        logger.debug(`Registered custom translator for provider: ${provider}`);
    }
}
```

### Translation Service

**Location**: `/src/translators/services/translation.service.ts`

```typescript
import { injectable, inject } from 'tsyringe';
import { TranslatorRegistry } from '../registry/translator.registry';
import { TRANSLATOR_TOKENS, StandardLLMRequest, StandardLLMResponse } from '../types';
import { Provider } from '../../types';
import logger from '../../utils/logger';

@injectable()
export class TranslationService {
    constructor(
        @inject(TRANSLATOR_TOKENS.TRANSLATOR_REGISTRY) private registry: TranslatorRegistry
    ) {}
    
    // High-level request translation
    async translateRequestToProvider(
        standardRequest: StandardLLMRequest, 
        targetProvider: Provider
    ): Promise<any> {
        try {
            logger.debug(`Translating request to ${targetProvider} format`, {
                requestId: standardRequest.requestId,
                model: standardRequest.model
            });
            
            const translated = this.registry.translateRequest(targetProvider, standardRequest);
            
            logger.debug(`Successfully translated request to ${targetProvider} format`, {
                requestId: standardRequest.requestId
            });
            
            return translated;
        } catch (error) {
            logger.error(`Failed to translate request to ${targetProvider} format`, {
                requestId: standardRequest.requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    
    // High-level response translation
    async translateResponseFromProvider(
        provider: Provider, 
        providerResponse: any, 
        requestId?: string
    ): Promise<StandardLLMResponse> {
        try {
            logger.debug(`Translating response from ${provider} format`, {
                requestId,
                hasResponse: !!providerResponse
            });
            
            const translated = this.registry.translateResponse(provider, providerResponse);
            
            logger.debug(`Successfully translated response from ${provider} format`, {
                requestId: translated.requestId,
                isComplete: translated.status.isComplete
            });
            
            return translated;
        } catch (error) {
            logger.error(`Failed to translate response from ${provider} format`, {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Return error response in standard format
            return this.registry.translateError(provider, error);
        }
    }
    
    // Stream processing
    async translateStreamChunk(
        provider: Provider, 
        chunk: any, 
        requestId?: string
    ): Promise<StandardLLMResponse> {
        try {
            const translated = this.registry.translateStreamChunk(provider, chunk);
            
            if (translated.status.isComplete) {
                logger.debug(`Stream completed for ${provider}`, {
                    requestId: translated.requestId
                });
            }
            
            return translated;
        } catch (error) {
            logger.error(`Failed to translate stream chunk from ${provider}`, {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            return this.registry.translateError(provider, error);
        }
    }
    
    // Batch translation utilities
    async translateMultipleRequests(
        requests: Array<{ request: StandardLLMRequest; provider: Provider }>
    ): Promise<Array<{ provider: Provider; translated: any; error?: Error }>> {
        const results = await Promise.allSettled(
            requests.map(async ({ request, provider }) => {
                const translated = await this.translateRequestToProvider(request, provider);
                return { provider, translated };
            })
        );
        
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    provider: requests[index].provider,
                    translated: null,
                    error: result.reason
                };
            }
        });
    }
}
```

## Request/Data Flow

```
Provider Response (Raw Format)
    ↓
TranslatorRegistry.getTranslator(provider)
    ↓
Provider-Specific Translator (validation, extraction)
    ↓
Base Translator Utilities (timing, usage calculation)
    ↓
StandardLLMResponse (unified format)
    ↓
Audit Service / API Response / Analytics
    ↓
Consistent Processing Across All Providers
```

**Flow Description**: 
1. **Raw Response**: Provider returns response in native format
2. **Registry Lookup**: TranslatorRegistry finds appropriate translator for provider
3. **Translation**: Provider-specific translator converts to standard format
4. **Validation**: Standard format is validated before return
5. **Usage**: Translated response used by audit, API, and analytics systems
6. **Error Handling**: Translation errors are caught and converted to standard error format

## File Structure

```
src/
├── translators/
│   ├── types/
│   │   ├── index.ts                    # Export all types and tokens
│   │   ├── standard-format.types.ts    # Standard request/response formats
│   │   └── translator.interface.ts     # Translator contract & DI tokens
│   ├── providers/
│   │   ├── base.translator.ts          # Abstract base translator with @injectable
│   │   ├── ollama.translator.ts        # Ollama ↔ Standard with @injectable
│   │   ├── claude.translator.ts        # Claude ↔ Standard with @injectable
│   │   ├── openai.translator.ts        # OpenAI ↔ Standard with @injectable
│   │   └── index.ts                    # Export all translators
│   ├── services/
│   │   ├── translation.service.ts      # High-level service with @injectable
│   │   └── index.ts                    # Export services
│   ├── registry/
│   │   ├── translator.registry.ts      # TSyringe-based factory/registry
│   │   └── index.ts                    # Export registry
│   ├── middleware/
│   │   ├── request-translation.middleware.ts  # Express middleware for requests
│   │   ├── response-translation.middleware.ts # Express middleware for responses
│   │   └── index.ts                    # Export middleware
│   ├── utils/
│   │   ├── validation.ts               # Standard format validation
│   │   ├── metrics.ts                  # Usage/timing utilities
│   │   └── index.ts                    # Export utilities
│   ├── container.config.ts             # TSyringe container configuration
│   └── index.ts                        # Export all translators with DI setup
```

## Usage Examples

### Primary Use Case - Response Translation
```typescript
import { TranslatorRegistry } from '../translators';

// Automatic provider-specific translation
const standardResponse = TranslatorRegistry.translateResponse(
    Provider.CLAUDE, 
    claudeRawResponse
);

// Result: StandardLLMResponse with unified format
console.log(standardResponse.content.text);
console.log(standardResponse.usage.totalTokens);
console.log(standardResponse.status.isComplete);
```

### Stream Processing Use Case
```typescript
import { TranslatorRegistry } from '../translators';

// Stream chunk translation
provider.on('chunk', (chunk) => {
    const standardChunk = TranslatorRegistry.translateStreamChunk(
        Provider.OPENAI, 
        chunk
    );
    
    // Unified stream processing regardless of provider
    if (standardChunk.content.text) {
        await auditService.logChunk(standardChunk);
    }
    
    if (standardChunk.status.isComplete) {
        await auditService.logComplete(standardChunk);
    }
});
```

### Error Handling Usage
```typescript
import { TranslatorRegistry } from '../translators';

try {
    const response = await provider.call();
    const standard = TranslatorRegistry.translateResponse(provider.type, response);
    return standard;
} catch (error) {
    // Convert provider error to standard format
    const standardError = TranslatorRegistry.getTranslator(provider.type)
        .translateError(error);
    
    // Unified error handling
    await auditService.logError(standardError);
    throw new Error(standardError.status.error.message);
}
```

## Implementation Status

### ✅ Completed Features - Phase 1: Request Translation System
- **Architecture Design**: Complete system architecture implemented
- **Type System**: LLMWorkerRequest → LlmRequest translation interfaces defined
- **Base Translator**: Abstract `BaseRequestTranslator` class implemented with common field mapping
- **Provider Translators**: All three provider translators implemented (Ollama, Claude, OpenAI)
- **Registry Pattern**: `TranslatorRegistry` factory system implemented with TSyringe DI
- **Database Integration**: Updated `LlmRequest` schema with new fields
- **Audit Service Integration**: `AuditService` refactored to use translator system
- **Type Safety**: Full TypeScript support with proper error handling
- **ProxyRequest Removal**: Deprecated `ProxyRequest` type removed, replaced with `LLMWorkerRequest`

### 🔄 Current Features - Phase 1 Complete
- **Production Ready**: Phase 1 translator system is fully functional and integrated
- **Database Schema**: Updated schema supports new fields (model_slug, user_prompt, system_prompt, etc.)
- **Provider Coverage**: All existing providers (Ollama, Claude, OpenAI) have working translators
- **Testing**: TypeScript compilation successful, basic functionality verified

## Actual Implementation Details - Phase 1

### File Structure Created
```
src/
├── translators/
│   ├── types/
│   │   └── index.ts                    # IRequestTranslator interface & exports
│   ├── providers/
│   │   ├── base.translator.ts          # Abstract base translator 
│   │   ├── ollama.translator.ts        # Ollama → LlmRequest translator
│   │   ├── claude.translator.ts        # Claude → LlmRequest translator
│   │   ├── openai.translator.ts        # OpenAI → LlmRequest translator
│   │   └── index.ts                    # Export all translators
│   ├── translator.registry.ts          # TSyringe-based factory/registry
│   └── index.ts                        # Export all translator components
```

### Key Implementation Decisions

**1. Simplified Interface**: Instead of bidirectional translation, focused on `LLMWorkerRequest → LlmRequest` only
```typescript
interface IRequestTranslator {
    readonly provider: Provider;
    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;
}
```

**2. Database-First Approach**: Translators populate database schema directly rather than intermediate standard format

**3. Provider-Specific Field Extraction**:
- **Ollama**: Handles both `chat` (messages) and `generate` (prompt) formats
- **Claude**: Processes system prompts as string or TextBlockParam[] via JSON.stringify
- **OpenAI**: Extracts from chat completion format with content array support

**4. Integration Points**:
- `AuditService.logRequest()` now uses `TranslatorRegistry.translate()`
- Removed deprecated `ProxyRequest` type and mapping logic
- Updated database schema with new fields: `model_slug`, `user_prompt`, `system_prompt`, `raw_request`, `application_id`, `provider_slug`

### 🚀 Future Enhancements - Phase 2
- **Response Translation**: Implement response translation system (originally planned StandardLLMResponse)
- **Schema Validation**: JSON schema validation for database format
- **Caching Layer**: Cache translated requests for performance
- **Plugin System**: Dynamic translator loading for custom providers
- **Metrics Dashboard**: Real-time translation performance monitoring
- **Advanced Features**: A/B testing, translation strategies optimization

## Configuration

### Environment Variables
```bash
# Translator system configuration
TRANSLATOR_VALIDATION_ENABLED=true
TRANSLATOR_CACHE_ENABLED=false
TRANSLATOR_DEBUG_LOGGING=false
TRANSLATOR_PRESERVE_RAW=true

# Performance tuning
TRANSLATOR_CACHE_TTL=300
TRANSLATOR_MAX_CACHE_SIZE=1000
```

### Registry Configuration
```typescript
// Custom translator registration
TranslatorRegistry.registerTranslator(
    Provider.CUSTOM_PROVIDER, 
    new CustomTranslator()
);

// Configuration per translator
const translator = TranslatorRegistry.getTranslator(Provider.CLAUDE);
translator.configure({
    preserveRawResponse: true,
    validateOutput: true,
    enableMetrics: true
});
```

## Testing Strategy

### Unit Tests
- **Translator Classes**: Test each provider translator in isolation
- **Registry System**: Test translator registration and lookup
- **Type Validation**: Test standard format validation
- **Error Handling**: Test error translation for all providers

### Integration Tests
- **Provider Integration**: Test with real provider responses
- **Stream Processing**: Test stream chunk translation end-to-end
- **Performance**: Test translation performance under load
- **Error Scenarios**: Test error handling with real provider errors

### End-to-End Tests
- **Full Request Flow**: Test complete request → response → translation flow
- **Multi-Provider**: Test switching between providers with consistent output
- **Audit Integration**: Test translated responses in audit system
- **API Consistency**: Test API responses use translated format

## Security Considerations

- **Input Validation**: All provider responses validated before translation
- **Sensitive Data**: PII and sensitive data handling in translation
- **Raw Response Storage**: Optional raw response preservation with security controls
- **Error Information**: Prevent sensitive error details from leaking
- **Audit Trail**: All translations logged for security audit

## Performance Considerations

- **Translation Overhead**: Minimize performance impact of translation layer
- **Memory Usage**: Efficient handling of large responses and streaming
- **Caching Strategy**: Cache frequently translated responses
- **Streaming Performance**: Low-latency translation for streaming responses
- **Concurrent Translation**: Thread-safe translation for multiple requests

## Monitoring and Observability

### Metrics
- **Translation Performance**: Translation latency per provider
- **Error Rates**: Translation failure rates by provider and error type
- **Usage Patterns**: Most frequently translated response types
- **Cache Hit Rates**: Translation cache effectiveness

### Logging
- **Translation Events**: All successful translations logged with metadata
- **Error Details**: Translation failures with full context
- **Performance Metrics**: Translation timing and resource usage
- **Provider Patterns**: Provider-specific translation patterns

### Alerting
- **High Error Rates**: Alert when translation failure rate exceeds threshold
- **Performance Degradation**: Alert when translation latency increases
- **Provider Issues**: Alert when specific provider translations consistently fail

## Integration Points

### Audit Service Integration
```typescript
// Enhanced audit service with translations
class AuditService {
    async logResponse(response: LLMWorkerResponse) {
        // Translate to standard format for consistent auditing
        const standardResponse = TranslatorRegistry.translateResponse(
            response.provider, 
            response.payload
        );
        
        // Use standard format for audit logging
        await this.auditDB.insert(this.mapStandardToAudit(standardResponse));
    }
}
```

### Response Service Integration
```typescript
// Enhanced response service with translations
class ResponseService {
    async handleProviderResponse(provider: Provider, response: any) {
        // Translate to standard format
        const standardResponse = TranslatorRegistry.translateResponse(provider, response);
        
        // Use standard format for all downstream processing
        await this.sendToAudit(standardResponse);
        await this.sendToClient(standardResponse);
        await this.updateMetrics(standardResponse);
    }
}
```

## Rollout Plan

### Phase 1: Core Implementation
- Implement base translator and registry system
- Create Ollama translator as proof of concept
- Add comprehensive unit tests
- Integration with audit service

### Phase 2: Provider Coverage
- Implement Claude and OpenAI translators
- Add stream translation support
- Integration testing with all providers
- Performance optimization

### Phase 3: Production Deployment
- Feature flag for gradual rollout
- Monitor translation performance
- Gather feedback and optimize
- Full production deployment

### Phase 4: Enhancement
- Add caching layer
- Implement advanced analytics
- Add custom provider support
- Performance tuning

## Dependencies

### Internal Dependencies
- **Provider System**: Depends on existing provider implementations
- **Type System**: Extends existing Provider and LLMWorkerResponse types
- **Audit Service**: Integrates with current audit logging system
- **Logger**: Uses existing Winston logging infrastructure

### External Dependencies
- **TypeScript**: Strong typing throughout the system
- **Provider SDKs**: Anthropic SDK, OpenAI SDK, Ollama SDK types
- **Validation Libraries**: Potential JSON schema validation library

## Risks and Mitigation

### Technical Risks
- **Performance Impact**: Translation adds processing overhead
  - **Mitigation**: Benchmark and optimize, implement caching
- **Memory Usage**: Large responses consume memory during translation
  - **Mitigation**: Streaming translation, memory monitoring
- **Provider Changes**: Provider response format changes break translators
  - **Mitigation**: Comprehensive testing, version detection, fallback handling

### Business Risks
- **Data Loss**: Translation errors could lose important response data
  - **Mitigation**: Preserve raw responses, comprehensive error handling
- **Inconsistency**: Different translators produce inconsistent results
  - **Mitigation**: Shared base class, comprehensive testing, validation

---

**Note**: This document should be updated throughout the implementation process and maintained as the translator system evolves. Each section should be refined based on implementation feedback and real-world usage patterns.