# Streaming Translators Implementation

## Architecture

**Stateless streaming translators** that extend `BaseTranslator` pattern.

**Input:** Provider streaming chunk → **Output:** `HoloStreamChunk[]`

Each provider chunk may produce 0-N `HoloStreamChunk` outputs.

## Core Types

```typescript
HoloStreamChunk {
  id?: string;
  model: string;
  delta?: HoloStreamingDelta;
  done?: boolean;
  finish_reason?: HoloFinishReason;
  usage?: HoloUsage;
}

HoloStreamingDelta {
  provider: 'claude' | 'openai' | 'ollama';
  type: 'message_start' | 'content_delta' | 'message_delta' | 'message_stop';
  index?: number;
  delta: Partial<HoloMessage>;
  usage?: HoloUsage;
  provider_delta?: ProviderDelta;  // Tool call fragments
}

ProviderDelta =
  | { kind: 'openai.tool_call.args.delta'; index: number; id?: string; fragment: string }
  | { kind: 'claude.tool_use.input.delta'; index: number; fragment: string };

// Can be single or array for multiple fragments per chunk
provider_delta?: HoloProviderDelta | HoloProviderDelta[];
```

## Tool Call Fragment Strategy

**Problem:** Tool call arguments arrive as JSON fragments across multiple chunks.

**Solution:** 
1. Emit shell tool call with complete name/id but empty arguments: `{}`
2. Put raw argument fragments in `provider_delta` side channel
3. Downstream handles accumulation/JSON parsing

## Provider Mappings

### OpenAI Chat Completions

```
OpenAIChatCompletionChunk → HoloStreamChunk[]
```

**Chunk Detection:**
- `delta.role: 'assistant'` → `type: 'message_start'`
- `delta.content` → `type: 'content_delta'`
- `delta.refusal` → `type: 'content_delta'`
- `delta.tool_calls[].function.name` → `type: 'message_delta'` (shell tool call)
- `delta.tool_calls[].function.arguments` → `type: 'message_delta'` (fragment in provider_delta)
- `finish_reason` present → `type: 'message_stop'`

**Index & Choice Handling:**
- Content: `index` undefined, `choice = choiceIndex`
- Tool calls: `index = tool_calls[].index`, `choice = choiceIndex`

**Finish Reasons:**
- `stop` → `stop`
- `length` → `length` 
- `tool_calls` → `tool_calls`
- `content_filter` → `content_filter`

### Claude Event Stream

```
ClaudeRawEvent → HoloStreamChunk[]
```

**Event Mapping:**
- `message_start` → `type: 'message_start'`
- `content_block_delta` (text_delta) → `type: 'content_delta'`
- `content_block_delta` (tool name) → `type: 'message_delta'` (shell)
- `content_block_delta` (input_json_delta) → `type: 'message_delta'` (fragment)
- `message_delta` → `type: 'message_delta'` (usage updates)
- `message_stop` → `type: 'message_stop'`

**Index & Choice Handling:**
- Use `content_block.index` for all content/tool deltas
- Set `choice = 0` for future-proof symmetry

**Finish Reasons:**
- `end_turn` → `stop`
- `max_tokens` → `length`
- `tool_use` → `tool_calls`
- `refusal` → `content_filter`

### Ollama Token Stream

```
OllamaFrame → HoloStreamChunk[]
```

**Frame Detection:**
- `response` + `!done` → `type: 'content_delta'`
- `done: true` → `type: 'message_stop'`

## Implementation Guidelines

### Error Handling
- **Malformed chunks:** Drop silently, log at debug level
- **Terminal errors:** Let transport handle (exceptions/close)
- **Don't poison streams** with empty/error deltas

### Provider Field
- Set intrinsically in each translator: `provider: 'openai'|'claude'|'ollama'`

### Usage & Metrics
- Only attach when present on provider chunk
- Typically final chunks only

### IDs & Models
- Pass through when present
- Don't fabricate unless required

### Validators
- **Validate both source and target** - chunks are complete objects of their streaming type
- **Source validation:** Provider chunk validators (e.g. OpenAIChatCompletionChunkValidator)
- **Target validation:** HoloStreamChunkValidator with `onUndeclaredKey('delete')` to strip provider fields
- **Drop invalid chunks:** Use `failQuietly: true` and log malformed results

### Code Style
- Minimize comments
- Utilize known types from provider directories
- Utilize known validators from provider directories  
- Use existing utilities (pickDefined, etc.)

## Translator Structure

```typescript
@injectable()
export class OpenAIStreamTranslator {
    constructor(
        private readonly providerValidator = OpenAIChatCompletionChunkValidator,
        private readonly holoValidator = HoloStreamChunkValidator,
    ) {}

    async toHoloMany(src: OpenAIChatCompletionChunk): Promise<HoloStreamChunk[]> {
        // 1) Validate source
        const validatedSource = this.providerValidator(src);
        if (validatedSource instanceof ArkErrors) {
            this.log.debug(`Source validation failed: ${validatedSource.summary}`);
            return [];
        }

        // 2) Map → 0..N HoloStreamChunk
        const drafts = this.mapToHoloChunks(validatedSource);

        // 3) Validate each target chunk
        const cleaned: HoloStreamChunk[] = [];
        for (const draft of drafts) {
            const validated = this.holoValidator.onUndeclaredKey('delete')(draft);
            if (!(validated instanceof ArkErrors)) {
                cleaned.push(validated);
            } else {
                this.log.debug(`Target validation failed: ${validated.summary}`);
            }
        }
        return cleaned;
    }
    
    private mapToHoloChunks(chunk: OpenAIChatCompletionChunk): HoloStreamChunk[] {
        // Main mapping logic producing 0-N chunks with choice/index handling
    }
}
```

## Usage

Streaming translators provide 1→N mapping with full validation:

```typescript
// Single chunk → multiple Holo deltas  
const translator = new OpenAIStreamTranslator();
const holoChunks = await translator.toHoloMany(providerChunk);

// Batch processing
const allResults = await Promise.all(
    providerChunks.map(chunk => translator.toHoloMany(chunk))
);
const flattened = allResults.flat();
```

## Output Strategy

- **`toHoloMany()`** - Primary method returning `HoloStreamChunk[]` 
- **Source validation** - Provider chunks validated before mapping
- **Target validation** - Each Holo chunk validated with `onUndeclaredKey('delete')`
- **Error tolerance** - Invalid chunks dropped, logged at debug level
- **1→N mapping** - Single provider chunk → multiple Holo events preserved