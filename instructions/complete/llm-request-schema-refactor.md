# LlmRequest Schema Refactoring Documentation

## Overview

The `llm_requests` table has been significantly refactored to better support the unified request translation system and improve data structure for audit and analytics purposes.

## Database Schema Changes

### Before (Old Schema)
```sql
Table "public.llm_requests" (OLD)
     Column     |              Type              | Nullable |      Default      
----------------+--------------------------------+----------+-------------------
 id             | uuid                           | not null | gen_random_uuid()
 request_id     | character varying(36)          | not null | 
 request_type   | character varying(50)          | not null | 
 model          | character varying(100)         | not null | 
 prompt         | text                           |          | 
 options        | jsonb                          |          | 
 source_id      | character varying(100)         |          | 
 user_id        | text                           |          | 
 timestamp      | timestamp(6) without time zone | not null | CURRENT_TIMESTAMP
 metadata       | jsonb                          |          | 
```

### After (New Schema)
```sql
Table "public.llm_requests" (NEW)
     Column     |              Type              | Nullable |      Default      
----------------+--------------------------------+----------+-------------------
 id             | uuid                           | not null | gen_random_uuid()
 request_id     | character varying(36)          | not null | 
 request_type   | character varying(50)          | not null | 
 model_slug     | character varying(100)         | not null | 
 user_prompt    | text                           |          | 
 options        | jsonb                          |          | 
 source_id      | character varying(100)         |          | 
 user_id        | text                           |          | 
 timestamp      | timestamp(6) without time zone | not null | CURRENT_TIMESTAMP
 raw_request    | jsonb                          |          | 
 application_id | text                           | not null | 'default'::text
 provider_slug  | text                           | not null | 'default'::text
 system_prompt  | text                           |          | 
```

## Field Changes Summary

### Renamed Fields
- `model` → `model_slug`: More descriptive naming for model identification
- `prompt` → `user_prompt`: Clarifies this is the user's input prompt
- `metadata` → `raw_request`: More specific about containing the full original request

### New Fields
- `application_id` (text, required, default: 'default'): Identifies the application making the request
- `provider_slug` (text, required, default: 'default'): Identifies which LLM provider processed the request
- `system_prompt` (text, optional): Stores system/instruction prompts separately from user prompts

### Enhanced Field Purposes

#### `user_prompt` vs `system_prompt`
- **`user_prompt`**: The actual user input/question/request
- **`system_prompt`**: Instructions/context provided to the LLM (e.g., "You are a helpful assistant")

#### `raw_request` (formerly `metadata`)
- Stores the complete original `LLMWorkerRequest.payload` object
- Provides full audit trail and debugging capability
- Preserves provider-specific parameters that don't map to standard fields

#### `model_slug` vs `provider_slug`
- **`model_slug`**: Specific model name (e.g., "gpt-4", "claude-3-sonnet", "llama2")
- **`provider_slug`**: Provider identification (e.g., "openai", "claude", "ollama")

## Code Changes

### LlmRequest Interface Update
```typescript
// OLD Interface
export interface LlmRequest {
    id: string;
    request_id: string;
    request_type: string;
    model: string;                    // → model_slug
    prompt?: string;                  // → user_prompt
    options?: Record<string, any>;
    source_id?: string;
    user_id?: string;
    timestamp: string;
    metadata?: Record<string, any>;   // → raw_request
}

// NEW Interface
export interface LlmRequest {
    id: string;
    request_id: string;
    request_type: string;
    model_slug: string;               // RENAMED from model
    user_prompt?: string;             // RENAMED from prompt
    options?: Record<string, any>;
    source_id?: string;
    user_id?: string;
    timestamp: string;
    raw_request?: Record<string, any>; // RENAMED from metadata
    application_id: string;           // NEW FIELD
    provider_slug: string;            // NEW FIELD
    system_prompt?: string;           // NEW FIELD
}
```

### Database Insertion Update
```typescript
// OLD RequestDB.insert method
async insert(request: Omit<LlmRequest, 'id'>) {
    const query = `
        INSERT INTO llm_requests
        (request_id, request_type, model, prompt, options, source_id, user_id, timestamp, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await this.db.query(query, [
        request_id, request_type, model, prompt,
        JSON.stringify(options), source_id, user_id, timestamp,
        JSON.stringify(metadata)
    ]);
}

