# Claude Stream Response Translators Implementation

## Architecture

**Layered approach:** Individual event translators using `BaseStreamTranslator` + main orchestrator.

Each Claude event type gets dedicated translator for proper validation and type safety.

## Individual Event Translators (Layer 1)

### 1. ClaudeMessageStartEventTranslator
- **Input:** `ClaudeRawMessageStartEvent` 
- **Output:** `HoloStreamChunk[]` (single chunk)
- **Validator:** `ClaudeRawMessageStartEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** `message_start` event → `type: 'message_start'`, `role: 'assistant'`
- **Fields:** `id`, `model`, `choice: 0`, `provider: 'claude'`

### 2. ClaudeMessageDeltaEventTranslator  
- **Input:** `ClaudeRawMessageDeltaEvent`
- **Output:** `HoloStreamChunk[]` (single chunk)
- **Validator:** `ClaudeRawMessageDeltaEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** Usage updates → `type: 'message_delta'`
- **Fields:** `usage`, `stop_reason` → `finish_reason` mapping

### 3. ClaudeMessageStopEventTranslator
- **Input:** `ClaudeRawMessageStopEvent`
- **Output:** `HoloStreamChunk[]` (single chunk)  
- **Validator:** `ClaudeRawMessageStopEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** Final event → `type: 'message_stop'`, `done: true`
- **Fields:** `finish_reason` from context

### 4. ClaudeContentBlockStartEventTranslator
- **Input:** `ClaudeRawContentBlockStartEvent`
- **Output:** `HoloStreamChunk[]` (0-1 chunks)
- **Validator:** `ClaudeRawContentBlockStartEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** Tool use start → `type: 'message_delta'` with shell tool call
- **Fields:** `index`, `tool_calls` with `{id, name, arguments: {}}`

### 5. ClaudeContentBlockDeltaEventTranslator
- **Input:** `ClaudeRawContentBlockDeltaEvent`
- **Output:** `HoloStreamChunk[]` (0-2 chunks)
- **Validator:** `ClaudeRawContentBlockDeltaEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** 
  - `text_delta` → `type: 'content_delta'` with text content
  - `input_json_delta` → `type: 'message_delta'` with `provider_delta` fragment
- **Fields:** `index`, `choice: 0`, fragment handling

### 6. ClaudeContentBlockStopEventTranslator
- **Input:** `ClaudeRawContentBlockStopEvent`
- **Output:** `HoloStreamChunk[]` (empty array)
- **Validator:** `ClaudeRawContentBlockStopEventValidator` → `HoloStreamChunkValidator`
- **Mapping:** No output (block completion marker only)

## Main Stream Translator (Layer 2)

### ClaudeStreamTranslator
- **Input:** `ClaudeRawMessageStreamEvent` (union type)
- **Output:** `HoloStreamChunk[]`
- **Pattern:** Type discrimination + delegation to individual translators
- **Dependencies:** All 6 individual event translators via constructor injection

## Implementation Tasks

### Phase 1: Individual Event Translators
- [ ] **Task 1:** ClaudeMessageStartEventTranslator
- [ ] **Task 2:** ClaudeMessageDeltaEventTranslator  
- [ ] **Task 3:** ClaudeMessageStopEventTranslator
- [ ] **Task 4:** ClaudeContentBlockStartEventTranslator
- [ ] **Task 5:** ClaudeContentBlockDeltaEventTranslator
- [ ] **Task 6:** ClaudeContentBlockStopEventTranslator

### Phase 2: Main Orchestrator
- [ ] **Task 7:** ClaudeStreamTranslator (main coordinator)

### Phase 3: Integration
- [ ] **Task 8:** Dependency injection setup
- [ ] **Task 9:** Export all translators from index
- [ ] **Task 10:** Update main response translator to handle streaming

## Implementation Details

### Common Patterns
- **Extend:** `BaseStreamTranslator<HoloStreamChunk, ClaudeEventType>`
- **Validators:** Use existing Claude event validators
- **Defaults:** `holoDefaults = {}`, `providerDefaults = {}`
- **Method:** Implement `toHoloManyImpl()` (primary direction)
- **Error Handling:** Let BaseStreamTranslator handle validation/dropping

### Finish Reason Mapping
- `end_turn` → `'stop'`
- `max_tokens` → `'length'`
- `tool_use` → `'tool_calls'`
- `stop_sequence` → `'stop'`

### Provider Delta Fragment Format
```typescript
{
  kind: 'claude.tool_use.input.delta',
  index: number,
  fragment: string
}
```

### Key Fields Per Chunk
- **provider:** `'claude'`
- **choice:** `0` (Claude single choice)
- **index:** `content_block.index` when applicable
- **created:** Pass through `created` timestamp when available

## File Structure
```
src/providers/claude/translators/streaming/
├── claude.message.start.event.translator.ts
├── claude.message.delta.event.translator.ts  
├── claude.message.stop.event.translator.ts
├── claude.content.block.start.event.translator.ts
├── claude.content.block.delta.event.translator.ts
├── claude.content.block.stop.event.translator.ts
├── claude.stream.translator.ts
└── index.ts
```