// NEW RequestDB.insert method
async insert(request: Omit<LlmRequest, 'id'>) {
    const query = `
        INSERT INTO llm_requests
        (request_id, request_type, model_slug, user_prompt, options, source_id, user_id, timestamp, raw_request, application_id, provider_slug, system_prompt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    
    await this.db.query(query, [
        request_id, request_type, model_slug, user_prompt,
        JSON.stringify(options), source_id, user_id, timestamp,
        JSON.stringify(raw_request), application_id, provider_slug, system_prompt
    ]);
}
```

## Translator System Integration

The new schema works seamlessly with the translator system:

### Common Fields (handled by BaseRequestTranslator)
```typescript
protected setCommonFields(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
    llmRequest.request_id = workerRequest.requestId;
    llmRequest.request_type = workerRequest.type;
    llmRequest.source_id = workerRequest.sourceId;
    llmRequest.user_id = workerRequest.userId;
    llmRequest.timestamp = new Date(workerRequest.timestamp).toISOString();
    llmRequest.application_id = workerRequest.applicationId || 'default';
    llmRequest.provider_slug = workerRequest.provider;
    llmRequest.raw_request = workerRequest.payload;
}
```

### Provider-Specific Fields
Each translator extracts relevant fields based on the provider's payload format:

**Ollama Example:**
```typescript
// For chat requests
llmRequest.user_prompt = this.extractUserPromptFromMessages(chatPayload.messages);
llmRequest.system_prompt = this.extractSystemPromptFromMessages(chatPayload.messages);

// For generate requests  
llmRequest.user_prompt = generatePayload.prompt;
llmRequest.system_prompt = generatePayload.system;
```

**Claude Example:**
```typescript
llmRequest.model_slug = payload.model;
llmRequest.user_prompt = this.extractUserPromptFromMessages(payload.messages);
llmRequest.system_prompt = typeof payload.system === 'string' 
    ? payload.system 
    : payload.system ? JSON.stringify(payload.system) : undefined;
```

## Migration Considerations

### Database Migration
When deploying this change, ensure:
1. **Column Renames**: Update existing data mapping queries
2. **New Columns**: Add new columns with appropriate defaults
3. **Application Code**: Update all queries that reference old column names
4. **Indexes**: Update any indexes that reference renamed columns

### Backward Compatibility
- The `AuditService` still supports both `LLMWorkerRequest` and direct `LlmRequest` formats
- Old `ProxyRequest` type has been completely removed
- Applications should migrate to use `LLMWorkerRequest` format

## Benefits of New Schema

### 1. Enhanced Audit Capabilities
- **Separate Prompts**: User vs system prompts tracked independently
- **Provider Tracking**: Clear identification of which provider processed each request
- **Application Tracking**: Multi-application support with `application_id`
- **Complete Audit Trail**: Full original request preserved in `raw_request`

### 2. Better Analytics
- **Model Usage**: Track usage patterns by specific model names
- **Provider Performance**: Compare performance across different providers
- **Application Metrics**: Per-application usage statistics
- **Prompt Analysis**: Separate analysis of user vs system prompts

### 3. Improved Data Quality
- **Type Safety**: Translator system ensures consistent field extraction
- **Provider-Specific Logic**: Each provider has customized field extraction
- **Validation**: Better validation through TypeScript interfaces
- **Consistency**: Unified approach across all providers

## Future Enhancements

### Potential Schema Additions
- `request_size`: Size of the request payload
- `estimated_tokens`: Token count estimation
- `priority`: Request priority level
- `retry_count`: Number of retry attempts
- `parent_request_id`: For follow-up requests

### Analytics Opportunities
- Model popularity tracking
- Provider performance comparison
- Application usage patterns
- Prompt engineering insights
- Cost tracking by provider and model

---

**Last Updated**: 2025-08-01  
**Status**: Implemented and Production Ready  
**Related Documents**: 
- `translator-system-design.md`
- `CLAUDE.md` (updated with schema changes)
- `README.md` (updated with translator system info)